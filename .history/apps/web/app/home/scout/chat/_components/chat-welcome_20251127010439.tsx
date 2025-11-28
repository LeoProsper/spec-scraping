'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { useCreateConversation } from '@kit/kaix-scout/hooks';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

    try {
      const result = await createConversation.mutateAsync({
        initial_message: finalQuery
      });
      router.push(`/home/scout/chat?c=${result.conversation.id}`);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
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

        {/* Animated Search Input */}
        <div ref={wrapperRef} onClick={() => setIsActive(true)}>
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex items-center gap-2 p-2 rounded-full bg-muted/50 border">
            <div className="relative flex-1 ml-2">
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
