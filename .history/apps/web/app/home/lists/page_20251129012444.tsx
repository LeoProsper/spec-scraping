'use client';

import { useState } from 'react';
import { PanelLeft, ListFilter } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { Separator } from '@kit/ui/separator';
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header padronizado */}
      <div className="flex items-center justify-between py-5 lg:px-4">
        <div className="flex items-center gap-x-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-4.5 w-4.5 cursor-pointer lg:inline-flex hover:bg-accent text-muted-foreground hover:text-secondary-foreground"
            data-sidebar="trigger"
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>

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
