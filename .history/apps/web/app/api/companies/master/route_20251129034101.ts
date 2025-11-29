import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/companies/master
 * 
 * Endpoint central para a tela Master CRM
 * Retorna empresas unificadas com filtros avançados
 */
export async function GET(request: NextRequest) {
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

    // Parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    
    // Paginação
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;
    
    // Ordenação
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Filtros
    const leadStatus = searchParams.get('leadStatus');
    const responsavelId = searchParams.get('responsavelId');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const hasWebsite = searchParams.get('hasWebsite');
    const ratingMin = searchParams.get('ratingMin');
    const reviewsMin = searchParams.get('reviewsMin');
    const listId = searchParams.get('listId');
    const semInteracaoDias = searchParams.get('semInteracaoDias');
    const followupVencido = searchParams.get('followupVencido');
    const isHotLead = searchParams.get('isHotLead');
    const searchText = searchParams.get('search');
    
    // Novos filtros de pressão operacional
    const statusPressao = searchParams.get('status'); // ativo, parado, quente
    const followupStatus = searchParams.get('followup'); // vencido
    const propostaStatus = searchParams.get('proposta'); // aberta, sem
    
    // Filtros comerciais prontos (FASE 3)
    const websiteFilter = searchParams.get('website'); // null
    const ratingFilter = searchParams.get('rating'); // baixo (< 3.5)
    const reviewsFilter = searchParams.get('reviews'); // baixo (< 20)

    // Construir query base
    let query = supabase
      .from('companies_master_view')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (leadStatus) {
      query = query.eq('lead_status', leadStatus);
    }
    
    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (city) {
      query = query.eq('city', city);
    }
    
    if (state) {
      query = query.eq('state', state);
    }
    
    if (hasWebsite !== null) {
      query = query.eq('has_site', hasWebsite === 'true');
    }
    
    if (ratingMin) {
      query = query.gte('rating', parseFloat(ratingMin));
    }
    
    if (reviewsMin) {
      query = query.gte('total_reviews', parseInt(reviewsMin, 10));
    }
    
    if (semInteracaoDias) {
      query = query.gte('dias_sem_interacao', parseInt(semInteracaoDias, 10));
    }
    
    if (followupVencido === 'true') {
      query = query.eq('followup_vencido', true);
    }
    
    if (isHotLead === 'true') {
      query = query.eq('is_hot_lead', true);
    }
    
    // Filtros de pressão operacional
    if (statusPressao === 'ativo') {
      // Leads ativos: NOT IN ('ganho', 'perdido')
      query = query.not('lead_status', 'in', '("ganho","perdido")');
    }
    
    if (statusPressao === 'parado') {
      // Leads parados: sem interação há mais de 14 dias
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      query = query
        .not('lead_status', 'in', '("ganho","perdido")')
        .or(`ultima_interacao.is.null,ultima_interacao.lt.${fourteenDaysAgo.toISOString()}`);
    }
    
    if (statusPressao === 'quente') {
      // Leads quentes: interações nos últimos 3 dias OU status qualificado
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      query = query.or(
        `ultima_interacao.gte.${threeDaysAgo.toISOString()},lead_status.eq.qualificado`
      );
    }
    
    if (followupStatus === 'vencido') {
      query = query.eq('followup_vencido', true);
    }
    
    // Filtro de proposta aberta requer subquery
    if (propostaStatus === 'aberta') {
      // Buscar company_ids com propostas abertas
      const { data: openProposals } = await supabase
        .from('proposals')
        .select('company_id')
        .eq('status', 'sent');
      
      if (openProposals && openProposals.length > 0) {
        const companyIds = openProposals.map(p => p.company_id);
        query = query.in('company_id', companyIds);
      } else {
        // Nenhuma proposta aberta, retornar vazio
        return NextResponse.json({
          data: {
            companies: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
          success: true,
        });
      }
    }
    
    // Busca por texto
    if (searchText) {
      query = query.ilike('name', `%${searchText}%`);
    }

    // Filtro especial por lista
    if (listId) {
      // Buscar companies_ids da lista
      const { data: listCompanies } = await supabase
        .from('list_companies')
        .select('company_id')
        .eq('list_id', listId);
      
      if (listCompanies && listCompanies.length > 0) {
        const companyIds = listCompanies.map(lc => lc.company_id);
        query = query.in('company_id', companyIds);
      } else {
        // Lista vazia, retornar vazio
        return NextResponse.json({
          data: {
            companies: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
          success: true,
        });
      }
    }

    // Aplicar ordenação
    query = query.order(sortBy as any, { ascending: sortOrder === 'asc' });
    
    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    // Executar query
    const { data: companies, error: companiesError, count } = await query;

    if (companiesError) {
      console.error('[API] Error fetching companies:', companiesError);
      return NextResponse.json(
        { 
          error: { 
            message: 'Failed to fetch companies',
            details: companiesError.message,
          }, 
          success: false 
        },
        { status: 500 },
      );
    }

    // Calcular estatísticas dos filtros atuais
    const stats = companies?.reduce((acc, company) => {
      return {
        totalInteracoes: acc.totalInteracoes + (company.total_interacoes || 0),
        totalPropostas: acc.totalPropostas + (company.total_propostas || 0),
        comSite: acc.comSite + (company.has_site ? 1 : 0),
        semSite: acc.semSite + (company.has_site ? 0 : 1),
        hotLeads: acc.hotLeads + (company.is_hot_lead ? 1 : 0),
        followupsVencidos: acc.followupsVencidos + (company.followup_vencido ? 1 : 0),
      };
    }, {
      totalInteracoes: 0,
      totalPropostas: 0,
      comSite: 0,
      semSite: 0,
      hotLeads: 0,
      followupsVencidos: 0,
    });

    // Retornar resposta
    return NextResponse.json({
      data: {
        companies: companies || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
        stats,
      },
      success: true,
    });

  } catch (error) {
    console.error('[API] Error in companies/master:', error);

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
