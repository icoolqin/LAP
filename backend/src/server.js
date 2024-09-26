// server.js
const cors = require('cors');
const express = require('express');
const { fetchAllHotItems, requestAIService } = require('./apiClient');
const { executeTask, generateReplies } = require('./taskExecutionService'); 
const { saveHotItems, getHotItems, getHotPosts, addPromotionItem, getAllPromotionItems, updatePromotionItem, deletePromotionItem, getTaskById, updateTaskMatchPrompt, updateTaskGeneratePrompt, togglePromotionItemStatus, getPromotionItems, createTaskWithRelations, getAllTasks, deleteTask, getTaskPromotionItems, getTaskHotPosts, updateTaskWithRelations, getTaskExecutionDetails, deleteTaskExecution, addAccount, getAllAccounts, updateAccount, deleteAccount, getAccountById} = require('./dbOperations');
const { robotManager } = require('./robotManager');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

app.get('/update-hot-items', async (req, res) => {
    try {
      const items = await fetchAllHotItems();
      await saveHotItems(items);
      res.json({ success: true }); // 修改返回的JSON数据，包含success字段
    } catch (error) {
      console.error('Error updating trending topics:', error);
      res.status(500).json({ success: false, error: 'An error occurred while updating trending topics.' });
    }
  });
  

  app.get('/get-hot-items', async (req, res) => {
    try {
      const items = await getHotItems();
      res.json({ items });
    } catch (error) {
      console.error('Error getting hot items:', error);
      res.status(500).json({ error: 'Failed to retrieve hot items' });
    }
  });

  // 添加查询网罗帖子的接口
  app.post('/hot-posts/search', async (req, res) => {
    try {
        const { startTime, endTime, title, domain, page, pageSize } = req.body;

        const filters = {};
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


// 获取所有推广标的
app.get('/promotion-items', async (req, res) => {
    try {
        const items = await getAllPromotionItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch promotion items' });
    }
});

// 新增推广标的
app.post('/promotion-items', async (req, res) => {
    try {
        const item = req.body;
        item.created_at = Date.now();  // 设置创建时间戳
        const id = await addPromotionItem(item);
        res.json({ id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add promotion item' });
    }
});

// 更新推广标的
app.put('/promotion-items/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedItem = req.body;
        await updatePromotionItem(id, updatedItem);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update promotion item' });
    }
});

// 删除推广标的
app.delete('/promotion-items/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await deletePromotionItem(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete promotion item' });
    }
});

// 修改推广标的状态
app.put('/promotion-items/:id/status', async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        await togglePromotionItemStatus(id, status);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update promotion item status' });
    }
});

// 查询推广标的状态
app.post('/promotion-items/search', async (req, res) => {
    try {
        const { startTime, endTime, name, type } = req.body;

        const filters = {};
        if (name) filters.name = name;
        if (type) filters.type = type;
        if (startTime && endTime) {
            filters.created_at = {
                $gte: parseInt(startTime),
                $lte: parseInt(endTime),
            };
        }

        const items = await getPromotionItems(filters);
        res.json(items || []); // 确保我们总是返回一个数组
    } catch (error) {
        console.error('Error fetching promotion items:', error);
        res.status(500).json({ error: 'Failed to fetch promotion items' });
    }
});

// 获取所有任务
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await getAllTasks();
        res.json(tasks || []); // 确保返回数组
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
    }
});

// 获取单个任务信息
app.get('/tasks/:id', async (req, res) => {
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

// 更新任务的匹配 prompt
app.put('/tasks/:id/match-prompt', async (req, res) => {
  try {
      const taskId = req.params.id;
      const { matchPrompt } = req.body;
      await updateTaskMatchPrompt(taskId, matchPrompt);
      res.json({ success: true });
  } catch (error) {
      res.status(500).json({ error: 'Failed to update task match prompt' });
  }
});

// 新增任务
app.post('/tasks', async (req, res) => {
    try {
        const task = req.body;
        task.created_at = Date.now();
        const id = await addTask(task);
        res.json({ id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add task' });
    }
});

// 删除任务
app.delete('/tasks/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await deleteTask(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// 创建任务
app.post('/tasks/create', async (req, res) => {
    try {
      const { taskData, promotionItems, hotPosts } = req.body;
      const taskId = await createTaskWithRelations(taskData, promotionItems, hotPosts);
      res.json({ success: true, taskId });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ success: false, error: 'Failed to create task' });
    }
  });

  // Get promotion items for a specific task
app.get('/tasks/:id/promotion-items', async (req, res) => {
    try {
      const taskId = req.params.id;
      const items = await getTaskPromotionItems(taskId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching task promotion items:', error);
      res.status(500).json({ error: 'Failed to fetch task promotion items' });
    }
  });
  
  // Get hot posts for a specific task
  app.get('/tasks/:id/hot-posts', async (req, res) => {
    try {
      const taskId = req.params.id;
      const posts = await getTaskHotPosts(taskId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching task hot posts:', error);
      res.status(500).json({ error: 'Failed to fetch task hot posts' });
    }
  });
  
  // Update a task
  app.put('/tasks/:id', async (req, res) => {
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

// 获取任务执行详情
app.get('/tasks/:id/execution', async (req, res) => {
  try {
    const taskId = req.params.id;
    const executionDetails = await getTaskExecutionDetails(taskId);
    res.json(executionDetails);
  } catch (error) {
    console.error('Error fetching task execution details:', error);
    res.status(500).json({ error: 'Failed to fetch task execution details' });
  }
});

// 删除任务执行条目
app.delete('/task-executions/:id', async (req, res) => {
  try {
    const executionId = req.params.id;
    await deleteTaskExecution(executionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task execution:', error);
    res.status(500).json({ error: 'Failed to delete task execution' });
  }
});

// 处理执行任务的API端点
app.post('/tasks/:id/execute', async (req, res) => {
  const taskId = req.params.id;
  const { matchPrompt } = req.body;  // 从请求体获取用户输入的Prompt

  try {
    const result = await executeTask(taskId, matchPrompt);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error executing task:', error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

app.post('/tasks/:id/generate-replies', async (req, res) => {
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

// Add this new endpoint to update the generate prompt
app.put('/tasks/:id/generate-prompt', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { generatePrompt } = req.body;
    await updateTaskGeneratePrompt(taskId, generatePrompt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task generate prompt' });
  }
});

// 获取所有账号
app.get('/accounts', async (req, res) => {
  try {
    const accounts = await getAllAccounts();
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// 新增账号
app.post('/accounts', async (req, res) => {
  try {
    const account = req.body;
    const id = await addAccount(account);
    res.json({ id });
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).json({ error: 'Failed to add account' });
  }
});

// 更新账号
app.put('/accounts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedAccount = req.body;
    await updateAccount(id, updatedAccount);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// 删除账号
app.delete('/accounts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await deleteAccount(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// 新增处理更新登录状态的路由
app.post('/accounts/:id/update-login-state', async (req, res) => {
  const { id } = req.params;
  try {
    const loginState = await robotManager.updateLoginState(id);
    res.json({ success: true, message: 'Login state updated successfully' });
  } catch (error) {
    console.error('Error updating login state:', error);
    res.status(500).json({ success: false, error: 'Failed to update login state' });
  }
});

  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
