// robots/zhihuRobot.js
const BaseRobot = require('./baseRobot');
const logger = require('../logger');

class ZhihuRobot extends BaseRobot {
  constructor(account) {
    super(account);
  }

  async login() {
    await this.init();
    try {
      await this.page.goto('https://www.zhihu.com/signin', { waitUntil: 'networkidle' });
      
      await this.page.fill('input[name="username"]', this.account.account_username);
      await this.page.fill('input[name="password"]', this.account.account_password);
      
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle' })
      ]);
      
      const loggedIn = await this.page.evaluate(() => !!document.querySelector('a[href="/notifications"]'));
      if (loggedIn) {
        logger.info(`Successfully logged in to Zhihu account: ${this.account.account_username}`);
        return await this.saveLoginState();
      } else {
        throw new Error('Failed to log in to Zhihu');
      }
    } catch (error) {
      logger.error('Error during Zhihu login:', error);
      throw error;
    }
  }

  async post(content) {
    try {
      await this.page.goto('https://www.zhihu.com/question/your-question-id/answer/new', { waitUntil: 'networkidle' });
      await this.page.fill('textarea[name="content"]', content);
      
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle' })
      ]);

      const success = await this.page.evaluate(() => !!document.querySelector('.some-success-selector'));
      if (success) {
        logger.info(`Successfully posted to Zhihu with account: ${this.account.account_username}`);
        return true;
      } else {
        throw new Error('Failed to post to Zhihu');
      }
    } catch (error) {
      logger.error('Error during Zhihu posting:', error);
      throw error;
    }
  }
}

module.exports = ZhihuRobot;
