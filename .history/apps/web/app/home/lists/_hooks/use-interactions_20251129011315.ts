'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';

export interface CompanyInteraction {
  id: string;
  company_id: string;
  user_id: string;
  tipo: string;
  canal: string | null;
  descricao: string;
  resultado: string | null;
  created_at: string;
  next_action_at: string | null;
}

export function useCompanyInteractions(companyId: string | null) {
  const [interactions, setInteractions] = useState<CompanyInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchInteractions = async () => {
    if (!companyId) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_interactions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [companyId]);

  const addInteraction = async (interaction: {
    tipo: string;
    canal?: string;
    descricao: string;
    resultado?: string;
    next_action_at?: string;
  }) => {
    if (!companyId) return;

    const supabase = getSupabaseBrowserClient();
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('company_interactions')
      .insert({
        company_id: companyId,
        user_id: userData.user.id,
        ...interaction,
      });

    if (error) throw error;
    await fetchInteractions();
  };

  return { interactions, loading, error, refetch: fetchInteractions, addInteraction };
}
