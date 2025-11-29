import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Search {
  id: string;
  user_id: string;
  title: string;
  query: string;
  max_places?: number;
  radius?: number;
  lang?: string;
  total_results: number;
  status: 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface SearchHistoryResponse {
  searches: Search[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Hook para buscar histórico de pesquisas
 */
export function useSearchHistory(options?: { limit?: number; offset?: number }) {
  return useQuery<SearchHistoryResponse>({
    queryKey: ['search-history', options?.limit, options?.offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`/api/scout/searches?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar histórico de pesquisas');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para deletar uma pesquisa do histórico
 */
export function useDeleteSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchId: string) => {
      const response = await fetch(`/api/scout/searches/${searchId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Falha ao deletar pesquisa');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
  });
}
