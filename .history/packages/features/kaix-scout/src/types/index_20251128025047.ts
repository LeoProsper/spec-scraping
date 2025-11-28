/**
 * Kaix Scout - Type Definitions
 * Centralized type definitions for the entire application
 */

// ============================================================================
// Database Types (matching Supabase schema)
// ============================================================================

export type PlanType = 'free' | 'premium';
export type SearchStatus = 'processing' | 'completed' | 'error';
export type CompanyStatus = 'pending' | 'analyzing' | 'analyzed' | 'error';
export type ScoreCategory = 'ignore' | 'low' | 'medium' | 'hot';
export type TemplateType = 'modern' | 'blacklane' | 'minimalist';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'paid' | 'rejected';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMode = 'full' | 'split';
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';

// ============================================================================
// User & Account
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  picture_url?: string;
  plan: PlanType;
  stripe_customer_id?: string;
  searches_count: number;
  searches_limit: number;
  created_at: Date;
  updated_at?: Date;
}

export interface UserStats {
  user_id: string;
  plan: PlanType;
  searches_count: number;
  searches_limit: number;
  total_searches: number;
  total_companies: number;
  hot_leads: number;
  total_proposals: number;
}

// ============================================================================
// Search & Google Maps
// ============================================================================

export interface SearchParams {
  query: string;
  maxPlaces: number; // 1-100
  lang: string; // 'pt', 'en', etc.
  radius?: number; // km
  category?: string;
}

export interface Search {
  id: string;
  user_id: string;
  title: string; // Título automático gerado (ex: "5 resultados - Restaurantes São Paulo")
  query: string;
  max_places: number;
  lang: string;
  radius?: number;
  category?: string;
  status: SearchStatus;
  total_results: number;
  error_message?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface CreateSearchInput {
  query: string;
  maxPlaces?: number;
  lang?: string;
  radius?: number;
  category?: string;
}

// ============================================================================
// Google Maps Scraper Response
// ============================================================================

export interface GoogleMapsPlace {
  name: string;
  place_id: string;
  cid?: string;
  cnpj?: string; // CNPJ da empresa (14 dígitos)
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  rating?: number;
  reviews_count?: number;
  rating_distribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categories: string[];
  website?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  link: string;
  description?: string;
  opening_hours?: string;
  plus_code?: string;
  images?: string[];
  about?: string;
  price_level?: number;
  accessibility?: string[];
  amenities?: string[];
  service_options?: string[];
  popular_times?: any;
  top_reviews?: {
    author: string;
    rating: string | number;
    text: string;
    time: string;
  }[];
  menu_url?: string;
}

export interface ScraperResponse {
  places: GoogleMapsPlace[];
  total: number;
}

// ============================================================================
// Company
// ============================================================================

export interface Company {
  id: string;
  search_id: string;
  place_id: string;
  cid?: string;
  cnpj?: string; // CNPJ da empresa (14 dígitos)
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  categories: string[];
  google_maps_link: string;
  status: CompanyStatus;
  opening_hours?: string;
  plus_code?: string;
  about?: string;
  price_level?: number;
  images?: string[];
  accessibility?: string[];
  amenities?: string[];
  service_options?: string[];
  popular_times?: any;
  top_reviews?: {
    author: string;
    rating: string | number;
    text: string;
    time: string;
  }[];
  menu_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCompanyInput {
  search_id: string;
  place_id: string;
  cid?: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  categories: string[];
  google_maps_link: string;
  opening_hours?: string;
  plus_code?: string;
  about?: string;
  price_level?: number;
  images?: string[];
  accessibility?: string[];
  amenities?: string[];
  service_options?: string[];
  popular_times?: any;
  top_reviews?: {
    author: string;
    rating: string | number;
    text: string;
    time: string;
  }[];
  menu_url?: string;
}

// ============================================================================
// Website Analysis
// ============================================================================

export interface AIReport {
  defects: string[];
  strengths: string[];
  modernityLevel: number; // 0-10
  suggestions: string[];
  fullAnalysis: string;
}

export interface WebsiteAnalysis {
  id: string;
  company_id: string;
  has_website: boolean;
  website_url?: string;
  screenshot_url?: string;
  html_snapshot?: string;
  
  // Technical analysis
  has_https: boolean;
  is_responsive: boolean;
  load_time: number; // ms
  technologies: string[];
  
  // AI analysis
  ai_report: AIReport;
  
  // Score
  score: number; // 0-10
  score_category: ScoreCategory;
  
