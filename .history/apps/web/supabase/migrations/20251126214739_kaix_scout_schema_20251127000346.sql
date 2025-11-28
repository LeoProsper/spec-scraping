/*
 * -------------------------------------------------------
 * Kaix Scout - SaaS de Prospecção Inteligente
 * Schema para sistema de busca e análise de empresas
 * -------------------------------------------------------
 */

-- Extend accounts table with plan information
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium'));
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS searches_count INT DEFAULT 0;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS searches_limit INT DEFAULT 10;

COMMENT ON COLUMN public.accounts.plan IS 'User subscription plan: free or premium';
COMMENT ON COLUMN public.accounts.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.accounts.searches_count IS 'Number of searches performed in current period';
COMMENT ON COLUMN public.accounts.searches_limit IS 'Maximum searches allowed per period';

-- Searches table
CREATE TABLE IF NOT EXISTS public.searches (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  max_places INT DEFAULT 20 CHECK (max_places BETWEEN 1 AND 100),
  lang TEXT DEFAULT 'pt',
  radius INT,
  category TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  total_results INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.searches IS 'Search queries made by users for finding companies';
COMMENT ON COLUMN public.searches.query IS 'Search query (e.g., "hotéis em São Paulo")';
COMMENT ON COLUMN public.searches.max_places IS 'Maximum number of places to retrieve';
COMMENT ON COLUMN public.searches.status IS 'Search status: processing, completed, or error';

CREATE INDEX idx_searches_user_id ON public.searches(user_id);
CREATE INDEX idx_searches_status ON public.searches(status);
CREATE INDEX idx_searches_created_at ON public.searches(created_at DESC);

-- Enable RLS on searches
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own searches
CREATE POLICY searches_read ON public.searches 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Users can create their own searches
CREATE POLICY searches_insert ON public.searches 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Users can update their own searches
CREATE POLICY searches_update ON public.searches 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.searches TO authenticated, service_role;

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  search_id UUID NOT NULL REFERENCES public.searches(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  website TEXT,
  rating DECIMAL(2, 1),
  reviews_count INT,
  categories JSONB DEFAULT '[]'::jsonb,
  google_maps_link TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'analyzed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS 'Companies found through Google Maps searches';
COMMENT ON COLUMN public.companies.place_id IS 'Unique Google Maps place ID';
COMMENT ON COLUMN public.companies.status IS 'Analysis status: pending, analyzing, analyzed, or error';

CREATE UNIQUE INDEX idx_companies_place_id ON public.companies(place_id);
CREATE INDEX idx_companies_search_id ON public.companies(search_id);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_website ON public.companies(website) WHERE website IS NOT NULL;

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Users can see companies from their searches
CREATE POLICY companies_read ON public.companies 
  FOR SELECT 
  TO authenticated 
  USING (
    search_id IN (
      SELECT id FROM public.searches WHERE user_id = auth.uid()
    )
  );

-- Users can insert companies for their searches
CREATE POLICY companies_insert ON public.companies 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    search_id IN (
      SELECT id FROM public.searches WHERE user_id = auth.uid()
    )
  );

-- Users can update companies from their searches
CREATE POLICY companies_update ON public.companies 
  FOR UPDATE 
  TO authenticated 
  USING (
    search_id IN (
      SELECT id FROM public.searches WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated, service_role;

-- Website Analysis table
CREATE TABLE IF NOT EXISTS public.website_analysis (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  has_website BOOLEAN DEFAULT false,
  website_url TEXT,
  screenshot_url TEXT,
  html_snapshot TEXT,
  
  -- Technical analysis
  has_https BOOLEAN,
  is_responsive BOOLEAN,
  load_time INT, -- milliseconds
  technologies JSONB DEFAULT '[]'::jsonb,
  
  -- AI analysis
  ai_report JSONB DEFAULT '{}'::jsonb,
  
  -- Score
  score INT CHECK (score BETWEEN 0 AND 10),
  score_category TEXT CHECK (score_category IN ('ignore', 'low', 'medium', 'hot')),
  
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.website_analysis IS 'Technical and AI-powered analysis of company websites';
COMMENT ON COLUMN public.website_analysis.score IS 'Lead score from 0-10 based on website quality';
COMMENT ON COLUMN public.website_analysis.score_category IS 'Score category: ignore (0-3), low (4-5), medium (6), hot (7-10)';
COMMENT ON COLUMN public.website_analysis.ai_report IS 'JSON containing AI analysis: defects, strengths, modernityLevel, suggestions, fullAnalysis';

CREATE UNIQUE INDEX idx_website_analysis_company_id ON public.website_analysis(company_id);
CREATE INDEX idx_website_analysis_score ON public.website_analysis(score DESC);
CREATE INDEX idx_website_analysis_score_category ON public.website_analysis(score_category);

-- Enable RLS on website_analysis
ALTER TABLE public.website_analysis ENABLE ROW LEVEL SECURITY;

-- Users can see analysis from their companies
CREATE POLICY website_analysis_read ON public.website_analysis 
  FOR SELECT 
  TO authenticated 
  USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      INNER JOIN public.searches s ON c.search_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY website_analysis_insert ON public.website_analysis 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT c.id FROM public.companies c
      INNER JOIN public.searches s ON c.search_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY website_analysis_update ON public.website_analysis 
  FOR UPDATE 
  TO authenticated 
  USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      INNER JOIN public.searches s ON c.search_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.website_analysis TO authenticated, service_role;

-- Templates table (Premium feature)
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  modern_preview_url TEXT,
  modern_description TEXT,
  modern_features JSONB DEFAULT '[]'::jsonb,
  blacklane_preview_url TEXT,
  blacklane_description TEXT,
  blacklane_features JSONB DEFAULT '[]'::jsonb,
  minimalist_preview_url TEXT,
  minimalist_description TEXT,
  minimalist_features JSONB DEFAULT '[]'::jsonb,
  comparison_page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.templates IS 'Generated website templates for premium users';

CREATE UNIQUE INDEX idx_templates_company_id ON public.templates(company_id);

-- Enable RLS on templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_read ON public.templates 
  FOR SELECT 
  TO authenticated 
  USING (
    company_id IN (
      SELECT c.id FROM public.companies c
      INNER JOIN public.searches s ON c.search_id = s.id
      INNER JOIN public.accounts a ON s.user_id = a.id
      WHERE s.user_id = auth.uid() AND a.plan = 'premium'
    )
  );

CREATE POLICY templates_insert ON public.templates 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    company_id IN (
      SELECT c.id FROM public.companies c
      INNER JOIN public.searches s ON c.search_id = s.id
      INNER JOIN public.accounts a ON s.user_id = a.id
      WHERE s.user_id = auth.uid() AND a.plan = 'premium'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.templates TO authenticated, service_role;

-- Proposals table
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  selected_template TEXT CHECK (selected_template IN ('modern', 'blacklane', 'minimalist')),
  before_screenshot TEXT,
  after_mockup TEXT,
  pricing JSONB DEFAULT '{}'::jsonb, -- { total, paymentMode, currency }
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'paid', 'rejected')),
  proposal_url TEXT UNIQUE,
  stripe_checkout_id TEXT,
  stripe_payment_status TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.proposals IS 'Proposals sent to potential clients';
COMMENT ON COLUMN public.proposals.pricing IS 'JSON containing: total, paymentMode (full/split), currency';
COMMENT ON COLUMN public.proposals.proposal_url IS 'Unique public URL for the proposal';

CREATE INDEX idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_company_id ON public.proposals(company_id);
CREATE UNIQUE INDEX idx_proposals_url ON public.proposals(proposal_url) WHERE proposal_url IS NOT NULL;

-- Enable RLS on proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Users can see their own proposals
CREATE POLICY proposals_read ON public.proposals 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Public read for proposal URLs (no auth required)
CREATE POLICY proposals_public_read ON public.proposals 
  FOR SELECT 
  TO anon 
  USING (proposal_url IS NOT NULL);

CREATE POLICY proposals_insert ON public.proposals 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY proposals_update ON public.proposals 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.proposals TO authenticated, service_role;
GRANT SELECT ON public.proposals TO anon;

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_mode TEXT CHECK (payment_mode IN ('full', 'split')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Payment records for proposals';

CREATE INDEX idx_payments_proposal_id ON public.payments(proposal_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_stripe_session ON public.payments(stripe_session_id);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_read ON public.payments 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY payments_insert ON public.payments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated, service_role;

-- Onboarding table
CREATE TABLE IF NOT EXISTS public.onboarding (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  business_name TEXT,
  logo_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  business_info JSONB DEFAULT '{}'::jsonb, -- description, services, hours, socialMedia
  content JSONB DEFAULT '{}'::jsonb, -- heroText, aboutText, servicesText, contactText
  domain TEXT,
  dns_configured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.onboarding IS 'Client onboarding data after payment';
COMMENT ON COLUMN public.onboarding.business_info IS 'JSON with description, services[], hours, socialMedia{}';
COMMENT ON COLUMN public.onboarding.content IS 'JSON with heroText, aboutText, servicesText, contactText';

CREATE UNIQUE INDEX idx_onboarding_proposal_id ON public.onboarding(proposal_id);

-- Enable RLS on onboarding
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

-- Users can see onboarding from their proposals
CREATE POLICY onboarding_read ON public.onboarding 
  FOR SELECT 
  TO authenticated 
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  );

-- Public can access via proposal link
CREATE POLICY onboarding_public_read ON public.onboarding 
  FOR SELECT 
  TO anon 
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE proposal_url IS NOT NULL
    )
  );

CREATE POLICY onboarding_insert ON public.onboarding 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY onboarding_update ON public.onboarding 
  FOR UPDATE 
  TO authenticated 
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.onboarding TO authenticated, service_role;
GRANT SELECT ON public.onboarding TO anon;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION kit.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON public.companies 
  FOR EACH ROW 
  EXECUTE FUNCTION kit.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at 
  BEFORE UPDATE ON public.proposals 
  FOR EACH ROW 
  EXECUTE FUNCTION kit.update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at 
  BEFORE UPDATE ON public.onboarding 
  FOR EACH ROW 
  EXECUTE FUNCTION kit.update_updated_at_column();

-- Function to increment searches count
CREATE OR REPLACE FUNCTION kit.increment_searches_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.accounts 
  SET searches_count = searches_count + 1 
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER increment_searches_count_trigger 
  AFTER INSERT ON public.searches 
  FOR EACH ROW 
  EXECUTE FUNCTION kit.increment_searches_count();

-- View for dashboard stats
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  a.id as user_id,
  a.plan,
  a.searches_count,
  a.searches_limit,
  COUNT(DISTINCT s.id) as total_searches,
  COUNT(DISTINCT c.id) as total_companies,
  COUNT(DISTINCT CASE WHEN wa.score_category = 'hot' THEN c.id END) as hot_leads,
  COUNT(DISTINCT p.id) as total_proposals
FROM public.accounts a
LEFT JOIN public.searches s ON a.id = s.user_id
LEFT JOIN public.companies c ON s.id = c.search_id
LEFT JOIN public.website_analysis wa ON c.id = wa.company_id
LEFT JOIN public.proposals p ON a.id = p.user_id
GROUP BY a.id;

COMMENT ON VIEW public.user_stats IS 'Aggregated stats for user dashboard';
