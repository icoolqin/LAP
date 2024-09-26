"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const apiClient_1 = require("./apiClient");
const taskExecutionService_1 = require("./taskExecutionService");
const dbOperations_1 = require("./dbOperations");
const robotManager_1 = require("./robotManager");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/update-hot-items', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield (0, apiClient_1.fetchAllHotItems)();
        yield (0, dbOperations_1.saveHotItems)(items);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating trending topics:', error);
        res.status(500).json({ success: false, error: 'An error occurred while updating trending topics.' });
    }
}));
app.get('/get-hot-items', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield (0, dbOperations_1.getHotItems)();
        res.json({ items });
    }
    catch (error) {
        console.error('Error getting hot items:', error);
        res.status(500).json({ error: 'Failed to retrieve hot items' });
    }
}));
app.post('/hot-posts/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startTime, endTime, title, domain, page, pageSize } = req.body;
        const filters = {};
        if (title)
            filters.title = title;
        if (domain)
            filters.domain = domain;
        if (startTime && endTime) {
            filters.time = {
                $gte: parseInt(startTime),
                $lte: parseInt(endTime),
            };
        }
        const result = yield (0, dbOperations_1.getHotPosts)(filters, page, pageSize);
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching hot posts:', error);
        res.status(500).json({ error: 'Failed to fetch hot posts' });
    }
}));
app.get('/promotion-items', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield (0, dbOperations_1.getAllPromotionItems)();
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch promotion items' });
    }
}));
app.post('/promotion-items', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = req.body;
        item.created_at = Date.now();
        const id = yield (0, dbOperations_1.addPromotionItem)(item);
        res.json({ id });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add promotion item' });
    }
}));
app.put('/promotion-items/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const updatedItem = req.body;
        yield (0, dbOperations_1.updatePromotionItem)(id, updatedItem);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update promotion item' });
    }
}));
app.delete('/promotion-items/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield (0, dbOperations_1.deletePromotionItem)(id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete promotion item' });
    }
}));
app.put('/promotion-items/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { status } = req.body;
        yield (0, dbOperations_1.togglePromotionItemStatus)(id, status);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update promotion item status' });
    }
}));
app.post('/promotion-items/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startTime, endTime, name, type } = req.body;
        const filters = {};
        if (name)
            filters.name = name;
        if (type)
            filters.type = type;
        if (startTime && endTime) {
            filters.created_at = {
                $gte: parseInt(startTime),
                $lte: parseInt(endTime),
            };
        }
        const items = yield (0, dbOperations_1.getPromotionItems)(filters);
        res.json(items || []);
    }
    catch (error) {
        console.error('Error fetching promotion items:', error);
        res.status(500).json({ error: 'Failed to fetch promotion items' });
    }
}));
app.get('/tasks', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tasks = yield (0, dbOperations_1.getAllTasks)();
        res.json(tasks || []);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
    }
}));
app.get('/tasks/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.id;
        const task = yield (0, dbOperations_1.getTaskById)(taskId);
        if (task) {
            res.json(task);
        }
        else {
            res.status(404).json({ error: 'Task not found' });
        }
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
}));
app.put('/tasks/:id/match-prompt', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.id;
        const { matchPrompt } = req.body;
        yield (0, dbOperations_1.updateTaskMatchPrompt)(taskId, matchPrompt);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task match prompt' });
    }
}));
app.post('/tasks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = req.body;
        task.created_at = Date.now();
        const id = yield addTask(task);
        res.json({ id });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add task' });
    }
}));
app.delete('/tasks/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield (0, dbOperations_1.deleteTask)(id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
}));
app.post('/tasks/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskData, promotionItems, hotPosts } = req.body;
        const taskId = yield (0, dbOperations_1.createTaskWithRelations)(taskData, promotionItems, hotPosts);
        res.json({ success: true, taskId });
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ success: false, error: 'Failed to create task' });
    }
}));
app.get('/tasks/:id/promotion-items', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.id;
        const items = yield (0, dbOperations_1.getTaskPromotionItems)(taskId);
        res.json(items);
    }
    catch (error) {
        console.error('Error fetching task promotion items:', error);
        res.status(500).json({ error: 'Failed to fetch task promotion items' });
    }
}));
app.get('/tasks/:id/hot-posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.id;
        const posts = yield (0, dbOperations_1.getTaskHotPosts)(taskId);
        res.json(posts);
    }
    catch (error) {
        console.error('Error fetching task hot posts:', error);
        res.status(500).json({ error: 'Failed to fetch task hot posts' });
    }
}));
app.put('/tasks/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.id;
        const { taskData, promotionItems, hotPosts } = req.body;
        yield (0, dbOperations_1.updateTaskWithRelations)(taskId, taskData, promotionItems, hotPosts);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ success: false, error: 'Failed to update task' });
    }
}));
app.get('/tasks/:id/execution', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.id;
        const executionDetails = yield (0, dbOperations_1.getTaskExecutionDetails)(taskId);
        res.json(executionDetails);
    }
    catch (error) {
        console.error('Error fetching task execution details:', error);
        res.status(500).json({ error: 'Failed to fetch task execution details' });
    }
}));
app.delete('/task-executions/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const executionId = req.params.id;
        yield (0, dbOperations_1.deleteTaskExecution)(executionId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting task execution:', error);
        res.status(500).json({ error: 'Failed to delete task execution' });
    }
}));
app.post('/tasks/:id/execute', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.params.id;
    const { matchPrompt } = req.body;
    try {
        const result = yield (0, taskExecutionService_1.executeTask)(taskId, matchPrompt);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error executing task:', error);
        res.status(500).json({ error: 'Failed to execute task' });
    }
}));
app.post('/tasks/:id/generate-replies', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.params.id;
    const { generatePrompt } = req.body;
    try {
        const result = yield (0, taskExecutionService_1.generateReplies)(taskId, generatePrompt);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error generating replies:', error);
        res.status(500).json({ error: 'Failed to generate replies' });
    }
}));
app.put('/tasks/:id/generate-prompt', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.id;
        const { generatePrompt } = req.body;
        yield (0, dbOperations_1.updateTaskGeneratePrompt)(taskId, generatePrompt);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task generate prompt' });
    }
}));
app.get('/accounts', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield (0, dbOperations_1.getAllAccounts)();
        res.json(accounts);
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
}));
app.post('/accounts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = req.body;
        const id = yield (0, dbOperations_1.addAccount)(account);
        res.json({ id });
    }
    catch (error) {
        console.error('Error adding account:', error);
        res.status(500).json({ error: 'Failed to add account' });
    }
}));
app.put('/accounts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const updatedAccount = req.body;
        yield (0, dbOperations_1.updateAccount)(id, updatedAccount);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ error: 'Failed to update account' });
    }
}));
app.delete('/accounts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield (0, dbOperations_1.deleteAccount)(id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
}));
app.post('/accounts/:id/update-login-state', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield robotManager_1.robotManager.updateLoginState(id);
        res.json({ success: true, message: 'Login state updated successfully' });
    }
    catch (error) {
        console.error('Error updating login state:', error);
        res.status(500).json({ success: false, error: 'Failed to update login state' });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
