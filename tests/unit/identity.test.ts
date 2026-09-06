import { describe, expect, it, vi } from 'vitest'

import {
  kenhDangNhapCuaVai,
  xacDinhTuCach,
  type TuCach,
} from '@/lib/domain/tenant/identity'
import {
  OTP_SO_CHU_SO,
  bamMa,
  maKhop,
  taoMaOtp,
  taoKenhGui,
  taoTokenMoi,
} from '@/lib/domain/tenant/otp'

function tuCach(over: Partial<TuCach> = {}): TuCach {
  return { membershipId: 'm1', role: 'student', classId: 'c1', status: 'active', ...over }
}

describe('xác định tư cách khi đăng nhập', () => {
  it('không tư cách nào → không tạo tài khoản, chỉ mời học thử', () => {
    expect(xacDinhTuCach([])).toEqual({ loai: 'khong-co-tu-cach' })
  })

  it('lời mời chưa nhận thì chưa tính là tư cách', () => {
    expect(xacDinhTuCach([tuCach({ status: 'pending' })])).toEqual({ loai: 'khong-co-tu-cach' })
  })

  it('em đã nghỉ thì không vào lại được', () => {
    expect(xacDinhTuCach([tuCach({ status: 'left' })])).toEqual({ loai: 'khong-co-tu-cach' })
  })

  it('đúng một tư cách → vào thẳng, không hỏi gì', () => {
    const t = tuCach()
    expect(xacDinhTuCach([t])).toEqual({ loai: 'vao-thang', tuCach: t })
  })

  it('học hai lớp cùng vai vẫn là vào thẳng — không phải hai tư cách', () => {
    const ketQua = xacDinhTuCach([
      tuCach({ membershipId: 'm1', classId: 'c1' }),
      tuCach({ membershipId: 'm2', classId: 'c2' }),
    ])
    expect(ketQua.loai).toBe('vao-thang')
  })

  it('vừa là học viên vừa là trợ giảng → hỏi một lần', () => {
    const ketQua = xacDinhTuCach([
      tuCach({ membershipId: 'm1', role: 'student' }),
      tuCach({ membershipId: 'm2', role: 'assistant' }),
    ])
    expect(ketQua.loai).toBe('hoi-mot-lan')
    expect(ketQua.loai === 'hoi-mot-lan' && ketQua.luaChon).toHaveLength(2)
  })

  it('đã chọn lần trước thì nhớ, không hỏi lại', () => {
    const ketQua = xacDinhTuCach(
      [tuCach({ membershipId: 'm1', role: 'student' }), tuCach({ membershipId: 'm2', role: 'assistant' })],
      'assistant',
    )
    expect(ketQua).toMatchObject({ loai: 'vao-thang', tuCach: { role: 'assistant' } })
  })

  it('vai đã nhớ mà nay không còn thì hỏi lại, không cho vào nhầm', () => {
    const ketQua = xacDinhTuCach(
      [tuCach({ membershipId: 'm1', role: 'student' }), tuCach({ membershipId: 'm2', role: 'parent' })],
      'assistant', // cô đã gỡ quyền trợ giảng
    )
    expect(ketQua.loai).toBe('hoi-mot-lan')
  })

  it('cô vào bằng email, em và trợ giảng vào bằng SĐT', () => {
    expect(kenhDangNhapCuaVai('owner')).toBe('email')
    expect(kenhDangNhapCuaVai('student')).toBe('phone')
    expect(kenhDangNhapCuaVai('assistant')).toBe('phone')
    expect(kenhDangNhapCuaVai('parent')).toBe('phone')
  })
})

describe('mã OTP', () => {
  it('đúng số chữ số, giữ cả số 0 đứng đầu', () => {
    for (let i = 0; i < 200; i += 1) {
      const ma = taoMaOtp()
      expect(ma).toHaveLength(OTP_SO_CHU_SO)
      expect(ma).toMatch(/^\d+$/)
    }
  })

  it('không lặp lại — nguồn ngẫu nhiên thật', () => {
    const da = new Set(Array.from({ length: 500 }, () => taoMaOtp()))
    // 500 lần bốc trong 10^6 khả năng: trùng vài lần là bình thường, trùng nhiều là hỏng.
    expect(da.size).toBeGreaterThan(480)
  })

  it('cùng mã ở hai lần thách thức khác nhau ra hai chuỗi băm khác nhau', () => {
    expect(bamMa('challenge-1', '123456')).not.toBe(bamMa('challenge-2', '123456'))
  })

  it('băm rồi thì không đọc ra mã', () => {
    expect(bamMa('challenge-1', '123456')).not.toContain('123456')
  })

  it('so mã khớp và không khớp', () => {
    const bam = bamMa('c1', '123456')
    expect(maKhop(bam, bamMa('c1', '123456'))).toBe(true)
    expect(maKhop(bam, bamMa('c1', '123457'))).toBe(false)
    expect(maKhop(bam, 'ngắn')).toBe(false)
  })

  it('token mời đủ dài để không dò ra', () => {
    const token = taoTokenMoi()
    expect(token.length).toBeGreaterThanOrEqual(32)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(taoTokenMoi()).not.toBe(token)
  })
})

describe('kênh gửi OTP', () => {
  it('production mà chưa cắm nhà cung cấp thì hỏng ngay, không âm thầm bỏ qua', () => {
    const truoc = process.env.NODE_ENV
    try {
      vi.stubEnv('NODE_ENV', 'production')
      expect(() => taoKenhGui()).toThrow(/Chưa cắm nhà cung cấp OTP/)
    } finally {
      vi.unstubAllEnvs()
      expect(process.env.NODE_ENV).toBe(truoc)
    }
  })

  it('lúc phát triển thì dùng bản ghi ra log', () => {
    expect(taoKenhGui()).toBeDefined()
  })
})
