import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * POST /api/lists/duplicate
 * 
 * FASE P3: Duplica uma lista existente
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

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

    const body = await request.json();
    const { listId } = body;

    if (!listId) {
      return NextResponse.json(
        { error: { message: 'listId é obrigatório' }, success: false },
        { status: 400 },
      );
    }

    // Buscar lista original
    const { data: originalList, error: listError } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .single();

    if (listError || !originalList) {
      return NextResponse.json(
        { error: { message: 'Lista não encontrada' }, success: false },
        { status: 404 },
      );
    }

    // Criar nova lista (cópia)
    const { data: newList, error: createError } = await supabase
      .from('lists')
      .insert({
        account_id: originalList.account_id,
        nome: `${originalList.nome} (cópia)`,
        descricao: originalList.descricao,
        is_public: false, // Sempre começa como privada
        created_by: user.id,
      })
      .select()
      .single();

    if (createError || !newList) {
      return NextResponse.json(
        { error: { message: createError?.message || 'Erro ao criar lista' }, success: false },
        { status: 500 },
      );
    }

    // Buscar empresas da lista original
    const { data: companies, error: companiesError } = await supabase
      .from('list_companies')
      .select('company_id')
      .eq('list_id', listId);

    if (companiesError) {
      console.error('Erro ao buscar empresas:', companiesError);
    }

    // Copiar empresas para nova lista
    if (companies && companies.length > 0) {
      const inserts = companies.map(c => ({
        list_id: newList.id,
        company_id: c.company_id,
        added_by: user.id,
        added_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('list_companies')
        .insert(inserts);

      if (insertError) {
        console.error('Erro ao copiar empresas:', insertError);
      }
    }

    // Registrar telemetria
    await supabase.from('product_events').insert({
      user_id: user.id,
      evento: 'lista_duplicada',
      list_id: newList.id,
      metadata: {
        lista_original_id: listId,
        total_empresas: companies?.length || 0,
      },
    });

    return NextResponse.json({
      data: {
        list: newList,
        message: 'Lista duplicada com sucesso!',
      },
      success: true,
    });

  } catch (error) {
    console.error('Erro ao duplicar lista:', error);
    return NextResponse.json(
      { error: { message: 'Erro ao duplicar lista' }, success: false },
      { status: 500 },
    );
  }
}
