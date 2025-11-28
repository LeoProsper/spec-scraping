-- Adicionar campo para armazenar resultados da busca
ALTER TABLE searches ADD COLUMN IF NOT EXISTS results JSONB DEFAULT '[]'::jsonb;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_searches_results ON searches USING gin (results);

-- Comentário
COMMENT ON COLUMN searches.results IS 'Armazena os resultados completos da busca para acesso posterior';
