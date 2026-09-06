import { describe, expect, it } from 'vitest'

import {
  cheSoDienThoai,
  chuanHoaSoDienThoai,
  cungMotSo,
  danDanhSachHocVien,
  hienThiSoDienThoai,
} from '@/lib/domain/tenant/phone'

describe('chuẩn hoá số điện thoại', () => {
  it('nhận mọi cách cô hay gõ cùng một số', () => {
    const cachViet = [
      '0901234567',
      '0901 234 567',
      '090-123-4567',
      '090.123.4567',
      ' 0901234567 ',
      '+84901234567',
      '+84 90 123 45 67',
      '84901234567',
      '(+84) 901 234 567',
    ]
    for (const viet of cachViet) {
      expect(chuanHoaSoDienThoai(viet), viet).toBe('+84901234567')
    }
  })

  it('quy đổi đầu số 11 chữ số cũ sang đầu số hiện hành', () => {
    // Danh bạ Zalo của cô còn đầy số trước đợt chuyển 2018.
    expect(chuanHoaSoDienThoai('01634567890')).toBe('+84334567890') // 163 → 33
    expect(chuanHoaSoDienThoai('01214567890')).toBe('+84794567890') // 121 → 79
    expect(chuanHoaSoDienThoai('01234567890')).toBe('+84834567890') // 123 → 83
    expect(chuanHoaSoDienThoai('01884567890')).toBe('+84584567890') // 188 → 58
  })

  it('số cũ và số mới của cùng một người là một', () => {
    expect(cungMotSo('01634567890', '0334567890')).toBe(true)
  })

  it('không nhầm 084x là mã quốc gia', () => {
    // 084 là đầu số VinaPhone. Bỏ nhầm "84" thì số này hỏng.
    expect(chuanHoaSoDienThoai('0845123456')).toBe('+84845123456')
  })

  it('từ chối thứ không phải số di động Việt Nam', () => {
    const khongHopLe = [
      '',
      '   ',
      '02838221234',      // số bàn
      '0901234',          // thiếu chữ số
      '09012345678',      // thừa chữ số
      '+1 415 555 2671',  // số Mỹ
      '+8613800138000',   // số Trung Quốc
      'khong-phai-so',
      '0111234567',       // đầu số cũ không có trong bảng chuyển đổi
    ]
    for (const so of khongHopLe) {
      expect(chuanHoaSoDienThoai(so), so).toBeNull()
    }
  })

  it('hiển thị lại dạng cô quen đọc', () => {
    expect(hienThiSoDienThoai('+84901234567')).toBe('090 123 4567')
  })
})

describe('dán danh sách học viên', () => {
  it('đọc được bản dán từ Excel (tab)', () => {
    const { hopLe, hong } = danDanhSachHocVien(
      'Nguyễn Minh Anh\t0901234567\nTrần Thu Hà\t0332345678',
    )
    expect(hong).toHaveLength(0)
    expect(hopLe).toEqual([
      { ten: 'Nguyễn Minh Anh', soDienThoai: '+84901234567' },
      { ten: 'Trần Thu Hà', soDienThoai: '+84332345678' },
    ])
  })

  it('đọc được bản dán có phẩy, chấm phẩy, hoặc nhiều khoảng trắng', () => {
    const { hopLe } = danDanhSachHocVien(
      'Lê Yến Nhi, 0779876543\nPhạm Quốc Bảo; 0912345678\nVũ Hoài Nam   0338887777',
    )
    expect(hopLe.map((h) => h.soDienThoai)).toEqual([
      '+84779876543',
      '+84912345678',
      '+84338887777',
    ])
    expect(hopLe[0]!.ten).toBe('Lê Yến Nhi')
  })

  it('giữ nguyên dấu tiếng Việt trong tên', () => {
    const { hopLe } = danDanhSachHocVien('Đặng Thuỳ Dương\t0901112223')
    expect(hopLe[0]!.ten).toBe('Đặng Thuỳ Dương')
  })

  it('bỏ dòng trống, báo từng dòng hỏng kèm số dòng', () => {
    const { hopLe, hong } = danDanhSachHocVien(
      'Nguyễn Minh Anh\t0901234567\n\nHọc viên lạ\t02838221234\n\t0912345678',
    )
    expect(hopLe).toHaveLength(1)
    expect(hong).toEqual([
      { dong: 3, noiDung: 'Học viên lạ\t02838221234', lyDo: 'không tìm thấy số di động hợp lệ' },
      { dong: 4, noiDung: '0912345678', lyDo: 'thiếu tên học viên' },
    ])
  })

  it('dán trùng một người thì chỉ giữ một', () => {
    const { hopLe } = danDanhSachHocVien(
      'Nguyễn Minh Anh\t0901234567\nMinh Anh\t+84 901 234 567',
    )
    expect(hopLe).toHaveLength(1)
    expect(hopLe[0]!.ten).toBe('Nguyễn Minh Anh')
  })

  it('gộp được số cũ và số mới của cùng một em', () => {
    const { hopLe } = danDanhSachHocVien(
      'Trần Thu Hà\t01634567890\nThu Hà\t0334567890',
    )
    expect(hopLe).toHaveLength(1)
  })
})

describe('che số trên màn lời mời', () => {
  it('đúng dạng bản mẫu đã duyệt', () => {
    expect(cheSoDienThoai('+84901234567')).toBe('0901 ••• 567')
  })

  it('che 3 chữ số giữa — đủ để em nhận ra số mình', () => {
    const che = cheSoDienThoai('+84901234567')
    expect(che.replace(/\D/g, '')).toHaveLength(7)
    expect(che).toContain('•••')
  })

  it('số hỏng thì không lộ gì', () => {
    expect(cheSoDienThoai('linh tinh')).toBe('•••')
  })
})
