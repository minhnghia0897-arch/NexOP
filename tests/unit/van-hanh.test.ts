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

describe('thực thể trong ARCHITECTURE §2 mà permissions.json chưa phủ', () => {
  // can() mặc định đóng, nên object không có trong permissions.json thì mọi vai đều
  // bị từ chối — kể cả máy làm đúng việc của nó. Test này liệt kê chỗ hổng để nó
  // không lặng lẽ chặn nguyên một bước của vòng vận hành.
  const THUC_THE_CUA_VONG_VAN_HANH = [
    'proposal',     // bước 7 và 8: máy đề xuất, cô quyết
    'draft',        // bước 3: nháp chấm
    'practice_set', // bước 5: sinh bài luyện
    'attendance',   // đầu vào của bước 7
    'path',         // đầu vào của bước 1 và 8
  ]

  /**
   * Danh sách chỗ hổng ĐÃ BIẾT, chờ chốt. Không phải chuyện tôi tự quyết được:
   * thêm một dòng vào permissions.json là đặt ra chính sách quyền cho một thực thể,
   * mà file đó là nguồn duy nhất và `DECISIONS.md` mới là chỗ đổi cách làm.
   */
  const CHO_CHOT = ['proposal', 'draft', 'practice_set', 'attendance', 'path']

  it('chỗ hổng đúng bằng danh sách đã biết — có cái mới thì đỏ ở đây', () => {
    const chuaPhu = THUC_THE_CUA_VONG_VAN_HANH.filter((t) => !(t in DEFAULTS))
    expect(chuaPhu.sort()).toEqual([...CHO_CHOT].sort())
  })

  it('can() từ chối chúng — đóng chứ không mở, nhưng bước vận hành đứng im', () => {
    const may: Actor = { accountId: 'system', tenantId: TENANT, role: 'system', classIds: [LOP] }
    for (const type of CHO_CHOT) {
      // Máy đang làm đúng việc OPERATIONS.md giao mà vẫn bị chặn.
      expect(can(may, `${type}.propose`, trongLop(type)), type).toBe(false)
    }
  })
})
