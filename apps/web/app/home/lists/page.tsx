'use client';

import { useState } from 'react';
import { ListsSidebar } from './_components/lists-sidebar';
import { ListHeader } from './_components/list-header';
import { ListCompaniesTable } from './_components/list-companies-table';
import { CompanyDetailsDrawer } from './_components/company-details-drawer';
import { useListById } from './_hooks/use-lists';
import { useListCompanies, type ListCompany } from './_hooks/use-list-companies';

export default function ListsPage() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 shrink-0">
        <ListsSidebar
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ListHeader
          list={list}
          loading={loadingList}
          onEdit={() => {
            // TODO: Implement edit list
            console.log('Edit list', list);
          }}
          onDuplicate={() => {
            // TODO: Implement duplicate list
            console.log('Duplicate list', list);
          }}
        />

        <div className="flex-1 overflow-hidden">
          <ListCompaniesTable
            companies={companies}
            loading={loadingCompanies}
            onViewDetails={handleViewDetails}
            onRegisterInteraction={handleRegisterInteraction}
          />
        </div>
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
