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
exports.dbOperations = void 0;
// dbOperations.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
const DB_PATH = './data/database.sqlite';
class DBOperations {
    constructor() {
        this.db = new sqlite3_1.default.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database', err.message);
            }
            else {
                console.log('Connected to the SQLite database.');
                this.initializeTables();
            }
        });
    }
    initializeTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS trending_topics (
        id TEXT PRIMARY KEY,
        title TEXT,
        thumbnail TEXT,
        url TEXT,
        md5 TEXT,
        extra TEXT,
        time TEXT,
        nodeids TEXT,
        topicid TEXT,
        domain TEXT,
        sitename TEXT,
        logo TEXT,
        views TEXT
      )`,
            `CREATE TABLE IF NOT EXISTS promotion_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT,
        name TEXT,
        description TEXT,
        method TEXT,
        type TEXT,
        additional_info TEXT,
        status TEXT
      )`,
            `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT,
        name TEXT,
        promotion_count INTEGER,
        post_count INTEGER,
        match_count INTEGER,
        stage TEXT,
        match_prompt TEXT,
        generate_prompt TEXT
      )`,
            `CREATE TABLE IF NOT EXISTS task_promotion_items (
        task_id INTEGER,
        promotion_item_id INTEGER,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (promotion_item_id) REFERENCES promotion_items(id)
      )`,
            `CREATE TABLE IF NOT EXISTS task_hot_posts (
        task_id INTEGER,
        hot_post_id TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (hot_post_id) REFERENCES trending_topics(id)
      )`,
            `CREATE TABLE IF NOT EXISTS task_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        promotion_item_id INTEGER,
        hot_post_id TEXT,
        generated_reply TEXT,
        generated_time TEXT,
        robot_id INTEGER,
        publish_time TEXT,
        status TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (promotion_item_id) REFERENCES promotion_items(id),
        FOREIGN KEY (hot_post_id) REFERENCES trending_topics(id)
      )`,
            `CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        website_name TEXT,
        website_domain TEXT,
        account_status TEXT,
        playwright_login_state TEXT,
        login_state_update_time TEXT,
        login_state_suggested_update_interval TEXT,
        last_used_time TEXT,
        account_username TEXT,
        account_password TEXT,
        account_bound_phone_number TEXT,
        account_last_update_time TEXT,
        recent_login_screenshot TEXT,
        remarks TEXT
      )`
        ];
        tables.forEach((table) => {
            this.db.run(table, (err) => {
                if (err) {
                    console.error(`Error creating table: ${err.message}`);
                }
            });
        });
    }
    saveHotItems(items) {
        const stmt = this.db.prepare(`INSERT OR REPLACE INTO trending_topics (id, title, thumbnail, url, md5, extra, time, nodeids, topicid, domain, sitename, logo, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        items.forEach((item) => {
            stmt.run(item.id, item.title, item.thumbnail, item.url, item.md5, item.extra, item.time, item.nodeids, item.topicid, item.domain, item.sitename, item.logo, item.views, (err) => {
                if (err) {
                    console.error('Error inserting trending topic', err.message);
                }
            });
        });
        stmt.finalize();
    }
    getHotItems() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM trending_topics ORDER BY time DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    getHotPosts(filters, page = 1, pageSize = 10) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM trending_topics WHERE 1=1`;
            const params = [];
            if (filters.title) {
                sql += ` AND title LIKE ?`;
                params.push(`%${filters.title}%`);
            }
            if (filters.domain) {
                sql += ` AND domain LIKE ?`;
                params.push(`%${filters.domain}%`);
            }
            if (filters.time && filters.time.$gte && filters.time.$lte) {
                sql += ` AND time BETWEEN ? AND ?`;
                params.push(filters.time.$gte, filters.time.$lte);
            }
            const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
            sql += ` ORDER BY time DESC LIMIT ? OFFSET ?`;
            params.push(pageSize, (page - 1) * pageSize);
            this.db.get(countSql, params.slice(0, -2), (err, countRow) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.db.all(sql, params, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve({
                                items: rows,
                                total: countRow.total,
                                page: page,
                                pageSize: pageSize
                            });
                        }
                    });
                }
            });
        });
    }
    addPromotionItem(item) {
        return new Promise((resolve, reject) => {
            const { created_at, name, description, method, type, additional_info, status } = item;
            const sql = `INSERT INTO promotion_items (created_at, name, description, method, type, additional_info, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [created_at, name, description, method, type, additional_info, status], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.lastID);
                }
            });
        });
    }
    getAllPromotionItems() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM promotion_items ORDER BY created_at DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    updatePromotionItem(id, updatedItem) {
        return new Promise((resolve, reject) => {
            const { name, description, method, type, additional_info, status } = updatedItem;
            const sql = `UPDATE promotion_items 
                   SET name = ?, description = ?, method = ?, type = ?, additional_info = ?, status = ?
                   WHERE id = ?`;
            this.db.run(sql, [name, description, method, type, additional_info, status, id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    deletePromotionItem(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM promotion_items WHERE id = ?`;
            this.db.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    togglePromotionItemStatus(id, status) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE promotion_items SET status = ? WHERE id = ?`;
            this.db.run(sql, [status, id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    getPromotionItems(filters) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM promotion_items WHERE 1=1`;
            const params = [];
            if (filters.name) {
                sql += ` AND name LIKE ?`;
                params.push(`%${filters.name}%`);
            }
            if (filters.type) {
                sql += ` AND type LIKE ?`;
                params.push(`%${filters.type}%`);
            }
            if (filters.created_at && filters.created_at.$gte && filters.created_at.$lte) {
                sql += ` AND created_at BETWEEN ? AND ?`;
                params.push(filters.created_at.$gte, filters.created_at.$lte);
            }
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    addTask(task) {
        return new Promise((resolve, reject) => {
            const { created_at, name, promotion_count, post_count, match_count, stage } = task;
            const sql = `INSERT INTO tasks (created_at, name, promotion_count, post_count, match_count, stage) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [created_at, name, promotion_count, post_count, match_count, stage], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.lastID);
                }
            });
        });
    }
    getAllTasks() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tasks ORDER BY created_at DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    getTaskById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM tasks WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }
    deleteTask(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM tasks WHERE id = ?`;
            this.db.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    updateTaskMatchPrompt(id, matchPrompt) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE tasks SET match_prompt = ? WHERE id = ?`;
            this.db.run(sql, [matchPrompt, id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    updateTaskGeneratePrompt(taskId, generatePrompt) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE tasks SET generate_prompt = ? WHERE id = ?';
            this.db.run(sql, [generatePrompt, taskId], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    createTaskWithRelations(taskData, promotionItems, hotPosts) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                this.db.run(`INSERT INTO tasks (created_at, name, promotion_count, post_count, match_count, stage) 
                    VALUES (?, ?, ?, ?, ?, ?)`, [Date.now(), taskData.name, promotionItems.length, hotPosts.length, 0, '初创'], function (err) {
                    if (err) {
                        this.db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    const taskId = this.lastID;
                    const promotionStmt = this.db.prepare('INSERT INTO task_promotion_items (task_id, promotion_item_id) VALUES (?, ?)');
                    promotionItems.forEach(item => {
                        promotionStmt.run(taskId, item.id);
                    });
                    promotionStmt.finalize();
                    const hotPostStmt = this.db.prepare('INSERT INTO task_hot_posts (task_id, hot_post_id) VALUES (?, ?)');
                    hotPosts.forEach(post => {
                        hotPostStmt.run(taskId, post.id);
                    });
                    hotPostStmt.finalize();
                    this.db.run('COMMIT', (err) => {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        }
                        else {
                            resolve(taskId);
                        }
                    });
                });
            });
        });
    }
    getTaskPromotionItems(taskId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT pi.* 
        FROM promotion_items pi
        JOIN task_promotion_items tpi ON pi.id = tpi.promotion_item_id
        WHERE tpi.task_id = ?
      `;
            this.db.all(sql, [taskId], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows || []);
                }
            });
        });
    }
    getTaskHotPosts(taskId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT tt.* 
        FROM trending_topics tt
        JOIN task_hot_posts thp ON tt.id = thp.hot_post_id
        WHERE thp.task_id = ?
      `;
            this.db.all(sql, [taskId], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows || []);
                }
            });
        });
    }
    updateTaskWithRelations(taskId, taskData, promotionItems, hotPosts) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                this.db.run(`UPDATE tasks SET name = ?, promotion_count = ?, post_count = ?, stage = ? WHERE id = ?`, [taskData.name, promotionItems.length, hotPosts.length, taskData.stage, taskId], (err) => {
                    if (err) {
                        this.db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    this.db.run(`DELETE FROM task_promotion_items WHERE task_id = ?`, [taskId]);
                    this.db.run(`DELETE FROM task_hot_posts WHERE task_id = ?`, [taskId]);
                    const promotionStmt = this.db.prepare('INSERT INTO task_promotion_items (task_id, promotion_item_id) VALUES (?, ?)');
                    promotionItems.forEach(item => {
                        promotionStmt.run(taskId, item.id);
                    });
                    promotionStmt.finalize();
                    const hotPostStmt = this.db.prepare('INSERT INTO task_hot_posts (task_id, hot_post_id) VALUES (?, ?)');
                    hotPosts.forEach(post => {
                        hotPostStmt.run(taskId, post.id);
                    });
                    hotPostStmt.finalize();
                    this.db.run('COMMIT', (err) => {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            });
        });
    }
    getTaskExecutionDetails(taskId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT te.id, te.task_id, te.promotion_item_id, te.hot_post_id, te.generated_reply, te.generated_time, 
               te.robot_id, te.publish_time, te.status, pi.name AS promotionItemName, 
               tt.title AS hotPostTitle, tt.url AS hotPostUrl
        FROM task_executions te
        LEFT JOIN promotion_items pi ON te.promotion_item_id = pi.id
        LEFT JOIN trending_topics tt ON te.hot_post_id = tt.id
        WHERE te.task_id = ?`;
            this.db.all(sql, [taskId], (err, rows) => {
                if (err) {
                    console.error('Error in getTaskExecutionDetails:', err);
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    deleteTaskExecution(executionId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM task_executions WHERE id = ?`;
            this.db.run(sql, [executionId], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    addAccount(account) {
        return new Promise((resolve, reject) => {
            const { website_name, website_domain, account_status, playwright_login_state, login_state_update_time, login_state_suggested_update_interval, last_used_time, account_username, account_password, account_bound_phone_number, account_last_update_time, recent_login_screenshot, remarks } = account;
            const sql = `INSERT INTO accounts 
        (website_name, website_domain, account_status, playwright_login_state, login_state_update_time, login_state_suggested_update_interval, last_used_time, account_username, account_password, account_bound_phone_number, account_last_update_time, recent_login_screenshot, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [website_name, website_domain, account_status, playwright_login_state, login_state_update_time, login_state_suggested_update_interval, last_used_time, account_username, account_password, account_bound_phone_number, account_last_update_time, recent_login_screenshot, remarks], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.lastID);
                }
            });
        });
    }
    getAllAccounts() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM accounts ORDER BY id DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    updateAccount(id, updatedAccount) {
        return new Promise((resolve, reject) => {
            const { website_name, website_domain, account_status, playwright_login_state, login_state_update_time, login_state_suggested_update_interval, last_used_time, account_username, account_password, account_bound_phone_number, account_last_update_time, recent_login_screenshot, remarks } = updatedAccount;
            const sql = `UPDATE accounts SET 
        website_name = ?, 
        website_domain = ?, 
        account_status = ?, 
        playwright_login_state = ?, 
        login_state_update_time = ?, 
        login_state_suggested_update_interval = ?,
        last_used_time = ?, 
        account_username = ?, 
        account_password = ?, 
        account_bound_phone_number = ?, 
        account_last_update_time = ?, 
        recent_login_screenshot = ?, 
        remarks = ?
        WHERE id = ?`;
            this.db.run(sql, [website_name, website_domain, account_status, playwright_login_state, login_state_update_time, login_state_suggested_update_interval, last_used_time, account_username, account_password, account_bound_phone_number, account_last_update_time, recent_login_screenshot, remarks, id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    deleteAccount(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM accounts WHERE id = ?`;
            this.db.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes);
                }
            });
        });
    }
    getAccountById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM accounts WHERE id = ?`;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }
    updateAccountLoginState(id, loginState) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `UPDATE accounts SET 
        playwright_login_state = ?,
        login_state_update_time = ?
        WHERE id = ?`;
                this.db.run(sql, [loginState, Date.now().toString(), id], (err) => {
                    if (err) {
                        console.error('Error updating account login state:', err);
                        reject(err);
                    }
                    else {
                        console.log(`Updated login state for account ${id}`);
                        resolve();
                    }
                });
            });
        });
    }
}
exports.dbOperations = new DBOperations();
