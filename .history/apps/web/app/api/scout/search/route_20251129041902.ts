import { NextResponse } from 'next/server';
import { searchPlaces } from '@kit/kaix-scout/services';
import type { SearchParams } from '@kit/kaix-scout/types';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

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

    // ============================================================================
    // INTEGRAÇÃO CHAT AI → CRM MASTER (FASE 3)
    // ============================================================================
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      console.log(`[API Scout Search] Integrando ${result.places.length} empresas ao CRM...`);
      
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      // Para cada empresa encontrada, criar/atualizar no CRM
      for (const place of result.places) {
        try {
          const { data, error } = await supabase.rpc('create_or_update_company_from_chat', {
            p_user_id: session.user.id,
            p_place_id: place.place_id || `temp_${Date.now()}_${Math.random()}`,
            p_name: place.name,
            p_address: place.address || null,
            p_city: null, // Será extraído do address pela função
            p_state: null, // Será extraído do address pela função
            p_category: place.categories && place.categories[0] ? place.categories[0] : null,
            p_phone: place.phone || null,
            p_website: place.website || null,
            p_rating: place.rating || null,
            p_reviews_count: place.reviews_count || null,
            p_latitude: place.coordinates?.latitude || null,
            p_longitude: place.coordinates?.longitude || null,
            p_google_maps_link: place.link || null,
            p_cnpj: place.cnpj || null,
            p_about: place.about || null,
            p_opening_hours: place.opening_hours || null,
            p_email: place.email || null,
          });

          if (error) {
            console.error('[API Scout Search] Erro ao integrar empresa:', place.name, error);
            errorCount++;
          } else if (data && data.length > 0) {
            const action = data[0].action;
            if (action === 'created') {
              createdCount++;
              console.log(`[API Scout Search] ✅ Lead criado: ${place.name}`);
            } else if (action === 'updated') {
              updatedCount++;
              console.log(`[API Scout Search] 🔄 Lead atualizado: ${place.name}`);
            }
          }
        } catch (err) {
          console.error('[API Scout Search] Exceção ao integrar empresa:', place.name, err);
          errorCount++;
        }
      }

      console.log(`[API Scout Search] Integração finalizada: ${createdCount} criados, ${updatedCount} atualizados, ${errorCount} erros`);
    } else {
      console.warn('[API Scout Search] Usuário não autenticado. Empresas NÃO foram integradas ao CRM.');
    }

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
