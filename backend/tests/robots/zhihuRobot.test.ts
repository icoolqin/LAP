// tests/robots/zhihuRobot.test.ts
// 测试zhihuRobot里的post函数

import ZhihuRobot from '../../src/robots/zhihuRobot';
import { dbOperations } from '../../src/dbOperations';
import { Account } from '../../src/types';

describe('ZhihuRobot', () => {
  let zhihuRobot: ZhihuRobot;
  let testAccount: Account;

  beforeAll(async () => {
    // 获取知乎账号
    const accounts = await dbOperations.getAccountsByDomain('zhihu.com');
    testAccount = accounts.find(account => account.playwright_login_state) as Account;

    if (!testAccount) {
      throw new Error('No Zhihu account found with valid login state');
    }

    zhihuRobot = new ZhihuRobot(testAccount);
  });

  afterAll(async () => {
    await zhihuRobot.close();
  });

  test('post function should successfully post content to Zhihu', async () => {
    const testUrl = 'https://www.zhihu.com/question/802411063'; // 替换为真实的知乎问题 URL
    const testContent = '我也很无语。'; // "This is a test answer, please ignore."

    const result = await zhihuRobot.post(testUrl, testContent);

    expect(result).toBe(true);
  }, 60000); // 增加超时时间到 60 秒，因为浏览器操作可能需要更长时间
});