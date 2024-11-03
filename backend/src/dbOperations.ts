// dbOperations.ts
import sqlite3 from 'sqlite3';
import { Database} from 'sqlite3';
import { TrendingTopic, PromotionItem, Task, TaskExecution, Account  } from './types';

const DB_PATH = './data/database.sqlite';

export class DBOperations {
  private db: Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database', err.message);
      } else {
        console.log('Connected to the SQLite database.');
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
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
        generate_prompt TEXT,
        modify_reply_prompt TEXT
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
        account_id INTEGER,
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

  public saveHotItems(items: TrendingTopic[]): void {
    const stmt = this.db.prepare(`INSERT OR REPLACE INTO trending_topics (id, title, thumbnail, url, md5, extra, time, nodeids, topicid, domain, sitename, logo, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    items.forEach((item) => {
      stmt.run(item.id, item.title, item.thumbnail, item.url, item.md5, item.extra, item.time, item.nodeids, item.topicid, item.domain, item.sitename, item.logo, item.views, (err: Error | null) => {
        if (err) {
          console.error('Error inserting trending topic', err.message);
        }
      });
    });

    stmt.finalize();
  }

  public getHotItems(): Promise<TrendingTopic[]> {
    return new Promise((resolve, reject) => {
      this.db.all<TrendingTopic>(`SELECT * FROM trending_topics ORDER BY time DESC`, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public getHotPosts(filters: any, page: number = 1, pageSize: number = 10): Promise<{ items: TrendingTopic[], total: number, page: number, pageSize: number }> {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM trending_topics WHERE 1=1`;
      const params: any[] = [];

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

      this.db.get(countSql, params.slice(0, -2), (err, countRow: { total: number }) => {
        if (err) {
          reject(err);
        } else {
          this.db.all<TrendingTopic>(sql, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
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

  public addPromotionItem(item: PromotionItem): Promise<number> {
    return new Promise((resolve, reject) => {
      const { created_at, name, description, method, type, additional_info, status } = item;
      const sql = `INSERT INTO promotion_items (created_at, name, description, method, type, additional_info, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [created_at, name, description, method, type, additional_info, status], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  public getAllPromotionItems(): Promise<PromotionItem[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM promotion_items ORDER BY created_at DESC`;
      this.db.all<PromotionItem>(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public updatePromotionItem(id: number, updatedItem: Partial<PromotionItem>): Promise<number> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];
      
      Object.entries(updatedItem).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (updates.length === 0) {
        resolve(0); // No fields to update
        return;
      }
      
      const sql = `UPDATE promotion_items SET ${updates.join(', ')} WHERE id = ?`;
      values.push(id);
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public deletePromotionItem(id: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM promotion_items WHERE id = ?`;
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public togglePromotionItemStatus(id: number, status: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE promotion_items SET status = ? WHERE id = ?`;
      this.db.run(sql, [status, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public getPromotionItems(filters: any): Promise<PromotionItem[]> {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM promotion_items WHERE 1=1`;
      const params: any[] = [];

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

      this.db.all<PromotionItem>(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public getTaskPromotionItems(taskId: number): Promise<PromotionItem[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT pi.* 
        FROM promotion_items pi
        JOIN task_promotion_items tpi ON pi.id = tpi.promotion_item_id
        WHERE tpi.task_id = ?
      `;
      this.db.all<PromotionItem>(sql, [taskId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  public addTask(task: Task): Promise<number> {
    return new Promise((resolve, reject) => {
      const { created_at, name, promotion_count, post_count, match_count, stage } = task;
      const sql = `INSERT INTO tasks (created_at, name, promotion_count, post_count, match_count, stage) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [created_at, name, promotion_count, post_count, match_count, stage], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  public getAllTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM tasks ORDER BY created_at DESC`;
      this.db.all<Task>(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public getTaskById(id: number): Promise<Task> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM tasks WHERE id = ?`;
      this.db.get<Task>(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public deleteTask(id: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM tasks WHERE id = ?`;
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public updateTaskMatchPrompt(id: number, matchPrompt: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE tasks SET match_prompt = ? WHERE id = ?`;
      this.db.run(sql, [matchPrompt, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public updateTaskGeneratePrompt(taskId: number, generatePrompt: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE tasks SET generate_prompt = ? WHERE id = ?';
      this.db.run(sql, [generatePrompt, taskId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public updateTaskModifyReplyPrompt(taskId: number, modifyReplyPrompt: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE tasks SET modify_reply_prompt = ? WHERE id = ?`;
      
      this.db.run(sql, [modifyReplyPrompt, taskId], function(err) {
        if (err) {
          console.error(`Error updating modify_reply_prompt for taskId ${taskId}:`, err.message);
          reject(err);
        } else {
          resolve(this.changes); // Returns the number of rows updated
        }
      });
    });
  }  
  
  public createTaskWithRelations(taskData: Task, promotionItems: PromotionItem[], hotPosts: TrendingTopic[]): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
  
        this.db.run(
          `INSERT INTO tasks (created_at, name, promotion_count, post_count, match_count, stage) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [Date.now().toString(), taskData.name, promotionItems.length, hotPosts.length, 0, '初创'],
          (err: Error | null) => {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
              return;
            }
  
            this.db.get('SELECT last_insert_rowid() as taskId', (err: Error | null, row: { taskId: number }) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }
  
              const taskId = row.taskId;
  
              const promotionStmt = this.db.prepare('INSERT INTO task_promotion_items (task_id, promotion_item_id) VALUES (?, ?)');
              promotionItems.forEach(item => {
                promotionStmt.run(taskId, item.id);
              });
              promotionStmt.finalize();
  
              const hotPostStmt = this.db.prepare('INSERT INTO task_hot_posts (task_id, hot_post_id) VALUES (?, ?)');
              hotPosts.forEach(post => {
                if (!post.id) {
                  console.error('Hot post missing id:', post);
                  return;
                }
                hotPostStmt.run(taskId, post.id);
              });
              hotPostStmt.finalize();
  
              this.db.run('COMMIT', (err: Error | null) => {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                } else {
                  resolve(taskId);
                }
              });
            });
          }
        );
      });
    });
  }
  
  public getTaskHotPosts(taskId: number): Promise<TrendingTopic[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT tt.* 
        FROM trending_topics tt
        JOIN task_hot_posts thp ON tt.id = thp.hot_post_id
        WHERE thp.task_id = ?
      `;
      this.db.all<TrendingTopic>(sql, [taskId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  
  public updateTaskWithRelations(taskId: number, taskData: Task, promotionItems: PromotionItem[], hotPosts: TrendingTopic[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
  
        this.db.run(`UPDATE tasks SET name = ?, promotion_count = ?, post_count = ?, stage = ? WHERE id = ?`, 
          [taskData.name, promotionItems.length, hotPosts.length, taskData.stage, taskId],
          (err) => {
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
              } else {
                resolve();
              }
            });
          }
        );
      });
    });
  }

  public getTaskExecutionDetails(taskId: number): Promise<(TaskExecution & { promotionItemName: string; hotPostTitle: string; hotPostUrl: string; accountName: string })[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT te.*, pi.name AS promotionItemName, tt.title AS hotPostTitle, tt.url AS hotPostUrl, a.account_username AS accountName
        FROM task_executions te
        LEFT JOIN promotion_items pi ON te.promotion_item_id = pi.id
        LEFT JOIN trending_topics tt ON te.hot_post_id = tt.id
        LEFT JOIN accounts a ON te.account_id = a.id
        WHERE te.task_id = ?
      `;
      this.db.all<TaskExecution & { promotionItemName: string; hotPostTitle: string; hotPostUrl: string; accountName: string }>(
        sql,
        [taskId],
        (err, rows) => {
          if (err) {
            console.error('Error in getTaskExecutionDetails:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  //Get execution by ID
  public getExecutionById(executionId: number): Promise<TaskExecution & { promotionItemName: string; hotPostTitle: string; hotPostUrl: string; modify_reply_prompt: string; task_id: number }> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT te.*, pi.name AS promotionItemName, tt.title AS hotPostTitle, tt.url AS hotPostUrl, t.modify_reply_prompt, t.id as task_id
        FROM task_executions te
        LEFT JOIN promotion_items pi ON te.promotion_item_id = pi.id
        LEFT JOIN trending_topics tt ON te.hot_post_id = tt.id
        LEFT JOIN tasks t ON te.task_id = t.id
        WHERE te.id = ?
      `;
      this.db.get<TaskExecution & { promotionItemName: string; hotPostTitle: string; hotPostUrl: string; modify_reply_prompt: string; task_id: number }>(
        sql,
        [executionId],
        (err, row) => {
          if (err) {
            console.error('Error in getExecutionById:', err);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  //Update execution publish info
  public updateExecutionPublishInfo(executionId: number, accountId: number, publishTime: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE task_executions SET account_id = ?, publish_time = ? WHERE id = ?`;
      this.db.run(sql, [accountId, publishTime, executionId], (err) => {
        if (err) {
          console.error('Error in updateExecutionPublishInfo:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Add method to get a promotion item by ID
  public getPromotionItemById(id: number): Promise<PromotionItem> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM promotion_items WHERE id = ?`;
      this.db.get<PromotionItem>(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Add method to get a hot post by ID
  public getHotPostById(id: string): Promise<TrendingTopic> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM trending_topics WHERE id = ?`;
      this.db.get<TrendingTopic>(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Add method to update a task execution record
  public updateTaskExecution(id: number, updatedFields: Partial<TaskExecution>): Promise<number> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(updatedFields).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updates.length === 0) {
        resolve(0); // No fields to update
        return;
      }

      const sql = `UPDATE task_executions SET ${updates.join(', ')} WHERE id = ?`;
      values.push(id);

      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public deleteTaskExecution(executionId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM task_executions WHERE id = ?`;
      this.db.run(sql, [executionId], function(this: sqlite3.RunResult, err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public async runTransaction(callback: (db: Database) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        this.db.run('BEGIN TRANSACTION');
        try {
          await callback(this.db);
          this.db.run('COMMIT', (err) => {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
            } else {
              resolve();
            }
          });
        } catch (error) {
          this.db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  public addAccount(account: Account): Promise<number> {
    return new Promise((resolve, reject) => {
      const {
        website_name,
        website_domain,
        account_status,
        playwright_login_state,
        login_state_update_time,
        login_state_suggested_update_interval,
        last_used_time,
        account_username,
        account_password,
        account_bound_phone_number,
        account_last_update_time,
        recent_login_screenshot,
        remarks
      } = account;
      const sql = `INSERT INTO accounts 
        (website_name, website_domain, account_status, playwright_login_state, login_state_update_time, login_state_suggested_update_interval, last_used_time, account_username, account_password, account_bound_phone_number, account_last_update_time, recent_login_screenshot, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [website_name, website_domain, account_status, playwright_login_state, login_state_update_time, login_state_suggested_update_interval, last_used_time, account_username, account_password, account_bound_phone_number, account_last_update_time, recent_login_screenshot, remarks], function(this: sqlite3.RunResult, err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  public getAllAccounts(): Promise<Account[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM accounts ORDER BY id DESC`;
      this.db.all<Account>(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get accounts by domain
  public getAccountsByDomain(domain: string): Promise<Account[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM accounts WHERE website_domain = ?`;
      this.db.all<Account>(sql, [domain], (err, rows) => {
        if (err) {
          console.error('Error in getAccountsByDomain:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public updateAccount(id: number, updatedAccount: Partial<Account>): Promise<number> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];
      
      Object.entries(updatedAccount).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (updates.length === 0) {
        resolve(0); // No fields to update
        return;
      }
      
      const sql = `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`;
      values.push(id);
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public deleteAccount(id: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM accounts WHERE id = ?`;
      this.db.run(sql, [id], function(this: sqlite3.RunResult, err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  public getAccountById(id: number): Promise<Account> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM accounts WHERE id = ?`;
      this.db.get<Account>(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public async updateAccountLoginState(id: number, loginState: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE accounts SET 
        playwright_login_state = ?,
        login_state_update_time = ?
        WHERE id = ?`;
      this.db.run(sql, [loginState, Date.now().toString(), id], (err) => {
        if (err) {
          console.error('Error updating account login state:', err);
          reject(err);
        } else {
          console.log(`Updated login state for account ${id}`);
          resolve();
        }
      });
    });
  }
}

export const dbOperations = new DBOperations();