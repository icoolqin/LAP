import { Database } from 'sqlite3';
import { 
  PromotionItem, 
  HotPost, 
  TaskExecution, 
  AIResult, 
  TaskData, 
  GeneratedReply 
} from './types';
import { requestAIService } from './apiClient';

// Type definitions
interface PromotionItem {
  id: number;
  name: string;
  description: string;
  method?: string;
  type?: string;
}

interface HotPost {
  id: number;
  title: string;
  sitename: string;
}

interface TaskExecution {
  id: number;
  promotion_item_id: number;
  hot_post_id: number;
}

interface AIResult {
  promotional_item_id: number;
  post_id: number;
}

interface TaskData {
  promotionItems: Partial<PromotionItem>[];
  hotPosts: Partial<HotPost>[];
}

interface GeneratedReply {
  replyContent: string;
}


// Declare db as a property of the module
declare const db: Database;

// Database operations
async function getTaskPromotionItems(taskId: number): Promise<PromotionItem[]> {
  // Implementation remains the same, just add type annotations
  return [] as PromotionItem[]; // Placeholder
}

async function getTaskHotPosts(taskId: number): Promise<HotPost[]> {
  // Implementation remains the same, just add type annotations
  return [] as HotPost[]; // Placeholder
}

async function getTaskExecutionDetails(taskId: number): Promise<TaskExecution[]> {
  // Implementation remains the same, just add type annotations
  return [] as TaskExecution[]; // Placeholder
}

// Save AI results to database
async function saveAIResults(taskId: number, aiResult: string): Promise<void> {
  try {
    const jsonMatch = aiResult.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const matches: AIResult[] = JSON.parse(jsonMatch[0]).matches;

    const insertSql = `INSERT INTO task_executions (task_id, promotion_item_id, hot_post_id, status) VALUES (?, ?, ?, ?)`;

    return new Promise<void>((resolve, reject) => {
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

// Execute task main function
async function executeTask(taskId: number, userPrompt: string): Promise<{ success: boolean; message: string }> {
  try {
    const promotionItems = await getTaskPromotionItems(taskId);
    const hotPosts = await getTaskHotPosts(taskId);

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
    const replies: Record<string, GeneratedReply> = JSON.parse(aiResult);
    const updateSql = `UPDATE task_executions 
                       SET generated_reply = ?, generated_time = ? 
                       WHERE id = ?`;

    return new Promise<void>((resolve, reject) => {
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

async function generateReplies(taskId: number, userPrompt: string): Promise<{ success: boolean; message: string }> {
  try {
    const taskExecutions = await getTaskExecutionDetails(taskId);

    const promotionItemIds = [...new Set(taskExecutions.map(e => e.promotion_item_id))];
    const hotPostIds = [...new Set(taskExecutions.map(e => e.hot_post_id))];

    const promotionItems = await Promise.all(promotionItemIds.map(id => getTaskPromotionItems(taskId)));
    const hotPosts = await Promise.all(hotPostIds.map(id => getTaskHotPosts(taskId)));

    const promotionItemMap = Object.fromEntries(
      promotionItems.filter(item => item && item.length > 0)
        .flatMap(items => items.map(item => [item.id, item]))
    );
    const hotPostMap = Object.fromEntries(
      hotPosts.filter(post => post && post.length > 0)
        .flatMap(posts => posts.map(post => [post.id, post]))
    );

    const taskData: Record<string, TaskData> = {};
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

export { executeTask, generateReplies };