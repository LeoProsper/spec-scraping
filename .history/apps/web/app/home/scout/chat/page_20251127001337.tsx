'use client';

import { useSearchParams } from 'next/navigation';
import { ConversationSidebar } from './_components/conversation-sidebar';
import { ChatMessages } from './_components/chat-messages';
import { ChatInput } from './_components/chat-input';
import { ChatWelcome } from './_components/chat-welcome';
import { useSendMessage } from '@kit/kaix-scout/hooks';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');
  const sendMutation = useSendMessage();

  const handleExampleClick = async (example: string) => {
    if (!conversationId) return;
    
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
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-border overflow-y-auto">
        <ConversationSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {conversationId ? (
          <>
            <ChatMessages conversationId={conversationId} />
            <ChatInput conversationId={conversationId} />
          </>
        ) : (
          <ChatWelcome onExampleClick={handleExampleClick} />
        )}
      </div>
    </div>
  );
}
