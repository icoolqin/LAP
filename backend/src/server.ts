import cors from 'cors';
import express, { Request, Response } from 'express';
import { TrendingTopic, PromotionItem, Task, TaskExecution, Account  } from './types';
import { fetchAllHotItems, requestAIService } from './apiClient';
import { executeTask, generateReplies,  } from './taskExecutionService';
import { dbOperations } from './dbOperations';
// import { robotManager } from './robotManager';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/update-hot-items', async (_req: Request, res: Response) => {
  try {
    const items: TrendingTopic[] = await fetchAllHotItems();
    await dbOperations.saveHotItems(items);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating trending topics:', error);
    res.status(500).json({ success: false, error: 'An error occurred while updating trending topics.' });
  }
});

app.get('/get-hot-items', async (_req: Request, res: Response) => {
  try {
    const items = await dbOperations.getHotItems();
    res.json({ items });
  } catch (error) {
    console.error('Error getting hot items:', error);
    res.status(500).json({ error: 'Failed to retrieve hot items' });
  }
});

app.post('/hot-posts/search', async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, title, domain, page, pageSize } = req.body;

    const filters: Record<string, any> = {};
    if (title) filters.title = title;
    if (domain) filters.domain = domain;
    if (startTime && endTime) {
      filters.time = {
        $gte: parseInt(startTime),
        $lte: parseInt(endTime),
      };
    }

    const result = await dbOperations.getHotPosts(filters, page, pageSize);
    res.json(result);
  } catch (error) {
    console.error('Error fetching hot posts:', error);
    res.status(500).json({ error: 'Failed to fetch hot posts' });
  }
});

app.get('/promotion-items', async (_req: Request, res: Response) => {
  try {
    const items = await dbOperations.getAllPromotionItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promotion items' });
  }
});

app.post('/promotion-items', async (req: Request, res: Response) => {
  try {
    const item: PromotionItem = req.body;
    item.created_at = new Date().toISOString(); // 使用 ISO 字符串格式
    const id = await dbOperations.addPromotionItem(item);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add promotion item' });
  }
});

app.put('/promotion-items/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedItem: Partial<PromotionItem> = req.body;
    await dbOperations.updatePromotionItem(id, updatedItem);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promotion item' });
  }
});

app.delete('/promotion-items/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await dbOperations.deletePromotionItem(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promotion item' });
  }
});

app.put('/promotion-items/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    await dbOperations.togglePromotionItemStatus(id, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promotion item status' });
  }
});

app.post('/promotion-items/search', async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, name, type } = req.body;

    const filters: Record<string, any> = {};
    if (name) filters.name = name;
    if (type) filters.type = type;
    if (startTime && endTime) {
      filters.created_at = {
        $gte: parseInt(startTime),
        $lte: parseInt(endTime),
      };
    }

    const items = await dbOperations.getPromotionItems(filters);
    res.json(items || []);
  } catch (error) {
    console.error('Error fetching promotion items:', error);
    res.status(500).json({ error: 'Failed to fetch promotion items' });
  }
});

app.get('/tasks', async (_req: Request, res: Response) => {
  try {
    const tasks = await dbOperations.getAllTasks();
    res.json(tasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', details: (error as Error).message });
  }
});

app.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const task = await dbOperations.getTaskById(taskId);
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

app.put('/tasks/:id/match-prompt', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { matchPrompt } = req.body;
    await dbOperations.updateTaskMatchPrompt(taskId, matchPrompt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task match prompt' });
  }
});

app.post('/tasks', async (req: Request, res: Response) => {
  try {
    const task: Task = req.body;
    task.created_at = new Date().toISOString(); 
    const id = await dbOperations.addTask(task);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add task' });
  }
});

app.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await dbOperations.deleteTask(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.post('/tasks/create', async (req: Request, res: Response) => {
  try {
    const { taskData, promotionItems, hotPosts } = req.body;
    const taskId = await dbOperations.createTaskWithRelations(taskData, promotionItems, hotPosts);
    res.json({ success: true, taskId });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

app.get('/tasks/:id/promotion-items', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10); 
    const items = await dbOperations.getTaskPromotionItems(taskId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching task promotion items:', error);
    res.status(500).json({ error: 'Failed to fetch task promotion items' });
  }
});

app.get('/tasks/:id/hot-posts', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const posts = await dbOperations.getTaskHotPosts(taskId);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching task hot posts:', error);
    res.status(500).json({ error: 'Failed to fetch task hot posts' });
  }
});

app.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const { taskData, promotionItems, hotPosts } = req.body;
    await dbOperations.updateTaskWithRelations(taskId, taskData as Task, promotionItems as PromotionItem[], hotPosts as TrendingTopic[]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

app.get('/tasks/:id/execution', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const executionDetails = await dbOperations.getTaskExecutionDetails(taskId);
    res.json(executionDetails);
  } catch (error) {
    console.error('Error fetching task execution details:', error);
    res.status(500).json({ error: 'Failed to fetch task execution details' });
  }
});

app.delete('/task-executions/:id', async (req: Request, res: Response) => {
  try {
    const executionId = parseInt(req.params.id, 10);
    await dbOperations.deleteTaskExecution(executionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task execution:', error);
    res.status(500).json({ error: 'Failed to delete task execution' });
  }
});

app.post('/tasks/:id/execute', async (req: Request, res: Response) => {
  const taskId = parseInt(req.params.id, 10);
  const { matchPrompt } = req.body;

  try {
    const result = await executeTask(taskId, matchPrompt);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error executing task:', error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

app.post('/tasks/:id/generate-replies', async (req: Request, res: Response) => {
  const taskId = parseInt(req.params.id, 10);
  const { generatePrompt } = req.body;

  try {
    const result = await generateReplies(taskId, generatePrompt);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating replies:', error);
    res.status(500).json({ error: 'Failed to generate replies' });
  }
});

app.put('/tasks/:id/generate-prompt', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { generatePrompt } = req.body;
    await dbOperations.updateTaskGeneratePrompt(taskId, generatePrompt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task generate prompt' });
  }
});

app.get('/accounts', async (_req: Request, res: Response) => {
  try {
    const accounts = await dbOperations.getAllAccounts();
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/accounts', async (req: Request, res: Response) => {
  try {
    const account: Account = req.body;
    const id = await dbOperations.addAccount(account);
    res.json({ id });
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).json({ error: 'Failed to add account' });
  }
});

app.put('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedAccount: Partial<Account> = req.body;
    await dbOperations.updateAccount(id, updatedAccount);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

app.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await dbOperations.deleteAccount(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// app.post('/accounts/:id/update-login-state', async (req: Request, res: Response) => {
//   const id = parseInt(req.params.id, 10);
//   try {
//     await robotManager.updateLoginState(id);
//     res.json({ success: true, message: 'Login state updated successfully' });
//   } catch (error) {
//     console.error('Error updating login state:', error);
//     res.status(500).json({ success: false, error: 'Failed to update login state' });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});