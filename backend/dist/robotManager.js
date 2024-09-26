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
const zhihuRobot_1 = __importDefault(require("./robots/zhihuRobot"));
const logger_1 = __importDefault(require("./logger"));
const dbOperations_1 = require("./dbOperations");
// 可以根据需要添加更多的机器人
const robotsMap = {
    'zhihu.com': zhihuRobot_1.default,
    // '其他网站': OtherRobot,
};
class RobotManager {
    constructor() {
        this.robots = {};
    }
    // 根据网站和账号获取相应的机器人实例
    getRobot(siteDomain, account) {
        const RobotClass = robotsMap[siteDomain];
        if (!RobotClass) {
            throw new Error(`No robot found for site: ${siteDomain}`);
        }
        // 检查机器人是否已经存在
        if (!this.robots[account.id]) {
            const robot = new RobotClass(account);
            this.robots[account.id] = robot;
        }
        return this.robots[account.id];
    }
    // 关闭所有机器人
    closeAllRobots() {
        return __awaiter(this, void 0, void 0, function* () {
            const closePromises = Object.values(this.robots).map(robot => robot.close());
            yield Promise.all(closePromises);
            this.robots = {}; // 清空已关闭的机器人
        });
    }
    updateLoginState(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield (0, dbOperations_1.getAccountById)(accountId);
                if (!account) {
                    throw new Error(`Account not found with id: ${accountId}`);
                }
                const robot = this.getRobot(account.website_domain, account);
                yield robot.init();
                const loginState = yield robot.login();
                // 更新数据库中的登录状态
                yield (0, dbOperations_1.updateAccountLoginState)(accountId, loginState);
                return loginState;
            }
            catch (error) {
                logger_1.default.error(`Error updating login state for account ${accountId}:`, error);
                throw error;
            }
        });
    }
}
exports.default = new RobotManager();
