// robots/zhihuRobot.ts
import BaseRobot, { Account } from './baseRobot';
import logger from '../logger';

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

      await this.page.goto('https://www.zhihu.com/signin', { waitUntil: 'networkidle' });

      // Click on the QR code login tab
      await this.page.click('.SignFlow-qrcodeTab');

      // Wait for the QR code image to be visible
      await this.page.waitForSelector('.SignFlow-qrcode img', { timeout: 10000 });

      // Get the QR code image element
      const qrCodeElement = await this.page.$('.SignFlow-qrcode img');
      if (!qrCodeElement) {
        throw new Error('QR code element not found');
      }

      // Take a screenshot of the QR code element
      const qrCodeBuffer = await qrCodeElement.screenshot();

      // Convert buffer to base64 string
      const qrCodeBase64 = qrCodeBuffer.toString('base64');

      // Return the base64 string
      return qrCodeBase64;
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
      await this.page.waitForSelector('a[href="/notifications"]', { timeout: 60000 });
      logger.info(`Successfully logged in to Zhihu account: ${this.account.account_username}`);
    } catch (error: any) {
      logger.error('Error waiting for Zhihu login success:', error);
      throw error;
    }
  }

  async post(content: string): Promise<boolean> {
    // Implement posting logic here
    return true;
  }
}

export default ZhihuRobot;
