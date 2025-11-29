import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();

  try {
    const body = await request.json();
    const { prompt_id, prompt_text, category_id, results_count = 0 } = body;

    console.log('💾 [History POST] Recebendo dados:', { prompt_id, category_id, prompt_text: prompt_text?.substring(0, 50) });

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ [History POST] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log(`📝 [History POST] Salvando para user_id: ${user.id}`);

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
      console.error('❌ [History POST] Erro ao salvar histórico:', error);
      return NextResponse.json(
        { error: 'Falha ao salvar histórico', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [History POST] Salvo com sucesso! ID:', search.id);

    return NextResponse.json({ 
      success: true, 
      search 
    });

  } catch (error) {
    console.error('❌ [History POST] Erro:', error);
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
      console.log('❌ [History GET] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log(`📊 [History GET] Buscando histórico para user_id: ${user.id}, limit: ${limit}`);

    const { data: history, error } = await supabase
      .from('opportunity_searches_with_category')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [History GET] Erro ao buscar histórico:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar histórico', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [History GET] Retornando ${history?.length || 0} items`);
    console.log(`📋 [History GET] Primeiro item:`, history?.[0]);

    return NextResponse.json({ 
      success: true, 
      history: history || []
    });

  } catch (error) {
    console.error('❌ [History GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
