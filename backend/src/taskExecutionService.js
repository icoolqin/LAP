const { db, getTaskPromotionItems, getTaskHotPosts } = require('./dbOperations'); // 引入 db 对象

// 获取任务相关数据的函数
async function getTaskData(taskId) {
  try {
    // 获取推广标的ID
    const promotionItems = await getTaskPromotionItems(taskId);
    const promotionItemIds = promotionItems.map(item => item.promotion_item_id);

    // 获取网罗帖子ID
    const hotPosts = await getTaskHotPosts(taskId);
    const hotPostIds = hotPosts.map(post => post.hot_post_id);

    // 根据ID查询推广标的详细信息
    const promotionItemsData = await Promise.all(promotionItemIds.map(id => getPromotionItemById(id)));

    // 根据ID查询网罗帖子的详细信息
    const hotPostsData = await Promise.all(hotPostIds.map(id => getHotPostById(id)));

    // 组合成一个大的JSON对象
    const combinedData = {
      promotionItems: promotionItemsData,
      hotPosts: hotPostsData
    };

    return combinedData;
  } catch (error) {
    console.error('Error getting task data:', error);
    throw error;
  }
}

async function getPromotionItemById(id) {
  const sql = `SELECT id, name, description FROM promotion_items WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function getHotPostById(id) {
  const sql = `SELECT id, title, sitename FROM trending_topics WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = { getTaskData };
