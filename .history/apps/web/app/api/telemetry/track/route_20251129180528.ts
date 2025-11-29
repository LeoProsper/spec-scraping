import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * POST /api/telemetry/track
 * 
 * FASE P6: Registra eventos de telemetria
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
    const { evento, company_id, list_id, metadata } = body;

    if (!evento) {
      return NextResponse.json(
        { error: { message: 'Evento é obrigatório' }, success: false },
        { status: 400 },
      );
    }

    // Inserir evento
    const { error } = await supabase.from('product_events').insert({
      user_id: user.id,
      evento,
      company_id: company_id || null,
      list_id: list_id || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error('Erro ao registrar evento:', error);
      return NextResponse.json(
        { error: { message: error.message }, success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao registrar telemetria:', error);
    return NextResponse.json(
      { error: { message: 'Erro ao registrar evento' }, success: false },
      { status: 500 },
    );
  }
}

/**
 * GET /api/telemetry/track
 * 
 * Retorna eventos do usuário
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const { data, error } = await supabase
      .from('product_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: { message: error.message }, success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({ data, success: true });

  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json(
      { error: { message: 'Erro ao buscar eventos' }, success: false },
      { status: 500 },
    );
  }
}
