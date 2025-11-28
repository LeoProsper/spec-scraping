import { NextResponse } from 'next/server';
import { searchPlaces } from '@kit/kaix-scout/services';
import type { SearchParams } from '@kit/kaix-scout/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, maxPlaces = 5, radius, lang = 'pt' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query é obrigatória' },
        { status: 400 }
      );
    }

    const searchParams: SearchParams = {
      query: query.trim(),
      maxPlaces: Math.min(Math.max(1, maxPlaces), 100),
      lang,
      radius: radius ? Math.min(Math.max(1, radius), 50000) : undefined,
    };

    console.log('[API Scout Search] Searching with params:', searchParams);

    const result = await searchPlaces(searchParams);

    return NextResponse.json({
      success: true,
      places: result.places,
      total: result.total,
    });
  } catch (error) {
    console.error('[API Scout Search] Error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao buscar empresas',
      },
      { status: 500 }
    );
  }
}
