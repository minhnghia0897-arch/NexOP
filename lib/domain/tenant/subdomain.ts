/**
 * Giải tên miền phụ từ header Host: `cothao.oblue.vn` → `cothao`.
 *
 * Mọi truy vấn lọc theo `tenant_id` (CLAUDE.md, luật cứng), và `tenant_id` bắt đầu
 * từ đây. Giải sai thì hoặc cô không vào được nhà mình, hoặc tệ hơn, đứng ở tên miền
 * này lại đọc được dữ liệu tên miền khác.
 */

/** Tên miền phụ không thuộc về giáo viên nào — không được coi là tenant. */
const DANH_RIENG = new Set(['www', 'api', 'admin', 'app', 'static', 'assets', 'cdn', 'mail'])

export interface KetQuaGiai {
  /** Tên miền phụ của cô, hoặc null nếu đang ở trang gốc. */
  subdomain: string | null
  /** Trang gốc oblue.vn: chỗ đăng ký mở tên miền, không thuộc cô nào. */
  laTrangGoc: boolean
}

/**
 * @param host giá trị header Host, có thể kèm cổng
 * @param rootDomain tên miền gốc, ví dụ `oblue.vn`
 */
export function giaiSubdomain(host: string | null | undefined, rootDomain: string): KetQuaGiai {
  if (!host) return { subdomain: null, laTrangGoc: true }

  // Bỏ cổng và chuẩn về chữ thường; Host có thể là "cothao.oblue.vn:3000".
  const hostname = host.split(':')[0]!.trim().toLowerCase()

  // localhost khi phát triển: cothao.localhost → cothao.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { subdomain: null, laTrangGoc: true }
  }
  if (hostname.endsWith('.localhost')) {
    const nhan = hostname.slice(0, -'.localhost'.length)
    return laNhanHopLe(nhan)
      ? { subdomain: nhan, laTrangGoc: false }
      : { subdomain: null, laTrangGoc: true }
  }

  const goc = rootDomain.toLowerCase()
  if (hostname === goc) return { subdomain: null, laTrangGoc: true }
  if (!hostname.endsWith(`.${goc}`)) {
    // Tên miền lạ (bản xem trước, tên miền riêng chưa hỗ trợ) — không đoán bừa.
    return { subdomain: null, laTrangGoc: false }
  }

  const nhan = hostname.slice(0, -(goc.length + 1))

  // Chỉ nhận một cấp. "a.b.oblue.vn" không phải tenant "a.b".
  if (nhan.includes('.')) return { subdomain: null, laTrangGoc: false }
  if (DANH_RIENG.has(nhan)) return { subdomain: null, laTrangGoc: true }
  if (!laNhanHopLe(nhan)) return { subdomain: null, laTrangGoc: false }

  return { subdomain: nhan, laTrangGoc: false }
}

/** Cùng luật với ràng buộc tenants_subdomain_shape trong migration 0001. */
export function laNhanHopLe(nhan: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(nhan)
}
