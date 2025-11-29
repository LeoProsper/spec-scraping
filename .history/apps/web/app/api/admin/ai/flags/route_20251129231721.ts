/**
 * API: /api/admin/ai/flags
 * 
 * GET: Lista todas as feature flags da IA
 * POST: Atualiza status de uma feature flag
 * 
 * Apenas admins podem acessar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireAdmin } from '@/lib/ai/admin-helper';
import { z } from 'zod';

// ============================================
// GET: Lista todas as flags
// ============================================

export async function GET() {
  try {
    // Check admin
    await requireAdmin();

    const supabase = getSupabaseServerClient();

    // Get all flags
    const { data, error } = await supabase
      .from('ai_feature_flags')
      .select('*')
      .order('feature', { ascending: true });

    if (error) {
      console.error('[API] Failed to load AI feature flags:', error);
      return NextResponse.json(
        { error: 'Failed to load feature flags' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flags: data,
    });

  } catch (error: any) {
    // If error is already a Response (from requireAdmin), return it
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }

    console.error('[API] Error in GET /api/admin/ai/flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Atualiza uma flag
// ============================================

const UpdateFlagSchema = z.object({
  feature: z.enum([
    'CHAT_AI',
    'B2B_GENERATOR',
    'CRM_ASSISTANT',
    'PROPOSAL_WRITER',
    'EMAIL_OUTREACH',
    'CLASSIFICATION',
  ]),
  is_enabled: z.boolean(),
  max_calls_per_user_per_day: z.number().int().positive().nullable().optional(),
  max_calls_per_minute: z.number().int().positive().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check admin
    await requireAdmin();

    // Parse body
    const body = await req.json();

    // Validate
    const validated = UpdateFlagSchema.parse(body);

    const supabase = getSupabaseServerClient();

    // Update flag
    const { data, error } = await supabase
      .from('ai_feature_flags')
      .update({
        is_enabled: validated.is_enabled,
        max_calls_per_user_per_day: validated.max_calls_per_user_per_day,
        max_calls_per_minute: validated.max_calls_per_minute,
      })
      .eq('feature', validated.feature)
      .select()
      .single();

    if (error) {
      console.error('[API] Failed to update AI feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to update feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Feature '${validated.feature}' updated successfully`,
      flag: data,
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
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[API] Error in POST /api/admin/ai/flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
