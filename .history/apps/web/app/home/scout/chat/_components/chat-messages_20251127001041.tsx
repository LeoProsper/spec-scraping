'use client';

import { useConversation } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { MessageSquare, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Message } from '@kit/kaix-scout/types';
import { useRouter } from 'next/navigation';

interface ChatMessagesProps {
  conversationId: string;
}

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const router = useRouter();
  const { data: conversation, isLoading } = useConversation(conversationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Conversa não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {conversation.messages?.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onViewSearch={(searchId) => router.push(`/home/scout/searches/${searchId}`)}
        />
      ))}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onViewSearch: (searchId: string) => void;
}

function MessageBubble({ message, onViewSearch }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Avatar & Name */}
        <div className="flex items-center gap-2 mb-2">
          {!isUser && (
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <span className="text-xs font-medium">
            {isUser ? 'Você' : 'Kaix AI'}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-3
            ${isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground'
            }
            ${message.is_error ? 'border-2 border-destructive' : ''}
          `}
        >
          {/* Error Icon */}
          {message.is_error && (
            <div className="flex items-center gap-2 mb-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Erro</span>
            </div>
          )}

          {/* Content */}
          <div className="whitespace-pre-wrap text-sm">
            {message.content}
          </div>

          {/* Search Info */}
          {message.metadata?.search_id && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="space-y-2">
                {message.metadata.search_params && (
                  <div className="text-xs opacity-80">
                    <span className="font-medium">Busca:</span>{' '}
                    {message.metadata.search_params.query}
                  </div>
                )}
                
                {message.metadata.results_count !== undefined && (
                  <div className="text-xs opacity-80">
                    <span className="font-medium">Resultados:</span>{' '}
                    {message.metadata.results_count}
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewSearch(message.metadata!.search_id!)}
                  className="mt-2 h-8"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Ver Resultados
                </Button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {message.metadata?.quick_actions && message.metadata.quick_actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.metadata.quick_actions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  {action}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-1 text-xs text-muted-foreground px-2">
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </div>
      </div>
    </div>
  );
}
