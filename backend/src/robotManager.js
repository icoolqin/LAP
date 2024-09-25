const ZhihuRobot = require('./robots/zhihuRobot');
const logger = require('./logger');
const { getAccountById, updateAccountLoginState } = require('./dbOperations');

// 可以根据需要添加更多的机器人
const robotsMap = {
  'zhihu.com': ZhihuRobot,
  // '其他网站': OtherRobot,
};

class RobotManager {
  constructor() {
    this.robots = {};
  }

  // 根据网站和账号获取相应的机器人实例
  getRobot(siteName, account) {
    const RobotClass = robotsMap[siteName];
    if (!RobotClass) {
      throw new Error(`No robot found for site: ${siteName}`);
    }
    
    // 检查机器人是否已经存在
    if (!this.robots[account.id]) {
      const robot = new RobotClass(account);
      this.robots[account.id] = robot;
    }
    
    return this.robots[account.id];
  }

  // 关闭所有机器人
  async closeAllRobots() {
    const closePromises = Object.values(this.robots).map(robot => robot.close());
    await Promise.all(closePromises);
    this.robots = {}; // 清空已关闭的机器人
  }
  
  async updateLoginState(accountId) {
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


module.exports = new RobotManager();