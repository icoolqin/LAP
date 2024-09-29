// robots/baseRobot.ts
import * as playwright from 'playwright';
import logger from '../logger';

export interface Account {
  id: string | number;
  account_username: string;
  account_password: string;
  playwright_login_state?: string;
  website_domain: string;
}

abstract class BaseRobot {
  protected account: Account;
  protected browser: playwright.Browser | null;
  protected context: playwright.BrowserContext | null;
  protected page: playwright.Page | null;

  constructor(account: Account) {
    this.account = account;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init(): Promise<void> {
    try {
      this.browser = await playwright.chromium.launch({ headless: false });
      this.context = await this.browser.newContext();

      if (this.account.playwright_login_state) {
        await this.context.addCookies(JSON.parse(this.account.playwright_login_state));
      }

      this.page = await this.context.newPage();
    } catch (error: any) {
      logger.error('Error initializing browser:', error);
      throw error;
    }
  }

  abstract startLoginProcess(): Promise<string>; // Returns QR code image data

  abstract waitForLoginSuccess(): Promise<void>;

  abstract post(content: string): Promise<boolean>;

  async saveLoginState(): Promise<string> {
    try {
      if (!this.context) {
        throw new Error('Browser context is not initialized');
      }
      // Get the storage state of the context
      const storageState = await this.context.storageState();

      // Return the storage state as a JSON string
      return JSON.stringify(storageState);
    } catch (error: any) {
      logger.error('Error saving login state:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export default BaseRobot;
