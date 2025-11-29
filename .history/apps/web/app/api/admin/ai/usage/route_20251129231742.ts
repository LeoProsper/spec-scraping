/**
 * API: /api/admin/ai/usage
 * 
 * GET: Retorna analytics de uso da IA
 * 
 * Query params:
 * - period: day | week | month | all (default: month)
 * - mode: CHAT_AI | B2B_GENERATOR | ... (optional, filtra por modo)
 * - userId: uuid (optional, filtra por usuário)
 * 
 * Apenas admins podem acessar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireAdmin } from '@/lib/ai/admin-helper';

export async function GET(req: NextRequest) {
  try {
    // Check admin
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const mode = searchParams.get('mode');
    const userId = searchParams.get('userId');

    const supabase = getSupabaseServerClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01'); // Very old date
        break;
    }

    // Build query
    let query = supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (mode) {
      query = query.eq('mode', mode);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    query = query.order('created_at', { ascending: false });

    const { data: logs, error } = await query;

    if (error) {
      console.error('[API] Failed to load AI usage logs:', error);
      return NextResponse.json(
        { error: 'Failed to load usage data' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      period,
      totalRequests: logs.length,
      successfulRequests: logs.filter(l => l.success).length,
      failedRequests: logs.filter(l => !l.success).length,
      successRate: logs.length > 0 
        ? ((logs.filter(l => l.success).length / logs.length) * 100).toFixed(1) 
        : '0',

      totalInputTokens: logs.reduce((sum, l) => sum + (l.input_tokens || 0), 0),
      totalOutputTokens: logs.reduce((sum, l) => sum + (l.output_tokens || 0), 0),
      totalTokens: logs.reduce((sum, l) => sum + (l.input_tokens || 0) + (l.output_tokens || 0), 0),

      totalCost: logs.reduce((sum, l) => sum + (l.cost_estimated || 0), 0),
      avgCostPerRequest: logs.length > 0 
        ? logs.reduce((sum, l) => sum + (l.cost_estimated || 0), 0) / logs.length 
        : 0,

      avgDuration: logs.filter(l => l.duration_ms).length > 0
        ? logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.filter(l => l.duration_ms).length
        : 0,

      // By mode
      byMode: Object.entries(
        logs.reduce((acc, log) => {
          if (!acc[log.mode]) {
            acc[log.mode] = {
              count: 0,
              cost: 0,
              tokens: 0,
            };
          }
          acc[log.mode].count++;
          acc[log.mode].cost += log.cost_estimated || 0;
          acc[log.mode].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
          return acc;
        }, {} as Record<string, { count: number; cost: number; tokens: number }>)
      ).map(([mode, data]) => ({ mode, ...data }))
      .sort((a, b) => b.cost - a.cost),

      // By user (top 10)
      topUsers: Object.entries(
        logs.reduce((acc, log) => {
          if (!acc[log.user_id]) {
            acc[log.user_id] = {
              userId: log.user_id,
              count: 0,
              cost: 0,
              tokens: 0,
            };
          }
          acc[log.user_id].count++;
          acc[log.user_id].cost += log.cost_estimated || 0;
          acc[log.user_id].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
          return acc;
        }, {} as Record<string, { userId: string; count: number; cost: number; tokens: number }>)
      ).map(([, data]) => data)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10),

      // Daily breakdown (last 7 days)
      dailyStats: (() => {
        const dailyMap: Record<string, { date: string; requests: number; cost: number }> = {};
        
        logs.forEach(log => {
          const date = new Date(log.created_at).toISOString().split('T')[0];
          if (!dailyMap[date]) {
            dailyMap[date] = { date, requests: 0, cost: 0 };
          }
          dailyMap[date].requests++;
          dailyMap[date].cost += log.cost_estimated || 0;
        });

        return Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
      })(),

      // Recent errors (last 10)
      recentErrors: logs
        .filter(l => !l.success)
        .slice(0, 10)
        .map(l => ({
          mode: l.mode,
          errorCode: l.error_code,
          errorMessage: l.error_message,
          createdAt: l.created_at,
        })),
    };

    return NextResponse.json({
      success: true,
      stats,
      logs: logs.slice(0, 100), // Return last 100 logs for detail view
    });

  } catch (error: any) {
    // If error is already a Response (from requireAdmin), return it
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }

    console.error('[API] Error in GET /api/admin/ai/usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
