import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  Conversation, 
  ConversationWithMessages, 
  CreateConversationInput,
  SendMessageInput,
  Message
} from '../types/conversation.types';

const API_BASE = '/api/conversations';

// Query keys
export const conversationsKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationsKeys.all, 'list'] as const,
  list: (status: string) => [...conversationsKeys.lists(), status] as const,
  details: () => [...conversationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationsKeys.details(), id] as const,
};

// 1. Hook para criar nova conversa
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateConversationInput) => {
      const response = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar conversa');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar lista de conversas
      void queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() });
    },
  });
}

// 2. Hook para listar conversas
export function useConversations(status: 'active' | 'archived' | 'deleted' = 'active') {
  return useQuery({
    queryKey: conversationsKeys.list(status),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/list?status=${status}&limit=50`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar conversas');
      }

      const data = await response.json();
      return data.conversations as Conversation[];
    },
    staleTime: 30_000, // 30 segundos
  });
}

// 3. Hook para buscar uma conversa específica com mensagens
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: conversationsKeys.detail(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) {
        return null;
      }

      const response = await fetch(`${API_BASE}/${conversationId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar conversa');
      }

      const data = await response.json();
      return data.conversation as ConversationWithMessages;
    },
    enabled: !!conversationId,
    refetchInterval: 3_000, // Refetch a cada 3s para streaming
    refetchIntervalInBackground: false, // Não refetch em background
  });
}

// 4. Hook para enviar mensagem
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: SendMessageInput) => {
      const response = await fetch(`${API_BASE}/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar mensagem');
      }

      return response.json();
    },
    onMutate: async ({ conversationId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: conversationsKeys.detail(conversationId) 
      });

      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData<ConversationWithMessages>(
        conversationsKeys.detail(conversationId)
      );

      // Optimistically update with user message
      if (previousConversation) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          conversation_id: conversationId,
          role: 'user',
          content,
          metadata: undefined,
          is_streaming: false,
          is_error: false,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData<ConversationWithMessages>(
          conversationsKeys.detail(conversationId),
          {
            ...previousConversation,
            messages: [...(previousConversation.messages || []), optimisticMessage],
          }
        );
      }

      return { previousConversation };
    },
    onError: (_err, { conversationId }, context) => {
      // Rollback on error
      if (context?.previousConversation) {
        queryClient.setQueryData(
          conversationsKeys.detail(conversationId),
          context.previousConversation
        );
      }
    },
    onSettled: (_data, _error, { conversationId }) => {
      // Always refetch after error or success
      void queryClient.invalidateQueries({ 
        queryKey: conversationsKeys.detail(conversationId) 
      });
      void queryClient.invalidateQueries({ 
        queryKey: conversationsKeys.lists() 
      });
    },
  });
}

// 5. Hook para deletar conversa
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await fetch(`${API_BASE}/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar conversa');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries de conversas
      void queryClient.invalidateQueries({ queryKey: conversationsKeys.all });
    },
  });
}
