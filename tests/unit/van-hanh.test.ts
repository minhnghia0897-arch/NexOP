/**
 * Vòng vận hành tuần trong docs/OPERATIONS.md, soi qua can().
 *
 * Bảng ở OPERATIONS.md có cột "Ai": 🟢 máy tự chạy · 🔵 cô quyết · 🟠 dính tiền, luôn
 * qua tay cô. Test ở đây kiểm đúng cột đó cho từng bước — và quan trọng hơn, kiểm
 * những ai KHÔNG được làm bước nào.
 *
 * Một bước sai vai không hỏng ngay: nó chỉ khiến máy gửi mất một tin cho phụ huynh,
 * hoặc trợ giảng chốt mất một điểm số. Nên chốt ở đây.
 */
import { describe, expect, it } from 'vitest'

import { can, type Actor } from '@/lib/auth/can'
import { DEFAULTS, OBJECT_TYPES } from '@/lib/auth/permissions'

const TENANT = 'tenant-1'
const LOP = 'class-1'
const CO = 'account-co'
const EM = 'account-em'
const TRO_GIANG = 'account-tro-giang'

const co: Actor = { accountId: CO, tenantId: TENANT, role: 'owner', classIds: [] }
const may: Actor = { accountId: 'system', tenantId: TENANT, role: 'system', classIds: [LOP] }
const em: Actor = { accountId: EM, tenantId: TENANT, role: 'student', classIds: [LOP] }
const troGiang: Actor = {
  accountId: TRO_GIANG,
  tenantId: TENANT,
  role: 'assistant',
  classIds: [LOP],
}
/** Trợ giảng được cô bật "Tự làm" cho mọi việc cấp được — mức cao nhất có thể. */
const troGiangTuLam: Actor = {
  ...troGiang,
  permissions: Object.fromEntries([
    [LOP, Object.fromEntries(OBJECT_TYPES.map((t) => [t, 'auto' as const]))],
  ]),
}

function trongLop(type: string, ownerId?: string) {
  return { type, tenantId: TENANT, classId: LOP, ...(ownerId ? { ownerId } : {}) }
}

describe('bước 1 — cô giao bài từ lộ trình (🔵 cô)', () => {
  it('cô giao được', () => {
    expect(can(co, 'assignment.create', trongLop('assignment'))).toBe(true)
  })

  it('máy không tự giao bài', () => {
    expect(can(may, 'assignment.create', trongLop('assignment'))).toBe(false)
  })

  it('trợ giảng mặc định chỉ đề xuất, không giao', () => {
    expect(can(troGiang, 'assignment.propose', trongLop('assignment'))).toBe(true)
    expect(can(troGiang, 'assignment.create', trongLop('assignment'))).toBe(false)
  })
})

describe('bước 2 — máy đăng bảng tin và đặt nhắc (🟢 máy)', () => {
  it('máy tự đăng được', () => {
    expect(can(may, 'post.auto:publish', trongLop('post'))).toBe(true)
  })

  it('em đăng bài của em nhưng không ghim, không xoá bài người khác', () => {
    expect(can(em, 'post.create', trongLop('post', EM))).toBe(true)
    expect(can(em, 'post.update', trongLop('post', 'em-khac'))).toBe(false)
  })
})

describe('bước 3 — máy nháp chấm (🟢 máy)', () => {
  it('máy nháp được nhận xét', () => {
    expect(can(may, 'review.draft', trongLop('review'))).toBe(true)
  })

  it('máy đọc được bài nộp để mà chấm', () => {
    // Cửa chặn máy phải cho `view`, nếu không job chấm không lấy nổi bài.
    expect(can(may, 'submission.view', trongLop('submission'))).toBe(true)
  })

  it('máy không bao giờ tự chốt nhận xét', () => {
    expect(can(may, 'review.create', trongLop('review'))).toBe(false)
    expect(can(may, 'review.send', trongLop('review'))).toBe(false)
  })
})

