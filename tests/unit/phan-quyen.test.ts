/**
 * Ba vai trò theo `OBLUE_PHAN_QUYEN_3_VAI_TRO.md`, soi trên bản đang dựng.
 *
 * Tài liệu đó là đặc tả ĐÍCH của bản oblue.vn cũ — schema khác (`class_teachers`,
 * `student_assignments`, `exam_bank`), nhưng CHÍNH SÁCH thì áp được nguyên. File này chốt đúng
 * phần chính sách, và chốt bằng hành vi chứ không bằng cách gõ lại ma trận.
 *
 * Câu quan trọng nhất của tài liệu, §A: quyền của cô đi theo VAI, quyền của trợ giảng đi theo
 * QUAN HỆ với lớp. Mọi khẳng định dưới đây là hệ quả của một trong hai câu đó.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { can } from '@/lib/auth/can'
import {
  actorCuaVai,
  datLai,
  duLieu,
  hocVienThemDuoc,
  hocVienTrongTam,
  lopPhuTrach,
  nhatKy,
  suaHoSoCuaToi,
} from '@/lib/demo/kho'

beforeEach(() => {
  datLai()
})

/** Bỏ trợ giảng khỏi mọi lớp — trạng thái "được mời vào mà chưa phân lớp" của §E1 bước 4. */
function boPhanCong(): void {
  const du = duLieu()
  for (const l of du.lop) l.troGiangIds = []
}

/** Phân trợ giảng sang một lớp khác — để soi rằng quan hệ THẬT SỰ điều khiển phạm vi. */
function phanSang(lopId: string): void {
  const du = duLieu()
  for (const l of du.lop) l.troGiangIds = l.id === lopId ? [du.vai.assistant] : []
}

describe('§A · quyền trợ giảng đi theo QUAN HỆ, không theo vai', () => {
  it('phạm vi lớp suy từ dữ liệu phân công, không từ chuỗi cắm trong mã', () => {
    const du = duLieu()
    expect(lopPhuTrach(du.vai.assistant)).toEqual(['lop-65'])
    expect(actorCuaVai('assistant').classIds).toEqual(['lop-65'])

    phanSang('lop-55')
    expect(actorCuaVai('assistant').classIds).toEqual(['lop-55'])
  })

  it('cô phân sang lớp khác thì MỌI màn đổi theo — không còn bản sao thứ hai', () => {
    /*
     * Đây là bài kiểm đáng giá nhất của file. Trước refactor, phạm vi trợ giảng là chuỗi
     * `'lop-65'` cắm ở `actorCuaVai` và cắm LẦN THỨ HAI ở màn Học viên. Cô phân sang lớp khác
     * thì `can()` mở lớp mới còn màn Học viên vẫn lọc lớp cũ — lộ đúng thứ ranh giới này sinh
     * ra để che, mà không có gì báo.
     */
    const lop55 = duLieu().lop.find((l) => l.id === 'lop-55')!
    phanSang('lop-55')

    const thay = hocVienTrongTam('assistant').map((h) => h.id)
    expect(thay.length).toBeGreaterThan(0)
    for (const id of thay) expect(lop55.hocVienIds).toContain(id)
    // Và KHÔNG còn em nào của lớp cũ.
    expect(thay).not.toContain('hv-01')
  })

  it('chưa được phân lớp thì không thấy gì — và đó là hành vi ĐÚNG', () => {
    boPhanCong()
    expect(actorCuaVai('assistant').classIds).toEqual([])
    expect(hocVienTrongTam('assistant')).toHaveLength(0)

    // Không phải vì hàm trả rỗng cho xong: `can()` chặn ở cửa 3 cho từng em.
    const du = duLieu()
    expect(
      can(actorCuaVai('assistant'), 'submission.view', {
        type: 'submission',
        tenantId: du.tenant.id,
        classId: 'lop-65',
        ownerId: 'hv-01',
      }),
    ).toBe(false)
  })

  it('cô KHÔNG bị bó theo lớp — quyền theo vai, không theo quan hệ', () => {
    boPhanCong()
    expect(actorCuaVai('owner').classIds).toEqual([])
    expect(hocVienTrongTam('owner').length).toBe(duLieu().hoSo.length)
  })
})

