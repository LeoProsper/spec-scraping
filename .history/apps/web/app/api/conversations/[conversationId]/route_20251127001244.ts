import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    conversationId: string;
  }>;
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

    // Buscar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError) throw convError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Buscar mensagens
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Buscar buscas relacionadas
    const { data: searches, error: searchError } = await supabase
      .from('conversation_searches')
      .select('*, searches(*)')
      .eq('conversation_id', conversationId);

    if (searchError) throw searchError;

    return NextResponse.json({
      conversation: {
        ...conversation,
        messages,
        searches
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    const message = error instanceof Error ? error.message : 'Erro ao buscar conversa';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    const message = error instanceof Error ? error.message : 'Erro ao deletar conversa';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
