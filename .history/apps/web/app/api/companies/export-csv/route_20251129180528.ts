import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/companies/export-csv
 * 
 * FASE P4: Exporta empresas para CSV
 * - Suporta exportação de lista específica ou CRM completo
 * - Respeita filtros ativos
 * - Registra telemetria
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

    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('listId');
    const leadStatus = searchParams.get('leadStatus');
    const category = searchParams.get('category');
    const city = searchParams.get('city');

    // Query base
    let query = supabase
      .from('companies')
      .select('*')
      .eq('responsavel_id', user.id);

    // Filtros
    if (listId) {
      // Buscar empresas da lista
      const { data: listCompanies } = await supabase
        .from('list_companies')
        .select('company_id')
        .eq('list_id', listId);

      if (listCompanies && listCompanies.length > 0) {
        const companyIds = listCompanies.map(lc => lc.company_id);
        query = query.in('id', companyIds);
      }
    }

    if (leadStatus) {
      query = query.eq('lead_status', leadStatus);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (city) {
      query = query.eq('municipio', city);
    }

    const { data: companies, error } = await query;

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return NextResponse.json(
        { error: { message: error.message }, success: false },
        { status: 500 },
      );
    }

    // Registrar telemetria
    await supabase.from('product_events').insert({
      user_id: user.id,
      evento: 'exportacao_realizada',
      list_id: listId || null,
      metadata: {
        total_exportado: companies?.length || 0,
        filtros: {
          leadStatus,
          category,
          city,
        },
      },
    });

    // Atualizar progresso de onboarding
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('primary_owner_user_id', user.id)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({
          onboarding_progress: {
            first_export_done: true,
          },
        })
        .eq('id', account.id);
    }

    // Gerar CSV
    const csvHeaders = [
      'Empresa',
      'Telefone',
      'Cidade',
      'Estado',
      'Categoria',
      'Website',
      'Avaliação',
      'Total Reviews',
      'Status',
      'Prioridade',
      'Score',
      'Última Interação',
    ];

    const csvRows = companies?.map((c) => [
      c.name || '',
      c.phone || '',
      c.municipio || '',
      c.uf || '',
      c.category || '',
      c.website || '',
      c.rating || '',
      c.total_reviews || '',
      c.lead_status || '',
      c.priority_level || '',
      c.priority_score || '',
      c.ultima_interacao ? new Date(c.ultima_interacao).toLocaleDateString('pt-BR') : '',
    ]);

    const csv = [
      csvHeaders.join(','),
      ...(csvRows || []).map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Retornar CSV com encoding UTF-8 BOM
    const utf8BOM = '\uFEFF';
    const csvContent = utf8BOM + csv;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="spec64_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    return NextResponse.json(
      { error: { message: 'Erro ao exportar CSV' }, success: false },
      { status: 500 },
    );
  }
}