describe('§G · ranh giới riêng tư giữa hai giáo viên', () => {
  it('cô thấy mọi em kèm lớp đang học; trợ giảng chỉ thấy em CHƯA thuộc lớp nào', () => {
    const cua = hocVienThemDuoc('owner')
    expect(cua.length).toBe(duLieu().hoSo.length)
    expect(cua.some((x) => x.dangOLop !== null)).toBe(true)

    // Trợ giảng: em của đồng nghiệp bị ẩn HOÀN TOÀN khỏi danh sách chọn — không hiện rồi báo
    // lỗi khi bấm. Hiện ra rồi từ chối là vừa lộ thông tin, vừa làm người dùng bực (§G).
    for (const x of hocVienThemDuoc('assistant')) expect(x.dangOLop).toBeNull()
  })

  it('em trong lớp của chính trợ giảng cũng không hiện ra để chọn lại', () => {
    const trongLop = duLieu().lop.find((l) => l.id === 'lop-65')!.hocVienIds
    const chonDuoc = hocVienThemDuoc('assistant').map((x) => x.id)
    for (const id of trongLop) expect(chonDuoc).not.toContain(id)
  })
})

describe('§C4 · sửa hồ sơ của chính mình — cả ba vai', () => {
  it('trợ giảng sửa được TÊN của chính mình', () => {
    /* Trước khi có mức `read_own`, dòng duy nhất dính tới hồ sơ là `profile: read`, mà
       `profile` là hồ sơ NĂNG LỰC. Trợ giảng không sửa nổi tên mình, và đó không phải chính
       sách của ai — nó là chỗ mô hình thiếu chữ. */
    suaHoSoCuaToi('assistant', 'Phạm Lan Anh')
    const id = duLieu().vai.assistant
    expect(duLieu().taiKhoan.find((t) => t.id === id)!.ten).toBe('Phạm Lan Anh')
  })

  it('em cũng sửa được tên của mình', () => {
    suaHoSoCuaToi('student', 'Nguyễn Minh Anh (Anh)')
    const id = duLieu().vai.student
    expect(duLieu().taiKhoan.find((t) => t.id === id)!.ten).toBe('Nguyễn Minh Anh (Anh)')
  })

  it('không ai sửa được hồ sơ của người khác — cửa 7b', () => {
    const du = duLieu()
    const hs = (ownerId: string) => ({ type: 'account', tenantId: du.tenant.id, ownerId })

    /* `parent` không có trong `VaiDemo` (bản demo chưa có màn phụ huynh), nên dựng actor tay
       cho vai đó — mức `read_own` của phụ huynh vẫn phải đi qua cùng cửa. */
    const actors = [
      actorCuaVai('assistant'),
      actorCuaVai('student'),
      { ...actorCuaVai('student'), role: 'parent' as const, accountId: 'ph-01' },
    ]
    for (const actor of actors) {
      expect(can(actor, 'account.update', hs(actor.accountId)), actor.role).toBe(true)
      expect(can(actor, 'account.update', hs('nguoi-khac')), actor.role).toBe(false)
    }
  })

  it('nhật ký ghi ĐỘ DÀI tên, không ghi tên', () => {
    suaHoSoCuaToi('assistant', 'Tên Mới Của Lan')
    const ev = nhatKy().find((e) => e.action === 'account.update')!
    expect(ev.payload.do_dai).toBe('Tên Mới Của Lan'.length)
    expect(JSON.stringify(ev.payload)).not.toContain('Tên Mới')
    // Và chỉ chính người đó thấy dòng này.
    expect(ev.visibility).toEqual([duLieu().vai.assistant])
  })

  it('máy KHÔNG đổi tên ai', () => {
    const may = { ...actorCuaVai('owner'), role: 'system' as const, accountId: 'system' }
    expect(
      can(may, 'account.update', {
        type: 'account',
        tenantId: duLieu().tenant.id,
        ownerId: 'system',
      }),
    ).toBe(false)
  })
})

describe('§C · những dòng bản đang dựng CHẶT HƠN tài liệu', () => {
  it('học phí là trần cứng: cô cấp quyền gì trợ giảng cũng không đọc', () => {
    const du = duLieu()
    const troGiangTuLam = {
      ...actorCuaVai('assistant'),
      permissions: { 'lop-65': { fee: 'auto' as const } },
    }
    expect(
      can(troGiangTuLam, 'fee.view', {
        type: 'fee',
        tenantId: du.tenant.id,
        classId: 'lop-65',
        ownerId: 'hv-01',
      }),
    ).toBe(false)
  })

  it('gửi tới người thật thì chỉ cô — kể cả trợ giảng được cấp mức cao nhất', () => {
    const du = duLieu()
    const troGiangTuLam = {
      ...actorCuaVai('assistant'),
      permissions: { 'lop-65': { review: 'auto' as const } },
    }
    expect(
      can(troGiangTuLam, 'review.send', {
        type: 'review',
        tenantId: du.tenant.id,
        classId: 'lop-65',
        ownerId: 'hv-01',
      }),
    ).toBe(false)
  })
})
