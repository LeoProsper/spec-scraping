'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { useCreateConversation } from '@kit/kaix-scout/hooks';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  UtensilsCrossed, 
  Hotel, 
  ShoppingBag,
  Dumbbell,
  Scissors,
  Wrench,
  Coffee,
  Store
} from 'lucide-react';

interface ChatWelcomeProps {
  onExampleClick: (example: string) => void;
}

export function ChatWelcome({ onExampleClick }: ChatWelcomeProps) {
  const [query, setQuery] = useState('');
  const createConversation = useCreateConversation();
  const router = useRouter();

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    try {
      const result = await createConversation.mutateAsync({
        initial_message: finalQuery
      });
      router.push(`/home/scout/chat?c=${result.conversation.id}`);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  const quickNiches = [
    { icon: UtensilsCrossed, label: 'Restaurantes', query: 'restaurantes em São Paulo' },
    { icon: Hotel, label: 'Hotéis', query: 'hotéis no Rio de Janeiro' },
    { icon: Coffee, label: 'Padarias', query: 'padarias em Florianópolis' },
    { icon: Dumbbell, label: 'Academias', query: 'academias em Curitiba' },
    { icon: Scissors, label: 'Salões', query: 'salões de beleza em Porto Alegre' },
    { icon: Wrench, label: 'Oficinas', query: 'oficinas mecânicas em Belo Horizonte' },
    { icon: ShoppingBag, label: 'Lojas', query: 'lojas de roupas em Brasília' },
    { icon: Store, label: 'Mercados', query: 'supermercados em Salvador' },
  ];

  const quickRadius = ['5km', '10km', '20km', '50km', 'Toda cidade'];
  const quickResults = [10, 20, 50, 100];
  const quickCities = ['São Paulo', 'Rio de Janeiro', 'Florianópolis', 'Curitiba', 'Porto Alegre'];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Logo + Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Search className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Kaix Scout</h1>
          <p className="text-muted-foreground">
            Encontre empresas e oportunidades em segundos
          </p>
        </div>

        {/* Main Search Input */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="O que você quer buscar? Ex: restaurantes em São Paulo"
              className="h-14 text-lg pl-5 pr-14 rounded-xl border-2 focus:border-primary"
              disabled={createConversation.isPending}
            />
            <Button
              onClick={() => handleSearch()}
              disabled={!query.trim() || createConversation.isPending}
              size="icon"
              className="absolute right-2 top-2 h-10 w-10 rounded-lg"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Niches - Below Input */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Nichos populares
            </p>
            <div className="flex flex-wrap gap-2">
              {quickNiches.map((niche) => {
                const Icon = niche.icon;
                return (
                  <Button
                    key={niche.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(niche.query)}
                    disabled={createConversation.isPending}
                    className="h-9 gap-2 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {niche.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Quick Filters Grid */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {/* Raio */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Raio de busca
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickRadius.map((radius) => (
                  <Button
                    key={radius}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs hover:bg-accent"
                  >
                    {radius}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Quantidade
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickResults.map((num) => (
                  <Button
                    key={num}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs hover:bg-accent"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cidades */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Cidade
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickCities.slice(0, 3).map((city) => (
                  <Button
                    key={city}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs hover:bg-accent"
                  >
                    {city.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="h-3 w-3 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Busca Inteligente</p>
                <p className="text-xs">Google Maps + IA</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-500 text-xs font-bold">⚡</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Análise Automática</p>
                <p className="text-xs">Score de oportunidade 0-10</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
