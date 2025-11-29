import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@kit/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: categories, error } = await supabase
      .from('opportunity_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[OpportunitiesAPI] Erro ao buscar categorias:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar categorias' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      categories 
    });

  } catch (error) {
    console.error('[OpportunitiesAPI] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
