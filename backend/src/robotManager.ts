import ZhihuRobot from './robots/zhihuRobot';
import logger from './logger';
import { getAccountById, updateAccountLoginState } from './dbOperations';

// 定义账号接口
interface Account {
  id: string;
  website_domain: string;
  // 可以根据需要添加更多属性
}

// 定义机器人接口
interface Robot {
  init(): Promise<void>;
  login(): Promise<boolean>;
  close(): Promise<void>;
}

// 定义机器人构造函数类型
type RobotConstructor = new (account: Account) => Robot;

// 定义机器人映射类型
type RobotsMap = {
  [key: string]: RobotConstructor;
};

// 可以根据需要添加更多的机器人
const robotsMap: RobotsMap = {
  'zhihu.com': ZhihuRobot as RobotConstructor,
  // '其他网站': OtherRobot,
};

class RobotManager {
  private robots: { [key: string]: Robot };

  constructor() {
    this.robots = {};
  }

  // 根据网站和账号获取相应的机器人实例
  public getRobot(siteDomain: string, account: Account): Robot {
    const RobotClass = robotsMap[siteDomain];
    if (!RobotClass) {
      throw new Error(`No robot found for site: ${siteDomain}`);
    }
    
    // 检查机器人是否已经存在
    if (!this.robots[account.id]) {
      const robot = new RobotClass(account);
      this.robots[account.id] = robot;
    }
    
    return this.robots[account.id];
  }

  // 关闭所有机器人
  public async closeAllRobots(): Promise<void> {
    const closePromises = Object.values(this.robots).map(robot => robot.close());
    await Promise.all(closePromises);
    this.robots = {}; // 清空已关闭的机器人
  }
  
  public async updateLoginState(accountId: string): Promise<boolean> {
    try {
      const account = await getAccountById(accountId);
      if (!account) {
        throw new Error(`Account not found with id: ${accountId}`);
      }

      const robot = this.getRobot(account.website_domain, account);
      await robot.init();
      const loginState = await robot.login();
      
      // 更新数据库中的登录状态
      await updateAccountLoginState(accountId, loginState);

      return loginState;
    } catch (error) {
      logger.error(`Error updating login state for account ${accountId}:`, error);
      throw error;
    }
  }
}

export const RobotManager = new  RobotManager();