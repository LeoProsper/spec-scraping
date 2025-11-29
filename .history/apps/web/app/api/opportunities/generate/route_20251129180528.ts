import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('category');

  try {
    // Gerar prompt aleatório
    const { data: prompt, error: promptError } = await supabase.rpc(
      'generate_random_opportunity_prompt',
      { p_category_id: categoryId }
    ).single();

    if (promptError) {
      console.error('[OpportunitiesAPI] Erro ao gerar prompt:', promptError);
      return NextResponse.json(
        { error: 'Falha ao gerar prompt' },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Nenhum prompt disponível para esta categoria' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      prompt 
    });

  } catch (error) {
    console.error('[OpportunitiesAPI] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
