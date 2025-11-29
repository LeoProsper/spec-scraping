import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  try {
    const body = await request.json();
    const { prompt_id, prompt_text, category_id, results_count = 0 } = body;

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Salvar no histórico
    const { data: search, error } = await supabase
      .from('opportunity_searches')
      .insert({
        user_id: user.id,
        prompt_id,
        prompt_text,
        category_id,
        results_count,
      })
      .select()
      .single();

    if (error) {
      console.error('[OpportunitiesAPI] Erro ao salvar histórico:', error);
      return NextResponse.json(
        { error: 'Falha ao salvar histórico' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      search 
    });

  } catch (error) {
    console.error('[OpportunitiesAPI] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { data: history, error } = await supabase
      .from('opportunity_searches_with_category')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[OpportunitiesAPI] Erro ao buscar histórico:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar histórico' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      history 
    });

  } catch (error) {
    console.error('[OpportunitiesAPI] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
