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

module.exports = { saveHotItems };
