'use client';

import { useSearchParams } from 'next/navigation';
import { ChatMessages } from './_components/chat-messages';
import { ChatInput } from './_components/chat-input';
import { ChatWelcome } from './_components/chat-welcome';
import { useSendMessage, useCreateConversation } from '@kit/kaix-scout/hooks';
import { useRouter } from 'next/navigation';
import { PageBody, PageHeader } from '@kit/ui/page';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');

  return (
    <>
      <PageHeader
        title="Chat AI"
        description="Converse com a IA para encontrar empresas e gerar propostas"
      />
      <PageBody>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {conversationId ? (
          <>
            <ChatMessages conversationId={conversationId} />
            <ChatInput conversationId={conversationId} />
          </>
        ) : (
          <ChatWelcome />
        )}
        </div>
      </PageBody>
    </>
  );
}
