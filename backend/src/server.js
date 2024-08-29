const cors = require('cors');
const express = require('express');
const { fetchAllHotItems } = require('./apiClient');
const { saveHotItems, getHotItems, getHotPosts } = require('./dbOperations');
const { addPromotionItem, getAllPromotionItems, updatePromotionItem, deletePromotionItem, togglePromotionItemStatus, getPromotionItems, createTaskWithRelations, getAllTasks, deleteTask, getTaskPromotionItems, getTaskHotPosts, updateTaskWithRelations } = require('./dbOperations');

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

  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
