import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing public Supabase environment variables')
}

// Client-side client with anonymous key (limited access)
export const createClientSideClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}