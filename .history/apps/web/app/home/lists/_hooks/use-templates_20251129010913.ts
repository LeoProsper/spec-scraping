'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@kit/supabase/client';

export interface ListTemplate {
  id: string;
  nome: string;
  descricao: string;
  filtros: Record<string, any>;
  categoria: string | null;
  ativo: boolean;
  created_at: string;
}

export function useListTemplates() {
  const [templates, setTemplates] = useState<ListTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('list_templates')
        .select('*')
        .eq('ativo', true)
        .order('categoria', { ascending: true, nullsFirst: false })
        .order('nome', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return { templates, loading, error, refetch: fetchTemplates };
}
