import BaseRobot, { Account as BaseAccount } from './robots/baseRobot';
import ZhihuRobot from './robots/zhihuRobot';
import logger from './logger';
import { dbOperations } from './dbOperations';
import { Account as DBAccount } from './types';

type RobotConstructor = new (account: BaseAccount) => BaseRobot;

const robotsMap: { [key: string]: RobotConstructor } = {
  'zhihu.com': ZhihuRobot,
  // 'other-website.com': OtherRobot,
};

class RobotManager {
  private robots: { [key: string]: BaseRobot };

  constructor() {
    this.robots = {};
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
  }

  async updateLoginState(accountId: string | number): Promise<string> {
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
      await robot.init();
      const loginState = await robot.login();

      await dbOperations.updateAccountLoginState(numericAccountId, loginState);

      return loginState;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error updating login state for account ${accountId}: ${errorMessage}`);
      throw error;
    }
  }
}

export default new RobotManager();