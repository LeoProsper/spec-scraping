'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { useCreateConversation } from '@kit/kaix-scout/hooks';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Settings2, MapPin, Star, Phone, Globe, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@kit/ui/popover';
import type { GoogleMapsPlace } from '@kit/kaix-scout/types';

const PLACEHOLDERS = [
  'Buscar restaurantes em São Paulo...',
  'Encontrar hotéis no Rio de Janeiro...',
  'Prospectar academias em Curitiba...',
  'Listar salões de beleza em Porto Alegre...',
];

export function ChatWelcome() {
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const createConversation = useCreateConversation();
  const router = useRouter();

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
        throw new Error('Erro ao buscar empresas');
      }

      const data = await response.json();
      setSearchResults(data.places || []);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      setSearchError(error instanceof Error ? error.message : 'Erro desconhecido');
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
      <div className="flex-1 flex flex-col h-full">
        {/* Header with back button */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Resultados da busca</h2>
              <p className="text-sm text-muted-foreground">
                {searchResults.length} empresas encontradas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchResults([]);
                setQuery('');
              }}
            >
              Nova busca
            </Button>
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {searchResults.map((place, index) => (
              <div
                key={place.place_id || index}
                className="bg-card border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-base">{place.name}</h3>
                      {place.categories && place.categories.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {place.categories.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {place.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{place.rating}</span>
                          {place.reviews_count && (
                            <span className="text-muted-foreground">
                              ({place.reviews_count})
                            </span>
                          )}
                        </div>
                      )}

                      {place.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{place.phone}</span>
                        </div>
                      )}
                    </div>

                    {place.address && (
                      <div className="flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{place.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                      {place.link && (
                        <a
                          href={place.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver no Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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

        {/* Error message */}
        {searchError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            {searchError}
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
