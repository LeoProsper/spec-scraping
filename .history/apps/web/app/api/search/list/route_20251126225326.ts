import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function GET(request: NextRequest) {
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

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status');

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabase
      .from('searches')
      .select('*, companies(count)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Add status filter if provided
    if (status && ['processing', 'completed', 'error'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: searches, error: searchesError, count } = await query;

    if (searchesError) {
      console.error('[API] Error fetching searches:', searchesError);
      return NextResponse.json(
        { error: { message: 'Failed to fetch searches' }, success: false },
        { status: 500 },
      );
    }

    const total = count || 0;
    const hasMore = offset + pageSize < total;

    return NextResponse.json(
      {
        data: searches || [],
        pagination: {
          page,
          pageSize,
          total,
          hasMore,
        },
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[API] Error in search/list:', error);

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
