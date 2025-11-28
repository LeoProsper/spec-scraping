-- ============================================
-- CONVERSATIONAL SYSTEM SCHEMA
-- ============================================

-- Conversations (múltiplas conversas por usuário)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
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
  user_query TEXT NOT NULL,
  refined_query TEXT,
  
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
      last_message_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.conversations
    SET 
      messages_count = GREATEST(messages_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.conversation_id;
  END IF
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
    SET 
      searches_count = searches_count + 1,
      updated_at = NOW()
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

-- Trigger: Atualizar updated_at
CREATE TRIGGER on_conversation_updated
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION kit.trigger_set_timestamps();
