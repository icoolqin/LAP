// robotManager.js 机器人管理器.负责加载和初始化所有机器人。提供方法来根据网站选择合适的机器人。

const ZhihuRobot = require('./robots/zhihuRobot');
const logger = require('./logger');

// 可以根据需要添加更多的机器人
const robotsMap = {
  'zhihu.com': ZhihuRobot,
  // '其他网站': OtherRobot,
};

class RobotManager {
  constructor() {
    this.robots = {};
  }

  getRobot(siteName, account) {
    const RobotClass = robotsMap[siteName];
    if (!RobotClass) {
      throw new Error(`No robot found for site: ${siteName}`);
    }
    // 如果机器人已存在，返回现有实例
    if (this.robots[account.id]) {
      return this.robots[account.id];
    }
    // 否则，创建新的机器人实例
    const robot = new RobotClass(account);
    this.robots[account.id] = robot;
    return robot;
  }

  async closeAllRobots() {
    for (const id in this.robots) {
      await this.robots[id].close();
    }
  }
}

module.exports = new RobotManager();
