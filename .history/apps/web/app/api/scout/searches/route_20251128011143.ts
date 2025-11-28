import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      title,
      query,
      max_places,
      radius,
      lang,
      total_results,
      status,
      error_message,
    } = body;

    // Insert search history
    const { data, error } = await supabase
      .from('searches')
      .insert({
        id,
        user_id: session.user.id,
        title,
        query,
        max_places,
        radius,
        lang,
        total_results,
        status,
        error_message,
        created_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting search:', error);
      return NextResponse.json(
        { error: 'Failed to save search history', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, search: data });
  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch search history
    const { data, error, count } = await supabase
      .from('searches')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching searches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch search history', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      searches: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching searches:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
