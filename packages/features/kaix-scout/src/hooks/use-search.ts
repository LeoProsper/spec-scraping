/**
 * React Hooks for Kaix Scout
 * Hooks for managing searches, companies, and analysis
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type {
  CreateSearchInput,
  Search,
  Company,
  ApiResponse,
  SearchProgress,
  PaginatedResponse,
} from '../types';

// ============================================================================
// API Client Functions
// ============================================================================

async function createSearch(input: CreateSearchInput): Promise<{ searchId: string; status: string }> {
  const response = await fetch('/api/search/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const result: ApiResponse<{ searchId: string; status: string }> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to create search');
  }

  return result.data!;
}

async function getSearch(searchId: string): Promise<SearchProgress> {
  const response = await fetch(`/api/search/${searchId}`);
  const result: ApiResponse<SearchProgress> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to fetch search');
  }

  return result.data!;
}

async function listSearches(page = 1, pageSize = 20, status?: string): Promise<PaginatedResponse<Search>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (status) {
    params.set('status', status);
  }

  const response = await fetch(`/api/search/list?${params}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to fetch searches');
  }

  return {
    data: result.data,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    hasMore: result.pagination.hasMore,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to create a new search
 */
export function useCreateSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSearch,
    onSuccess: () => {
      // Invalidate searches list
      queryClient.invalidateQueries({ queryKey: ['searches'] });
    },
  });
}

/**
 * Hook to get search details with real-time updates
 */
export function useSearch(searchId: string | null, options?: { 
  refetchInterval?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['search', searchId],
    queryFn: () => getSearch(searchId!),
    enabled: !!searchId && (options?.enabled !== false),
    refetchInterval: (query) => {
      // Auto-refresh while processing
      const data = query.state.data;
      if (data?.search.status === 'processing') {
        return options?.refetchInterval || 3000; // 3 seconds
      }
      return false; // Stop refetching when completed
    },
    retry: 3,
  });
}

/**
 * Hook to list all searches with pagination
 */
export function useSearchList(page = 1, pageSize = 20, status?: string) {
  return useQuery({
    queryKey: ['searches', page, pageSize, status],
    queryFn: () => listSearches(page, pageSize, status),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get companies from a search
 */
export function useSearchCompanies(searchId: string | null) {
  const { data, ...rest } = useSearch(searchId);
  
  return {
    companies: data?.companies || [],
    progress: data?.progress,
    search: data?.search,
    ...rest,
  };
}

/**
 * Hook to filter companies
 */
export function useFilteredCompanies(
  companies: Company[],
  filters: {
    hasWebsite?: boolean;
    scoreMin?: number;
    scoreCategory?: string;
    search?: string;
  },
) {
  return useCallback(() => {
    let filtered = [...companies];

    if (filters.hasWebsite !== undefined) {
      filtered = filtered.filter((c) => 
        filters.hasWebsite ? !!c.website : !c.website
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.address.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [companies, filters])();
}

/**
 * Hook to get user stats
 */
export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch stats');
      }

      return result.data;
    },
    staleTime: 60000, // 1 minute
  });
}
