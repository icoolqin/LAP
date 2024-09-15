const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './data/database.sqlite';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // 创建 trending_topics 表
    db.run(`CREATE TABLE IF NOT EXISTS trending_topics (
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
    )`, (err) => {
      if (err) {
        console.error('Error creating trending_topics table', err.message);
      }
    });

    // 创建 promotion_items 表
    db.run(`CREATE TABLE IF NOT EXISTS promotion_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT,
      name TEXT,
      description TEXT,
      method TEXT,
      type TEXT,
      additional_info TEXT,
      status TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating promotion_items table', err.message);
      }
    });

    // 创建 tasks 表
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT,
        name TEXT,
        promotion_count INTEGER,
        post_count INTEGER,
        match_count INTEGER,
        stage TEXT,
        match_prompt TEXT
    )`, (err) => {
        if (err) {
        console.error('Error creating tasks table', err.message);
        }
    });

    // 创建 task_promotion_items 表
    db.run(`CREATE TABLE IF NOT EXISTS task_promotion_items (
        task_id INTEGER,
        promotion_item_id INTEGER,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (promotion_item_id) REFERENCES promotion_items(id)
      )`, (err) => {
        if (err) {
          console.error('Error creating task_promotion_items table', err.message);
        }
      });
  
      // 创建 task_hot_posts 表
      db.run(`CREATE TABLE IF NOT EXISTS task_hot_posts (
        task_id INTEGER,
        hot_post_id TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (hot_post_id) REFERENCES trending_topics(id)
      )`, (err) => {
        if (err) {
          console.error('Error creating task_hot_posts table', err.message);
        }
      });
  
      // 创建task_executions表
      db.run(`CREATE TABLE IF NOT EXISTS task_executions (
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
      )`, (err) => {
        if (err) {
          console.error('Error creating task_matches table', err.message);
        }
      });
  }
});


