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
    <div className="w-full min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="container mx-auto px-6">
        <div className="flex gap-12 py-20 items-center justify-center flex-col">
          {/* Badge Superior */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Gerador de Oportunidades B2B</span>
            </div>
          </motion.div>

          {/* Título Principal com Animação */}
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl lg:text-8xl max-w-5xl tracking-tighter text-center font-bold">
              <span className="text-foreground">Descubra empresas com dores</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
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
              className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-3xl text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Gere prompts estratégicos de prospecção usando IA. Identifique empresas com necessidades específicas e transforme dados em oportunidades reais de negócio.
            </motion.p>
          </div>

          {/* Filtros de Categoria */}
          <motion.div 
            className="flex flex-wrap gap-2 justify-center max-w-3xl"
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
                className="h-9 transition-all hover:scale-105"
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </motion.div>

          {/* CTA Principal */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              size="lg" 
              className="gap-3 px-8 text-base h-14 shadow-lg hover:shadow-xl transition-all"
              onClick={onGenerateClick}
              disabled={loading}
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'Gerando...' : 'Gerar Oportunidade'}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-3 px-8 text-base h-14"
              onClick={() => {
                // Scroll para o histórico ou instruções
                const historySection = document.getElementById('history-section');
                historySection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Target className="w-5 h-5" />
              Ver Histórico
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">12+</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Categorias de nichos B2B
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">100%</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Prompts otimizados para IA
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">∞</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Oportunidades ilimitadas
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
