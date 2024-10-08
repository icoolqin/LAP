import { requestAIService } from '../src/apiClient';

describe('requestAIService Integration Test', () => {
  it('should return a non-empty string response', async () => {
    // This test will make a real API call
    const messageContent = 'Hello, AI!';
    
    try {
      const response = await requestAIService(messageContent);
      
      // Check if the response is a non-empty string
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      
      console.log('AI Service Response:', response);
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error; // Re-throw the error to fail the test
    }
  }, 30000); // Increase timeout to 30 seconds for API call
});