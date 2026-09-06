import 'server-only'

import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { supabaseAnonKey, supabaseUrl } from './env'

/**
 * Nơi DUY NHẤT gọi Supabase từ phía máy chủ (ARCHITECTURE §8).
 * Không component nào import @supabase/* trực tiếp.
 *
 * Client này chạy dưới danh nghĩa người đang đăng nhập, nên RLS có hiệu lực.
 * RLS chỉ phản chiếu nhánh `read` của can(); mọi `write` vẫn phải qua can() ở server.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: ((cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Gọi từ Server Component thì không đặt được cookie — middleware làm mới phiên.
        }
      }) satisfies SetAllCookies,
    },
  })
}
