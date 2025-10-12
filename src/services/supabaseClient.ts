import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  // Vite 环境变量读取
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || (window as any).__SUPABASE_URL__;
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (window as any).__SUPABASE_ANON_KEY__;

  if (!url || !anonKey) {
    throw new Error('Supabase 未配置: 请设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY');
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
  return client;
}





