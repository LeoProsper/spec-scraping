Prompt de Instrução - Sistema Conversacional Kaix Scout
Contexto
Você é um desenvolvedor sênior especializado em Next.js 15, TypeScript, React e Supabase. Sua missão é transformar o sistema Kaix Scout de um dashboard tradicional em uma interface conversacional estilo ChatGPT/Claude/Gemini.
Objetivo
Implementar um sistema completo de chat conversacional onde usuários podem:

Conversar naturalmente com uma IA para fazer buscas
Manter múltiplas conversas em abas
Ver histórico de conversas na sidebar
Refinar buscas através de mensagens
Ver resultados inline no chat

Stack Tecnológico Atual

Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
Backend: Supabase PostgreSQL (local Docker)
UI: Shadcn UI + Radix UI
State: @tanstack/react-query
Projeto: Monorepo Turborepo com pnpm

Arquitetura do Sistema Conversacional
1. Estrutura de Dados
Novas Tabelas no Banco de Dados
Crie uma nova migration: apps/web/supabase/migrations/[timestamp]_conversational_system.sql
sql-- ============================================
-- CONVERSATIONAL SYSTEM SCHEMA
-- ============================================

-- Conversations (múltiplas conversas por usuário)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Metadata
  title TEXT NOT NULL, -- "Restaurantes em São Paulo"
  description TEXT, -- resumo automático
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- Stats
  messages_count INT DEFAULT 0,
  searches_count INT DEFAULT 0,
  total_results INT DEFAULT 0,
  
  -- Timestamps
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages (mensagens do chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  -- Message data
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Estrutura metadata:
  -- {
  --   "search_id": "uuid",
  --   "results_count": 20,
  --   "quick_actions": ["Ver resultados", "Refinar"],
  --   "search_params": {...},
  --   "analysis_summary": {...}
  -- }
  
  -- UI State
  is_streaming BOOLEAN DEFAULT false,
  is_error BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation-Search Link (relaciona conversas com buscas)
CREATE TABLE public.conversation_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  search_id UUID NOT NULL REFERENCES public.searches(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  
  -- Context
  user_query TEXT NOT NULL, -- query original do usuário
  refined_query TEXT, -- query refinada pela IA
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(conversation_id, search_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_conversations_user ON public.conversations(user_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);
CREATE INDEX idx_messages_role ON public.messages(role);

CREATE INDEX idx_conversation_searches_conversation ON public.conversation_searches(conversation_id);
CREATE INDEX idx_conversation_searches_search ON public.conversation_searches(search_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_searches ENABLE ROW LEVEL SECURITY;

-- Conversations: usuários podem CRUD suas próprias conversas
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: usuários podem ver/criar mensagens de suas conversas
CREATE POLICY "Users can view messages of own conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Conversation-Search: link entre conversas e buscas
CREATE POLICY "Users can view own conversation searches" ON public.conversation_searches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_searches.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own conversation searches" ON public.conversation_searches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_searches.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Atualizar contador de mensagens
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.conversations
    SET 
      messages_count = messages_count + 1,
      last_message_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.conversations
    SET messages_count = messages_count - 1
    WHERE id = OLD.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

CREATE TRIGGER on_message_deleted
  AFTER DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Function: Atualizar contador de buscas
CREATE OR REPLACE FUNCTION update_conversation_search_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.conversations
    SET searches_count = searches_count + 1
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_conversation_search_created
  AFTER INSERT ON public.conversation_searches
  FOR EACH ROW EXECUTE FUNCTION update_conversation_search_count();

-- Function: Gerar título automático da conversa
CREATE OR REPLACE FUNCTION generate_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NULL OR NEW.title = '' THEN
    NEW.title := 'Nova Conversa ' || to_char(NOW(), 'DD/MM/YYYY HH24:MI');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_conversation_title
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION generate_conversation_title();
2. Tipos TypeScript
Crie: packages/features/kaix-scout/src/types/conversation.types.ts
typescriptexport interface Conversation {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'active' | 'archived' | 'deleted'
  messages_count: number
  searches_count: number
  total_results: number
  last_message_at: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: MessageMetadata
  is_streaming: boolean
  is_error: boolean
  created_at: string
}

export interface MessageMetadata {
  search_id?: string
  results_count?: number
  quick_actions?: string[]
  search_params?: {
    query: string
    maxPlaces: number
    lang: string
  }
  analysis_summary?: {
    hot_leads: number
    medium_leads: number
    low_leads: number
  }
  error?: {
    message: string
    code: string
  }
}

export interface ConversationSearch {
  id: string
  conversation_id: string
  search_id: string
  message_id?: string
  user_query: string
  refined_query?: string
  created_at: string
}

export interface CreateConversationInput {
  title?: string
  initial_message?: string
}

export interface SendMessageInput {
  conversation_id: string
  content: string
  role?: 'user' | 'system'
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
  searches: ConversationSearch[]
}
3. API Routes
3.1 POST /api/conversations/create
Crie: apps/web/app/api/conversations/create/route.ts
typescriptimport { createRouteClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { title, initial_message } = body

    // Criar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: session.user.id,
        title: title || undefined,
      })
      .select()
      .single()

    if (convError) throw convError

    // Se tem mensagem inicial, criar
    if (initial_message) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: initial_message,
        })

      if (msgError) throw msgError

      // Criar resposta da IA
      const assistantMessage = generateWelcomeMessage()
      
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantMessage,
          metadata: {
            quick_actions: ['Buscar empresas', 'Ver exemplos']
          }
        })
    } else {
      // Mensagem de boas-vindas padrão
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: 'Olá! 👋 Quais empresas você quer prospectar hoje?\n\nPosso buscar por:\n• Tipo de negócio (ex: restaurantes, hotéis)\n• Cidade ou região\n• Raio de busca\n• Quantidade de resultados',
          metadata: {
            quick_actions: ['Buscar empresas', 'Ver exemplos']
          }
        })
    }

    return NextResponse.json({ 
      success: true, 
      conversation 
    })

  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conversa' },
      { status: 500 }
    )
  }
}

