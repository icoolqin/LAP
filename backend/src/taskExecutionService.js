const { getTaskPromotionItems, getTaskHotPosts } = require('./dbOperations');

async function getTaskData(taskId) {
  try {
    // 获取推广标的
    const promotionItems = await getTaskPromotionItems(taskId);
    const promotionItemsData = promotionItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description
    }));

    // 获取网罗帖子
    const hotPosts = await getTaskHotPosts(taskId);
    const hotPostsData = hotPosts.map(post => ({
      id: post.id,
      title: post.title,
      sitename: post.sitename
    }));

    // 组合成一个大的JSON对象
    return {
      promotionItems: promotionItemsData,
      hotPosts: hotPostsData
    };
  } catch (error) {
    console.error('Error getting task data:', error);
    throw error;
  }
}

module.exports = { getTaskData };