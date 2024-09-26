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
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTask = executeTask;
exports.generateReplies = generateReplies;
const apiClient_1 = require("./apiClient");
// Database operations
function getTaskPromotionItems(taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation remains the same, just add type annotations
        return []; // Placeholder
    });
}
function getTaskHotPosts(taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation remains the same, just add type annotations
        return []; // Placeholder
    });
}
function getTaskExecutionDetails(taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Implementation remains the same, just add type annotations
        return []; // Placeholder
    });
}
// Save AI results to database
function saveAIResults(taskId, aiResult) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const jsonMatch = aiResult.match(/{[\s\S]*}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }
            const matches = JSON.parse(jsonMatch[0]).matches;
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
                        }
                        else {
                            resolve();
                        }
                    });
                });
            });
        }
        catch (error) {
            console.error('Error saving AI results:', error);
            throw error;
        }
    });
}
// Execute task main function
function executeTask(taskId, userPrompt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const promotionItems = yield getTaskPromotionItems(taskId);
            const hotPosts = yield getTaskHotPosts(taskId);
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
            const jsonPlaceholder = "{{json}}";
            let messageContent = userPrompt;
            if (messageContent.includes(jsonPlaceholder)) {
                messageContent = messageContent.replace(jsonPlaceholder, JSON.stringify(taskData));
            }
            else {
                messageContent += `\n\n${JSON.stringify(taskData)}`;
            }
            const aiResult = yield (0, apiClient_1.requestAIService)(messageContent);
            yield saveAIResults(taskId, aiResult);
            return { success: true, message: 'Task executed successfully' };
        }
        catch (error) {
            console.error('Error executing task:', error);
            throw error;
        }
    });
}
function saveGeneratedReplies(aiResult) {
    return __awaiter(this, void 0, void 0, function* () {
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
                        }
                        else {
                            resolve();
                        }
                    });
                });
            });
        }
        catch (error) {
            console.error('Error saving generated replies:', error);
            throw error;
        }
    });
}
function generateReplies(taskId, userPrompt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const taskExecutions = yield getTaskExecutionDetails(taskId);
            const promotionItemIds = [...new Set(taskExecutions.map(e => e.promotion_item_id))];
            const hotPostIds = [...new Set(taskExecutions.map(e => e.hot_post_id))];
            const promotionItems = yield Promise.all(promotionItemIds.map(id => getTaskPromotionItems(taskId)));
            const hotPosts = yield Promise.all(hotPostIds.map(id => getTaskHotPosts(taskId)));
            const promotionItemMap = Object.fromEntries(promotionItems.filter(item => item && item.length > 0)
                .flatMap(items => items.map(item => [item.id, item])));
            const hotPostMap = Object.fromEntries(hotPosts.filter(post => post && post.length > 0)
                .flatMap(posts => posts.map(post => [post.id, post])));
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
            const jsonPlaceholder = "{{json}}";
            let messageContent = userPrompt;
            if (messageContent.includes(jsonPlaceholder)) {
                messageContent = messageContent.replace(jsonPlaceholder, JSON.stringify(taskData));
            }
            else {
                messageContent += `\n\n${JSON.stringify(taskData)}`;
            }
            const aiResult = yield (0, apiClient_1.requestAIService)(messageContent);
            yield saveGeneratedReplies(aiResult);
            return { success: true, message: 'Replies generated successfully' };
        }
        catch (error) {
            console.error('Error generating replies:', error);
            throw error;
        }
    });
}
