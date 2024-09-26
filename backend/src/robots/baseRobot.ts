import { Browser, BrowserContext, Page } from 'playwright';
import logger from '../logger';

interface Account {
  account_username: string;
  account_password: string;
  playwright_login_state?: string;
}

interface StorageState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

abstract class BaseRobot {
  protected account: Account;
  protected browser: Browser | null;
  protected context: BrowserContext | null;
  protected page: Page | null;

  constructor(account: Account) {
    this.account = account;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init(): Promise<void> {
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

  abstract login(): Promise<string>;

  abstract post(content: string): Promise<boolean>;

  async saveLoginState(): Promise<string> {
    try {
      if (!this.context) {
        throw new Error('Browser context is not initialized');
      }
      const storageState: StorageState = await this.context.storageState();
      return JSON.stringify(storageState);
    } catch (error) {
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