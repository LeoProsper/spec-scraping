'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';

export interface List {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  filtros: Record<string, any>;
  total_resultados: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  return { lists, loading, error, refetch: fetchLists };
}

export function useListById(listId: string | null) {
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!listId) {
      setList(null);
      setLoading(false);
      return;
    }

    const fetchList = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lists')
          .select('*')
          .eq('id', listId)
          .single();

        if (error) throw error;
        setList(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [listId]);

  return { list, loading, error };
}