  analyzed_at: Date;
  created_at: Date;
}

export interface CreateAnalysisInput {
  company_id: string;
  has_website: boolean;
  website_url?: string;
  screenshot_url?: string;
  html_snapshot?: string;
  has_https: boolean;
  is_responsive: boolean;
  load_time: number;
  technologies: string[];
  ai_report: AIReport;
  score: number;
  score_category: ScoreCategory;
}

// ============================================================================
// Score Rules
// ============================================================================

export interface ScoreRules {
  noWebsite: number;
  noHttps: number;
  notResponsive: number;
  oldTechDetected: number;
  slowPage: number; // >3s
  outdatedDesign: number;
}

export const DEFAULT_SCORE_RULES: ScoreRules = {
  noWebsite: 10,
  noHttps: 7,
  notResponsive: 7,
  oldTechDetected: 6,
  slowPage: 6,
  outdatedDesign: 8,
};

// ============================================================================
// Templates (Premium)
// ============================================================================

export interface TemplateVariant {
  previewUrl: string;
  description: string;
  features: string[];
}

export interface Templates {
  id: string;
  company_id: string;
  modern_preview_url: string;
  modern_description: string;
  modern_features: string[];
  blacklane_preview_url: string;
  blacklane_description: string;
  blacklane_features: string[];
  minimalist_preview_url: string;
  minimalist_description: string;
  minimalist_features: string[];
  comparison_page_url: string;
  created_at: Date;
}

export interface GenerateTemplatesInput {
  company_id: string;
  company_name: string;
  company_info: {
    address: string;
    categories: string[];
    current_website?: string;
    analysis?: WebsiteAnalysis;
  };
}

// ============================================================================
// Proposal
// ============================================================================

export interface ProposalPricing {
  total: number;
  paymentMode: PaymentMode;
  currency: string;
}

export interface Proposal {
  id: string;
  company_id: string;
  user_id: string;
  selected_template: TemplateType;
  before_screenshot: string;
  after_mockup: string;
  pricing: ProposalPricing;
  status: ProposalStatus;
  proposal_url: string;
  stripe_checkout_id?: string;
  stripe_payment_status?: string;
  sent_at?: Date;
  viewed_at?: Date;
  responded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProposalInput {
  company_id: string;
  selected_template: TemplateType;
  pricing: ProposalPricing;
}

export interface ProposalWithDetails extends Proposal {
  company: Company;
  templates: Templates;
  analysis?: WebsiteAnalysis;
}

// ============================================================================
// Payment
// ============================================================================

export interface Payment {
  id: string;
  proposal_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_mode: PaymentMode;
  stripe_session_id: string;
  stripe_payment_intent_id?: string;
  status: PaymentStatus;
  paid_at?: Date;
  created_at: Date;
}

export interface CreateCheckoutInput {
  proposal_id: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

// ============================================================================
// Onboarding
// ============================================================================

export interface BusinessInfo {
  description: string;
  services: string[];
  hours: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface OnboardingContent {
  heroText: string;
  aboutText: string;
  servicesText: string;
  contactText: string;
}

export interface Onboarding {
  id: string;
  proposal_id: string;
  business_name: string;
  logo_url?: string;
  photos: string[];
  business_info: BusinessInfo;
  content: OnboardingContent;
  domain?: string;
  dns_configured: boolean;
  status: OnboardingStatus;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOnboardingInput {
  proposal_id: string;
  business_name: string;
  logo_url?: string;
  photos?: string[];
  business_info: BusinessInfo;
  content: OnboardingContent;
  domain?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SearchProgress {
  search: Search;
  companies: Company[];
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface CompanyFilters {
  hasWebsite?: boolean | null;
  scoreMin?: number;
  scoreCategory?: ScoreCategory | null;
  categories?: string[];
  minRating?: number;
}

export interface SearchFilters {
  status?: SearchStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalSearches: number;
  totalCompanies: number;
  hotLeads: number;
  totalProposals: number;
  searchesRemaining: number;
  conversionRate: number; // proposals / hot leads
}

export interface RecentActivity {
  type: 'search' | 'analysis' | 'proposal' | 'payment';
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Rate Limiting
// ============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

export interface RateLimitConfig {
  free: {
    searchesPerMinute: number;
    searchesPerMonth: number;
    maxPlaces: number;
  };
  premium: {
    searchesPerMinute: number;
    searchesPerMonth: number;
    maxPlaces: number;
    templatesPerDay: number;
  };
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  free: {
    searchesPerMinute: 1,
    searchesPerMonth: 10,
    maxPlaces: 20,
  },
  premium: {
    searchesPerMinute: 5,
    searchesPerMonth: -1, // unlimited
    maxPlaces: 100,
    templatesPerDay: 10,
  },
};

// ============================================================================
// Webhook Types (Stripe)
// ============================================================================

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      customer?: string;
      payment_intent?: string;
      amount_total?: number;
      currency?: string;
      metadata?: Record<string, string>;
    };
  };
}

// ============================================================================
// Conversational System Types
// ============================================================================

export * from './conversation.types';
