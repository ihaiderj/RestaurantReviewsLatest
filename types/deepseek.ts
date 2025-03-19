export interface DeepSeekMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  created: number;
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
} 