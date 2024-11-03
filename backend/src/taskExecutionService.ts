// taskExecutionService.ts
import { dbOperations } from './dbOperations';
import { requestAIService } from './apiClient';
import robotManager from './robotManager';
import { Account, TaskExecution } from './types';
import { extractMainDomain } from './utils';

interface Match {
  promotional_item_id: number;
  post_id: string;
}

interface AIResult {
  matches: Match[];
}

interface TaskData {
  promotionItems: {
    id: number;
    name: string;
    description: string;
  }[];
  hotPosts: {
    id: string;
    title: string;
    sitename: string;
  }[];
}

interface GenerateReplyData {
  [key: string]: {
    promotionItems: {
      id: number;
      name: string;
      description: string;
      method: string;
      type: string;
    };
    hotPosts: {
      id: string;
      title: string;
      sitename: string;
    };
  };
}

interface GeneratedReply {
  replyContent: string;
}

// 保存AI结果到数据库
async function saveAIResults(taskId: number, aiResult: string): Promise<void> {
  try {
    const jsonMatch = aiResult.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    const matches = (JSON.parse(jsonMatch[0]) as AIResult).matches;
    const insertSql = `INSERT INTO task_executions (task_id, promotion_item_id, hot_post_id, status) VALUES (?, ?, ?, ?)`;

    await dbOperations.runTransaction(async (db) => {
      for (const match of matches) {
        await new Promise<void>((resolve, reject) => {
          db.run(insertSql, [taskId, match.promotional_item_id, match.post_id, 'completed'], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    });
  } catch (error) {
    console.error('Error saving AI results:', error);
    throw error;
  }
}

// 执行任务的主函数
export async function executeTask(taskId: number, userPrompt: string): Promise<{ success: boolean; message: string }> {
  try {
    const promotionItems = await dbOperations.getTaskPromotionItems(taskId);
    const hotPosts = await dbOperations.getTaskHotPosts(taskId);

    const filteredPromotionItems = promotionItems
    .filter(item => item.id !== undefined)
    .map(item => ({
      id: item.id!,
      name: item.name,
      description: item.description
    }));  

    const filteredHotPosts = hotPosts.map(post => ({
      id: post.id,
      title: post.title,
      sitename: post.sitename
    }));

    const taskData: TaskData = { 
      promotionItems: filteredPromotionItems, 
      hotPosts: filteredHotPosts 
    };

    const jsonPlaceholder = "{{json}}";
    let messageContent = userPrompt;
    if (messageContent.includes(jsonPlaceholder)) {
      messageContent = messageContent.replace(jsonPlaceholder, JSON.stringify(taskData));
    } else {
      messageContent += `\n\n${JSON.stringify(taskData)}`;
    }

    const aiResult = await requestAIService(messageContent);

    await saveAIResults(taskId, aiResult);

    return { success: true, message: 'Task executed successfully' };
  } catch (error) {
    console.error('Error executing task:', error);
    throw error;
  }
}

async function saveGeneratedReplies(aiResult: string): Promise<void> {
  try {
    // 输出原始返回的结果，方便调试
    // console.log("Raw AI result before cleaning:", aiResult);

    // 使用正则表达式去除 "json复制代码" 等不需要的字符
    const cleanedResult = aiResult.replace(/^json复制代码/, '').trim();
    
    // console.log("Cleaned AI result:", cleanedResult);

    // 检查内容是否为空或不符合 JSON 格式
    if (!cleanedResult || !cleanedResult.startsWith("{")) {
      throw new Error('Invalid JSON format in AI result');
    }

    const replies = JSON.parse(cleanedResult) as Record<string, GeneratedReply>;
    
    const updateSql = `UPDATE task_executions 
                       SET generated_reply = ?, generated_time = ? 
                       WHERE id = ?`;

    await dbOperations.runTransaction(async (db) => {
      for (const [id, reply] of Object.entries(replies)) {
        await new Promise<void>((resolve, reject) => {
          db.run(updateSql, [
            reply.replyContent,
            Date.now(),
            id
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    });
  } catch (error) {
    console.error('Error saving generated replies:', error);
    throw error;
  }
}

export async function generateReplies(taskId: number, userPrompt: string): Promise<{ success: boolean; message: string }> {
  try {
    const taskExecutions = await dbOperations.getTaskExecutionDetails(taskId);

    const promotionItemIds = [...new Set(taskExecutions.map(e => e.promotion_item_id))];
    const hotPostIds = [...new Set(taskExecutions.map(e => e.hot_post_id))];

    const promotionItems = await Promise.all(promotionItemIds.map(id => dbOperations.getTaskPromotionItems(taskId)));
    const hotPosts = await Promise.all(hotPostIds.map(id => dbOperations.getTaskHotPosts(taskId)));

    const promotionItemMap = Object.fromEntries(
      promotionItems.filter(item => item && item.length > 0)
        .flatMap(items => items.map(item => [item.id, item]))
    );
    const hotPostMap = Object.fromEntries(
      hotPosts.filter(post => post && post.length > 0)
        .flatMap(posts => posts.map(post => [post.id, post]))
    );

    const taskData: GenerateReplyData = {};
    for (const execution of taskExecutions) {
      if (execution.id === undefined) continue; 
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

    const jsonPlaceholder = "{{json}}";
    let messageContent = userPrompt;
    if (messageContent.includes(jsonPlaceholder)) {
      messageContent = messageContent.replace(jsonPlaceholder, JSON.stringify(taskData));
    } else {
      messageContent += `\n\n${JSON.stringify(taskData)}`;
    }

    const aiResult = await requestAIService(messageContent);

    await saveGeneratedReplies(aiResult);

    return { success: true, message: 'Replies generated successfully' };
  } catch (error) {
    console.error('Error generating replies:', error);
    throw error;
  }
}

// Add function to generate reply for a single execution
export async function generateSingleReply(executionId: number, userPrompt: string): Promise<string> {
  try {
    // Fetch the execution record
    const executionRecord = await dbOperations.getExecutionById(executionId);

    if (!executionRecord) {
      throw new Error(`Execution record with id ${executionId} not found`);
    }

    const promotionItem = await dbOperations.getPromotionItemById(executionRecord.promotion_item_id);
    const hotPost = await dbOperations.getHotPostById(executionRecord.hot_post_id);

    if (!promotionItem || !hotPost) {
      throw new Error('Missing promotion item or hot post data');
    }

    const taskData = {
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

    const jsonPlaceholder = "{{json}}";
    let messageContent = userPrompt;
    if (messageContent.includes(jsonPlaceholder)) {
      messageContent = messageContent.replace(jsonPlaceholder, JSON.stringify(taskData));
    } else {
      messageContent += `\n\n${JSON.stringify(taskData)}`;
    }

    const aiResult = await requestAIService(messageContent);

    // Return the AI response directly
    return aiResult;

  } catch (error) {
    console.error('Error generating single reply:', error);
    throw error;
  }
}

export async function publishReply(executionId: number): Promise<{ success: boolean }> {
  try {
    // Get the execution record
    const executionRecord = await dbOperations.getExecutionById(executionId);

    if (!executionRecord) {
      throw new Error(`Execution record with id ${executionId} not found`);
    }

    const { hotPostUrl, generated_reply } = executionRecord;

    if (!hotPostUrl || !generated_reply) {
      throw new Error('Missing post URL or generated reply content');
    }

    // Extract the main domain from hotPostUrl
    const mainDomain = extractMainDomain(hotPostUrl);

    if (!mainDomain) {
      throw new Error('Failed to extract main domain from post URL');
    }

    // Find an account matching the main domain with valid login state
    const accounts = await dbOperations.getAccountsByDomain(mainDomain);

    if (!accounts || accounts.length === 0) {
      throw new Error(`No accounts found for domain ${mainDomain}`);
    }

    const account = accounts.find(acc => acc.playwright_login_state);

    if (!account) {
      throw new Error(`No accounts with valid login state for domain ${mainDomain}`);
    }

    // Get the robot for the main domain
    const robot = robotManager.getRobot(mainDomain, account);

    // Use the robot to post the content
    const postSuccess = await robot.post(hotPostUrl, generated_reply);

    if (!postSuccess) {
      throw new Error('Failed to post reply');
    }

    // Update the execution record with publishing account and time
    const publishTime = Date.now().toString();
    await dbOperations.updateExecutionPublishInfo(executionId, account.id, publishTime);

    return { success: true };
  } catch (error) {
    console.error('Error publishing reply:', error);
    throw error;
  }
}