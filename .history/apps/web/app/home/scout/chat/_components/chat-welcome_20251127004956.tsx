'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { useCreateConversation } from '@kit/kaix-scout/hooks';
import { useRouter } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';

export function ChatWelcome() {
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

  const quickActions = [
    { label: 'Restaurantes SP', query: 'Buscar restaurantes em São Paulo' },
    { label: 'Hotéis RJ', query: 'Encontrar hotéis no Rio de Janeiro' },
    { label: 'Academias', query: 'Prospectar academias em Florianópolis' },
    { label: 'Salões', query: 'Buscar salões de beleza em Curitiba' },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Logo + Title - Simples */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Kaix Scout</h1>
          <p className="text-sm text-muted-foreground">
            Encontre empresas e oportunidades em segundos
          </p>
        </div>

        {/* Main Search Input - Fino */}
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="O que você quer buscar?"
            className="h-11 pl-4 pr-11 rounded-lg"
            disabled={createConversation.isPending}
          />
          <Button
            onClick={() => handleSearch()}
            disabled={!query.trim() || createConversation.isPending}
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1 h-9 w-9"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions - Simples e Pequeno */}
        <div className="flex flex-wrap gap-2 justify-center">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => handleSearch(action.query)}
              disabled={createConversation.isPending}
              className="h-8 text-xs rounded-full"
            >
              {action.label}
            </Button>
          ))}
        </div>

      </div>
    </div>
  );
}
