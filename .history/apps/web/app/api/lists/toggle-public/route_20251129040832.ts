import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * PATCH /api/lists/toggle-public
 * 
 * FASE P3: Alterna visibilidade pública/privada de uma lista
 */
export async function PATCH(request: NextRequest) {
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
    const { listId, isPublic } = body;

    if (!listId || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: { message: 'listId e isPublic são obrigatórios' }, success: false },
        { status: 400 },
      );
    }

    // Atualizar visibilidade
    const { data, error } = await supabase
      .from('lists')
      .update({ is_public: isPublic })
      .eq('id', listId)
      .eq('created_by', user.id) // Garantir que só o criador pode alterar
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { message: error.message }, success: false },
        { status: 500 },
      );
    }

    // Registrar telemetria
    await supabase.from('product_events').insert({
      user_id: user.id,
      evento: isPublic ? 'lista_tornada_publica' : 'lista_tornada_privada',
      list_id: listId,
    });

    return NextResponse.json({
      data: {
        list: data,
        message: isPublic ? 'Lista agora é pública' : 'Lista agora é privada',
      },
      success: true,
    });

  } catch (error) {
    console.error('Erro ao alternar visibilidade:', error);
    return NextResponse.json(
      { error: { message: 'Erro ao alternar visibilidade' }, success: false },
      { status: 500 },
    );
  }
}
