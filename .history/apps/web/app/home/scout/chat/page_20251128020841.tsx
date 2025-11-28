'use client';

import { useSearchParams } from 'next/navigation';
import { ChatMessages } from './_components/chat-messages';
import { ChatInput } from './_components/chat-input';
import { ChatWelcome } from './_components/chat-welcome';
import { PageBody, PageHeader } from '@kit/ui/page';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');
  const searchId = searchParams.get('searchId');
  const query = searchParams.get('query');

  // Mostrar ChatWelcome se não tiver conversação OU se tiver searchId/query
  const showWelcome = !conversationId || searchId || query;

  return (
    <>
      <PageHeader
        title="Chat AI"
        description="Converse com a IA para encontrar empresas e gerar propostas"
      />
      <PageBody>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {showWelcome ? (
            <ChatWelcome />
          ) : (
            <>
              <ChatMessages conversationId={conversationId} />
              <ChatInput conversationId={conversationId} />
            </>
          )}
        </div>
      </PageBody>
    </>
  );
}
