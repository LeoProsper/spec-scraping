import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, initial_message } = body;

    // Criar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: title || undefined,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Se tem mensagem inicial, criar
    if (initial_message) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: initial_message,
        });

      if (msgError) throw msgError;

      // Criar resposta da IA
      const assistantMessage = generateWelcomeMessage();
      
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantMessage,
          metadata: {
            quick_actions: ['Buscar empresas', 'Ver exemplos']
          }
        });
    } else {
      // Mensagem de boas-vindas padrão
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: 'Olá! 👋 Quais empresas você quer prospectar hoje?\n\nPosso buscar por:\n• Tipo de negócio (ex: restaurantes, hotéis)\n• Cidade ou região\n• Raio de busca\n• Quantidade de resultados',
          metadata: {
            quick_actions: ['Buscar empresas', 'Ver exemplos']
          }
        });
    }

    return NextResponse.json({ 
      success: true, 
      conversation 
    });

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conversa' },
      { status: 500 }
    );
  }
}

function generateWelcomeMessage(): string {
  return `Olá! 👋 Vou te ajudar a encontrar as melhores oportunidades de negócio.

**Como posso ajudar?**

Você pode me dizer coisas como:
- "Buscar restaurantes em São Paulo"
- "Encontre hotéis em Florianópolis no raio de 10km"
- "Quero prospectar padarias no Rio de Janeiro"

**O que você quer buscar hoje?**`;
}
