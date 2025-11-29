/**
 * AI Layer Configuration
 * 
 * Centralizes OpenAI configuration and provides safe access to environment variables
 * with fallbacks and validation.
 */

export interface AIConfig {
  openaiApiKey: string;
  openaiModelDefault: string;
  openaiModelHigh: string;
  openaiMaxTokens: number;
  openaiTimeoutMs: number;
}

/**
 * Reads AI configuration from environment variables with safe fallbacks
 * 
 * @throws {Error} if OPENAI_API_KEY is not provided
 */
export function getAIConfig(): AIConfig {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-proj-your_key_here') {
    throw new Error(
      'OPENAI_API_KEY is not configured. Please add it to your .env.local file.'
    );
  }

  return {
    openaiApiKey: apiKey,
    openaiModelDefault: process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini',
    openaiModelHigh: process.env.OPENAI_MODEL_HIGH || 'gpt-4o',
    openaiMaxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1200', 10),
    openaiTimeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '45000', 10),
  };
}

/**
 * Checks if AI layer is properly configured
 */
export function isAIConfigured(): boolean {
  try {
    getAIConfig();
    return true;
  } catch {
    return false;
  }
}
