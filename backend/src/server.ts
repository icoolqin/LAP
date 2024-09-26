import cors from 'cors';
import express, { Request, Response } from 'express';
import { fetchAllHotItems, requestAIService } from './apiClient';
import { executeTask, generateReplies } from './taskExecutionService';
import { dbOperations } from './dbOperations';
import { RobotManager } from './robotManager';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface HotItem {
  // Define the structure of a hot item
}

interface PromotionItem {
  id?: string;
  name: string;
  type: string;
  created_at: number;
  // Add other properties as needed
}

interface Task {
  id?: string;
  // Define other properties of a task
}

interface Account {
  id?: string;
  // Define other properties of an account
}

app.get('/update-hot-items', async (_req: Request, res: Response) => {
  try {
    const items = await fetchAllHotItems();
    await saveHotItems(items);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating trending topics:', error);
    res.status(500).json({ success: false, error: 'An error occurred while updating trending topics.' });
  }
});

app.get('/get-hot-items', async (_req: Request, res: Response) => {
  try {
    const items = await getHotItems();
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

    const result = await getHotPosts(filters, page, pageSize);
    res.json(result);
  } catch (error) {
    console.error('Error fetching hot posts:', error);
    res.status(500).json({ error: 'Failed to fetch hot posts' });
  }
});

app.get('/promotion-items', async (_req: Request, res: Response) => {
  try {
    const items = await getAllPromotionItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promotion items' });
  }
});

app.post('/promotion-items', async (req: Request, res: Response) => {
  try {
    const item: PromotionItem = req.body;
    item.created_at = Date.now();
    const id = await addPromotionItem(item);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add promotion item' });
  }
});

app.put('/promotion-items/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const updatedItem: Partial<PromotionItem> = req.body;
    await updatePromotionItem(id, updatedItem);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promotion item' });
  }
});

app.delete('/promotion-items/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await deletePromotionItem(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promotion item' });
  }
});

app.put('/promotion-items/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    await togglePromotionItemStatus(id, status);
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

    const items = await getPromotionItems(filters);
    res.json(items || []);
  } catch (error) {
    console.error('Error fetching promotion items:', error);
    res.status(500).json({ error: 'Failed to fetch promotion items' });
  }
});

app.get('/tasks', async (_req: Request, res: Response) => {
  try {
    const tasks = await getAllTasks();
    res.json(tasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', details: (error as Error).message });
  }
});

app.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const task = await getTaskById(taskId);
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
    const taskId = req.params.id;
    const { matchPrompt } = req.body;
    await updateTaskMatchPrompt(taskId, matchPrompt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task match prompt' });
  }
});

app.post('/tasks', async (req: Request, res: Response) => {
  try {
    const task: Task = req.body;
    task.created_at = Date.now();
    const id = await addTask(task);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add task' });
  }
});

app.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await deleteTask(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.post('/tasks/create', async (req: Request, res: Response) => {
  try {
    const { taskData, promotionItems, hotPosts } = req.body;
    const taskId = await createTaskWithRelations(taskData, promotionItems, hotPosts);
    res.json({ success: true, taskId });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

app.get('/tasks/:id/promotion-items', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const items = await getTaskPromotionItems(taskId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching task promotion items:', error);
    res.status(500).json({ error: 'Failed to fetch task promotion items' });
  }
});

app.get('/tasks/:id/hot-posts', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const posts = await getTaskHotPosts(taskId);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching task hot posts:', error);
    res.status(500).json({ error: 'Failed to fetch task hot posts' });
  }
});

app.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const { taskData, promotionItems, hotPosts } = req.body;
    await updateTaskWithRelations(taskId, taskData, promotionItems, hotPosts);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

app.get('/tasks/:id/execution', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const executionDetails = await getTaskExecutionDetails(taskId);
    res.json(executionDetails);
  } catch (error) {
    console.error('Error fetching task execution details:', error);
    res.status(500).json({ error: 'Failed to fetch task execution details' });
  }
});

app.delete('/task-executions/:id', async (req: Request, res: Response) => {
  try {
    const executionId = req.params.id;
    await deleteTaskExecution(executionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task execution:', error);
    res.status(500).json({ error: 'Failed to delete task execution' });
  }
});

app.post('/tasks/:id/execute', async (req: Request, res: Response) => {
  const taskId = req.params.id;
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
  const taskId = req.params.id;
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
    const taskId = req.params.id;
    const { generatePrompt } = req.body;
    await updateTaskGeneratePrompt(taskId, generatePrompt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task generate prompt' });
  }
});

app.get('/accounts', async (_req: Request, res: Response) => {
  try {
    const accounts = await getAllAccounts();
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/accounts', async (req: Request, res: Response) => {
  try {
    const account: Account = req.body;
    const id = await addAccount(account);
    res.json({ id });
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).json({ error: 'Failed to add account' });
  }
});

app.put('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const updatedAccount: Partial<Account> = req.body;
    await updateAccount(id, updatedAccount);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

app.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await deleteAccount(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.post('/accounts/:id/update-login-state', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await robotManager.updateLoginState(id);
    res.json({ success: true, message: 'Login state updated successfully' });
  } catch (error) {
    console.error('Error updating login state:', error);
    res.status(500).json({ success: false, error: 'Failed to update login state' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});