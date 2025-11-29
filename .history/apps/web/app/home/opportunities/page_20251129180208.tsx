'use client';

import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Skeleton } from '@kit/ui/skeleton';
import { Textarea } from '@kit/ui/textarea';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Copy, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatedHero } from '~/components/opportunities/animated-hero';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Prompt {
  id: string;
  category_id: string;
  category_name: string;
  prompt_text: string;
  pain_point: string;
  data_sources: string[];
}

interface HistoryItem {
  id: string;
  prompt_text: string;
  category_name: string;
  category_icon: string;
  results_count: number;
  created_at: string;
}

export default function OpportunitiesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Carregar categorias
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/opportunities/categories');
        const data = await res.json();
        
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        toast.error('Erro ao carregar categorias');
      }
    }

    loadCategories();
  }, []);

  // Carregar histórico
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/opportunities/history?limit=20');
        const data = await res.json();
        
        if (data.success) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, []);

  // Gerar novo prompt
  async function handleGenerate() {
    setLoading(true);
    
    try {
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const res = await fetch(`/api/opportunities/generate${categoryParam}`);
      const data = await res.json();

      if (data.success) {
        setCurrentPrompt(data.prompt);
        toast.success('Nova oportunidade gerada!');
      } else {
        toast.error(data.error || 'Erro ao gerar oportunidade');
      }
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      toast.error('Erro ao gerar oportunidade');
    } finally {
      setLoading(false);
    }
  }

  // Copiar prompt
  async function handleCopy() {
    if (!currentPrompt) return;

    try {
      await navigator.clipboard.writeText(currentPrompt.prompt_text);
      toast.success('Prompt copiado!');

      // Salvar no histórico
      await fetch('/api/opportunities/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: currentPrompt.id,
          prompt_text: currentPrompt.prompt_text,
          category_id: currentPrompt.category_id,
          results_count: 0,
        }),
      });

      // Recarregar histórico
      const res = await fetch('/api/opportunities/history?limit=20');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar prompt');
    }
  }

  const displayedHistory = showAllHistory ? history : history.slice(0, 8);

  return (
    <>
      <PageHeader 
        title="Oportunidades"
        description="Gere prompts estratégicos de prospecção e descubra empresas com dores específicas"
      />

      <PageBody>
        <div className="animate-in fade-in flex flex-col items-center space-y-8 pb-36 duration-500 max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="text-center space-y-3 pt-8">
            <h1 className="text-4xl font-bold tracking-tight">
              Gerador de Oportunidades B2B
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Gere prompts estratégicos de prospecção usando IA para descobrir empresas com dores específicas
            </p>
          </div>

          {/* Campo de Resultado */}
          <div className="w-full max-w-4xl space-y-4">
            <div className="flex items-center justify-between gap-4 p-6 bg-muted/30 rounded-lg border min-h-[120px]">
              {currentPrompt ? (
                <>
                  <p className="flex-1 text-sm font-mono text-foreground leading-relaxed">
                    {currentPrompt.prompt_text}
                  </p>
                  <Button onClick={handleCopy} size="icon" variant="ghost" className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <p className="flex-1 text-sm text-muted-foreground text-center">
                  Clique em "Gerar Oportunidade" para criar um novo prompt
                </p>
              )}
            </div>

            {/* Botão Gerar */}
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full h-14 text-base"
              size="lg"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Gerando...' : 'Gerar Oportunidade'}
            </Button>
          </div>

          {/* Aviso sobre como salvar no histórico */}
          {!loadingHistory && history.length === 0 && (
            <div className="w-full max-w-2xl">
              <Card className="border-muted-foreground/20 bg-muted/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Seu histórico está vazio</CardTitle>
                  </div>
                  <CardDescription className="text-sm space-y-2 pt-2">
                    <p>Para salvar prompts no histórico:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                      <li>Clique em <strong>"Gerar Oportunidade"</strong></li>
                      <li>Clique no ícone de <strong>copiar</strong> (📋) ao lado do prompt</li>
                      <li>O prompt será salvo automaticamente no histórico</li>
                    </ol>
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Histórico de Resultados */}
          {!loadingHistory && history.length > 0 && (
            <div className="w-full pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Histórico de Resultados</h2>
                {history.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                  >
                    {showAllHistory ? 'Ver menos' : `Ver mais (${history.length})`}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedHistory.map((item) => (
                  <Card 
                    key={item.id} 
                    className="group relative overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-background to-muted/20"
                  >
                    {/* Badge de categoria no topo */}
                    <div className="absolute top-0 right-0 m-3">
                      <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
                        {item.category_name}
                      </Badge>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      {/* Ícone grande da categoria */}
                      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <span className="text-4xl">{item.category_icon}</span>
                      </div>

                      {/* Texto da frase - destaque principal */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                          FRASE GERADA
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed min-h-[80px]">
                          {item.prompt_text}
                        </p>
                      </div>

                      {/* Footer com data */}
                      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await navigator.clipboard.writeText(item.prompt_text);
                            toast.success('Frase copiada!');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
