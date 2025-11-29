import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * FASE 6: Indicadores de Dinheiro
 * GET /api/companies/conversion-stats
 * 
 * Retorna:
 * - Taxa de conversão (ganhos / leads ativos)
 * - Potencial total de receita em carteira
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' }, success: false },
        { status: 401 },
      );
    }

    // Buscar leads ativos (não ganhos, não perdidos)
    const { count: leadsAtivos } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .not('lead_status', 'in', '("ganho","perdido")')
      .eq('responsavel_id', user.id);

    // Buscar leads ganhos
    const { count: leadsGanhos } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('lead_status', 'ganho')
      .eq('responsavel_id', user.id);

    // Calcular taxa de conversão
    const totalLeads = (leadsAtivos || 0) + (leadsGanhos || 0);
    const taxaConversao = totalLeads > 0 
      ? ((leadsGanhos || 0) / totalLeads) * 100 
      : 0;

    // Calcular potencial de receita (heurística)
    const { data: leadsAtivosData } = await supabase
      .from('companies')
      .select('priority_score, lead_status, rating, total_reviews')
      .not('lead_status', 'in', '("ganho","perdido")')
      .eq('responsavel_id', user.id);

    let potencialTotal = 0;

    if (leadsAtivosData) {
      potencialTotal = leadsAtivosData.reduce((sum, lead) => {
        // Base: R$ 3.000 por lead
        let valor = 3000;

        // Multiplicador por status
        const statusMultiplier: Record<string, number> = {
          novo: 0.3,
          contatado: 0.5,
          qualificado: 1.0,
          negociacao: 1.5,
          proposta: 1.2,
        };
        valor *= statusMultiplier[lead.lead_status] || 0.5;

        // Multiplicador por prioridade (score / 100)
        valor *= (lead.priority_score || 30) / 100;

        // Bônus por avaliação alta
        if (lead.rating && lead.rating >= 4.5) {
          valor *= 1.2;
        }

        // Bônus por visibilidade (reviews)
        if (lead.total_reviews && lead.total_reviews >= 50) {
          valor *= 1.3;
        }

        return sum + valor;
      }, 0);
    }

    return NextResponse.json({
      data: {
        leadsAtivos: leadsAtivos || 0,
        leadsGanhos: leadsGanhos || 0,
        taxaConversao,
        potencialTotal: Math.round(potencialTotal),
      },
      success: true,
    });

  } catch (error) {
    console.error('[API] Error in conversion-stats:', error);

    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        success: false,
      },
      { status: 500 },
    );
  }
}
