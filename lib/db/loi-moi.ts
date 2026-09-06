import 'server-only'

import { createClient } from './server'

/**
 * Đọc lời mời cho trang công khai `/m/<token>`.
 *
 * Đi qua app.peek_invite chứ không truy vấn thẳng memberships: người mở link chưa
 * đăng nhập, và permissions.json chỉ cho owner đọc bảng đó. Hàm kia trả đúng những
 * trường trang cần, SĐT đã che sẵn ở trong DB.
 */
export interface LoiMoiXemTruoc {
  found: boolean
  status: string | null
  subdomain: string | null
  teacher_name: string | null
  role: string | null
  class_id: string | null
  phone_masked: string | null
}

export async function xemTruocLoiMoi(token: string): Promise<LoiMoiXemTruoc | null> {
  const client = await createClient()
  const { data, error } = await client.rpc('peek_invite', { p_token: token })

  if (error) throw new Error(`Không đọc được lời mời: ${error.message}`)
  return (data as LoiMoiXemTruoc | null) ?? null
}
