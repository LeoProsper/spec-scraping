/**
 * AI Run API Route
 * 
 * Generic endpoint for all AI operations in SPEC64.
 * Handles authentication, rate limiting, AI execution, and usage logging.
 * 
 * POST /api/ai/run
 * 
 * Body:
 * {
 *   "mode": "B2B_GENERATOR" | "CHAT" | "CRM_ASSISTANT" | "PROPOSAL_WRITER" | "EMAIL_OUTREACH" | "CLASSIFICATION",
 *   "user": "user message/prompt",
 *   "system": "optional system prompt override",
 *   "context": "optional additional context",
 *   "maxTokens": 800,
 *   "temperature": 0.6,
 *   "metadata": {
 *     "source": "b2b_generator",
 *     "category": "Web & Digital"
 *   }
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "mode": "B2B_GENERATOR",
 *   "result": "Generated text from AI"
 * }
 * 
 * Response (Error):
 * {
 *   "success": false,
 *   "error": "User-friendly error message",
 *   "code": "AI_TIMEOUT" | "AI_RATE_LIMIT" | "AI_INTERNAL_ERROR"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@kit/supabase/server';
import { runAI, isValidAIMode, AIError, AIErrorCode, type AIMode } from '@/lib/ai/openai.service';
import { checkRateLimit, getRateLimitStatus } from '@/lib/ai/rate-limit';
import { z } from 'zod';

/**
 * Request body validation schema
 */
const requestSchema = z.object({
  mode: z.string(),
  user: z.string().min(1, 'User message is required'),
  system: z.string().optional(),
  context: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Log AI usage to database
 */
async function logUsage(params: {
  userId: string;
  mode: AIMode;
  metadata?: Record<string, any>;
  tokensUsed?: number;
  durationMs?: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}) {
  try {
    const supabase = await createClient();
    
    await supabase.from('ai_usage_logs').insert({
      user_id: params.userId,
      mode: params.mode,
      metadata: params.metadata || {},
      tokens_used: params.tokensUsed || null,
      duration_ms: params.durationMs || null,
      success: params.success,
      error_code: params.errorCode || null,
      error_message: params.errorMessage || null,
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('[AI API] Failed to log usage:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please log in to use AI features.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid request parameters.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    const { mode, user: userMessage, system, context, maxTokens, temperature, metadata } = validation.data;

    // 3. Validate AI mode
    if (!isValidAIMode(mode)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid AI mode: ${mode}. Valid modes: CHAT, B2B_GENERATOR, CRM_ASSISTANT, PROPOSAL_WRITER, EMAIL_OUTREACH, CLASSIFICATION`,
          code: 'INVALID_MODE',
        },
        { status: 400 }
      );
    }

    // 4. Check rate limit
    if (!checkRateLimit(user.id)) {
      const status = getRateLimitStatus(user.id);
      const resetDate = new Date(status.resetAt);
      
      await logUsage({
        userId: user.id,
        mode: mode as AIMode,
        metadata,
        success: false,
        errorCode: 'AI_RATE_LIMIT',
        errorMessage: 'Rate limit exceeded',
        durationMs: Date.now() - startTime,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. You can make ${status.limit} requests per hour. Try again after ${resetDate.toLocaleTimeString()}.`,
          code: AIErrorCode.RATE_LIMIT,
          rateLimitStatus: {
            limit: status.limit,
            remaining: status.remaining,
            resetAt: resetDate.toISOString(),
          },
        },
        { status: 429 }
      );
    }

    // 5. Execute AI request
    let result;
    try {
      result = await runAI({
        mode: mode as AIMode,
        userId: user.id,
        user: userMessage,
        system,
        context,
        maxTokens,
        temperature,
        metadata,
      });
    } catch (error) {
      // Handle AI-specific errors
      if (error instanceof AIError) {
        const durationMs = Date.now() - startTime;
        
        await logUsage({
          userId: user.id,
          mode: mode as AIMode,
          metadata,
          success: false,
          errorCode: error.code,
          errorMessage: error.message,
          durationMs,
        });

        // Map error codes to user-friendly messages
        const userMessage = 
          error.code === AIErrorCode.TIMEOUT
            ? 'The AI request took too long. Please try again with a simpler prompt.'
            : error.code === AIErrorCode.CONFIG_ERROR
            ? 'AI service is not properly configured. Please contact support.'
            : error.code === AIErrorCode.INVALID_API_KEY
            ? 'AI service configuration error. Please contact support.'
            : error.message;

        return NextResponse.json(
          {
            success: false,
            error: userMessage,
            code: error.code,
          },
          { status: error.code === AIErrorCode.TIMEOUT ? 408 : 500 }
        );
      }

      // Handle unexpected errors
      throw error;
    }

    // 6. Log successful usage
    const durationMs = Date.now() - startTime;
    const tokensUsed = result.raw?.usage?.total_tokens;

    await logUsage({
      userId: user.id,
      mode: mode as AIMode,
      metadata,
      tokensUsed,
      durationMs,
      success: true,
    });

    // 7. Return success response
    const rateLimitStatus = getRateLimitStatus(user.id);
    
    return NextResponse.json({
      success: true,
      mode,
      result: result.text,
      rateLimitStatus: {
        limit: rateLimitStatus.limit,
        remaining: rateLimitStatus.remaining,
        resetAt: new Date(rateLimitStatus.resetAt).toISOString(),
      },
    });

  } catch (error: any) {
    // Handle unexpected errors
    console.error('[AI API] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        code: AIErrorCode.INTERNAL_ERROR,
      },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to execute AI requests.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}
