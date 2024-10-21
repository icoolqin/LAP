// robots/zhihuRobot.ts
import BaseRobot from './baseRobot';
import logger from '../logger';
import { Account  } from '../types';

class ZhihuRobot extends BaseRobot {
  constructor(account: Account) {
    super(account);
  }

  async startLoginProcess(): Promise<string> {
    await this.init();
    try {
      if (!this.page) {
        throw new Error('Page is not initialized');
      }

      // Navigate to the Zhihu login page
      await this.page.goto('https://www.zhihu.com/signin', { waitUntil: 'networkidle' });

      // Wait for the page to load completely
      await this.page.waitForLoadState('networkidle');

      // Take a screenshot of the entire page
      const screenshotBuffer = await this.page.screenshot({ fullPage: true });

      // Convert the buffer to a base64 string
      const screenshotBase64 = screenshotBuffer.toString('base64');

      // Return the base64 string
      return screenshotBase64;
    } catch (error: any) {
      logger.error('Error during Zhihu login process:', error);
      throw error;
    }
  }

  async waitForLoginSuccess(): Promise<void> {
    try {
      if (!this.page) {
        throw new Error('Page is not initialized');
      }

      // Wait for a specific element that indicates the user is logged in
      await this.page.waitForSelector('text="创作中心"', { timeout: 60000 });
      logger.info(`Successfully logged in to Zhihu account: ${this.account.account_username}`);
    } catch (error: any) {
      logger.error('Error waiting for Zhihu login success:', error);
      throw error;
    }
  }

  async post(url: string, content: string): Promise<boolean> {
    try {
      await this.init(); // Ensure browser is initialized with login state
  
      if (!this.page) {
        throw new Error('Page is not initialized');
      }
  
      // Navigate to the post URL
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
  
      // Click the "写回答" button
      await this.page.click('button:has-text("写回答")');
  
      // Wait for the answer editor to appear
      await this.page.waitForSelector('.InputLike.AnswerForm-editor', { timeout: 10000 });
  
      // Try to find a more specific element within the editor
      const editorElement = await this.page.locator('.InputLike.AnswerForm-editor [contenteditable="true"]');
  
      // If we found a contenteditable element, use page.type()
      if (await editorElement.count() > 0) {
        await editorElement.type(content, { delay: 10 }); // Add a small delay between keystrokes
      } else {
        // If we couldn't find a specific element, use evaluate()
        await this.page.evaluate((text) => {
          const editor = document.querySelector('.InputLike.AnswerForm-editor');
          if (editor) {
            editor.innerHTML = text;
          }
        }, content);
      }
  
      // Click the "发布" button
      await this.page.click('button:has-text("发布回答")');
  
      // Wait for confirmation that the answer was posted
      await this.page.waitForSelector('span:has-text("修改")', { timeout: 10000 });
  
      logger.info(`Successfully posted answer on Zhihu for account: ${this.account.account_username}`);
      return true;
    } catch (error) {
      logger.error('Error posting answer on Zhihu:', error);
      return false;
    } finally {
      await this.close();
    }
  }
  
}

export default ZhihuRobot;
