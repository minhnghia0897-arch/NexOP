import 'server-only'

import { headers } from 'next/headers'

import { HEADER_TENANT } from '@/middleware'

/**
 * Tên miền phụ của yêu cầu đang xử lý, do middleware giải sẵn.
 *
 * Đọc từ đây chứ không đọc Host: middleware xoá header này trước khi đặt lại, nên
 * người ngoài không tự gửi vào để giả làm tên miền của cô. Trang nào tự đọc Host là
 * mở lại đúng cái cửa đó.
 */
export async function subdomainHienTai(): Promise<string | null> {
  const h = await headers()
  return h.get(HEADER_TENANT)
}
