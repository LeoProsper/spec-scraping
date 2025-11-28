'use client';

import { useState, useRef, useEffect } from 'react';
import { useSendMessage } from '@kit/kaix-scout/hooks';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Send, Loader2, Paperclip, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInputProps {
  conversationId: string;
}

const PLACEHOLDERS = [
  'Buscar restaurantes em São Paulo...',
  'Encontrar hotéis no Rio de Janeiro...',
  'Prospectar academias em Curitiba...',
  'Listar salões de beleza em Porto Alegre...',
];

export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sendMutation = useSendMessage();

  // Cycle placeholder text
  useEffect(() => {
    if (isActive || message) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, message]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!message) setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [message]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim() || sendMutation.isPending) {
      return;
    }

    try {
      await sendMutation.mutateAsync({
        conversationId,
        content: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const containerVariants = {
    collapsed: {
      height: 56,
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 56,
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 },
    },
  };

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
    <div className="border-t p-4 bg-background">
      <motion.div
        ref={wrapperRef}
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        animate={isActive || message ? 'expanded' : 'collapsed'}
        initial="collapsed"
        onClick={() => setIsActive(true)}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 rounded-full bg-muted/50 border">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-accent transition-colors"
            title="Anexar arquivo"
            tabIndex={-1}
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="relative flex-1">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsActive(true)}
              disabled={sendMutation.isPending}
              className="border-0 bg-transparent h-9 px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ position: 'relative', zIndex: 1 }}
            />
            <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-2">
              <AnimatePresence mode="wait">
                {showPlaceholder && !isActive && !message && (
                  <motion.span
                    key={placeholderIndex}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ staggerChildren: 0.02 }}
                  >
                    {PLACEHOLDERS[placeholderIndex].split('').map((char, i) => (
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

          <button
            type="button"
            className="p-2 rounded-full hover:bg-accent transition-colors"
            title="Entrada de voz"
            tabIndex={-1}
          >
            <Mic className="h-4 w-4 text-muted-foreground" />
          </button>

          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            className="h-9 w-9 rounded-full shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
