import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TrendingTopic } from './types';

// Lucky Cola API configuration
const LUCKY_COLA_API_BASE_URL = 'https://luckycola.com.cn/tools';
const COLA_KEY = 'NYFW61adtakDeM17239768653657p55cd4nIx'; // 请替换为您的实际 ColaKey

// Interfaces
interface AIServiceConfig {
  name: string;
  url: string;
  key: string | null;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIServiceResponse {
  choices: Array<{
    message?: {
      content: string;
    };
  }>;
}

interface LuckyColaResponse {
  code: number;
  data: {
    items: Array<unknown>; // 可以根据实际返回的数据结构进一步定义
  };
}

// AI Service configurations
const AI_SERVICES: AIServiceConfig[] = [
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
const luckyColaApiClient: AxiosInstance = axios.create({
  baseURL: LUCKY_COLA_API_BASE_URL,
  headers: {
    'Authorization': COLA_KEY
  }
});

// AI Service client factory
function createAIServiceClient(serviceConfig: AIServiceConfig): AxiosInstance {
  return axios.create({
    baseURL: serviceConfig.url,
    headers: {
      'Content-Type': 'application/json',
      ...(serviceConfig.key && { 'Authorization': `Bearer ${serviceConfig.key}` })
    }
  });
}

// AI Service request function
async function requestAIService(messageContent: string, serviceName: string = 'Default AI'): Promise<string> {
  const serviceConfig = AI_SERVICES.find(service => service.name === serviceName);
  if (!serviceConfig) {
    throw new Error(`AI service "${serviceName}" not found`);
  }

  const aiClient = createAIServiceClient(serviceConfig);

  try {
    const response: AxiosResponse<AIServiceResponse> = await aiClient.post('', {
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: messageContent }
      ],
    });

    if (response.status === 200) {
      const content = response.data.choices[0]?.message?.content;
      if (content) {
        return content;
      } else {
        throw new Error('No content in AI response');
      }
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error requesting AI service (${serviceName}):`, error.message);
    } else {
      console.error(`Unknown error occurred while requesting AI service (${serviceName})`);
    }
    throw error;
  }
}

// Lucky Cola API functions
async function fetchAllHotItems(): Promise<TrendingTopic[]> {
  try {
    console.log(`Fetching trending topics...`);
    const response: AxiosResponse<LuckyColaResponse> = await luckyColaApiClient.get('/newsHot', {
      params: { ColaKey: COLA_KEY }
    });
    
    if (response.data && response.data.code === 0) {
      const items = response.data.data.items as TrendingTopic[];
      console.log(`Received ${items.length} trending topics.`);
      return items;
    } else {
      console.error('Unexpected response:', response.data);
      return [];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching trending topics:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } else {
      console.error('An unexpected error occurred:', error);
    }
    return [];
  }
}

export { fetchAllHotItems, requestAIService };