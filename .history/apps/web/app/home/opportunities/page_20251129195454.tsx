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
        
        console.log('📊 Resposta da API history:', data);
        console.log('📊 Total de items no histórico:', data.history?.length || 0);
        
        if (data.success) {
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
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
        
        console.log('✅ Frase gerada, salvando automaticamente no histórico...');
        
        // Salvar automaticamente no histórico
        const saveRes = await fetch('/api/opportunities/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt_id: data.prompt.id,
            prompt_text: data.prompt.prompt_text,
            category_id: data.prompt.category_id,
            results_count: 0,
          }),
        });

        const saveData = await saveRes.json();
        console.log('💾 Salvo no histórico:', saveData);

        // Recarregar histórico
        const historyRes = await fetch('/api/opportunities/history?limit=20');
        const historyData = await historyRes.json();
        console.log('🔄 Histórico atualizado:', historyData);
        
        if (historyData.success) {
          setHistory(historyData.history || []);
        }

        toast.success('Nova oportunidade gerada e salva!');
      } else {
        toast.error(data.error || 'Erro ao gerar oportunidade');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar prompt:', error);
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
      
      console.log('📋 Salvando no histórico:', {
        prompt_id: currentPrompt.id,
        prompt_text: currentPrompt.prompt_text,
        category_id: currentPrompt.category_id,
      });

      // Salvar no histórico
      const saveRes = await fetch('/api/opportunities/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: currentPrompt.id,
          prompt_text: currentPrompt.prompt_text,
          category_id: currentPrompt.category_id,
          results_count: 0,
        }),
      });

      const saveData = await saveRes.json();
      console.log('💾 Resposta do salvamento:', saveData);

      // Recarregar histórico
      const res = await fetch('/api/opportunities/history?limit=20');
      const data = await res.json();
      console.log('🔄 Histórico recarregado:', data);
      
      if (data.success) {
        setHistory(data.history || []);
        toast.success(`Prompt copiado e salvo! (${data.history?.length || 0} no histórico)`);
      } else {
        toast.success('Prompt copiado!');
      }
    } catch (error) {
      console.error('❌ Erro ao copiar:', error);
      toast.error('Erro ao copiar prompt');
    }
  }

  const displayedHistory = showAllHistory ? history : history.slice(0, 9);

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

          {/* Seletor de Nichos */}
          <div className="w-full max-w-4xl">
            <div className="flex flex-col gap-2 items-center">
              {/* Primeira linha: Todos + primeiros 4 */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="rounded-full"
                >
                  Todos os Nichos
                </Button>
                {categories.slice(0, 4).map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="rounded-full"
                  >
                    <span className="mr-1.5">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
              
              {/* Segunda linha: últimos 2 */}
              {categories.length > 4 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {categories.slice(4).map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="rounded-full"
                    >
                      <span className="mr-1.5">{category.icon}</span>
                      {category.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
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

          {/* Aviso sobre histórico vazio */}
          {!loadingHistory && history.length === 0 && (
            <div className="w-full max-w-2xl">
              <Card className="border-muted-foreground/20 bg-muted/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Seu histórico está vazio</CardTitle>
                  </div>
                  <CardDescription className="text-sm pt-2">
                    <p>Clique em <strong>"Gerar Oportunidade"</strong> para criar sua primeira frase.</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Todas as frases geradas são salvas automaticamente no histórico.
                    </p>
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
                {history.length > 9 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                  >
                    {showAllHistory ? 'Ver menos' : `Ver mais (${history.length})`}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedHistory.map((item) => (
                  <Card 
                    key={item.id} 
                    className="group relative overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-background to-muted/20 h-[180px]"
                  >
                    <CardContent className="p-4 h-full">
                      <div className="flex flex-col h-full justify-between gap-2">
                        {/* Header: Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80 shrink-0">
                            {item.category_name}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await navigator.clipboard.writeText(item.prompt_text);
                              toast.success('Frase copiada!');
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Texto da frase - ocupa espaço principal */}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm text-foreground line-clamp-4 leading-relaxed">
                            {item.prompt_text}
                          </p>
                        </div>

                        {/* Footer: Tags */}
                        <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            #{item.category_name.toLowerCase().replace(/\s+/g, '')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            #b2b
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            #prospecção
                          </span>
                        </div>
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
