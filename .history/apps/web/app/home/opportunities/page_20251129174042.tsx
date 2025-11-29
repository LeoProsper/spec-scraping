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
  const [loadingCategories, setLoadingCategories] = useState(true);
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
      } finally {
        setLoadingCategories(false);
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

  const displayedHistory = showAllHistory ? history : history.slice(0, 4);

  return (
    <>
      {/* Header Padronizado */}
      <div className="flex items-center justify-between py-5 lg:px-4">
        <div className="flex items-center gap-x-2.5">
          <SidebarTrigger className="text-muted-foreground hover:text-secondary-foreground hidden h-4.5 w-4.5 cursor-pointer lg:inline-flex" />

          <Separator orientation="vertical" className="hidden h-4 lg:inline-flex" />

          <span className="font-heading text-base leading-none font-bold tracking-tight dark:text-white">
            Oportunidades
          </span>
          <span className="text-muted-foreground mx-2">-</span>
          <span className="text-muted-foreground text-xs leading-none font-normal">
            Gere prompts estratégicos de prospecção e descubra empresas com dores específicas
          </span>
        </div>
      </div>

      {/* Hero Section com Animações */}
      {!currentPrompt && (
        <AnimatedHero
          onGenerateClick={handleGenerate}
          loading={loading}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}

      {/* Seção de Resultado Gerado */}
      {currentPrompt && (
        <div className="container mx-auto p-6 max-w-7xl">{/* Categorias Selecionáveis */}
        <div className="flex flex-wrap gap-2 mb-8">
          {loadingCategories ? (
            <Skeleton className="h-9 w-full max-w-md" />
          ) : (
            <>
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="h-9"
              >
                🎲 Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="h-9"
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </>
          )}
        </div>

          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="default" className="text-base px-3 py-1">
                      {categories.find(c => c.id === currentPrompt.category_id)?.icon} {currentPrompt.category_name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      💡 {currentPrompt.pain_point}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    ✨ Sua Oportunidade
                  </CardTitle>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={currentPrompt.prompt_text}
                readOnly
                className="min-h-[160px] font-mono text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleCopy} className="flex-1 h-12">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar e Usar no Chat AI
                </Button>
                <Button 
                  onClick={() => setCurrentPrompt(null)} 
                  variant="outline"
                  className="h-12"
                >
                  Voltar
                </Button>
              </div>
              {currentPrompt.data_sources.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">📊 Fontes de dados necessárias:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentPrompt.data_sources.map((source) => (
                      <Badge key={source} variant="secondary" className="text-xs">
                        {source.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de Resultados */}
      {history.length > 0 && (
        <div className="container mx-auto p-6 max-w-7xl" id="history-section">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-xl">Histórico de Resultados</CardTitle>
                </div>
                {history.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                  >
                    {showAllHistory ? 'Ver menos' : `Ver todos (${history.length})`}
                  </Button>
                )}
              </div>
              <CardDescription>
                Seus últimos prompts gerados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedHistory.map((item) => (
                    <Card key={item.id} className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{item.category_icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.category_name}
                              </Badge>
                            </div>
                            <p className="text-sm line-clamp-3 mb-2">{item.prompt_text}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
