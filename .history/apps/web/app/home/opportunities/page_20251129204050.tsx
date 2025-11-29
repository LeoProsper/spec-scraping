'use client';

import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Skeleton } from '@kit/ui/skeleton';
import { Textarea } from '@kit/ui/textarea';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Copy, RefreshCw, Clock, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
        toast.error(data.error || 'Erro ao buscar oportunidade');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar prompt:', error);
      toast.error('Erro ao buscar oportunidade');
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
      <PageBody>
        <div className="animate-in fade-in flex flex-col space-y-24 py-14 duration-500">
          {/* Hero Section */}
          <div className="container mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  New
                </span>
                <span className="text-muted-foreground">
                  Gerador de Oportunidades com IA
                </span>
              </div>

              {/* Title */}
              <div className="space-y-4">
                <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                  <span className="block">Buscador de Oportunidades,</span>
                  <span className="block">encontre seus próximos clientes.</span>
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
                  Gere e Prospecte com prompts estratégicos com IA. Ampliamos seu radar
                  para descobrir negócios com dores específicas.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto">
            <div className="flex flex-col space-y-16 xl:space-y-32">
              {/* Feature Showcase - Seletor de Nichos */}
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight">
                    <b className="font-semibold dark:text-white">
                      Selecione seu nicho
                    </b>
                    .{' '}
                    <span className="text-muted-foreground font-normal block mt-2">
                      Escolha a categoria que melhor se<br />encaixa no seu público-alvo
                    </span>
                  </h2>
                  <span className="text-muted-foreground text-xs leading-none font-normal">
                    Converse com a IA para encontrar empresas e gerar propostas
                  </span>
                </div>

                {/* Seletor de Nichos */}
                <div className="flex flex-col gap-3 items-center">
                  {/* Primeira linha: Todos + primeiros 3 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setSelectedCategory('all')}
                      className="rounded-full"
                    >
                      Todos os Nichos
                    </Button>
                    {categories.slice(0, 3).map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setSelectedCategory(category.id)}
                        className="rounded-full"
                      >
                        <span className="mr-1.5">{category.icon}</span>
                        {category.name}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Segunda linha: últimos 2 */}
                  {categories.length > 3 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {categories.slice(3).map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? 'default' : 'outline'}
                          size="lg"
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

                {/* Card de Resultado */}
                <div className="mx-auto max-w-4xl w-full">
                  <Card className="relative col-span-2 overflow-hidden border-0">
                    <CardHeader>
                      <CardTitle>Prompt Gerado</CardTitle>
                      <CardDescription>
                        Seu prompt estratégico de prospecção personalizado
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between gap-4 p-6 rounded-lg border min-h-[120px]">
                        {currentPrompt ? (
                          <>
                            <p className="flex-1 text-base text-foreground leading-relaxed">
                              {currentPrompt.prompt_text}
                            </p>
                            <Button onClick={handleCopy} size="icon" variant="ghost" className="shrink-0">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <p className="flex-1 text-sm text-muted-foreground text-center">
                            Clique em "Buscar Oportunidade" para criar um novo prompt
                          </p>
                        )}
                      </div>

                      {/* Botão Gerar */}
                      <Button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Buscando...' : 'Buscar Oportunidade'}
                      </Button>

                      {/* Botões Clicáveis Adicionais */}
                      <div className="flex items-center justify-center gap-6 pt-4">
                        <button
                          onClick={() => {
                            // Adicione a ação desejada aqui
                            console.log('Criar Lista Premium clicado');
                          }}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Sparkles className="h-4 w-4" />
                          Criar Lista Premium
                        </button>
                        
                        <button
                          onClick={() => {
                            // Adicione a ação desejada aqui
                            console.log('Buscar c/ Chat AI clicado');
                          }}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Zap className="h-4 w-4" />
                          Buscar c/ Chat AI
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Resultados */}
          {!loadingHistory && history.length > 0 && (
            <div className="container mx-auto">
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight">
                    <b className="font-semibold dark:text-white">
                      Histórico de Resultados
                    </b>
                    .{' '}
                    <span className="text-muted-foreground font-normal">
                      Suas últimas {history.length} frases geradas
                    </span>
                  </h2>
                  {history.length > 9 && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowAllHistory(!showAllHistory)}
                    >
                      {showAllHistory ? 'Ver menos' : `Ver todas (${history.length})`}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedHistory.map((item) => (
                    <Card 
                      key={item.id} 
                      className="border-primary/10 group relative overflow-hidden hover:border-primary/50 transition-all duration-200"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.category_name}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await navigator.clipboard.writeText(item.prompt_text);
                              toast.success('Frase copiada!');
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                          {item.prompt_text}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 pt-2 border-t">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            #{item.category_name.toLowerCase().replace(/\s+/g, '')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            #b2b
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            #prospecção
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loadingHistory && history.length === 0 && (
            <div className="container mx-auto">
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Histórico Vazio</CardTitle>
                  </div>
                  <CardDescription>
                    Clique em "Gerar Oportunidade" para criar sua primeira frase.
                    Todas as frases geradas são salvas automaticamente aqui.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
