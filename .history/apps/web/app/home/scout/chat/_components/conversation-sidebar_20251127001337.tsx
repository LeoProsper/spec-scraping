'use client';

import { useConversations, useCreateConversation, useDeleteConversation } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConversationSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentConversationId = searchParams.get('c');

  const { data: conversations = [], isLoading } = useConversations();
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();

  const handleNewConversation = async () => {
    try {
      const result = await createMutation.mutateAsync({});
      router.push(`/home/scout/chat?c=${result.conversation.id}`);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja deletar esta conversa?')) {
      await deleteMutation.mutateAsync(id);
      if (currentConversationId === id) {
        router.push('/home/scout/chat');
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* New Conversation Button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={handleNewConversation}
          disabled={createMutation.isPending}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && (
          <div className="text-center text-muted-foreground py-4">
            Carregando...
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="text-center text-muted-foreground py-8 px-4">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">Crie uma nova para começar</p>
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => router.push(`/home/scout/chat?c=${conv.id}`)}
            className={`
              group relative p-3 rounded-lg cursor-pointer
              transition-colors hover:bg-accent
              ${currentConversationId === conv.id ? 'bg-accent' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {conv.title || 'Nova conversa'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {conv.messages_count} mensagens
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conv.last_message_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {conv.searches_count > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                🔍 {conv.searches_count} buscas · {conv.total_results} resultados
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
