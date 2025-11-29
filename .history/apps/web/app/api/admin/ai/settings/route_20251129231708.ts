/**
 * API: /api/admin/ai/settings
 * 
 * GET: Retorna configurações atuais da IA (API key mascarada)
 * POST: Cria/atualiza configurações da IA
 * 
 * Apenas admins podem acessar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireAdmin, maskApiKey } from '@/lib/ai/admin-helper';
import { z } from 'zod';

// ============================================
// GET: Retorna configurações atuais
// ============================================

export async function GET() {
  try {
    // Check admin
    await requireAdmin();

    const supabase = getSupabaseServerClient();

    // Get active config
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: 'No AI configuration found. Please create one first.',
          hasConfig: false,
        },
        { status: 404 }
      );
    }

    // Mask API key
    const safeConfig = {
      ...data,
      api_key_masked: maskApiKey(data.api_key),
      api_key: undefined, // Never send real key
    };

    return NextResponse.json({
      success: true,
      config: safeConfig,
    });

  } catch (error: any) {
    // If error is already a Response (from requireAdmin), return it
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }

    console.error('[API] Error in GET /api/admin/ai/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Cria/atualiza configurações
// ============================================

const ConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'custom']).default('openai'),
  api_key: z.string().min(10, 'API key is too short'),
  api_base_url: z.string().url().default('https://api.openai.com/v1'),
  model_default: z.string().min(1),
  model_high: z.string().min(1),
  max_tokens: z.number().int().min(100).max(16000).default(1200),
  timeout_ms: z.number().int().min(5000).max(120000).default(45000),
  temperature_default: z.number().min(0).max(2).default(0.6),
});

export async function POST(req: NextRequest) {
  try {
    // Check admin
    await requireAdmin();

    // Parse body
    const body = await req.json();

    // Validate
    const validated = ConfigSchema.parse(body);

    const supabase = getSupabaseServerClient();

    // Deactivate all existing configs
    await supabase
      .from('ai_settings')
      .update({ is_active: false })
      .eq('is_active', true);

    // Insert new config
    const { data, error } = await supabase
      .from('ai_settings')
      .insert({
        provider: validated.provider,
        api_key: validated.api_key,
        api_base_url: validated.api_base_url,
        model_default: validated.model_default,
        model_high: validated.model_high,
        max_tokens: validated.max_tokens,
        timeout_ms: validated.timeout_ms,
        temperature_default: validated.temperature_default,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Failed to create AI config:', error);
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      );
    }

    // Return safe config (masked key)
    const safeConfig = {
      ...data,
      api_key_masked: maskApiKey(data.api_key),
      api_key: undefined,
    };

    return NextResponse.json({
      success: true,
      message: 'AI configuration saved successfully',
      config: safeConfig,
    });

  } catch (error: any) {
    // If error is already a Response (from requireAdmin), return it
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }

    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[API] Error in POST /api/admin/ai/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
