import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types based on your Prisma schema
export interface Category {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface Companion {
  id: string
  user_id: string
  user_name: string
  src: string
  name: string
  description: string
  instructions: string
  seed: string
  created_at?: string
  updated_at?: string
  category_id: string
  category?: Category
  messages?: Message[]
  _count?: { messages: number }
}

export interface Message {
  id: string
  role: 'user' | 'system'
  content: string
  created_at?: string
  updated_at?: string
  companion_id: string
  user_id: string
}

export interface UserSubscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  stripe_current_period_end?: string
}