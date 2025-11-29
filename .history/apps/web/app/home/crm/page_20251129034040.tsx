import { Suspense } from 'react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { MasterCrmTable } from './_components/master-crm-table';
import { MasterCrmFilters } from './_components/master-crm-filters';
import { MasterCrmStats } from './_components/master-crm-stats';
import { MasterCrmShortcuts } from './_components/master-crm-shortcuts';
import { Skeleton } from '@kit/ui/skeleton';

export default function CrmPage() {
  return (
    <>
      <PageHeader 
        title="CRM Master"
        description="Central unificada de todas as suas empresas e prospecções"
      />

      <PageBody>
        <div className="flex flex-col gap-6">
          {/* Estatísticas resumidas */}
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <MasterCrmStats />
          </Suspense>

          {/* Filtros e tabela */}
          <div className="flex gap-6">
            {/* Painel de filtros lateral */}
            <aside className="w-80 flex-shrink-0">
              <MasterCrmFilters />
            </aside>

            {/* Tabela principal */}
            <main className="flex-1 overflow-x-auto">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <MasterCrmTable />
              </Suspense>
            </main>
          </div>
        </div>
      </PageBody>
    </>
  );
}
