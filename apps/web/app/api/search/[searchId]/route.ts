import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { searchId: string } },
) {
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

    const { searchId } = params;

    // Get search details
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .eq('user_id', user.id) // Ensure user owns this search
      .single();

    if (searchError || !search) {
      return NextResponse.json(
        { error: { message: 'Search not found' }, success: false },
        { status: 404 },
      );
    }

    // Get companies for this search
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(
        `
        *,
        website_analysis (
          id,
          score,
          score_category,
          analyzed_at
        )
      `,
      )
      .eq('search_id', searchId)
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('[API] Error fetching companies:', companiesError);
    }

    // Calculate progress
    const totalResults = search.total_results || 0;
    const currentResults = companies?.length || 0;
    const progress = {
      current: currentResults,
      total: totalResults || search.max_places,
      percentage:
        totalResults > 0
          ? Math.round((currentResults / totalResults) * 100)
          : 0,
    };

    return NextResponse.json(
      {
        data: {
          search: {
            id: search.id,
            query: search.query,
            status: search.status,
            total_results: search.total_results,
            error_message: search.error_message,
            created_at: search.created_at,
            completed_at: search.completed_at,
          },
          companies: companies || [],
          progress,
        },
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[API] Error in search/[searchId]:', error);

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
