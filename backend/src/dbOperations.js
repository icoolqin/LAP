// dbOperations.js

const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './data/database.sqlite';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
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
        console.error('Error creating table', err.message);
      }
    });
  }
});

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
  
// 新增推广标的
async function addPromotionItem(item) {
    const { created_at, name, description, method, type, additional_info, status } = item;
    const sql = `INSERT INTO promotion_items (created_at, name, description, method, type, additional_info, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const result = await db.run(sql, [created_at, name, description, method, type, additional_info, status]);
    return result.lastID;
}

// 获取所有推广标的
async function getAllPromotionItems() {
    const sql = `SELECT * FROM promotion_items ORDER BY created_at DESC`;
    const items = await db.all(sql);
    return items;
}

// 更新推广标的
async function updatePromotionItem(id, updatedItem) {
    const { name, description, method, type, additional_info, status } = updatedItem;
    const sql = `UPDATE promotion_items 
                 SET name = ?, description = ?, method = ?, type = ?, additional_info = ?, status = ?
                 WHERE id = ?`;
    await db.run(sql, [name, description, method, type, additional_info, status, id]);
}

// 删除推广标的
async function deletePromotionItem(id) {
    const sql = `DELETE FROM promotion_items WHERE id = ?`;
    await db.run(sql, [id]);
}

// 修改推广标的状态
async function togglePromotionItemStatus(id, status) {
    const sql = `UPDATE promotion_items SET status = ? WHERE id = ?`;
    await db.run(sql, [status, id]);
}

module.exports = {
    saveHotItems, 
    getHotItems,
    addPromotionItem,
    getAllPromotionItems,
    updatePromotionItem,
    deletePromotionItem,
    togglePromotionItemStatus
};
