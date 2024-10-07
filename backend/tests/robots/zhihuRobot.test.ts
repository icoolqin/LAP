// tests/robots/zhihuRobot.test.ts
import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import ZhihuRobot from '../../src/robots/zhihuRobot';
import { Account } from '../../src/types';
import logger from '../../src/logger';

// Mock logger to prevent actual logging during tests
jest.mock('../../src/logger');

describe('ZhihuRobot', () => {
  let robot: ZhihuRobot;
  let testAccount: Account;

  beforeEach(() => {
    // Create a test account with necessary fields
    testAccount = {
      id: 1,
      website_name: 'Zhihu',
      website_domain: 'zhihu.com',
      account_status: 'active',
      playwright_login_state: '{}', // Empty storage state for testing
      login_state_update_time: Date.now().toString(),
      login_state_suggested_update_interval: '',
      last_used_time: '',
      account_username: 'testuser',
      account_password: 'testpassword',
      account_bound_phone_number: '',
      account_last_update_time: '',
      recent_login_screenshot: '',
      remarks: '',
    };

    robot = new ZhihuRobot(testAccount);
  });

  afterEach(async () => {
    // Ensure browser is closed after each test
    await robot.close();
  });

  test('should post content successfully', async () => {
    // Mock the methods that interact with the browser
    robot.init = jest.fn().mockResolvedValue(undefined);
    robot.page = {
      goto: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      fill: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as any; // Type assertion to satisfy TypeScript

    const url = 'https://www.zhihu.com/question/12345678';
    const content = 'This is a test answer.';

    const result = await robot.post(url, content);

    expect(robot.init).toHaveBeenCalled();
    expect(robot.page.goto).toHaveBeenCalledWith(url, { waitUntil: 'networkidle' });
    expect(robot.page.click).toHaveBeenCalledWith('button:has-text("写回答")');
    expect(robot.page.waitForSelector).toHaveBeenCalledWith('div.RichContent-editor', { timeout: 10000 });
    expect(robot.page.fill).toHaveBeenCalledWith('div.RichContent-editor', content);
    expect(robot.page.click).toHaveBeenCalledWith('button:has-text("发布")');
    expect(result).toBe(true);
  });

  test('should handle errors during posting', async () => {
    // Mock methods to throw an error
    robot.init = jest.fn().mockResolvedValue(undefined);
    robot.page = {
      goto: jest.fn().mockRejectedValue(new Error('Navigation failed')),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    const url = 'https://www.zhihu.com/question/12345678';
    const content = 'This is a test answer.';

    const result = await robot.post(url, content);

    expect(result).toBe(false);
    expect(robot.init).toHaveBeenCalled();
    expect(robot.page.goto).toHaveBeenCalledWith(url, { waitUntil: 'networkidle' });
    // Since an error occurs, other methods should not be called
    expect(robot.page.click).not.toHaveBeenCalled();
  });
});
