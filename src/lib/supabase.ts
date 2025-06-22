import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro' | 'premium';
          subscription_status: 'active' | 'inactive' | 'cancelled';
          subscription_expires_at: string | null;
          tron_wallet_address: string | null;
          api_requests_used: number;
          api_requests_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'premium';
          subscription_status?: 'active' | 'inactive' | 'cancelled';
          subscription_expires_at?: string | null;
          tron_wallet_address?: string | null;
          api_requests_used?: number;
          api_requests_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'premium';
          subscription_status?: 'active' | 'inactive' | 'cancelled';
          subscription_expires_at?: string | null;
          tron_wallet_address?: string | null;
          api_requests_used?: number;
          api_requests_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          model: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          model?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          model: string | null;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          model?: string | null;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          model?: string | null;
          tokens_used?: number | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          transaction_hash: string;
          amount: number;
          currency: string;
          subscription_tier: 'pro' | 'premium';
          status: 'pending' | 'confirmed' | 'failed';
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_hash: string;
          amount: number;
          currency: string;
          subscription_tier: 'pro' | 'premium';
          status?: 'pending' | 'confirmed' | 'failed';
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_hash?: string;
          amount?: number;
          currency?: string;
          subscription_tier?: 'pro' | 'premium';
          status?: 'pending' | 'confirmed' | 'failed';
          created_at?: string;
          confirmed_at?: string | null;
        };
      };
    };
  };
}

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const createClientComponentClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client
export const createServerComponentClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};

// Admin client (for server actions)
export const createAdminClient = () =>
  createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Utility functions
export const getUser = async () => {
  const supabase = await createServerComponentClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getUserProfile = async (userId: string) => {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Database['public']['Tables']['users']['Update']) => {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}; 