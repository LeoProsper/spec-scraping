'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Separator } from '@kit/ui/separator';
import { SidebarTrigger } from '@kit/ui/shadcn-sidebar';
import { ListCompaniesTable } from './_components/list-companies-table';
import { CompanyDetailsDrawer } from './_components/company-details-drawer';
import { useListById } from './_hooks/use-lists';
import { useListCompanies, type ListCompany } from './_hooks/use-list-companies';
import { useListsContext } from './layout';

export default function ListsPage() {
  const { selectedListId } = useListsContext();
  const [selectedCompany, setSelectedCompany] = useState<ListCompany | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  const { list, loading: loadingList } = useListById(selectedListId);
  const { companies, loading: loadingCompanies } = useListCompanies(selectedListId);

  const handleViewDetails = (company: ListCompany) => {
    setSelectedCompany(company);
    setDetailsDrawerOpen(true);
  };

  const handleRegisterInteraction = (company: ListCompany) => {
    setSelectedCompany(company);
    setDetailsDrawerOpen(true);
  };

  // Calcular métricas de negócio
  const totalEmpresas = companies.length;
  const contatadas = companies.filter(c => c.company.lead_status !== 'novo').length;
  const leadsQuentes = companies.filter(c => ['qualificado', 'negociando'].includes(c.company.lead_status)).length;
  const vendas = companies.filter(c => c.company.lead_status === 'ganho').length;
  const taxaConversao = totalEmpresas > 0 ? ((vendas / totalEmpresas) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header padronizado */}
      <div className="flex items-center justify-between py-5 lg:px-4">
        <div className="flex items-center gap-x-2.5">
          <SidebarTrigger className="text-muted-foreground hover:text-secondary-foreground hidden h-4.5 w-4.5 cursor-pointer lg:inline-flex" />

          <Separator orientation="vertical" className="hidden h-4 lg:inline-flex" />

          <span className="font-heading text-base leading-none font-bold tracking-tight dark:text-white">
            Listas
          </span>

          <span className="text-muted-foreground mx-2">-</span>

          <span className="text-muted-foreground text-xs leading-none font-normal">
            {list ? `${list.nome} • ${list.total_resultados} empresas` : 'Selecione uma lista na barra lateral'}
          </span>
        </div>
      </div>

      {/* Métricas de Negócio - Visível apenas quando há lista selecionada */}
      {list && companies.length > 0 && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-card border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Total de Empresas</div>
              <div className="text-2xl font-bold">{totalEmpresas}</div>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Contatadas</div>
              <div className="text-2xl font-bold text-blue-600">{contatadas}</div>
              <div className="text-xs text-muted-foreground">
                {totalEmpresas > 0 ? `${((contatadas / totalEmpresas) * 100).toFixed(0)}%` : '0%'}
              </div>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Leads Quentes</div>
              <div className="text-2xl font-bold text-orange-600">{leadsQuentes}</div>
              <div className="text-xs text-muted-foreground">
                {contatadas > 0 ? `${((leadsQuentes / contatadas) * 100).toFixed(0)}% dos contatados` : '0%'}
              </div>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Vendas Fechadas</div>
              <div className="text-2xl font-bold text-green-600">{vendas}</div>
              <div className="text-xs text-muted-foreground">
                Taxa: {taxaConversao}%
              </div>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Em Prospecção</div>
              <div className="text-2xl font-bold text-gray-600">
                {totalEmpresas - contatadas}
              </div>
              <div className="text-xs text-muted-foreground">Aguardando contato</div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="flex-1 overflow-hidden">
        <ListCompaniesTable
          companies={companies}
          loading={loadingCompanies}
          onViewDetails={handleViewDetails}
          onRegisterInteraction={handleRegisterInteraction}
        />
      </div>

      {/* Details Drawer */}
      <CompanyDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        listCompany={selectedCompany}
      />
    </div>
  );
}
