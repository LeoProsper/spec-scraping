/**
 * Admin AI Helper - Middleware de segurança
 * 
 * Verifica se o usuário é admin antes de permitir acesso às rotas de controle da IA
 */

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { NextResponse } from 'next/server';

/**
 * Check if user is admin
 * 
 * @throws {Response} 401 if not authenticated, 403 if not admin
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = getSupabaseServerClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  // Check if user is admin
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('role')
    .eq('id', user.id)
    .single();

  if (accountError || !account) {
    throw NextResponse.json(
      { error: 'Account not found' },
      { status: 404 }
    );
  }

  if (account.role !== 'admin') {
    throw NextResponse.json(
      { error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  }

  return { userId: user.id };
}

/**
 * Mask API key for security
 * 
 * @example
 * maskApiKey('sk-proj-1234567890abcdef') => 'sk-****cdef'
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '****';
  }

  return 'sk-****' + apiKey.slice(-4);
}
