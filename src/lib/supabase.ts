import { createClient } from '@supabase/supabase-js'

/**
 * Supabase (로그인 + 백업).
 * URL과 publishable 키는 브라우저에 공개돼도 되는 값이다.
 * 데이터는 RLS 정책(auth.uid() = user_id)으로 본인 줄만 읽고 쓸 수 있다.
 */
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://mjuesmghlyjmcxgtdzmo.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_1XGQbZ7C9Q8_c2gnUNYNZA_cyyjxvLT'

export const supabase = createClient(URL, KEY, {
  auth: {
    // HashRouter(#/...)와 충돌하지 않게 토큰 대신 ?code= 로 돌아오는 PKCE 방식
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'cookable:auth',
  },
})

export const BACKUP_TABLE = 'cookable_user_data'
