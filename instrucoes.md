Prompt para Criação do Kaix Scout - SaaS de Prospecção Inteligente
Contexto do Projeto
Você é um desenvolvedor sênior especializado em Next.js, TypeScript, e arquitetura de SaaS. Sua missão é criar o Kaix Scout, um sistema de prospecção inteligente que identifica empresas por região, analisa a qualidade de seus websites e gera oportunidades de vendas para criação ou redesign de sites.
Stack Tecnológico Obrigatório

Frontend: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
UI Base: https://github.com/makerkit/nextjs-saas-starter-kit-lite
Scraping: Google Maps Scraper API (https://github.com/conor-is-my-name/google-maps-scraper)
Análise IA: Google Gemini Vision + Text API
Screenshot: Browserless ou API similar
Pagamento: Stripe (subscription + checkout)
Banco de Dados: PostgreSQL (Supabase ou similar)
Autenticação: NextAuth.js ou Supabase Auth

Arquitetura do Sistema
1. Integração com Google Maps Scraper API
Importante: NÃO usar Google Places API. Usar o scraper Docker disponível em:

GitHub: https://github.com/conor-is-my-name/google-maps-scraper
Endpoint: GET /scrape-get?query={query}&max_places={limit}&lang={lang}&headless=true

Formato de Resposta do Scraper:
json[
  {
    "name": "Nome da Empresa",
    "place_id": "0x549037bf4a7fd889:0x7091242f04ffff4f",
    "coordinates": {
      "latitude": 47.543005199999996,
      "longitude": -122.6300069
    },
    "address": "Endereço completo",
    "rating": 4,
    "reviews_count": 735,
    "categories": ["Hotel"],
    "website": "https://example.com",
    "phone": "3603294051",
    "link": "https://www.google.com/maps/place/..."
  }
]
2. Módulos e Funcionalidades
Módulo de Autenticação

Cadastro com email/senha
Login persistente
Recuperação de senha
Planos: Free (10 buscas/mês) e Premium (ilimitado + templates)

Módulo de Busca de Empresas
Interface de Busca:
typescriptinterface SearchParams {
  query: string; // Ex: "hotéis em São Paulo", "restaurantes em Lisboa"
  maxPlaces: number; // Limite de resultados (1-100)
  lang: string; // "pt", "en", etc.
  radius?: number; // Raio em km (opcional)
  category?: string; // Categoria específica (opcional)
}

interface CompanyData {
  id: string;
  searchId: string;
  placeId: string;
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  phone?: string;
  website?: string;
  rating?: number;
  reviewsCount?: number;
  categories: string[];
  googleMapsLink: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'error';
  createdAt: Date;
}
Fluxo de Busca:

Usuário insere query (cidade + tipo de negócio)
Sistema chama scraper API via fetch ou axios
Processa resultados em background
Salva no banco com status 'pending'
Retorna lista para dashboard

Módulo de Análise de Website
Interface de Análise:
typescriptinterface WebsiteAnalysis {
  id: string;
  companyId: string;
  hasWebsite: boolean;
  websiteUrl?: string;
  screenshotUrl?: string;
  htmlSnapshot?: string;
  
  // Análise técnica
  hasHttps: boolean;
  isResponsive: boolean;
  loadTime: number; // ms
  technologies: string[]; // WordPress, Wix, custom, etc.
  
  // Análise de IA
  aiReport: {
    defects: string[];
    strengths: string[];
    modernityLevel: number; // 0-10
    suggestions: string[];
    fullAnalysis: string;
  };
  
  // Lead Score
  score: number; // 0-10
  scoreCategory: 'ignore' | 'low' | 'medium' | 'hot';
  
  analyzedAt: Date;
}

interface ScoreRules {
  noWebsite: 10;
  noHttps: 7;
  notResponsive: 7;
  oldTechDetected: 6;
  slowPage: 6; // >3s
  outdatedDesign: 8;
}
```

**Fluxo de Análise**:
1. Para cada empresa com website:
   - Captura screenshot (via Browserless API)
   - Extrai HTML da homepage
   - Testa HTTPS, responsividade, velocidade
   - Detecta tecnologias usadas
2. Envia para Gemini Vision + Text com prompt:
```
Analise este website e forneça em JSON:
{
  "defects": ["lista de 5 principais problemas"],
  "strengths": ["lista de pontos fortes"],
  "modernityLevel": 7,
  "suggestions": ["sugestões específicas de melhoria"],
  "fullAnalysis": "análise detalhada em 2-3 parágrafos"
}

Calcula score baseado nas regras
Salva análise completa no banco

Módulo de Lead Scoring
Categorização Automática:
typescriptfunction calculateLeadScore(analysis: WebsiteAnalysis): number {
  let score = 0;
  
  if (!analysis.hasWebsite) score = 10;
  else {
    if (!analysis.hasHttps) score += 3;
    if (!analysis.isResponsive) score += 3;
    if (analysis.loadTime > 3000) score += 2;
    if (analysis.technologies.includes('old')) score += 2;
    score = Math.min(10, score + (10 - analysis.aiReport.modernityLevel));
  }
  
  return Math.round(score);
}

function getScoreCategory(score: number): string {
  if (score <= 3) return 'ignore';
  if (score <= 6) return 'medium';
  return 'hot'; // 7-10
}
Módulo de Geração de Templates (Premium)
Interface de Templates:
typescriptinterface TemplateGeneration {
  id: string;
  companyId: string;
  templates: {
    modern: {
      previewUrl: string;
      description: string;
      features: string[];
    };
    blacklane: {
      previewUrl: string;
      description: string;
      features: string[];
    };
    minimalist: {
      previewUrl: string;
      description: string;
      features: string[];
    };
  };
  generatedAt: Date;
}
Fluxo de Geração (apenas para score >= 7):

Coleta informações da empresa
Gera 3 mockups usando IA (Gemini + templates pré-definidos)
Cria página comparativa interativa
Salva URLs dos mockups

Módulo de Propostas
Interface de Proposta:
typescriptinterface Proposal {
  id: string;
  companyId: string;
  userId: string;
  selectedTemplate: 'modern' | 'blacklane' | 'minimalist';
  
  // Conteúdo da proposta
  beforeAfter: {
    before: string; // screenshot atual
    after: string; // mockup escolhido
  };
  
  pricing: {
    total: number;
    paymentMode: 'full' | 'split'; // 100% ou 50/50
    currency: string;
  };
  
  // Status
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'paid' | 'rejected';
  proposalUrl: string; // URL pública da proposta
  
  // Stripe
  stripeCheckoutId?: string;
  stripePaymentStatus?: string;
  
  sentAt?: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  createdAt: Date;
}
Módulo de Pagamento (Stripe)
Interface de Pagamento:
typescriptinterface Payment {
  id: string;
  proposalId: string;
  userId: string;
  
  amount: number;
  currency: string;
  paymentMode: 'full' | 'split';
  
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  
  paidAt?: Date;
  createdAt: Date;
}
Fluxo Stripe:

Criar Checkout Session
Redirecionar cliente para pagamento
Webhook recebe confirmação
Atualiza status da proposta
Dispara email de confirmação
Libera onboarding

Módulo de Onboarding (Pós-Pagamento)
Interface de Onboarding:
typescriptinterface OnboardingData {
  id: string;
  proposalId: string;
  
  // Dados do cliente
  businessName: string;
  logo?: string;
  photos: string[];
  businessInfo: {
    description: string;
    services: string[];
    hours: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  
  // Textos do site
  heroText: string;
  aboutText: string;
  servicesText: string;
  contactText: string;
  
  // Domínio
  domain?: string;
  dnsConfigured: boolean;
  
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date;
  createdAt: Date;
}
3. Estrutura do Banco de Dados
sql-- Users (usando Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free', -- 'free' | 'premium'
  stripe_customer_id TEXT,
  searches_count INT DEFAULT 0,
  searches_limit INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Searches
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  max_places INT DEFAULT 20,
  lang TEXT DEFAULT 'pt',
  radius INT,
  category TEXT,
  status TEXT DEFAULT 'processing', -- 'processing' | 'completed' | 'error'
  total_results INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  phone TEXT,
  website TEXT,
  rating DECIMAL,
  reviews_count INT,
  categories JSONB,
  google_maps_link TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'analyzing' | 'analyzed' | 'error'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Website Analysis
CREATE TABLE website_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  has_website BOOLEAN DEFAULT false,
  website_url TEXT,
  screenshot_url TEXT,
  html_snapshot TEXT,
  
  -- Technical analysis
  has_https BOOLEAN,
  is_responsive BOOLEAN,
  load_time INT,
  technologies JSONB,
  
  -- AI analysis
  ai_report JSONB,
  
  -- Score
  score INT CHECK (score BETWEEN 0 AND 10),
  score_category TEXT, -- 'ignore' | 'medium' | 'hot'
  
  analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Templates (Premium)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  modern_preview_url TEXT,
  blacklane_preview_url TEXT,
  minimalist_preview_url TEXT,
  comparison_page_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  selected_template TEXT,
  before_screenshot TEXT,
  after_mockup TEXT,
  pricing JSONB,
  status TEXT DEFAULT 'draft',
  proposal_url TEXT,
  stripe_checkout_id TEXT,
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_mode TEXT, -- 'full' | 'split'
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Onboarding
CREATE TABLE onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  business_data JSONB,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
4. API Endpoints (Next.js API Routes)
typescript// Auth
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/reset-password

// Search
POST /api/search/create
// Body: { query, maxPlaces, lang, radius?, category? }
// Returns: { searchId, status }

GET /api/search/[searchId]
// Returns: { search, companies[], progress }

GET /api/search/list
// Returns: { searches[] }

// Companies
GET /api/companies/[companyId]
// Returns: { company, analysis?, templates? }

GET /api/companies/search/[searchId]
// Returns: { companies[] }

// Analysis
POST /api/analysis/[companyId]/start
// Inicia análise de website

GET /api/analysis/[companyId]
// Returns: { analysis }

// Templates (Premium)
POST /api/templates/[companyId]/generate
// Gera 3 templates

GET /api/templates/[companyId]
// Returns: { templates }

// Proposals
POST /api/proposals/create
// Body: { companyId, selectedTemplate, pricing }

GET /api/proposals/[proposalId]
// Returns: { proposal }

GET /api/proposals/public/[proposalId]
// Página pública da proposta (sem auth)

PATCH /api/proposals/[proposalId]/status
// Body: { status }

// Payments
POST /api/payments/checkout
// Body: { proposalId }
// Returns: { checkoutUrl }

POST /api/payments/webhook
// Stripe webhook handler

// Onboarding
POST /api/onboarding/[proposalId]
// Body: { businessData }

GET /api/onboarding/[proposalId]
// Returns: { onboarding }

// Subscription (Stripe)
POST /api/subscription/create
// Body: { plan: 'premium' }

POST /api/subscription/cancel

POST /api/subscription/webhook
5. Interface do Dashboard
typescript// Dashboard Principal
interface DashboardProps {
  user: User;
  searches: Search[];
  stats: {
    totalSearches: number;
    totalCompanies: number;
    hotLeads: number;
    proposals: number;
  };
}

// Componentes:
- SearchForm: campo de busca + filtros
- SearchList: lista de buscas anteriores
- StatsCards: métricas em cards
- RecentCompanies: últimas empresas encontradas

// Página de Resultados da Busca
interface SearchResultsProps {
  search: Search;
  companies: Company[];
  filters: {
    hasWebsite: boolean | null;
    scoreMin: number;
    scoreCategory: string | null;
  };
}

// Componentes:
- FilterBar: filtros (sem site, score >= 7, categoria)
- CompanyCard: card com info + screenshot + score
- AnalysisButton: botão "Analisar site"
- BulkActions: ações em massa

// Página de Detalhes da Empresa
interface CompanyDetailProps {
  company: Company;
  analysis: WebsiteAnalysis | null;
  templates: TemplateGeneration | null;
  proposals: Proposal[];
}

// Componentes:
- CompanyHeader: nome, endereço, rating
- WebsitePreview: screenshot atual
- AnalysisReport: relatório IA + score
- TemplatesSection: 3 modelos (premium)
- ProposalActions: criar/enviar proposta

// Página de Proposta Pública
interface PublicProposalProps {
  proposal: Proposal;
  company: Company;
  templates: TemplateGeneration;
}

// Componentes:
- BeforeAfter: comparação visual
- TemplateShowcase: galeria dos 3 modelos
- PricingSection: valor + opções de pagamento
- StripeCheckoutButton: botão de pagamento

// Página de Onboarding
interface OnboardingProps {
  proposal: Proposal;
}

// Componentes:
- StepIndicator: progresso (1/5)
- BusinessInfoForm: dados da empresa
- LogoUpload: upload de logo
- PhotosUpload: galeria de fotos
- TextsForm: textos do site
- DomainSetup: configuração de domínio
```

### 6. Fluxo de Trabalho do Sistema
```
1. BUSCA
Usuario → Dashboard → Insere query → API Search
→ Chama Google Maps Scraper → Salva empresas → Retorna lista

2. ANÁLISE
Dashboard → Seleciona empresa → "Analisar site"
→ API Analysis → Screenshot + HTML → Gemini AI
→ Score calculado → Salva análise → Atualiza dashboard

3. TEMPLATES (Premium)
Empresa score >= 7 → "Gerar templates"
→ API Templates → Gemini gera 3 mockups
→ Salva previews → Mostra comparação

4. PROPOSTA
Usuario escolhe template → "Criar proposta"
→ API Proposal → Gera página pública
→ Usuario compartilha link → Cliente visualiza

5. PAGAMENTO
Cliente na proposta → "Aceitar e pagar"
→ Stripe Checkout → Pagamento → Webhook
→ Atualiza status → Email confirmação

6. ONBOARDING
Pagamento confirmado → Cliente recebe link
→ Preenche formulário → Upload arquivos
→ Sistema processa → Site entregue
7. Regras de Negócio Importantes

Rate Limiting:

Free: máx 1 busca/minuto
Premium: máx 5 buscas/minuto
Aviso sobre rate limit do Google Maps


Limites de Plano:

Free: 10 buscas/mês, 20 empresas/busca
Premium: ilimitado, 100 empresas/busca, templates


Análise Inteligente:

Só analisa empresas com website
Score 0-3: ignorar automaticamente
Score 7-10: destacar como "hot lead"


Geração de Templates:

Apenas para premium
Apenas para score >= 7
Máximo 10 gerações/dia


Segurança:

Propostas públicas acessíveis apenas com ID único
Webhook Stripe com validação de assinatura
Rate limiting em todas APIs



8. Próximos Passos de Implementação
MVP (Semana 1-2):

Setup do projeto Next.js + Makerkit
Integração com Google Maps Scraper
CRUD de buscas e empresas
Dashboard básico
Sistema de análise com Gemini
Cálculo de lead score

V1.0 (Semana 3-4):

Geração de templates (premium)
Sistema de propostas
Integração Stripe
Páginas públicas de proposta
Sistema de onboarding

V2.0 (Futuro):

Envio automático de propostas
WhatsApp Business integration
CRM interno
Multi-idiomas
Analytics avançado


Instruções Finais
Crie a estrutura completa do projeto seguindo:

Use TypeScript estrito
Implemente tratamento de erros robusto
Adicione logs detalhados
Crie testes para fluxos críticos
Documente todas APIs
Use variáveis de ambiente para secrets
Implemente caching quando apropriado
Otimize queries do banco
Adicione loading states em todas operações assíncronas
Crie mensagens de erro user-friendly

Foco na MVP primeiro: busca + análise + score + dashboard básico.