describe('bước 4 — cô duyệt và gửi (🔵 cô)', () => {
  it('chỉ cô gửi được nhận xét', () => {
    expect(can(co, 'review.send', trongLop('review'))).toBe(true)
    for (const ai of [may, em, troGiang, troGiangTuLam]) {
      expect(can(ai, 'review.send', trongLop('review')), ai.role).toBe(false)
    }
  })

  it('trợ giảng dù bật "Tự làm" vẫn chỉ tới mức nháp', () => {
    expect(can(troGiangTuLam, 'review.draft', trongLop('review'))).toBe(true)
    expect(can(troGiangTuLam, 'review.send', trongLop('review'))).toBe(false)
  })
})

describe('bước 5 — máy cập nhật hồ sơ và ma trận điểm (🟢 máy)', () => {
  it('máy tự cập nhật được', () => {
    expect(can(may, 'profile.auto:recompute', trongLop('profile'))).toBe(true)
    expect(can(may, 'gradebook.auto:recompute', trongLop('gradebook'))).toBe(true)
  })

  it('em không sửa được hồ sơ năng lực của mình', () => {
    // Hồ sơ là lớp 2, máy ghi và cô sửa. Em sửa được thì mọi đề xuất mất nghĩa.
    expect(can(em, 'profile.view', trongLop('profile', EM))).toBe(true)
    expect(can(em, 'profile.update', trongLop('profile', EM))).toBe(false)
  })
})

describe('bước 6 — cô đọc "cả lớp sai chung ở đâu" (🔵 cô)', () => {
  it('cô đọc được hồ sơ cả lớp', () => {
    expect(can(co, 'profile.view', trongLop('profile', EM))).toBe(true)
  })

  it('em không đọc được hồ sơ của bạn', () => {
    expect(can(em, 'profile.view', trongLop('profile', 'em-khac'))).toBe(false)
  })

  it('em không đọc được ma trận điểm cả lớp', () => {
    expect(can(em, 'gradebook.view', trongLop('gradebook'))).toBe(false)
  })
})

describe('bước 7 — học phí: máy nháp, cô gửi (🟠 dính tiền)', () => {
  it('máy nháp được tin học phí', () => {
    expect(can(may, 'fee.propose', trongLop('fee'))).toBe(true)
  })

  it('không ai ngoài cô gửi được tin học phí — không có công tắc nào mở ra', () => {
    expect(can(co, 'fee.message.send', trongLop('fee'))).toBe(true)
    for (const ai of [may, em, troGiang, troGiangTuLam]) {
      expect(can(ai, 'fee.message.send', trongLop('fee')), ai.role).toBe(false)
    }
  })

  it('trợ giảng không chạm được vào học phí ở bất kỳ mức nào', () => {
    for (const verb of ['view', 'create', 'update', 'propose', 'draft']) {
      expect(can(troGiangTuLam, `fee.${verb}`, trongLop('fee')), verb).toBe(false)
    }
  })
})

describe('bước 8 — lên lớp / mở lớp mới: máy đề xuất, cô quyết (🟠)', () => {
  it('chỉ cô mở được lớp mới', () => {
    expect(can(co, 'class.create', { type: 'class', tenantId: TENANT })).toBe(true)
    expect(can(may, 'class.create', { type: 'class', tenantId: TENANT })).toBe(false)
  })

  it('máy không tự thêm học viên vào lớp', () => {
    expect(can(may, 'membership.create', trongLop('membership'))).toBe(false)
    expect(can(may, 'membership.propose', trongLop('membership'))).toBe(true)
  })
})

describe('luật xuyên suốt mọi bước', () => {
  it('máy không bao giờ ghi được lớp 1', () => {
    // ARCHITECTURE §3: lớp 1 là submissions, reviews, fees, attendance, posts, events.
    const lop1 = ['submission', 'review', 'fee', 'post', 'events']
    for (const type of lop1) {
      for (const verb of ['create', 'update', 'send', 'approve']) {
        expect(can(may, `${type}.${verb}`, trongLop(type)), `${type}.${verb}`).toBe(false)
      }
    }
  })

  it('không vai nào ngoài cô làm được ba hành vi "gửi"', () => {
    for (const action of ['review.send', 'message.send', 'fee.message.send']) {
      const type = action.split('.')[0]!
      for (const ai of [may, em, troGiang, troGiangTuLam]) {
        expect(can(ai, action, trongLop(type)), `${ai.role} · ${action}`).toBe(false)
      }
    }
  })

  it('người ngoài lớp không chạm được bước nào của lớp đó', () => {
    const nguoiLopKhac: Actor = { ...troGiang, classIds: ['class-2'] }
    for (const type of OBJECT_TYPES) {
      expect(can(nguoiLopKhac, `${type}.view`, trongLop(type)), type).toBe(false)
    }
  })
})

