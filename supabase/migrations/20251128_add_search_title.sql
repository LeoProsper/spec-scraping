-- Adicionar campo title à tabela searches
-- Data: 28/11/2025
-- Descrição: Adiciona campo para título automático das buscas e garante que a tabela existe

-- Criar tabela searches se não existir
CREATE TABLE IF NOT EXISTS searches (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  max_places INTEGER DEFAULT 5,
  lang TEXT DEFAULT 'pt',
  radius INTEGER,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  total_results INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Adicionar campo title se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'searches' AND column_name = 'title'
  ) THEN
    ALTER TABLE searches ADD COLUMN title TEXT NOT NULL DEFAULT 'Busca sem título';
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);

-- Atualizar títulos existentes (caso existam registros sem título)
UPDATE searches 
SET title = total_results || ' resultados - ' || SUBSTRING(query FROM 1 FOR 50)
WHERE title = 'Busca sem título' OR title IS NULL;

-- Habilitar RLS (Row Level Security)
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Users can view their own searches" ON searches;
CREATE POLICY "Users can view their own searches" ON searches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own searches" ON searches;
CREATE POLICY "Users can create their own searches" ON searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own searches" ON searches;
CREATE POLICY "Users can update their own searches" ON searches
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own searches" ON searches;
CREATE POLICY "Users can delete their own searches" ON searches
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários nas colunas
COMMENT ON COLUMN searches.id IS 'ID único gerado com nanoid';
COMMENT ON COLUMN searches.title IS 'Título automático (ex: "5 resultados - Restaurantes São Paulo")';
COMMENT ON COLUMN searches.query IS 'Query de busca original do usuário';
COMMENT ON COLUMN searches.total_results IS 'Número de resultados encontrados';
COMMENT ON COLUMN searches.status IS 'Status da busca: processing, completed ou error';
