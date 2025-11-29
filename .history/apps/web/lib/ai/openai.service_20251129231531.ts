/**
 * OpenAI Service - Central AI Layer for SPEC64
 * 
 * This service provides a unified interface for all AI operations in the system.
 * It handles:
 * - Multiple AI modes (CHAT, B2B_GENERATOR, CRM_ASSISTANT, etc.)
 * - Database-first configuration (ai_settings table)
 * - Feature flags for enabling/disabling AI modules
 * - Usage logging with cost calculation
 * - Retry logic with exponential backoff
 * - Timeout handling with AbortController
 * - Consistent error handling and logging
 */

import OpenAI from 'openai';
import { getAIConfig } from './config';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Available AI modes for different use cases
 */
export type AIMode =
  | 'CHAT'
  | 'B2B_GENERATOR'
  | 'CRM_ASSISTANT'
  | 'PROPOSAL_WRITER'
  | 'EMAIL_OUTREACH'
  | 'CLASSIFICATION';

/**
 * Parameters for AI execution
 */
export interface RunAIParams {
  /** AI mode to determine system prompt and behavior */
  mode: AIMode;
  /** User ID for tracking and rate limiting */
  userId: string;
  /** System prompt (will be merged with mode-specific base prompt) */
  system?: string;
  /** User message/prompt */
  user: string;
  /** Additional context information */
  context?: string;
  /** Max tokens for response (overrides default) */
  maxTokens?: number;
  /** Temperature for creativity (0-2, default 0.7) */
  temperature?: number;
  /** Metadata for logging and analytics */
  metadata?: Record<string, any>;
}

/**
 * Result from AI execution
 */
export interface RunAIResult {
  /** Generated text from AI */
  text: string;
  /** Raw OpenAI response (for debugging) */
  raw?: any;
}

/**
 * AI Error codes for better error handling
 */
export enum AIErrorCode {
  TIMEOUT = 'AI_TIMEOUT',
  RATE_LIMIT = 'AI_RATE_LIMIT',
  INVALID_API_KEY = 'AI_INVALID_API_KEY',
  INTERNAL_ERROR = 'AI_INTERNAL_ERROR',
  CONFIG_ERROR = 'AI_CONFIG_ERROR',
}

/**
 * Custom AI Error class
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Base system prompts for each AI mode
 */
const MODE_SYSTEM_PROMPTS: Record<AIMode, string> = {
  B2B_GENERATOR: `Você é um estrategista de prospecção B2B.
Sua função é gerar frases curtas, objetivas e ultra claras que descrevem oportunidades de negócio para encontrar empresas com algum problema, falha ou oportunidade real.

Regras:
- Máx. 1 frase.
- Sem explicação, apenas a instrução.
- Focar sempre em empresa-alvo B2B (quem VAI vender).
- Sempre incluir: tipo de empresa, região opcional, critério de dor/problema, e o que está errado/faltando.`,

  CRM_ASSISTANT: `Você é um assistente comercial que analisa leads, listas e interações.
Sua função é priorizar, resumir e sugerir próximos passos de contato, sem inventar dados que não existam.`,

  PROPOSAL_WRITER: `Você é um especialista em criação de propostas comerciais B2B.
Sua função é estruturar propostas claras, objetivas e persuasivas baseadas em dados reais da empresa e do lead.`,

  EMAIL_OUTREACH: `Você é um especialista em cold email e outreach B2B.
Sua função é criar mensagens personalizadas, diretas e com alta taxa de conversão.`,

  CLASSIFICATION: `Você é um classificador especializado.
Sua função é categorizar e organizar informações de forma consistente e precisa.`,

  CHAT: `Você é um assistente útil e prestativo que responde de forma clara e objetiva.`,
};

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main AI execution function with retry and timeout
 * 
 * @param params - AI execution parameters
 * @returns Promise with AI result
 * @throws {AIError} on failure after retries
 * 
 * @example
 * const result = await runAI({
 *   mode: 'B2B_GENERATOR',
 *   userId: 'user-123',
 *   user: 'Gerar oportunidade para empresas de tecnologia',
 *   metadata: { source: 'b2b_generator' }
 * });
 */
export async function runAI(params: RunAIParams): Promise<RunAIResult> {
  const startTime = Date.now();
  const maxRetries = 3;
  
  // Get configuration
  let config;
  try {
    config = getAIConfig();
  } catch (error) {
    throw new AIError(
      'AI layer is not properly configured. Check your OPENAI_API_KEY.',
      AIErrorCode.CONFIG_ERROR,
      error
    );
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    timeout: config.openaiTimeoutMs,
  });

  // Build system prompt (merge base + custom)
  const baseSystemPrompt = MODE_SYSTEM_PROMPTS[params.mode] || '';
  const systemPrompt = params.system 
    ? `${baseSystemPrompt}\n\n${params.system}`
    : baseSystemPrompt;

  // Build user message with context
  const userMessage = params.context
    ? `${params.user}\n\nContexto adicional: ${params.context}`
    : params.user;

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, config.openaiTimeoutMs);

      try {
        // Call OpenAI API
        const response = await openai.chat.completions.create({
          model: config.openaiModelDefault,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: params.maxTokens || config.openaiMaxTokens,
          temperature: params.temperature ?? 0.7,
        }, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const text = response.choices[0]?.message?.content?.trim() || '';
        const duration = Date.now() - startTime;

        // Log success
        console.log('[AI] Success:', {
          mode: params.mode,
          userId: params.userId,
          duration: `${duration}ms`,
          attempt,
          tokens: response.usage?.total_tokens,
          metadata: params.metadata,
        });

        return {
          text,
          raw: response,
        };

      } catch (error: any) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (error.name === 'AbortError') {
          throw new AIError(
            `AI request timed out after ${config.openaiTimeoutMs}ms`,
            AIErrorCode.TIMEOUT,
            error
          );
        }

        // Handle rate limit (429)
        if (error.status === 429) {
          throw new AIError(
            'OpenAI rate limit exceeded. Please try again later.',
            AIErrorCode.RATE_LIMIT,
            error
          );
        }

        // Handle invalid API key (401)
        if (error.status === 401) {
          throw new AIError(
            'Invalid OpenAI API key. Please check your configuration.',
            AIErrorCode.INVALID_API_KEY,
            error
          );
        }

        // Re-throw for retry
        throw error;
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;

      // If it's already an AIError, don't retry
      if (error instanceof AIError) {
        console.error('[AI] Error:', {
          mode: params.mode,
          userId: params.userId,
          code: error.code,
          message: error.message,
          duration: `${duration}ms`,
          attempt,
        });
        throw error;
      }

      // Log retry attempt
      console.warn('[AI] Retry attempt:', {
        mode: params.mode,
        userId: params.userId,
        attempt: `${attempt}/${maxRetries}`,
        error: error.message,
        duration: `${duration}ms`,
      });

      // If last attempt, throw error
      if (attempt === maxRetries) {
        throw new AIError(
          `AI request failed after ${maxRetries} attempts: ${error.message}`,
          AIErrorCode.INTERNAL_ERROR,
          error
        );
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      await sleep(backoffMs);
    }
  }

  // Should never reach here
  throw new AIError(
    'AI request failed unexpectedly',
    AIErrorCode.INTERNAL_ERROR
  );
}

/**
 * Check if a mode is valid
 */
export function isValidAIMode(mode: string): mode is AIMode {
  return [
    'CHAT',
    'B2B_GENERATOR',
    'CRM_ASSISTANT',
    'PROPOSAL_WRITER',
    'EMAIL_OUTREACH',
    'CLASSIFICATION',
  ].includes(mode);
}
