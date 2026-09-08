import 'server-only'

import { cookies } from 'next/headers'

import type { VaiDemo } from './du-lieu'

/**
 * Vai đang xem của bản demo.
 *
 * Có công tắc đổi vai vì quyền là phần khó thấy nhất của sản phẩm này: nhìn một màn hình
 * thì không biết trợ giảng bị chặn ở đâu. Đổi vai rồi xem cùng một màn đổi thế nào thì
 * thấy ngay — và vì kho chạy qua `can()` thật, cái thấy được là hành vi thật.
 *
 * Bản chạy thật thay chỗ này bằng phiên đăng nhập Supabase; phần còn lại không đổi.
 */
const COOKIE = 'oblue-vai'

export async function vaiHienTai(): Promise<VaiDemo> {
  const c = await cookies()
  const v = c.get(COOKIE)?.value
  return v === 'assistant' || v === 'student' ? v : 'owner'
}

export const COOKIE_VAI = COOKIE
