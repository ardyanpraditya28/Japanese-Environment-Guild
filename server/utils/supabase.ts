import { createClient } from '@supabase/supabase-js'

// Dipakai HANYA di server (server/api/**) — pakai service role key,
// jadi bisa bypass RLS. Jangan pernah expose key ini ke client.
export function useSupabaseAdmin() {
  const config = useRuntimeConfig()
  return createClient(config.supabaseUrl as string, config.supabaseServiceRoleKey as string, {
    auth: { persistSession: false },
  })
}
