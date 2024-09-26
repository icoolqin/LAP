// robots/baseRobot.js  实现机器人基础类定义一个基础机器人类，包含共同的方法如登录、发帖、检查结果等。
// 每个网站特定的机器人（如 siteARobot.js）继承自基础机器人，并实现网站特定的逻辑。
const playwright = require('playwright');
const logger = require('../logger');

class BaseRobot {
  constructor(account) {
    this.account = account;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
    try {
      this.browser = await playwright.chromium.launch({ headless: true });
      this.context = await this.browser.newContext();

      if (this.account.playwright_login_state) {
        await this.context.addCookies(JSON.parse(this.account.playwright_login_state));
      }

      this.page = await this.context.newPage();
    } catch (error) {
      logger.error('Error initializing browser:', error);
      throw error;
    }
  }

  async login() {
    throw new Error('login() must be implemented by subclass');
  }

  async post(content) {
    throw new Error('post() must be implemented by subclass');
  }

  async saveLoginState() {
    try {
      // 获取上下文的存储状态
      const storageState = await this.context.storageState();
      
      // 返回 JSON 字符串形式的存储状态
      return JSON.stringify(storageState);
    } catch (error) {
      logger.error('Error saving login state:', error);
      throw error;
    }
  }
  

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = BaseRobot;
