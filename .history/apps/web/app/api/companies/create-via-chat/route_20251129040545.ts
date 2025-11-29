import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * POST /api/companies/create-via-chat
 * 
 * FASE P1: Cria lead via Chat AI
 * - Cria empresa automaticamente
 * - Aplica scoring e prioridade
 * - Adiciona em lista default "Leads via Chat AI — {data}"
 * - Registra telemetria
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Autenticação
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

    // Parse body
    const body = await request.json();
    const { nome, cidade, categoria, telefone, website, instagram } = body;

    // Validação
    if (!nome || !cidade || !categoria) {
      return NextResponse.json(
        { 
          error: { message: 'Nome, cidade e categoria são obrigatórios' }, 
          success: false 
        },
        { status: 400 },
      );
    }

    // Chamar função SQL que cria lead + lista + telemetria
    const { data, error } = await supabase.rpc('criar_lead_via_chat', {
      p_user_id: user.id,
      p_nome: nome,
      p_cidade: cidade,
      p_categoria: categoria,
      p_telefone: telefone || null,
      p_website: website || null,
      p_instagram: instagram || null,
    });

    if (error) {
      console.error('Erro ao criar lead via chat:', error);
      return NextResponse.json(
        { error: { message: error.message }, success: false },
        { status: 500 },
      );
    }

    const result = data[0];

    return NextResponse.json({
      data: {
        company_id: result.company_id,
        list_id: result.list_id,
        list_name: result.list_name,
        message: result.message,
      },
      success: true,
    });

  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { 
        error: { message: 'Erro ao criar lead' }, 
        success: false 
      },
      { status: 500 },
    );
  }
}
