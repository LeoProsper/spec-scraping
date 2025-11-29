import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/companies/pressure-stats
 * 
 * Retorna KPIs de pressão operacional:
 * - Leads Ativos: companies onde lead_status NOT IN ('ganho','perdido')
 * - Leads Parados: sem interação há mais de 14 dias
 * - Leads Quentes: interações nos últimos 3 dias OU status = qualificado
 * - Follow-ups Vencidos: next_action_at < now()
 * - Propostas em Aberto: propostas.status = sent
 * - Potencial de Faturamento: SUM(valor_estimado) baseado em heurística
 */
export async function GET(request: NextRequest) {
  try {
    // 1. LEADS ATIVOS - status não está em ganho/perdido
    const { count: leadsAtivos } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .not('lead_status', 'in', '("ganho","perdido")');

    // 2. LEADS PARADOS - última interação há mais de 14 dias
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const { count: leadsParados } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .not('lead_status', 'in', '("ganho","perdido")')
      .or(`ultima_interacao.is.null,ultima_interacao.lt.${fourteenDaysAgo.toISOString()}`);

    // 3. LEADS QUENTES - interações nos últimos 3 dias OU status qualificado
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const { count: leadsQuentes } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .or(`ultima_interacao.gte.${threeDaysAgo.toISOString()},lead_status.eq.qualificado`);

    // 4. FOLLOW-UPS VENCIDOS - next_action_at < now()
    const { count: followupsVencidos } = await supabase
      .from('company_interactions')
      .select('*', { count: 'exact', head: true })
      .not('next_action_at', 'is', null)
      .lt('next_action_at', new Date().toISOString());

    // 5. PROPOSTAS EM ABERTO - status = sent
    const { count: propostasAbertas } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    // 6. POTENCIAL DE FATURAMENTO
    // Heurística mock baseada em categoria, porte e qualificação
    const { data: companiesForRevenue } = await supabase
      .from('companies')
      .select('category, lead_status, porte_empresa, rating')
      .not('lead_status', 'in', '("perdido")');

    let potencialFaturamento = 0;

    if (companiesForRevenue) {
      for (const company of companiesForRevenue) {
        let valor = 5000; // Base: R$ 5k por lead

        // Multiplicador por status
        const statusMultiplier: Record<string, number> = {
          'novo': 0.3,
          'contatado': 0.5,
          'qualificado': 1.0,
          'negociando': 1.5,
          'ganho': 0, // Já faturado
        };
        valor *= statusMultiplier[company.lead_status] || 0.5;

        // Multiplicador por porte (se disponível)
        if (company.porte_empresa) {
          const porteMultiplier: Record<string, number> = {
            'MEI': 0.5,
            'ME': 1.0,
            'EPP': 1.5,
            'Média': 2.0,
            'Grande': 3.0,
          };
          valor *= porteMultiplier[company.porte_empresa] || 1.0;
        }

        // Multiplicador por rating (reputação)
        if (company.rating && company.rating >= 4.5) {
          valor *= 1.2;
        }

        potencialFaturamento += valor;
      }
    }

    const stats = {
      leadsAtivos: leadsAtivos || 0,
      leadsParados: leadsParados || 0,
      leadsQuentes: leadsQuentes || 0,
      followupsVencidos: followupsVencidos || 0,
      propostasAbertas: propostasAbertas || 0,
      potencialFaturamento: Math.round(potencialFaturamento),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('Erro ao buscar pressure stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar estatísticas de pressão',
      },
      { status: 500 }
    );
  }
}
