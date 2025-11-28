'use client';

import { useSearchParams } from 'next/navigation';
import { ChatMessages } from './_components/chat-messages';
import { ChatInput } from './_components/chat-input';
import { ChatWelcome } from './_components/chat-welcome';
import { useSendMessage, useCreateConversation } from '@kit/kaix-scout/hooks';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');
  const sendMutation = useSendMessage();
  const createMutation = useCreateConversation();
  const router = useRouter();

  const handleExampleClick = async (example: string) => {
    if (!conversationId) {
      // Criar nova conversa primeiro
      try {
        const result = await createMutation.mutateAsync({
          initial_message: example,
        });
        router.push(`/home/scout/chat?c=${result.conversation.id}`);
      } catch (error) {
        console.error('Erro ao criar conversa:', error);
      }
      return;
    }
    
    try {
      await sendMutation.mutateAsync({
        conversationId,
        content: example,
      });
    } catch (error) {
      console.error('Erro ao enviar exemplo:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {conversationId ? (
        <>
          <ChatMessages conversationId={conversationId} />
          <ChatInput conversationId={conversationId} />
        </>
      ) : (
        <ChatWelcome onExampleClick={handleExampleClick} />
      )}
    </div>
  );
}
