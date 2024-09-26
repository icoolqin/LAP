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
exports.fetchAllHotItems = fetchAllHotItems;
exports.requestAIService = requestAIService;
const axios_1 = __importDefault(require("axios"));
// Lucky Cola API configuration
const LUCKY_COLA_API_BASE_URL = 'https://luckycola.com.cn/tools';
const COLA_KEY = 'NYFW61adtakDeM17239768653657p55cd4nIx'; // 请替换为您的实际 ColaKey
// AI Service configurations
const AI_SERVICES = [
    {
        name: 'Default AI',
        url: 'http://localhost:8766/v1/chat/completions',
        key: null // 当前不需要 key
    },
    // 可以在此添加更多 AI 服务配置
    // {
    //   name: 'Alternative AI',
    //   url: 'https://api.alternative-ai.com/v1/chat',
    //   key: 'your-alternative-ai-key'
    // },
];
// Lucky Cola API client
const luckyColaApiClient = axios_1.default.create({
    baseURL: LUCKY_COLA_API_BASE_URL,
    headers: {
        'Authorization': COLA_KEY
    }
});
// AI Service client factory
function createAIServiceClient(serviceConfig) {
    return axios_1.default.create({
        baseURL: serviceConfig.url,
        headers: Object.assign({ 'Content-Type': 'application/json' }, (serviceConfig.key && { 'Authorization': `Bearer ${serviceConfig.key}` }))
    });
}
// AI Service request function
function requestAIService(messageContent_1) {
    return __awaiter(this, arguments, void 0, function* (messageContent, serviceName = 'Default AI') {
        var _a, _b;
        const serviceConfig = AI_SERVICES.find(service => service.name === serviceName);
        if (!serviceConfig) {
            throw new Error(`AI service "${serviceName}" not found`);
        }
        const aiClient = createAIServiceClient(serviceConfig);
        try {
            const response = yield aiClient.post('', {
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: messageContent }
                ],
            });
            if (response.status === 200) {
                const content = (_b = (_a = response.data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (content) {
                    return content;
                }
                else {
                    throw new Error('No content in AI response');
                }
            }
            else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`Error requesting AI service (${serviceName}):`, error.message);
            }
            else {
                console.error(`Unknown error occurred while requesting AI service (${serviceName})`);
            }
            throw error;
        }
    });
}
// Lucky Cola API functions
function fetchAllHotItems() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Fetching trending topics...`);
            const response = yield luckyColaApiClient.get('/newsHot', {
                params: { ColaKey: COLA_KEY }
            });
            if (response.data && response.data.code === 0) {
                const items = response.data.data.items;
                console.log(`Received ${items.length} trending topics.`);
                return items;
            }
            else {
                console.error('Unexpected response:', response.data);
                return [];
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Error fetching trending topics:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                }
            }
            else {
                console.error('An unexpected error occurred:', error);
            }
            return [];
        }
    });
}