function generateWelcomeMessage(): string {
  return `Olá! 👋 Vou te ajudar a encontrar as melhores oportunidades de negócio.

**Como posso ajudar?**

Você pode me dizer coisas como:
- "Buscar restaurantes em São Paulo"
- "Encontre hotéis em Florianópolis no raio de 10km"
- "Quero prospectar padarias no Rio de Janeiro"

**O que você quer buscar hoje?**`
}
3.2 POST /api/conversations/[conversationId]/messages
Crie: apps/web/app/api/conversations/[conversationId]/messages/route.ts
typescriptimport { createRouteClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createRouteClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { conversationId } = params
    const body = await req.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    // Verificar se conversa pertence ao usuário
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', session.user.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Criar mensagem do usuário
    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: content.trim(),
      })
      .select()
      .single()

    if (userMsgError) throw userMsgError

    // Processar com IA e criar busca se necessário
    const aiResponse = await processUserMessage(content, conversationId, session.user.id, supabase)

    // Criar mensagem da IA
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.metadata,
      })
      .select()
      .single()

    if (assistantMsgError) throw assistantMsgError

    return NextResponse.json({ 
      success: true,
      user_message: userMessage,
      assistant_message: assistantMessage
    })

  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}

async function processUserMessage(
  content: string,
  conversationId: string,
  userId: string,
  supabase: any
): Promise<{ content: string; metadata: any }> {
  // Parser simples de intenção
  const intent = parseUserIntent(content)

  if (intent.type === 'search') {
    // Criar busca
    const { data: search } = await supabase
      .from('searches')
      .insert({
        user_id: userId,
        query: intent.query,
        max_places: intent.maxPlaces || 20,
        lang: intent.lang || 'pt',
        status: 'processing'
      })
      .select()
      .single()

    // Link conversa → busca
    await supabase
      .from('conversation_searches')
      .insert({
        conversation_id: conversationId,
        search_id: search.id,
        user_query: content,
        refined_query: intent.query
      })

    // Processar busca em background (chamar Google Maps Scraper)
    processSearchInBackground(search.id, intent)

    return {
      content: `🔍 Perfeito! Vou buscar **${intent.query}**.

**Configuração:**
- Quantidade: ${intent.maxPlaces} resultados
- Região: ${intent.location || 'Ampla'}
- Raio: ${intent.radius || 'Toda cidade'}

⏳ Processando busca...`,
      metadata: {
        search_id: search.id,
        search_params: {
          query: intent.query,
          maxPlaces: intent.maxPlaces,
          lang: intent.lang
        },
        quick_actions: ['Ver progresso', 'Cancelar busca']
      }
    }
  }

  // Resposta padrão se não entendeu
  return {
    content: `Desculpe, não entendi completamente. 

Você pode me dizer algo como:
- "Buscar restaurantes em São Paulo"
- "Encontre 50 hotéis em Florianópolis"
- "Padarias no Rio de Janeiro"

**O que você gostaria de buscar?**`,
    metadata: {
      quick_actions: ['Ver exemplos', 'Ajuda']
    }
  }
}

