/**
 * AI Layer Public API
 * 
 * This file exports all public types and functions from the AI layer.
 * Import from this file instead of individual modules.
 * 
 * @example
 * ```typescript
 * import { runAI, AIMode, type RunAIParams } from '@/lib/ai';
 * 
 * const result = await runAI({
 *   mode: 'B2B_GENERATOR',
 *   userId: user.id,
 *   user: 'Seu prompt aqui'
 * });
 * ```
 */

// Re-export types and functions from openai.service
export {
  runAI,
  isValidAIMode,
  AIError,
  AIErrorCode,
  type AIMode,
  type RunAIParams,
  type RunAIResult,
} from './openai.service';

// Re-export config utilities
export {
  getAIConfig,
  isAIConfigured,
  type AIConfig,
} from './config';

// Re-export rate limiting utilities
export {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  getRateLimitStoreSize,
  DEFAULT_RATE_LIMIT,
  type RateLimitConfig,
} from './rate-limit';
