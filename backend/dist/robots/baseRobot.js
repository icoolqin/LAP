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
const logger_1 = __importDefault(require("../logger"));
class BaseRobot {
    constructor(account) {
        this.account = account;
        this.browser = null;
        this.context = null;
        this.page = null;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.browser = yield playwright.chromium.launch({ headless: true });
                this.context = yield this.browser.newContext();
                if (this.account.playwright_login_state) {
                    yield this.context.addCookies(JSON.parse(this.account.playwright_login_state));
                }
                this.page = yield this.context.newPage();
            }
            catch (error) {
                logger_1.default.error('Error initializing browser:', error);
                throw error;
            }
        });
    }
    saveLoginState() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.context) {
                    throw new Error('Browser context is not initialized');
                }
                const storageState = yield this.context.storageState();
                return JSON.stringify(storageState);
            }
            catch (error) {
                logger_1.default.error('Error saving login state:', error);
                throw error;
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser) {
                yield this.browser.close();
            }
        });
    }
}
exports.default = BaseRobot;
