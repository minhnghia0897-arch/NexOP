import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { giaiSubdomain, laNhanHopLe } from '@/lib/domain/tenant/subdomain'

const GOC = 'oblue.vn'

function giai(host: string | null | undefined) {
  return giaiSubdomain(host, GOC)
}

describe('giải tên miền phụ', () => {
  it('tên miền của cô', () => {
    expect(giai('cothao.oblue.vn')).toEqual({ subdomain: 'cothao', laTrangGoc: false })
  })

  it('bỏ cổng và không phân biệt hoa thường', () => {
    expect(giai('CoThao.Oblue.VN:3000').subdomain).toBe('cothao')
  })

  it('trang gốc không thuộc cô nào', () => {
    expect(giai('oblue.vn')).toEqual({ subdomain: null, laTrangGoc: true })
    expect(giai('www.oblue.vn')).toEqual({ subdomain: null, laTrangGoc: true })
  })

  it('nhãn dành riêng không thành tên miền của ai', () => {
    for (const nhan of ['api', 'admin', 'app', 'static', 'cdn', 'mail']) {
      expect(giai(`${nhan}.oblue.vn`).subdomain, nhan).toBeNull()
    }
  })

  it('không có Host thì coi như trang gốc', () => {
    expect(giai(null).laTrangGoc).toBe(true)
    expect(giai(undefined).laTrangGoc).toBe(true)
    expect(giai('').laTrangGoc).toBe(true)
  })

  it('chỉ nhận một cấp — không đoán tenant từ tên miền nhiều cấp', () => {
    expect(giai('a.b.oblue.vn').subdomain).toBeNull()
  })

  it('tên miền lạ thì trả null, không đoán bừa', () => {
    // Quan trọng: KHÔNG được coi "cothao" ở đây là tenant, nếu không thì ai dựng
    // được tên miền cothao.oblue.vn.ke-gian.com là đọc được dữ liệu của cô.
    expect(giai('cothao.oblue.vn.ke-gian.com')).toEqual({ subdomain: null, laTrangGoc: false })
    expect(giai('oblue.vn.ke-gian.com')).toEqual({ subdomain: null, laTrangGoc: false })
  })

  it('nhãn sai luật thì không nhận', () => {
    for (const xau of ['-cothao', 'cothao-', 'a', 'cô-thảo', 'co_thao', 'a'.repeat(33)]) {
      expect(giai(`${xau}.oblue.vn`).subdomain, xau).toBeNull()
    }
  })

  it('chạy được ở localhost khi phát triển', () => {
    expect(giai('cothao.localhost:3000')).toEqual({ subdomain: 'cothao', laTrangGoc: false })
    expect(giai('localhost:3000')).toEqual({ subdomain: null, laTrangGoc: true })
    expect(giai('127.0.0.1:3000')).toEqual({ subdomain: null, laTrangGoc: true })
  })
})

describe('luật nhãn khớp với ràng buộc trong migration', () => {
  // Chép tay biểu thức ở hai nơi thì sớm muộn cũng lệch, và lúc đó ứng dụng nhận một
  // tên miền mà DB từ chối — hỏng ở chỗ khó lần nhất. Đọc thẳng từ migration.
  it('cùng một biểu thức với tenants_subdomain_shape', () => {
    const migration = readFileSync('supabase/migrations/0001_foundation.sql', 'utf8')
    const khop = migration.match(/tenants_subdomain_shape check \(subdomain ~ '([^']+)'\)/)

    expect(khop, 'không tìm thấy ràng buộc tenants_subdomain_shape').not.toBeNull()
    const tuMigration = new RegExp(khop![1]!)

    const mau = [
      'cothao', 'co-thao-2', 'ab', 'a', '-abc', 'abc-', 'a'.repeat(33),
      'co_thao', 'CoThao', '2026', 'a-b',
    ]
    for (const nhan of mau) {
      expect(laNhanHopLe(nhan), nhan).toBe(tuMigration.test(nhan))
    }
  })
})
