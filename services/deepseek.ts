import axios from 'axios';
import { DEEPSEEK_CONFIG } from '@/config/api';
import type { DeepSeekMessage, DeepSeekResponse } from '@/types/deepseek';

// Create an Axios instance with default config
const deepseekClient = axios.create({
  baseURL: DEEPSEEK_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEEPSEEK_CONFIG.API_KEY}`
  },
  timeout: 10000,
});

export const getDeepSeekResponse = async (
  messages: DeepSeekMessage[]
): Promise<DeepSeekResponse> => {
  try {
    const response = await deepseekClient.post('/chat/completions', {
      model: DEEPSEEK_CONFIG.MODEL,
      messages,
      temperature: 0.7,
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
}; 