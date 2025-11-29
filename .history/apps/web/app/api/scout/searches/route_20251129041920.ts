import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      query,
      max_places,
      radius,
      lang,
      total_results,
      status,
      error_message,
      results, // Array com os dados completos dos lugares encontrados
    } = body;

    // Insert search history (id será gerado automaticamente como UUID)
    const { data, error } = await supabase
      .from('searches')
      .insert({
        user_id: session.user.id,
        title,
        query,
        max_places,
        radius,
        lang,
        total_results,
        status,
        error_message,
        results: results || [], // Salvar resultados completos
        created_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting search:', error);
      return NextResponse.json(
        { error: 'Failed to save search history', details: error.message },
        { status: 500 }
      );
    }

    // ============================================================================
    // INTEGRAÇÃO CHAT AI → CRM MASTER (FASE 3B)
    // ============================================================================
    // Se temos resultados, integrar ao CRM
    if (results && Array.isArray(results) && results.length > 0 && status === 'completed') {
      console.log(`[API Scout Searches] Integrando ${results.length} empresas do histórico ao CRM...`);
      
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const place of results) {
        try {
          const { data: integrationData, error: integrationError } = await supabase.rpc(
            'create_or_update_company_from_chat',
            {
              p_user_id: session.user.id,
              p_place_id: place.place_id || `temp_${Date.now()}_${Math.random()}`,
              p_name: place.name,
              p_address: place.address || null,
              p_city: null,
              p_state: null,
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
            }
          );

          if (integrationError) {
            console.error('[API Scout Searches] Erro ao integrar empresa:', place.name, integrationError);
            errorCount++;
          } else if (integrationData && integrationData.length > 0) {
            const action = integrationData[0].action;
            if (action === 'created') {
              createdCount++;
            } else if (action === 'updated') {
              updatedCount++;
            }
          }
        } catch (err) {
          console.error('[API Scout Searches] Exceção ao integrar empresa:', place.name, err);
          errorCount++;
        }
      }

      console.log(`[API Scout Searches] Integração finalizada: ${createdCount} criados, ${updatedCount} atualizados, ${errorCount} erros`);
    }

    return NextResponse.json({ success: true, search: data });
  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch search history
    const { data, error, count } = await supabase
      .from('searches')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching searches:', error);
      return NextResponse.json(
        { error: 'Failed to fetch search history', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      searches: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching searches:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
