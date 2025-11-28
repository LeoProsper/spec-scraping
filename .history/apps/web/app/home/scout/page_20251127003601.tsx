import { PageBody, PageHeader } from '@kit/ui/page';
import { SearchForm } from './_components/search-form';
import { StatsCards } from './_components/stats-cards';
import { RecentSearches } from './_components/recent-searches';

export const metadata = {
  title: 'Kaix Scout - Dashboard',
  description: 'Sistema de prospecção inteligente',
};

export default function ScoutPage() {
  return (
    <>
      <PageHeader
        title="Kaix Scout"
        description="Encontre empresas, analise websites e gere oportunidades de vendas"
      />
      <PageBody>
        <div className="space-y-8">
          {/* Stats Cards */}
          <StatsCards />

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Search Form */}
            <SearchForm />

            {/* Recent Searches */}
            <RecentSearches />
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Como funciona?</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <h4 className="font-medium">Busque Empresas</h4>
                <p className="text-sm text-muted-foreground">
                  Digite o tipo de negócio e a localização para encontrar empresas
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <h4 className="font-medium">Analise Websites</h4>
                <p className="text-sm text-muted-foreground">
                  Nossa IA analisa a qualidade dos sites e gera um score de oportunidade
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <h4 className="font-medium">Crie Propostas</h4>
                <p className="text-sm text-muted-foreground">
                  Para hot leads (score 7-10), gere templates e envie propostas personalizadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