function parseUserIntent(content: string): any {
  const lower = content.toLowerCase()
  
  // Detectar tipo de negócio
  const businessTypes = ['restaurante', 'hotel', 'padaria', 'salão', 'oficina', 'loja', 'mercado']
  const businessType = businessTypes.find(t => lower.includes(t))
  
  // Detectar cidade
  const cities = ['são paulo', 'rio de janeiro', 'florianópolis', 'curitiba', 'porto alegre']
  const city = cities.find(c => lower.includes(c))
  
  // Detectar quantidade
  const numberMatch = content.match(/(\d+)/g)
  const maxPlaces = numberMatch ? parseInt(numberMatch[0]) : 20
  
  // Detectar raio
  const radiusMatch = lower.match(/(\d+)\s*k?m/)
  const radius = radiusMatch ? parseInt(radiusMatch[1]) : undefined

  if (businessType && city) {
    return {
      type: 'search',
      query: `${businessType}s em ${city}`,
      location: city,
      maxPlaces,
      radius,
      lang: 'pt'
    }
  }

  return { type: 'unknown' }
}

async function processSearchInBackground(searchId: string, intent: any) {
  // TODO: Implementar chamada ao Google Maps Scraper
  // Por enquanto, usar mock
  console.log('Processing search:', searchId, intent)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createRouteClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { conversationId } = params

    // Buscar mensagens
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages })

  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}
3.3 GET /api/conversations/list
Crie: apps/web/app/api/conversations/list/route.ts
typescriptimport { createRouteClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', status)
      .order('last_message_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ conversations })

  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar conversas' },
      { status: 500 }
    )
  }
}
3.4 GET /api/conversations/[conversationId]
Crie: apps/web/app/api/conversations/[conversationId]/route.ts
typescriptimport { createRouteClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createRouteClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { conversationId } = params

    // Buscar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', session.user.id)
      .single()

    if (convError) throw convError
    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Buscar mensagens
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) throw msgError

    // Buscar buscas relacionadas
    const { data: searches, error: searchError } = await supabase
      .from('conversation_searches')
      .select('*, searches(*)')
      .eq('conversation_id', conversationId)

    if (searchError) throw searchError

    return NextResponse.json({
      conversation: {
        ...conversation,
        messages,
        searches
      }
    })

  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar conversa' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createRouteClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { conversationId } = params

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar conversa' },
      { status: 500 }
    )
  }
}
4. Hooks React Query
Crie: packages/features/kaix-scout/src/hooks/use-conversations.ts
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Conversation, 
  Message, 
  ConversationWithMessages,
  CreateConversationInput,
  SendMessageInput 
} from '../types/conversation.types'

// Create conversation
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateConversationInput) => {
      const res = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      if (!res.ok) throw new Error('Erro ao criar conversa')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })
}

// List conversations
export function useConversations(status: string = 'active') {
  return useQuery({
    queryKey: ['conversations', status],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/list?status=${status}`)
      if (!res.ok) throw new Error('Erro ao buscar conversas')
      const data = await res.json()
      return data.conversations as Conversation[]
    }
  })
}

// Get single conversation with messages
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const res = await fetch(`/api/conversations/${conversationId}`)
      if (!res.ok) throw new Error('Erro ao buscar conversa')
      const data = await res.json()
      return data.conversation as ConversationWithMessages
    },
    enabled: !!conversationId,
    refetchInterval: 3000 // Auto-refresh a cada 3s
  })
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversation_id, content }: SendMessageInput) => {
      const res = await fetch(`/api/conversations/${conversation_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!res.ok) throw new Error('Erro ao enviar mensagem')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['conversation', variables.conversation_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['conversations'] 
      })
    }
  })
}

// Delete conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Erro ao deletar conversa')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })
}
5. Componentes da Interface
5.1 Layout Conversacional
Crie: apps/web/app/home/scout/chat/layout.tsx
typescript'use client'

