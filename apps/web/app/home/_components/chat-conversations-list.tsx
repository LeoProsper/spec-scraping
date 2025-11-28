'use client';

import { useConversations, useCreateConversation, useDeleteConversation } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSidebar } from '@kit/ui/shadcn-sidebar';

export function ChatConversationsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentConversationId = searchParams.get('c');
  const { open } = useSidebar();

  const { data: conversations = [], isLoading } = useConversations();
  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();

  // Só mostrar se estiver na rota do chat
  if (!pathname.includes('/scout/chat')) {
    return null;
  }

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

  // Se sidebar colapsada, mostrar apenas ícone
  if (!open) {
    return (
      <div className="flex flex-col items-center py-2">
        <Button
          onClick={handleNewConversation}
          disabled={createMutation.isPending}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium text-muted-foreground">Conversas</span>
      </div>

      {/* New Conversation Button */}
      <Button
        onClick={handleNewConversation}
        disabled={createMutation.isPending}
        variant="outline"
        size="sm"
        className="w-full justify-start"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Conversa
      </Button>

      {/* Conversations List */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          Carregando...
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4 px-2">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma conversa</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.slice(0, 10).map((conv) => (
            <div
              key={conv.id}
              onClick={() => router.push(`/home/scout/chat?c=${conv.id}`)}
              className={`
                group relative px-2 py-2 rounded-md cursor-pointer text-sm
                transition-colors hover:bg-accent
                ${currentConversationId === conv.id ? 'bg-accent' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">
                    {conv.title || 'Nova conversa'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
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
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
