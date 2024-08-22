const axios = require('axios');

const API_BASE_URL = 'https://luckycola.com.cn/tools';
const COLA_KEY = 'NYFW61adtakDeM17239768653657p55cd4nIx'; // 请替换为您的实际 ColaKey

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': COLA_KEY
  }
});

async function fetchAllHotItems() {
  try {
    console.log(`Fetching trending topics...`);
    const response = await apiClient.get('/newsHot', {
      params: { ColaKey: COLA_KEY }
    });
    
    if (response.data && response.data.code === 0) {
      const items = response.data.data.items;
      console.log(`Received ${items.length} trending topics.`);
      return items;
    } else {
      console.error('Unexpected response:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching trending topics:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return [];
  }
}

module.exports = { fetchAllHotItems };