// 热门帖子功能
function saveHotItems(items) {
  const stmt = db.prepare(`INSERT OR REPLACE INTO trending_topics (id, title, thumbnail, url, md5, extra, time, nodeids, topicid, domain, sitename, logo, views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  items.forEach((item) => {
    stmt.run(item.ID, item.title, item.thumbnail, item.url, item.md5, item.extra, item.time, item.nodeids, item.topicid, item.domain, item.sitename, item.logo, item.views, (err) => {
      if (err) {
        console.error('Error inserting trending topic', err.message);
      }
    });
  });

  stmt.finalize();
}

function getHotItems() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM trending_topics ORDER BY time DESC`, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

// 增加一个获取热门帖子的方法
function getHotPosts(filters, page = 1, pageSize = 10) {
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

        // Add COUNT query to get total number of items
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');

        sql += ` ORDER BY time DESC LIMIT ? OFFSET ?`;
        params.push(pageSize, (page - 1) * pageSize);

        db.get(countSql, params.slice(0, -2), (err, countRow) => {
            if (err) {
                reject(err);
            } else {
                db.all(sql, params, (err, rows) => {
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
  
// 推广标的管理功能
function addPromotionItem(item) {
    return new Promise((resolve, reject) => {
        const { created_at, name, description, method, type, additional_info, status } = item;
        const sql = `INSERT INTO promotion_items (created_at, name, description, method, type, additional_info, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [created_at, name, description, method, type, additional_info, status], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function getAllPromotionItems() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM promotion_items ORDER BY created_at DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function updatePromotionItem(id, updatedItem) {
    return new Promise((resolve, reject) => {
        const { name, description, method, type, additional_info, status } = updatedItem;
        const sql = `UPDATE promotion_items 
                     SET name = ?, description = ?, method = ?, type = ?, additional_info = ?, status = ?
                     WHERE id = ?`;
        db.run(sql, [name, description, method, type, additional_info, status, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

function deletePromotionItem(id) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM promotion_items WHERE id = ?`;
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

function togglePromotionItemStatus(id, status) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE promotion_items SET status = ? WHERE id = ?`;
        db.run(sql, [status, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

function getPromotionItems(filters) {
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

        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function addTask(task) {
    return new Promise((resolve, reject) => {
        const { created_at, name, promotion_count, post_count, match_count, stage } = task;
        const sql = `INSERT INTO tasks (created_at, name, promotion_count, post_count, match_count, stage) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [created_at, name, promotion_count, post_count, match_count, stage], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function getAllTasks() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM tasks ORDER BY created_at DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getTaskById(id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM tasks WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function deleteTask(id) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM tasks WHERE id = ?`;
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

function updateTaskMatchPrompt(id, matchPrompt) {
  return new Promise((resolve, reject) => {
      const sql = `UPDATE tasks SET match_prompt = ? WHERE id = ?`;
      db.run(sql, [matchPrompt, id], function(err) {
          if (err) {
              reject(err);
          } else {
              resolve(this.changes);
          }
      });
  });
}

function createTaskWithRelations(taskData, promotionItems, hotPosts) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(`INSERT INTO tasks (created_at, name, promotion_count, post_count, match_count, stage) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                [Date.now(), taskData.name, promotionItems.length, hotPosts.length, 0, '初创'],
                function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const taskId = this.lastID;

          const promotionStmt = db.prepare('INSERT INTO task_promotion_items (task_id, promotion_item_id) VALUES (?, ?)');
          promotionItems.forEach(item => {
            promotionStmt.run(taskId, item.id);
          });
          promotionStmt.finalize();

          const hotPostStmt = db.prepare('INSERT INTO task_hot_posts (task_id, hot_post_id) VALUES (?, ?)');
          hotPosts.forEach(post => {
            hotPostStmt.run(taskId, post.id);
          });
          hotPostStmt.finalize();

          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              resolve(taskId);
            }
          });
        });
      });
    });
  }

  function getTaskPromotionItems(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT pi.* 
        FROM promotion_items pi
        JOIN task_promotion_items tpi ON pi.id = tpi.promotion_item_id
        WHERE tpi.task_id = ?
      `;
      db.all(sql, [taskId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  function getTaskHotPosts(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT tt.* 
        FROM trending_topics tt
        JOIN task_hot_posts thp ON tt.id = thp.hot_post_id
        WHERE thp.task_id = ?
      `;
      db.all(sql, [taskId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  function updateTaskWithRelations(taskId, taskData, promotionItems, hotPosts) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
  
        // Update task data
        db.run(`UPDATE tasks SET name = ?, promotion_count = ?, post_count = ?, stage = ? WHERE id = ?`, 
          [taskData.name, promotionItems.length, hotPosts.length, taskData.stage, taskId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
  
            // Delete existing relations
            db.run(`DELETE FROM task_promotion_items WHERE task_id = ?`, [taskId]);
            db.run(`DELETE FROM task_hot_posts WHERE task_id = ?`, [taskId]);
  
            // Insert new relations
            const promotionStmt = db.prepare('INSERT INTO task_promotion_items (task_id, promotion_item_id) VALUES (?, ?)');
            promotionItems.forEach(item => {
              promotionStmt.run(taskId, item.id);
            });
            promotionStmt.finalize();
  
            const hotPostStmt = db.prepare('INSERT INTO task_hot_posts (task_id, hot_post_id) VALUES (?, ?)');
            hotPosts.forEach(post => {
              hotPostStmt.run(taskId, post.id);
            });
            hotPostStmt.finalize();
  
            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
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

// 获取任务执行详情
function getTaskExecutionDetails(taskId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT te.id, te.task_id, te.promotion_item_id, te.hot_post_id, te.generated_reply, te.generated_time, 
             te.robot_id, te.publish_time, te.status, pi.name AS promotionItemName, 
             tt.title AS hotPostTitle, tt.url AS hotPostUrl
      FROM task_executions te
      LEFT JOIN promotion_items pi ON te.promotion_item_id = pi.id
      LEFT JOIN trending_topics tt ON te.hot_post_id = tt.id
      WHERE te.task_id = ?`;
    
    db.all(sql, [taskId], (err, rows) => {
      if (err) {
        console.error('Error in getTaskExecutionDetails:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 删除任务执行条目
function deleteTaskExecution(executionId) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM task_executions WHERE id = ?`;
    db.run(sql, [executionId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}


module.exports = {
    db,
    saveHotItems, 
    getHotItems,
    getHotPosts,
    addPromotionItem,
    getAllPromotionItems,
    updatePromotionItem,
    deletePromotionItem,
    togglePromotionItemStatus,
    addTask,
    getAllTasks,
    getTaskById,
    deleteTask,
    updateTaskMatchPrompt,
    getPromotionItems,
    createTaskWithRelations,
    getTaskPromotionItems,
    getTaskHotPosts,
    updateTaskWithRelations,
    getTaskExecutionDetails,
    deleteTaskExecution
};