import { useState } from 'react'
import { ConversationSidebar } from './_components/conversation-sidebar'
import { Button } from '@kit/ui/button'
import { PanelLeftClose, PanelLeft } from 'lucide-react'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 border-r bg-background flex-shrink-0">
          <ConversationSidebar />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Toggle Sidebar Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>

        {children}
      </div>
    </div>
  )
}
5.2 Sidebar de Conversas
Crie: apps/web/app/home/scout/chat/_components/conversation-sidebar.tsx
typescript'use client'

import { useConversations, useCreateConversation } from '@kaix-scout/hooks'
import { Button } from '@kit/ui/button'
import { ScrollArea } from '@kit/ui/scroll-area'
import { Plus, MessageSquare, Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ConversationSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentConversationId = searchParams.get('id')
  
  const { data: conversations, isLoading } = useConversations()
  const createConversation = useCreateConversation()

  const handleNewChat = async () => {
    const result = await createConversation.mutateAsync({})
    router.push(`/home/scout/chat?id=${result.conversation.id}`)
  }

  const handleSelectConversation = (id: string) => {
    router.push(`/home/scout/chat?id=${id}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={handleNewChat}
          className="w-full"
          disabled={createConversation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading && (
            <div className="text-sm text-muted-foreground p-4">
              Carregando...
            </div>
          )}

          {conversations?.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground p-4">
              Nenhuma conversa ainda
            </div>
          )}

          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`
                w-full text-left p-3 rounded-lg transition-colors
                hover:bg-accent
                ${currentConversationId === conv.id ? 'bg-accent' : ''}
              `}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conv.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  {conv.total_results > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.total_results} resultado{conv.total_results !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
5.3 Área de Chat
Crie: apps/web/app/home/scout/chat/page.tsx
typescript'use client'

import { useSearchParams } from 'next/navigation'
import { useConversation } from '@kaix-scout/hooks'
import { ChatMessages } from './_components/chat-messages'
import { ChatInput } from './_components/chat-input'
import { ChatWelcome } from './_components/chat-welcome'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('id')

  const { data: conversation, isLoading } = useConversation(conversationId)

  if (!conversationId) {
    return <ChatWelcome />
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando conversa...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Conversa não encontrada</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages 
          messages={conversation.messages} 
          conversationId={conversation.id}
        />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <ChatInput conversationId={conversation.id} />
      </div>
    </div>
  )
}
5.4 Mensagens do Chat
Crie: apps/web/app/home/scout/chat/_components/chat-messages.tsx
typescript'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@kit/ui/scroll-area'
import { Message } from '@kaix-scout/types'
import { Avatar } from '@kit/ui/avatar'
import { Bot, User } from 'lucide-react'
import { Button } from '@kit/ui/button'
import { Badge } from '@kit/ui/badge'
import { useRouter } from 'next/navigation'

interface ChatMessagesProps {
  messages: Message[]
  conversationId: string
}

export function ChatMessages({ messages, conversationId }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <Bot className="h-5 w-5" />
              </Avatar>
            )}

            <div
              className={`
                flex flex-col gap-2 max-w-[80%]
                ${message.role === 'user' ? 'items-end' : 'items-start'}
              `}
            >
              <div
                className={`
                  rounded-lg px-4 py-3 
                  ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }
                `}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </div>

              {/* Search Results Preview */}
              {message.metadata?.search_id && message.metadata?.results_count && (
                <div className="bg-background border rounded-lg p-3 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      ✅ {message.metadata.results_count} empresas encontradas
                    </span>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/home/scout/search/${message.metadata.search_id}`)}
                    >
                      Ver Resultados
                    </Button>
                  </div>

                  {message.metadata.analysis_summary && (
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="destructive">
                        🔥 {message.metadata.analysis_summary.hot_leads} Hot Leads
                      </Badge>
                      <Badge variant="secondary">
                        📊 {message.metadata.analysis_summary.medium_leads} Médias
                      </Badge>
                      <Badge variant="outline">
                        📉 {message.metadata.analysis_summary.low_leads} Baixas
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              {message.metadata?.quick_actions && message.role === 'assistant' && (
                <div className="flex gap-2 flex-wrap">
                  {message.metadata.quick_actions.map((action: string) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              )}

              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {message.role === 'user' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <User className="h-5 w-5" />
              </Avatar>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
5.5 Input do Chat
Crie: apps/web/app/home/scout/chat/_components/chat-input.tsx
typescript'use client'

import { useState } from 'react'
import { useSendMessage } from '@kaix-scout/hooks'
import { Button } from '@kit/ui/button'
import { Textarea } from '@kit/ui/textarea'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  conversationId: string
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const sendMessage = useSendMessage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sendMessage.isPending) return

    const content = message.trim()
    setMessage('')

    await sendMessage.mutateAsync({
      conversation_id: conversationId,
      content
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
        className="min-h-[60px] max-h-[200px] resize-none"
        disabled={sendMessage.isPending}
      />
      <Button 
        type="submit" 
        size="icon"
        disabled={!message.trim() || sendMessage.isPending}
        className="h-[60px] w-[60px]"
      >
        {sendMessage.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  )
}
5.6 Welcome Screen
Crie: apps/web/app/home/scout/chat/_components/chat-welcome.tsx
typescript'use client'

import { Button } from '@kit/ui/button'
import { useCreateConversation } from '@kaix-scout/hooks'
import { useRouter } from 'next/navigation'
import { MessageSquarePlus, Sparkles, Target, Zap } from 'lucide-react'

export function ChatWelcome() {
  const createConversation = useCreateConversation()
  const router = useRouter()

  const handleStartChat = async (initialMessage?: string) => {
    const result = await createConversation.mutateAsync({
      initial_message: initialMessage
    })
    router.push(`/home/scout/chat?id=${result.conversation.id}`)
  }

  const examples = [
    'Buscar restaurantes em São Paulo',
    'Encontre hotéis em Florianópolis no raio de 10km',
    'Quero prospectar padarias no Rio de Janeiro',
    'Mostre-me salões de beleza em Curitiba'
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Kaix Scout AI</h1>
          <p className="text-xl text-muted-foreground">
            Seu assistente inteligente de prospecção
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Busca Inteligente</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Análise Rápida</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <MessageSquarePlus className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Chat Natural</p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Comece uma conversa ou experimente um exemplo:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {examples.map((example) => (
              <Button
                key={example}
                variant="outline"
                className="h-auto py-3 px-4 text-left justify-start"
                onClick={() => handleStartChat(example)}
                disabled={createConversation.isPending}
              >
                <span className="text-sm">{example}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Main CTA */}
        <Button
          size="lg"
          onClick={() => handleStartChat()}
          disabled={createConversation.isPending}
          className="text-lg px-8"
        >
          <MessageSquarePlus className="h-5 w-5 mr-2" />
          Iniciar Nova Conversa
        </Button>
      </div>
    </div>
  )
}
6. Atualizar Navegação
Atualize: apps/web/config/navigation.config.tsx
typescript// Adicionar item no menu
{
  label: 'Kaix Scout',
  children: [
    {
      label: 'Chat AI',
      path: '/home/scout/chat',
      Icon: MessageSquare,
    },
    {
      label: 'Buscas',
      path: '/home/scout',
      Icon: Search,
    }
  ]
}
7. Exportar Hooks
Atualize: packages/features/kaix-scout/src/hooks/index.ts
typescriptexport * from './use-search'
export * from './use-conversations'
8. Atualizar Package.json
Adicione dependências: packages/features/kaix-scout/package.json
json{
  "dependencies": {
    "date-fns": "^3.0.0"
  }
}
Checklist de Implementação
Execute os passos na seguinte ordem:

 1. Criar migration _conversational_system.sql
 2. Aplicar migration: pnpm run supabase:web:reset
 3. Gerar tipos: pnpm run supabase:web:typegen
 4. Criar tipos TypeScript em conversation.types.ts
 5. Criar APIs em /api/conversations/*
 6. Criar hooks em use-conversations.ts
 7. Criar componentes em chat/_components/*
 8. Criar páginas em chat/page.tsx e chat/layout.tsx
 9. Atualizar navegação
 10. Instalar dependências: pnpm install
 11. Testar sistema completo

Resultado Esperado
Após implementação, o usuário terá:
✅ Interface estilo ChatGPT/Claude
✅ Conversas em tempo real
✅ Múltiplas abas de chat
✅ Histórico na sidebar
✅ Busca conversacional
✅ Preview de resultados inline
✅ Quick actions
✅ Auto-refresh (3s)
✅ Sistema totalmente funcional