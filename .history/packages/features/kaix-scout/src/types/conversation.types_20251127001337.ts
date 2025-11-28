export interface Conversation {
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
  metadata?: MessageMetadata
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
  conversationId: string
  content: string
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
  searches: ConversationSearch[]
}
