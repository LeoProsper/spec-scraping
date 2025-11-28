'use client';

import { useState } from 'react';
import { useSendMessage } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { Textarea } from '@kit/ui/textarea';

interface ChatInputProps {
  conversationId: string;
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const sendMutation = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sendMutation.isPending) {
      return;
    }

    try {
      await sendMutation.mutateAsync({
        conversationId,
        content: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          className="min-h-[60px] max-h-[200px] resize-none"
          disabled={sendMutation.isPending}
        />
        
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || sendMutation.isPending}
          className="h-[60px] w-[60px] shrink-0"
        >
          {sendMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground text-center mt-2">
        Kaix AI pode cometer erros. Considere verificar informações importantes.
      </div>
    </form>
  );
}
