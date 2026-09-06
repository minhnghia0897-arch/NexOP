import { NextResponse, type NextRequest } from 'next/server'

import { giaiSubdomain } from '@/lib/domain/tenant/subdomain'

/**
 * Giải tên miền phụ một lần, ở cửa vào, rồi gắn vào header cho mọi route đọc lại.
 *
 * Để từng trang tự đoán tenant từ Host thì sớm muộn có trang đoán khác đi, và
 * "mọi query lọc theo tenant_id" (CLAUDE.md) hỏng ở đúng một chỗ không ai để ý.
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'oblue.vn'

/** Route đọc tenant qua header này. Không route nào tự đọc Host. */
export const HEADER_TENANT = 'x-oblue-subdomain'

export function middleware(request: NextRequest) {
  const { subdomain } = giaiSubdomain(request.headers.get('host'), ROOT_DOMAIN)

  const headers = new Headers(request.headers)

  // Xoá trước khi đặt: nếu không, người ngoài tự gửi header này là giả được tenant.
  headers.delete(HEADER_TENANT)
  if (subdomain) headers.set(HEADER_TENANT, subdomain)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Bỏ qua tài nguyên tĩnh — giải tenant cho một file ảnh là phí.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
}
