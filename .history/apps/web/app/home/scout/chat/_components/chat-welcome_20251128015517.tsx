'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { useCreateConversation } from '@kit/kaix-scout/hooks';
import { Search, Loader2, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@kit/ui/popover';
import type { GoogleMapsPlace } from '@kit/kaix-scout/types';
import { ResultsTable } from './results-table';
import { useSearchParams } from 'next/navigation';

const PLACEHOLDERS = [
  'Buscar restaurantes em São Paulo...',
  'Encontrar hotéis no Rio de Janeiro...',
  'Prospectar academias em Curitiba...',
  'Listar salões de beleza em Porto Alegre...',
];

export function ChatWelcome() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('query');
  
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [maxResults, setMaxResults] = useState(5);
  const [radius, setRadius] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleMapsPlace[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const createConversation = useCreateConversation();

  // Auto-execute search from URL query parameter
  useEffect(() => {
    if (queryParam && !isSearching && searchResults.length === 0) {
      setQuery(queryParam);
      handleSearch(queryParam);
    }
  }, [queryParam]);
  
  // Cycle placeholder text
  useEffect(() => {
    if (isActive || query) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);

  // Cycle placeholder text
  useEffect(() => {
    if (isActive || query) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, query]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!query) setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;

    const interval = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setSearchError(null); // Limpar erro quando acabar
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  const generateSearchTitle = (query: string, resultsCount: number): string => {
    // Extrair tipo de negócio e cidade da query
    const queryLower = query.toLowerCase();
    let businessType = '';
    let location = '';

    // Extrair tipo de negócio (primeira parte antes de "em" ou "in")
    const businessMatch = queryLower.match(/(?:buscar|encontrar|prospectar|listar)\s+([^em]+?)\s+(?:em|in|no|na)/i);
    if (businessMatch && businessMatch[1]) {
      businessType = businessMatch[1].trim();
    } else {
      // Se não encontrar padrão, pegar primeiras palavras
      const words = query.split(' ').filter(w => !['buscar', 'encontrar', 'prospectar', 'listar', 'em', 'in', 'no', 'na'].includes(w.toLowerCase()));
      businessType = words.slice(0, 2).join(' ');
    }

    // Extrair localização (após "em", "in", "no", "na")
    const locationMatch = queryLower.match(/(?:em|in|no|na)\s+(.+)$/i);
    if (locationMatch && locationMatch[1]) {
      location = locationMatch[1].trim();
    }

    // Capitalizar primeira letra
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    
    const title = location 
      ? `${resultsCount} ${resultsCount === 1 ? 'resultado' : 'resultados'} - ${capitalize(businessType)} ${capitalize(location)}`
      : `${resultsCount} ${resultsCount === 1 ? 'resultado' : 'resultados'} - ${capitalize(businessType)}`;
    
    return title;
  };

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      // Call API to search places
      const response = await fetch('/api/scout/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          maxPlaces: maxResults,
          radius: radius,
          lang: 'pt',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        
        // Detectar rate limit e extrair tempo de espera
        if (response.status === 429 || errorData.includes('Rate limit') || errorData.includes('Too Many Requests')) {
          try {
            const errorJson = JSON.parse(errorData);
            const waitTime = errorJson.retryAfter || 60;
            setRateLimitSeconds(waitTime);
          } catch {
            setRateLimitSeconds(60);
          }
        }
        
        throw new Error(`Erro ao buscar empresas: ${errorData.substring(0, 100)}`);
      }

      const data = await response.json();
      const places = data.places || [];
      setSearchResults(places);

      // Salvar busca no histórico com título automático
      if (places.length > 0) {
        const searchTitle = generateSearchTitle(finalQuery, places.length);
        try {
          await fetch('/api/scout/searches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: searchTitle,
              query: finalQuery,
              max_places: maxResults,
              radius: radius,
              lang: 'pt',
              total_results: places.length,
              status: 'completed',
            }),
          });
        } catch (err) {
          console.error('Erro ao salvar histórico:', err);
          // Não bloqueia a busca se falhar ao salvar
        }
      }
    } catch (error) {
      console.error('Erro ao buscar:', error);
      setSearchError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Salvar busca com erro no histórico
      try {
        await fetch('/api/scout/searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Erro - ${finalQuery.substring(0, 50)}`,
            query: finalQuery,
            max_places: maxResults,
            radius: radius,
            lang: 'pt',
            total_results: 0,
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
          }),
        });
      } catch (err) {
        console.error('Erro ao salvar histórico de erro:', err);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const quickActions = [
    { label: 'Restaurantes SP', query: 'Buscar restaurantes em São Paulo' },
    { label: 'Hotéis RJ', query: 'Encontrar hotéis no Rio de Janeiro' },
    { label: 'Academias', query: 'Prospectar academias em Florianópolis' },
    { label: 'Salões', query: 'Buscar salões de beleza em Curitiba' },
  ];

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: 'blur(8px)',
      y: 8,
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: 'spring' as const, stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: 'blur(8px)',
      y: -8,
      transition: {
        opacity: { duration: 0.15 },
        filter: { duration: 0.25 },
        y: { type: 'spring' as const, stiffness: 80, damping: 20 },
      },
    },
  };

  // Show loading state
  if (isSearching) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Buscando empresas...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Aguarde enquanto encontramos os melhores resultados
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show results
  if (searchResults.length > 0) {
    return (
      <ResultsTable
        results={searchResults}
        onNewSearch={() => {
          setSearchResults([]);
          setQuery('');
        }}
      />
    );
  }

  // Show search form (default)
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-6">
        
        {/* Logo + Title - Simples */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <h1 className="text-4xl font-bold" style={{ fontWeight: 700 }}>{'{ spec64 }'}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Encontre empresas e oportunidades em segundos
          </p>
        </div>

        {/* Error message with countdown */}
        {searchError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-destructive font-medium mb-1">
                  {rateLimitSeconds !== null ? '⏳ Rate Limit Atingido' : '❌ Erro na Busca'}
                </p>
                <p className="text-muted-foreground">
                  {searchError}
                </p>
              </div>
              {rateLimitSeconds !== null && rateLimitSeconds > 0 && (
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-2xl font-bold text-primary tabular-nums">
                    {rateLimitSeconds}s
                  </div>
                  <div className="text-xs text-muted-foreground">
                    aguarde
                  </div>
                </div>
              )}
            </div>
            {rateLimitSeconds !== null && rateLimitSeconds > 0 && (
              <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: rateLimitSeconds, ease: 'linear' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Animated Search Input */}
        <div ref={wrapperRef} onClick={() => setIsActive(true)}>
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex items-center gap-2 p-2 rounded-full bg-muted/50 border">
            {/* Settings Button */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full shrink-0 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                  }}
                >
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Configurações</h4>
                    
                    {/* Max Results */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Quantidade de resultados</label>
                      <div className="flex gap-2">
                        {[5, 10, 30, 50].map((value) => (
                          <Button
                            key={value}
                            type="button"
                            size="sm"
                            variant={maxResults === value ? 'default' : 'outline'}
                            className="flex-1 h-8"
                            onClick={() => setMaxResults(value)}
                          >
                            {value}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Radius */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Raio de busca (km)</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[10, 20, 30, 50, 100].map((value) => (
                          <Button
                            key={value}
                            type="button"
                            size="sm"
                            variant={radius === value ? 'default' : 'outline'}
                            className="h-8 text-xs"
                            onClick={() => setRadius(value)}
                          >
                            {value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="relative flex-1">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsActive(true)}
                disabled={createConversation.isPending}
                className="border-0 bg-transparent h-9 px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ position: 'relative', zIndex: 1 }}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !query && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ staggerChildren: 0.02 }}
                    >
                      {(PLACEHOLDERS[placeholderIndex] || '').split('').map((char, i) => (
                        <motion.span
                          key={i}
                          variants={letterVariants}
                          style={{ display: 'inline-block' }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Button
              type="submit"
              size="icon"
              disabled={!query.trim() || createConversation.isPending}
              className="h-9 w-9 rounded-full shrink-0"
            >
              {createConversation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
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
