'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, Target, Zap } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface AnimatedHeroProps {
  onGenerateClick: () => void;
  loading?: boolean;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function AnimatedHero({ 
  onGenerateClick, 
  loading = false,
  selectedCategory = 'all',
  onCategoryChange 
}: AnimatedHeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ['vendáveis', 'urgentes', 'qualificadas', 'rentáveis', 'estratégicas'],
    []
  );

  const categories = useMemo(() => [
    { id: 'all', name: 'Todas', icon: '🎲' },
    { id: 'web-digital', name: 'Web & Digital', icon: '💻' },
    { id: 'seo', name: 'SEO', icon: '🔍' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
    { id: 'saas', name: 'SaaS', icon: '☁️' },
  ], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full py-12">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex gap-6 items-center justify-center flex-col">
          {/* Badge Superior */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">Gerador de Oportunidades B2B</span>
            </div>
          </motion.div>

          {/* Título Principal com Animação */}
          <div className="flex gap-3 flex-col">
            <h1 className="text-3xl md:text-4xl max-w-3xl tracking-tight text-center font-bold">
              <span className="text-foreground">Descubra empresas com dores</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-2 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: -100 }}
                    transition={{ type: 'spring', stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <motion.p 
              className="text-sm md:text-base leading-relaxed text-muted-foreground max-w-2xl text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Gere prompts estratégicos de prospecção usando IA. Identifique empresas com necessidades específicas.
            </motion.p>
          </div>

          {/* Filtros de Categoria */}
          <motion.div 
            className="flex flex-wrap gap-2 justify-center max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange?.(cat.id)}
                className="h-8 text-xs transition-all hover:scale-105"
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </motion.div>

          {/* CTA Principal */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              size="default" 
              className="gap-2 px-6 shadow-lg hover:shadow-xl transition-all"
              onClick={onGenerateClick}
              disabled={loading}
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Gerando...' : 'Gerar Oportunidade'}
            </Button>
            <Button 
              size="default" 
              variant="outline"
              className="gap-2 px-6"
              onClick={() => {
                const historySection = document.getElementById('history-section');
                historySection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Target className="w-4 h-4" />
              Ver Histórico
            </Button>
          </motion.div>

          {/* Stats Cards - Compacto */}
          <motion.div 
            className="grid grid-cols-3 gap-4 w-full max-w-2xl mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">12+</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Nichos B2B
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">100%</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Otimizado IA
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">∞</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Ilimitado
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
