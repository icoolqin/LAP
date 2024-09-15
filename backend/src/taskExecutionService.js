const { db, getTaskPromotionItems, getTaskHotPosts } = require('./dbOperations'); 
const { requestAIService } = require('./apiClient'); 

// 保存AI结果到数据库
async function saveAIResults(taskId, aiResult) {
  try {
    // 使用正则表达式提取 JSON 部分
    const jsonMatch = aiResult.match(/{[\s\S]*}/); // 匹配第一个大括号及其内容

    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const matches = JSON.parse(jsonMatch[0]).matches; // 只解析匹配到的 JSON 部分

    const insertSql = `INSERT INTO task_executions (task_id, promotion_item_id, hot_post_id, status) VALUES (?, ?, ?, ?)`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        matches.forEach((match) => {
          db.run(insertSql, [taskId, match.promotional_item_id, match.post_id, 'completed'], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
          });
        });
        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  } catch (error) {
    console.error('Error saving AI results:', error);
    throw error;
  }
}

// 执行任务的主函数
async function executeTask(taskId, userPrompt) {
  try {
    // 获取任务相关数据
    const promotionItems = await getTaskPromotionItems(taskId);
    const hotPosts = await getTaskHotPosts(taskId);

    // 筛选出需要的字段
    const filteredPromotionItems = promotionItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description
    }));

    const filteredHotPosts = hotPosts.map(post => ({
      id: post.id,
      title: post.title,
      sitename: post.sitename
    }));

    const taskData = { 
      promotionItems: filteredPromotionItems, 
      hotPosts: filteredHotPosts 
    };

    // 拼装Prompt
    const jsonPlaceholder = "{{json}}";
    let messageContent = userPrompt;
    if (messageContent.includes(jsonPlaceholder)) {
      messageContent = messageContent.replace(jsonPlaceholder, JSON.stringify(taskData));
    } else {
      messageContent += `\n\n${JSON.stringify(taskData)}`;
    }

    // 与AI交互
    const aiResult = await requestAIService(messageContent);

    // 保存AI结果
    await saveAIResults(taskId, aiResult);

    return { success: true, message: 'Task executed successfully' };
  } catch (error) {
    console.error('Error executing task:', error);
    throw error;
  }
}

module.exports = { executeTask };
