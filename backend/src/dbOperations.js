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
        stage TEXT
    )`, (err) => {
        if (err) {
        console.error('Error creating tasks table', err.message);
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

        if (filters.created_at) {
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

function updateTask(id, updatedTask) {
    return new Promise((resolve, reject) => {
        const { name, promotion_count, post_count, match_count, stage } = updatedTask;
        const sql = `UPDATE tasks 
                     SET name = ?, promotion_count = ?, post_count = ?, match_count = ?, stage = ?
                     WHERE id = ?`;
        db.run(sql, [name, promotion_count, post_count, match_count, stage, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
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

module.exports = {
    saveHotItems, 
    getHotItems,
    addPromotionItem,
    getAllPromotionItems,
    updatePromotionItem,
    deletePromotionItem,
    togglePromotionItemStatus,
    addTask,
    getAllTasks,
    updateTask,
    deleteTask
};
