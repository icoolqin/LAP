"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baseRobot_1 = __importDefault(require("./baseRobot"));
const logger_1 = __importDefault(require("../logger"));
class ZhihuRobot extends baseRobot_1.default {
    constructor(account) {
        super(account);
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            try {
                if (!this.page) {
                    throw new Error('Page is not initialized');
                }
                yield this.page.goto('https://www.zhihu.com/signin', { waitUntil: 'networkidle' });
                yield this.page.fill('input[name="username"]', this.account.account_username);
                yield this.page.fill('input[name="password"]', this.account.account_password);
                yield Promise.all([
                    this.page.click('button[type="submit"]'),
                    this.page.waitForNavigation({ waitUntil: 'networkidle' })
                ]);
                const loggedIn = yield this.page.evaluate(() => !!document.querySelector('a[href="/notifications"]'));
                if (loggedIn) {
                    logger_1.default.info(`Successfully logged in to Zhihu account: ${this.account.account_username}`);
                    return yield this.saveLoginState();
                }
                else {
                    throw new Error('Failed to log in to Zhihu');
                }
            }
            catch (error) {
                logger_1.default.error('Error during Zhihu login:', error);
                throw error;
            }
        });
    }
    post(content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.page) {
                    throw new Error('Page is not initialized');
                }
                yield this.page.goto('https://www.zhihu.com/question/your-question-id/answer/new', { waitUntil: 'networkidle' });
                yield this.page.fill('textarea[name="content"]', content);
                yield Promise.all([
                    this.page.click('button[type="submit"]'),
                    this.page.waitForNavigation({ waitUntil: 'networkidle' })
                ]);
                const success = yield this.page.evaluate(() => !!document.querySelector('.some-success-selector'));
                if (success) {
                    logger_1.default.info(`Successfully posted to Zhihu with account: ${this.account.account_username}`);
                    return true;
                }
                else {
                    throw new Error('Failed to post to Zhihu');
                }
            }
            catch (error) {
                logger_1.default.error('Error during Zhihu posting:', error);
                throw error;
            }
        });
    }
}
exports.default = ZhihuRobot;
