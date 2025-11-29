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

  const displayedHistory = showAllHistory ? history : history.slice(0, 4);

  return (
    <>
      <PageHeader 
        title="Oportunidades"
        description="Gere prompts estratégicos de prospecção e descubra empresas com dores específicas"
      />

      <PageBody>
        <div className="animate-in fade-in flex flex-col space-y-4 pb-36 duration-500">
          {/* Hero Section com Animações - Sempre visível */}
          <AnimatedHero
            onGenerateClick={handleGenerate}
            loading={loading}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Resultado aparece inline abaixo do hero */}
          {currentPrompt && (
            <div className="space-y-4 max-w-5xl mx-auto w-full">
              <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-xl">
                  ✨ Sua Oportunidade Gerada
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Nova
                  </Button>
                  <Button 
                    onClick={() => setCurrentPrompt(null)} 
                    variant="ghost"
                    size="sm"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs px-2 py-1">
                  {categories.find(c => c.id === currentPrompt.category_id)?.icon} {currentPrompt.category_name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  💡 {currentPrompt.pain_point}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={currentPrompt.prompt_text}
                readOnly
                className="min-h-[200px] font-mono text-sm resize-none bg-muted/30"
              />
              <Button onClick={handleCopy} className="w-full h-12">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Prompt
              </Button>
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
            <div id="history-section">
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
        </div>
      </PageBody>
    </>
  );
}
