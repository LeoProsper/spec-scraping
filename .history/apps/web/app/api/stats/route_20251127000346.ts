import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' }, success: false },
        { status: 401 },
      );
    }

    // Get user stats from the view
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      console.error('[API] Error fetching user stats:', statsError);
      return NextResponse.json(
        { error: { message: 'Failed to fetch stats' }, success: false },
        { status: 500 },
      );
    }

    // Calculate searches remaining
    const searchesRemaining = 
      stats.plan === 'premium' 
        ? -1 // unlimited
        : Math.max(0, (stats.searches_limit || 0) - (stats.searches_count || 0));

    // Calculate conversion rate
    const conversionRate = 
      (stats.hot_leads || 0) > 0 
        ? Math.round(((stats.total_proposals || 0) / (stats.hot_leads || 1)) * 100)
        : 0;

    return NextResponse.json(
      {
        data: {
          totalSearches: stats.total_searches || 0,
          totalCompanies: stats.total_companies || 0,
          hotLeads: stats.hot_leads || 0,
          totalProposals: stats.total_proposals || 0,
          searchesRemaining,
          conversionRate,
          plan: stats.plan,
          searchesCount: stats.searches_count,
          searchesLimit: stats.searches_limit,
        },
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[API] Error in stats:', error);

    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        success: false,
      },
      { status: 500 },
    );
  }
}
