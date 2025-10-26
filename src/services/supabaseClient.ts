import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  // 直接硬编码配置（临时解决方案）
  const url = 'https://wtclpsjmbokwgwzsenxz.supabase.co';
  const anonKey = 'sb_publishable_6siuBEqDFzw24-PvxSvoWw_ha6CJwTf';

  console.log('🔗 创建Supabase客户端:', { url, hasKey: !!anonKey });

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
  return client;
}
















