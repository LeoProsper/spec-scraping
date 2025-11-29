-- Migration: Add Receita Federal enrichment fields to companies table
-- Data: 28/11/2025
-- Descrição: Adiciona campos de dados públicos da Receita Federal obtidos via API

-- Dados básicos da Receita
ALTER TABLE companies ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS situacao_cadastral TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_situacao_cadastral DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_inicio_atividade DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS matriz_filial TEXT;

-- Classificação
ALTER TABLE companies ADD COLUMN IF NOT EXISTS natureza_juridica TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS porte_empresa TEXT;

-- CNAE
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnae_principal TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnaes_secundarios JSONB DEFAULT '[]'::jsonb;

-- Financeiro
ALTER TABLE companies ADD COLUMN IF NOT EXISTS capital_social TEXT;

-- Regime tributário
ALTER TABLE companies ADD COLUMN IF NOT EXISTS opcao_simples TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_opcao_simples DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS opcao_mei TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_opcao_mei DATE;

-- Quadro Societário (JSONB)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qsa JSONB DEFAULT '[]'::jsonb;

-- Endereço da Receita
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_logradouro TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_numero TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_complemento TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_bairro TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_cep TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_municipio TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_uf TEXT;

-- Contato da Receita
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_telefones JSONB DEFAULT '[]'::jsonb;

-- Metadata
ALTER TABLE companies ADD COLUMN IF NOT EXISTS receita_fetched_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN companies.razao_social IS 'Razão social cadastrada na Receita Federal';
COMMENT ON COLUMN companies.nome_fantasia IS 'Nome fantasia cadastrado na Receita Federal';
COMMENT ON COLUMN companies.situacao_cadastral IS 'Situação cadastral (Ativa, Baixada, Suspensa, etc)';
COMMENT ON COLUMN companies.data_situacao_cadastral IS 'Data da situação cadastral';
COMMENT ON COLUMN companies.data_inicio_atividade IS 'Data de início de atividade';
COMMENT ON COLUMN companies.matriz_filial IS 'Tipo: Matriz ou Filial';
COMMENT ON COLUMN companies.natureza_juridica IS 'Natureza jurídica da empresa';
COMMENT ON COLUMN companies.porte_empresa IS 'Porte da empresa (ME, EPP, Demais)';
COMMENT ON COLUMN companies.cnae_principal IS 'Código CNAE da atividade principal';
COMMENT ON COLUMN companies.cnaes_secundarios IS 'Array de códigos CNAE das atividades secundárias';
COMMENT ON COLUMN companies.capital_social IS 'Valor do capital social';
COMMENT ON COLUMN companies.opcao_simples IS 'Optante pelo Simples Nacional (S/N)';
COMMENT ON COLUMN companies.data_opcao_simples IS 'Data da opção pelo Simples Nacional';
COMMENT ON COLUMN companies.opcao_mei IS 'É Microempreendedor Individual (S/N)';
COMMENT ON COLUMN companies.data_opcao_mei IS 'Data da opção pelo MEI';
COMMENT ON COLUMN companies.qsa IS 'Quadro de Sócios e Administradores (JSON)';
COMMENT ON COLUMN companies.receita_logradouro IS 'Logradouro cadastrado na Receita';
COMMENT ON COLUMN companies.receita_numero IS 'Número do endereço na Receita';
COMMENT ON COLUMN companies.receita_complemento IS 'Complemento do endereço na Receita';
COMMENT ON COLUMN companies.receita_bairro IS 'Bairro cadastrado na Receita';
COMMENT ON COLUMN companies.receita_cep IS 'CEP cadastrado na Receita';
COMMENT ON COLUMN companies.receita_municipio IS 'Município cadastrado na Receita';
COMMENT ON COLUMN companies.receita_uf IS 'UF cadastrada na Receita';
COMMENT ON COLUMN companies.receita_email IS 'Email cadastrado na Receita Federal';
COMMENT ON COLUMN companies.receita_telefones IS 'Telefones cadastrados na Receita (JSON)';
COMMENT ON COLUMN companies.receita_fetched_at IS 'Data/hora do enriquecimento com dados da Receita';

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_companies_razao_social ON companies(razao_social) WHERE razao_social IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_situacao_cadastral ON companies(situacao_cadastral) WHERE situacao_cadastral IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_porte_empresa ON companies(porte_empresa) WHERE porte_empresa IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_opcao_simples ON companies(opcao_simples) WHERE opcao_simples IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_opcao_mei ON companies(opcao_mei) WHERE opcao_mei IS NOT NULL;

-- Índices GIN para busca nos arrays JSONB
CREATE INDEX IF NOT EXISTS idx_companies_cnaes_secundarios ON companies USING gin (cnaes_secundarios);
CREATE INDEX IF NOT EXISTS idx_companies_qsa ON companies USING gin (qsa);
CREATE INDEX IF NOT EXISTS idx_companies_receita_telefones ON companies USING gin (receita_telefones);

-- View para empresas com dados completos da Receita
CREATE OR REPLACE VIEW companies_with_receita AS
SELECT 
  id,
  name,
  cnpj,
  razao_social,
  nome_fantasia,
  situacao_cadastral,
  porte_empresa,
  capital_social,
  opcao_simples,
  opcao_mei,
  jsonb_array_length(COALESCE(qsa, '[]'::jsonb)) as total_socios,
  receita_fetched_at,
  created_at
FROM companies
WHERE razao_social IS NOT NULL
ORDER BY receita_fetched_at DESC NULLS LAST;

COMMENT ON VIEW companies_with_receita IS 'Empresas com dados enriquecidos da Receita Federal';