describe('năm thực thể của vòng vận hành, chốt theo LOGIC.md §8.1', () => {
  // can() mặc định đóng: object không có trong permissions.json thì MỌI vai bị từ chối,
  // kể cả máy làm đúng việc OPERATIONS.md giao — và không chỗ nào báo, bước vận hành
  // chỉ lặng lẽ đứng im. Trước đây năm dòng này còn trống; nay đã chốt.
  const THUC_THE_CUA_VONG_VAN_HANH = [
    'proposal',     // bước 7 và 8: máy đề xuất, cô quyết
    'draft',        // bước 3: nháp chấm
    'practice_set', // bước 5: sinh bài luyện
    'attendance',   // đầu vào của bước 7
    'path',         // đầu vào của bước 1 và 8
  ]

  it('không còn thực thể nào của vòng vận hành nằm ngoài permissions.json', () => {
    expect(THUC_THE_CUA_VONG_VAN_HANH.filter((t) => !(t in DEFAULTS))).toEqual([])
  })

  it('máy đề xuất được nháp, bài luyện, đề xuất — nhưng không chạm lộ trình và điểm danh', () => {
    const may: Actor = { accountId: 'system', tenantId: TENANT, role: 'system', classIds: [LOP] }
    for (const type of ['draft', 'practice_set', 'proposal']) {
      expect(can(may, `${type}.propose`, trongLop(type)), type).toBe(true)
    }
    // Lộ trình là tài sản của cô; điểm danh là việc của người có mặt trong buổi học.
    for (const type of ['path', 'attendance']) {
      expect(can(may, `${type}.propose`, trongLop(type)), type).toBe(false)
    }
  })

  it('máy vẫn không GỬI được gì — cửa 1 chặn trước mọi mức quyền', () => {
    const may: Actor = { accountId: 'system', tenantId: TENANT, role: 'system', classIds: [LOP] }
    expect(can(may, 'draft.send', trongLop('draft'))).toBe(false)
    expect(can(may, 'practice_set.create', trongLop('practice_set'))).toBe(false)
  })

  it('em không thấy nháp chấm, dù đó là nháp của chính bài em', () => {
    const em: Actor = { accountId: EM, tenantId: TENANT, role: 'student', classIds: [LOP] }
    const nhapCuaEm = { ...trongLop('draft'), ownerId: EM }
    expect(can(em, 'draft.view', nhapCuaEm)).toBe(false)
  })

  it('em làm được bài luyện của em, không đụng bài luyện của bạn', () => {
    const em: Actor = { accountId: EM, tenantId: TENANT, role: 'student', classIds: [LOP] }
    expect(can(em, 'practice_set.update', { ...trongLop('practice_set'), ownerId: EM })).toBe(true)
    expect(can(em, 'practice_set.view', { ...trongLop('practice_set'), ownerId: 'hv-khac' })).toBe(false)
  })

  it('trợ giảng điểm danh tự có hiệu lực, nhưng không đụng lộ trình của cô', () => {
    const tg: Actor = { accountId: TRO_GIANG, tenantId: TENANT, role: 'assistant', classIds: [LOP] }
    expect(can(tg, 'attendance.update', trongLop('attendance'))).toBe(true)
    expect(can(tg, 'path.view', trongLop('path'))).toBe(false)
  })

  it('em chỉ LÀ CHỦ ĐỀ của điểm danh — xem được, sửa thì không', () => {
    const em: Actor = { accountId: EM, tenantId: TENANT, role: 'student', classIds: [LOP] }
    const cuaEm = { ...trongLop('attendance'), ownerId: EM }
    expect(can(em, 'attendance.view', cuaEm)).toBe(true)
    expect(can(em, 'attendance.update', cuaEm)).toBe(false)
  })
})
