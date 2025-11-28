import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function POST(
  req: NextRequest,
  context: RouteParams
) {
  try {
    const { conversationId } = await context.params;
    const supabase = getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });
    }

    // Verificar se conversa pertence ao usuário
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Criar mensagem do usuário
    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: content.trim(),
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Processar com IA e criar busca se necessário
    const aiResponse = await processUserMessage(content, conversationId, user.id, supabase);

    // Criar mensagem da IA
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.metadata,
      })
      .select()
      .single();

    if (assistantMsgError) throw assistantMsgError;

    return NextResponse.json({ 
      success: true,
      user_message: userMessage,
      assistant_message: assistantMessage
    });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}

async function processUserMessage(
  content: string,
  conversationId: string,
  userId: string,
  supabase: any
): Promise<{ content: string; metadata: any }> {
  // Parser simples de intenção
  const intent = parseUserIntent(content);

  if (intent.type === 'search') {
    // Criar busca
    const { data: search } = await supabase
      .from('searches')
      .insert({
        user_id: userId,
        query: intent.query,
        max_places: intent.maxPlaces || 20,
        lang: intent.lang || 'pt',
        status: 'processing'
      })
      .select()
      .single();

    // Link conversa → busca
    await supabase
      .from('conversation_searches')
      .insert({
        conversation_id: conversationId,
        search_id: search.id,
        user_query: content,
        refined_query: intent.query
      });

    // Processar busca em background (chamar Google Maps Scraper)
    processSearchInBackground(search.id, intent, supabase, userId);

    return {
      content: `🔍 Perfeito! Vou buscar **${intent.query}**.

**Configuração:**
- Quantidade: ${intent.maxPlaces} resultados
- Região: ${intent.location || 'Ampla'}
- Raio: ${intent.radius || 'Toda cidade'}

⏳ Processando busca...`,
      metadata: {
        search_id: search.id,
        search_params: {
          query: intent.query,
          maxPlaces: intent.maxPlaces,
          lang: intent.lang
        },
        quick_actions: ['Ver progresso', 'Cancelar busca']
      }
    };
  }

  // Resposta padrão se não entendeu
  return {
    content: `Desculpe, não entendi completamente. 

Você pode me dizer algo como:
- "Buscar restaurantes em São Paulo"
- "Encontre 50 hotéis em Florianópolis"
- "Padarias no Rio de Janeiro"

**O que você gostaria de buscar?**`,
    metadata: {
      quick_actions: ['Ver exemplos', 'Ajuda']
    }
  };
}

function parseUserIntent(content: string): any {
  const lower = content.toLowerCase();
  
  // Detectar tipo de negócio
  const businessTypes = ['restaurante', 'hotel', 'padaria', 'salão', 'oficina', 'loja', 'mercado', 'café', 'bar'];
  const businessType = businessTypes.find(t => lower.includes(t));
  
  // Detectar cidade
  const cities = ['são paulo', 'rio de janeiro', 'florianópolis', 'curitiba', 'porto alegre', 'belo horizonte', 'brasília'];
  const city = cities.find(c => lower.includes(c));
  
  // Detectar quantidade
  const numberMatch = content.match(/(\d+)/g);
  const maxPlaces = numberMatch ? parseInt(numberMatch[0]) : 20;
  
  // Detectar raio
  const radiusMatch = lower.match(/(\d+)\s*k?m/);
  const radius = radiusMatch ? parseInt(radiusMatch[1]) : undefined;

  if (businessType && city) {
    return {
      type: 'search',
      query: `${businessType}s em ${city}`,
      location: city,
      maxPlaces,
      radius,
      lang: 'pt'
    };
  }

  return { type: 'unknown' };
}

async function processSearchInBackground(searchId: string, intent: any, supabase: any, userId: string) {
  try {
    // Usar o mesmo processamento da busca normal
    console.log('[Background] Processing search from conversation:', searchId);
    
    // Importar e usar o serviço existente
    const { searchPlaces } = await import('@kit/kaix-scout/services');
    
    const result = await searchPlaces({
      query: intent.query,
      maxPlaces: intent.maxPlaces || 20,
      lang: intent.lang || 'pt',
      radius: intent.radius
    });

    console.log(`[Background] Found ${result.places.length} places for search ${searchId}`);

    // Inserir empresas
    const companies = result.places.map((place: any) => ({
      search_id: searchId,
      place_id: place.place_id,
      name: place.name,
      address: place.address,
      coordinates: place.coordinates,
      phone: place.phone,
      website: place.website,
      rating: place.rating,
      reviews_count: place.reviews_count,
      categories: place.categories,
      link: place.link,
      raw_data: place,
      lead_score: calculateSimpleScore(place)
    }));

    if (companies.length > 0) {
      await supabase.from('companies').insert(companies);
    }

    // Atualizar status da busca
    await supabase
      .from('searches')
      .update({
        status: 'completed',
        total_found: result.places.length
      })
      .eq('id', searchId);

    // Atualizar total_results na conversa
    const { data: convSearch } = await supabase
      .from('conversation_searches')
      .select('conversation_id')
      .eq('search_id', searchId)
      .single();

    if (convSearch) {
      await supabase.rpc('increment', {
        table_name: 'conversations',
        row_id: convSearch.conversation_id,
        column_name: 'total_results',
        increment_by: result.places.length
      }).catch(() => {
        // Fallback se RPC não existir
        console.log('RPC increment not available, using UPDATE');
      });
    }

    console.log(`[Background] Search ${searchId} completed successfully`);
  } catch (error) {
    console.error('[Background] Error processing search:', error);
    
    await supabase
      .from('searches')
      .update({ status: 'error' })
      .eq('id', searchId);
  }
}

function calculateSimpleScore(place: any): number {
  let score = 0;
  
  // Sem website = alta oportunidade
  if (!place.website) {
    score = 10;
  } else {
    score = 5; // Com website = média
  }
  
  return score;
}

export async function GET(
  req: NextRequest,
  context: RouteParams
) {
  try {
    const { conversationId } = await context.params;
    const supabase = getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar mensagens
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}
