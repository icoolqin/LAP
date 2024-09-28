// robotManager.ts
import BaseRobot, { Account as BaseAccount } from './robots/baseRobot';
import ZhihuRobot from './robots/zhihuRobot';
import logger from './logger';
import { dbOperations } from './dbOperations';
import { Account as DBAccount } from './types';

type RobotConstructor = new (account: BaseAccount) => BaseRobot;

const robotsMap: { [key: string]: RobotConstructor } = {
  'zhihu.com': ZhihuRobot,
  // Add other website robots here
};

class RobotManager {
  private robots: { [accountId: string]: BaseRobot };
  private loginStatus: { [accountId: string]: 'pending' | 'success' | 'failed' };
  
  constructor() {
    this.robots = {};
    this.loginStatus = {};
  }

  private convertAccount(dbAccount: DBAccount): BaseAccount {
    return {
      ...dbAccount,
      id: dbAccount.id?.toString() || '',
    };
  }

  getRobot(siteDomain: string, account: BaseAccount): BaseRobot {
    const RobotClass = robotsMap[siteDomain];
    if (!RobotClass) {
      throw new Error(`No robot found for site: ${siteDomain}`);
    }

    const accountId = account.id.toString();
    if (!this.robots[accountId]) {
      const robot = new RobotClass(account);
      this.robots[accountId] = robot;
    }

    return this.robots[accountId];
  }

  async closeAllRobots(): Promise<void> {
    const closePromises = Object.values(this.robots).map((robot) => robot.close());
    await Promise.all(closePromises);
    this.robots = {};
    this.loginStatus = {};
  }

  async startUpdateLoginState(accountId: string | number): Promise<string> {
    try {
      const numericAccountId = typeof accountId === 'string' ? parseInt(accountId, 10) : accountId;
      if (isNaN(numericAccountId)) {
        throw new Error(`Invalid account ID: ${accountId}`);
      }

      const dbAccount = await dbOperations.getAccountById(numericAccountId);
      if (!dbAccount) {
        throw new Error(`Account not found with id: ${numericAccountId}`);
      }

      const account = this.convertAccount(dbAccount);
      const robot = this.getRobot(account.website_domain, account);
      
      // Start the login process and get QR code image data
      const qrCodeData = await robot.startLoginProcess();

      // Set login status to pending
      this.loginStatus[accountId.toString()] = 'pending';

      // Wait for login success in background
      (async () => {
        try {
          await robot.waitForLoginSuccess();
          const storageState = await robot.saveLoginState();

          // Update the database with the storageState
          await dbOperations.updateAccountLoginState(numericAccountId, storageState);

          // Update login status
          this.loginStatus[accountId.toString()] = 'success';

          // Close the robot instance
          await robot.close();
          delete this.robots[accountId.toString()];
        } catch (error) {
          logger.error(`Error during login for account ${accountId}:`, error);
          this.loginStatus[accountId.toString()] = 'failed';
          // Close the robot instance
          await robot.close();
          delete this.robots[accountId.toString()];
        }
      })();

      return qrCodeData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error starting login state update for account ${accountId}: ${errorMessage}`);
      throw error;
    }
  }

  async getLoginStatus(accountId: string | number): Promise<'pending' | 'success' | 'failed'> {
    const status = this.loginStatus[accountId.toString()] || 'pending';
    return status;
  }
}

export default new RobotManager();
