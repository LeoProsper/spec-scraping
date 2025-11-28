'use client';

import { Button } from '@kit/ui/button';
import { Sparkles, Search, TrendingUp, Zap } from 'lucide-react';

interface ChatWelcomeProps {
  onExampleClick: (example: string) => void;
}

export function ChatWelcome({ onExampleClick }: ChatWelcomeProps) {
  const examples = [
    {
      icon: Search,
      title: 'Buscar Restaurantes',
      query: 'Buscar restaurantes em São Paulo sem site',
    },
    {
      icon: TrendingUp,
      title: 'Hotéis em Destino',
      query: 'Encontre 30 hotéis em Florianópolis',
    },
    {
      icon: Zap,
      title: 'Prospecção Rápida',
      query: 'Quero prospectar padarias no Rio de Janeiro',
    },
  ];

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold">
            Bem-vindo ao Kaix AI
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Seu assistente inteligente para prospecção de empresas.
            <br />
            Pergunte o que você precisa em linguagem natural.
          </p>
        </div>

        {/* Examples */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground text-center">
            Experimente perguntar:
          </h2>
          
          <div className="grid gap-3">
            {examples.map((example) => (
              <Button
                key={example.title}
                variant="outline"
                onClick={() => onExampleClick(example.query)}
                className="h-auto p-4 justify-start text-left hover:bg-accent"
              >
                <example.icon className="h-5 w-5 mr-3 shrink-0 text-primary" />
                <div>
                  <div className="font-medium">{example.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {example.query}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium">🔍 Busca Inteligente</div>
              <div className="text-muted-foreground text-xs">
                Encontre empresas com Google Maps
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">💬 Conversação Natural</div>
              <div className="text-muted-foreground text-xs">
                Pergunte como faria para um humano
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">📊 Análise Automática</div>
              <div className="text-muted-foreground text-xs">
                Score de leads calculado automaticamente
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">⚡ Resultados Rápidos</div>
              <div className="text-muted-foreground text-xs">
                Processamento em tempo real
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
