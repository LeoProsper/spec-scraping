'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@kit/supabase/client';

export interface ListCompany {
  id: string;
  list_id: string;
  company_id: string;
  posicao: number | null;
  notas: string | null;
  added_at: string;
  company: Company;
}

export interface Company {
  id: string;
  name: string;
  place_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  categories: any;
  lead_status: string;
  responsavel_id: string | null;
  tags: string[];
  ultima_interacao: string | null;
  observacoes: string | null;
  pipeline_stage: string | null;
  cnpj: string | null;
  razao_social: string | null;
  porte_empresa: string | null;
  cnae_principal: string | null;
  receita_municipio: string | null;
  receita_uf: string | null;
}

export function useListCompanies(listId: string | null) {
  const [companies, setCompanies] = useState<ListCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchCompanies = async () => {
    if (!listId) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('list_companies')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('list_id', listId)
        .order('posicao', { ascending: true, nullsFirst: false })
        .order('added_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [listId]);

  return { companies, loading, error, refetch: fetchCompanies };
}
