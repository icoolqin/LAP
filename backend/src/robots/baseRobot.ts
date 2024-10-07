// robots/baseRobot.ts
import { chromium, firefox, webkit } from 'playwright-extra';
import { Browser, BrowserContext, Page, devices, BrowserType } from 'playwright'; 
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Account  } from '../types';
import logger from '../logger';

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
    
    // Add stealth plugin to all browser types
    chromium.use(StealthPlugin());
    firefox.use(StealthPlugin());
    webkit.use(StealthPlugin());
  }

  async init(): Promise<void> {
    try {
        const browserType = chromium as unknown as BrowserType;
        this.browser = await browserType.launch({
            headless: false,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        });

        const device = devices['Desktop Chrome'];
        
        // 创建上下文时直接使用存储状态
        const contextOptions = {
            ...device,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            locale: 'zh-CN',
            timezoneId: 'Asia/Shanghai',
        };

        // 如果存在登录状态，直接使用 storageState
        if (this.account.playwright_login_state) {
            this.context = await this.browser.newContext({
                ...contextOptions,
                storageState: JSON.parse(this.account.playwright_login_state)
            });
        } else {
            this.context = await this.browser.newContext(contextOptions);
        }

        this.page = await this.context.newPage();
        await this.page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        });
    } catch (error: any) {
        logger.error('初始化浏览器时出错:', error);
        throw error;
    }
}

  abstract startLoginProcess(): Promise<string>; // Returns QR code image data

  abstract waitForLoginSuccess(): Promise<void>;

  abstract post(url: string, content: string): Promise<boolean>;

  async saveLoginState(): Promise<string> {
    try {
      if (!this.context) {
        throw new Error('Browser context is not initialized');
      }
      const storageState = await this.context.storageState();
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
