const { db, getTaskExecutionDetails, getTaskPromotionItems, getTaskHotPosts } = require('./dbOperations'); 
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

async function saveGeneratedReplies(aiResult) {
  try {
    const replies = JSON.parse(aiResult);
    const updateSql = `UPDATE task_executions 
                       SET generated_reply = ?, generated_time = ? 
                       WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        Object.entries(replies).forEach(([id, reply]) => {
          db.run(updateSql, [
            reply.replyContent,
            Date.now(),
            id
          ], (err) => {
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
    console.error('Error saving generated replies:', error);
    throw error;
  }
}

async function generateReplies(taskId, userPrompt) {
  try {
    // Get task execution data
    const taskExecutions = await getTaskExecutionDetails(taskId);

    // Get all related promotion items and hot posts
    const promotionItemIds = [...new Set(taskExecutions.map(e => e.promotion_item_id))];
    const hotPostIds = [...new Set(taskExecutions.map(e => e.hot_post_id))];

    // Fetch promotion items and hot posts
    const promotionItems = await Promise.all(promotionItemIds.map(id => getTaskPromotionItems(taskId)));
    const hotPosts = await Promise.all(hotPostIds.map(id => getTaskHotPosts(taskId)));

    // Create mappings, filtering out any undefined results
    const promotionItemMap = Object.fromEntries(
      promotionItems.filter(item => item && item.length > 0)
        .flatMap(items => items.map(item => [item.id, item]))
    );
    const hotPostMap = Object.fromEntries(
      hotPosts.filter(post => post && post.length > 0)
        .flatMap(posts => posts.map(post => [post.id, post]))
    );

    // Prepare AI request data
    const taskData = {};
    for (const execution of taskExecutions) {
      const promotionItem = promotionItemMap[execution.promotion_item_id];
      const hotPost = hotPostMap[execution.hot_post_id];

      if (promotionItem && hotPost) {
        taskData[execution.id] = {
          promotionItems: {
            id: promotionItem.id,
            name: promotionItem.name,
            description: promotionItem.description,
            method: promotionItem.method,
            type: promotionItem.type
          },
          hotPosts: {
            id: hotPost.id,
            title: hotPost.title,
            sitename: hotPost.sitename
          }
        };
      }
    }

    // Assemble Prompt
    const jsonPlaceholder = "{{json}}";
    let messageContent = userPrompt;
    if (messageContent.includes(jsonPlaceholder)) {
      messageContent = messageContent.replace(jsonPlaceholder, JSON.stringify(taskData));
    } else {
      messageContent += `\n\n${JSON.stringify(taskData)}`;
    }

    // Interact with AI
    const aiResult = await requestAIService(messageContent);

    // Save AI results
    await saveGeneratedReplies(aiResult);

    return { success: true, message: 'Replies generated successfully' };
  } catch (error) {
    console.error('Error generating replies:', error);
    throw error;
  }
}

module.exports = { executeTask,generateReplies };
