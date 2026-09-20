import { describe, expect, it } from 'vitest'

import { can, type Actor } from '@/lib/auth/can'
import {
  ASSISTANT_GRANTABLE,
  OWN_IS_READ_ONLY,
  DEFAULTS,
  HARD_CEILING,
  LEVELS,
  OBJECT_TYPES,
  ROLES,
  SEND_ACTIONS,
  canGrantToAssistant,
  levelAllows,
  type Level,
} from '@/lib/auth/permissions'

const TENANT = 'tenant-1'
const CLASS = 'class-1'
const CO = 'account-co'
const EM = 'account-em'
const TRO_GIANG = 'account-tro-giang'

function actor(overrides: Partial<Actor> = {}): Actor {
  return {
    accountId: CO,
    tenantId: TENANT,
    role: 'owner',
    classIds: [CLASS],
    ...overrides,
  }
}

describe('ma trận quyền', () => {
  it('permissions.json phủ đủ 21 object × 5 vai', () => {
    /*
     * Con số này là một cái chốt, không phải một con số trang trí. Hai lần nó bắt được lỗi
     * thật, cả hai lần là một object THIẾU HẲN dòng trong ma trận:
     *
     *   · `teacher_notes` nằm trong `assistant_hard_ceiling` mà không có dòng trong `objects`
     *     → `can()` từ chối với MỌI vai, kể cả cô, chủ của ghi chú. Chỗ gọi phải tự đoán bằng
     *     `vai === 'owner'`, đúng thứ CLAUDE.md cấm.
     *   · `account` (hồ sơ tài khoản: tên, số điện thoại) không có dòng nào, nên không ai sửa
     *     nổi tên của chính mình. Trợ giảng ở mức `profile: read` bị chặn, mà `profile` lại là
     *     hồ sơ NĂNG LỰC — hai thứ khác nhau bị gộp làm một chữ.
     */
    expect(OBJECT_TYPES).toHaveLength(21)
    for (const type of OBJECT_TYPES) {
      for (const role of ROLES) {
        expect(DEFAULTS[type]?.[role], `${type}.${role}`).toBeDefined()
      }
    }
  })

  it('mọi object trong trần cứng đều CÓ dòng trong ma trận', () => {
    /*
     * Bất biến này từng bị vi phạm bởi `teacher_notes`, và vi phạm im lặng: cửa 5 chặn trợ
     * giảng đúng, nhưng cửa 6 rồi chặn luôn CÔ vì không tìm thấy mức nào. "Mặc định đóng" là
     * đúng, nhưng nó biến một dòng thiếu thành một tính năng cô không dùng được, và không
     * chỗ nào báo.
     */
    for (const type of HARD_CEILING) {
      expect(DEFAULTS[type], `trần cứng "${type}" không có dòng trong objects`).toBeDefined()
    }
  })

  // Chạy hết ma trận: mọi ô đều phải cho đúng những verb mức đó cho phép,
  // và từ chối những verb nó không cho. Thêm object mà quên cập nhật JSON → đỏ.
  it('mỗi ô trong ma trận cư xử đúng mức của nó', () => {
    for (const type of OBJECT_TYPES) {
      for (const role of ROLES) {
        const level = DEFAULTS[type]![role]
        const a = actor({
          role,
          accountId: role === 'owner' ? CO : EM,
          classIds: [CLASS],
        })
        const object = { type, tenantId: TENANT, ownerId: role === 'owner' ? CO : EM }

        for (const verb of ['view', 'create', 'update', 'draft', 'propose', 'export'] as const) {
          const action = `${type}.${verb}`

          // Ba cửa chặn có thể phủ quyết mức, nên chỉ đối chiếu khi không cửa nào bật.
          const blockedBySystemGate = role === 'system' && !['view', 'draft', 'propose'].includes(verb)
          const blockedByCeiling = role === 'assistant' && HARD_CEILING.has(type)
          const blockedBySend = SEND_ACTIONS.has(action) && role !== 'owner'

          const expected =
            blockedBySystemGate || blockedByCeiling || blockedBySend
              ? false
              // Truyền cả object: với object mà người đó chỉ LÀ CHỦ ĐỀ (nhận xét,
              // học phí, hồ sơ), mức `own` chỉ là quyền xem.
              : levelAllows(level, verb, type)

          expect(can(a, action, object), `${role} · ${action} · mức ${level}`).toBe(expected)
        }
      }
    }
  })
})

describe('các cửa chặn, theo đúng thứ tự', () => {
  it('1 · máy đọc được nhưng không tạo được', () => {
    const may = actor({ role: 'system', accountId: 'system' })
    expect(can(may, 'submission.view', { type: 'submission', tenantId: TENANT })).toBe(true)
    expect(can(may, 'review.create', { type: 'review', tenantId: TENANT })).toBe(false)
    expect(can(may, 'review.update', { type: 'review', tenantId: TENANT })).toBe(false)
  })

  it('1 · máy được nháp, đề xuất và tự chạy', () => {
    const may = actor({ role: 'system', accountId: 'system' })
    expect(can(may, 'review.propose', { type: 'review', tenantId: TENANT })).toBe(true)
    expect(can(may, 'profile.auto:recompute', { type: 'profile', tenantId: TENANT })).toBe(true)
  })

  it('2 · khác tên miền thì chặn, dù là cô', () => {
    expect(can(actor(), 'class.update', { type: 'class', tenantId: 'tenant-khac' })).toBe(false)
  })

  it('3 · không ở trong lớp thì không thấy đồ của lớp', () => {
    const troGiang = actor({ role: 'assistant', accountId: TRO_GIANG, classIds: ['class-2'] })
    expect(can(troGiang, 'assignment.view', { type: 'assignment', tenantId: TENANT, classId: CLASS })).toBe(false)
    expect(can(troGiang, 'assignment.view', { type: 'assignment', tenantId: TENANT, classId: 'class-2' })).toBe(true)
  })

  it('3 · cô không cần liệt kê lớp — cô sở hữu cả tên miền', () => {
    const co = actor({ classIds: [] })
    expect(can(co, 'assignment.view', { type: 'assignment', tenantId: TENANT, classId: 'lop-bat-ky' })).toBe(true)
  })

  it('4 · gửi chỉ do cô, kể cả khi được cấp mức cao nhất', () => {
    for (const action of SEND_ACTIONS) {
      const type = action.split('.')[0]!
      for (const role of ['assistant', 'student', 'parent', 'system'] as const) {
        const a = actor({
          role,
          accountId: TRO_GIANG,
          // Cấp thẳng mức full cho lớp này — cửa 4 vẫn phải thắng.
          permissions: { [CLASS]: { [type]: 'full' } },
        })
        expect(can(a, action, { type, tenantId: TENANT, classId: CLASS }), `${role} · ${action}`).toBe(false)
      }
    }
  })

  it('5 · trần cứng trợ giảng thắng cả quyền cô cấp nhầm', () => {
    for (const type of HARD_CEILING) {
      const troGiang = actor({
        role: 'assistant',
        accountId: TRO_GIANG,
        permissions: { [CLASS]: { [type]: 'full' } },
      })
      expect(can(troGiang, `${type}.view`, { type, tenantId: TENANT, classId: CLASS }), type).toBe(false)
    }
  })

  it('6 · quyền cô cấp theo lớp thắng mặc định theo vai', () => {
    const base = { role: 'assistant' as const, accountId: TRO_GIANG }
    const object = { type: 'assignment', tenantId: TENANT, classId: CLASS }

    // Mặc định assignment cho assistant là propose → không create được.
    expect(can(actor(base), 'assignment.create', object)).toBe(false)
    // Cô bật "Tự làm" cho riêng lớp này.
    const tuLam = actor({ ...base, permissions: { [CLASS]: { assignment: 'auto' } } })
    expect(can(tuLam, 'assignment.create', object)).toBe(true)
  })

  it('6 · object lạ thì đóng, không mở', () => {
    expect(can(actor(), 'thu_la.view', { type: 'thu_la', tenantId: TENANT })).toBe(false)
  })

  it('7 · own chỉ áp lên đồ của chính mình', () => {
    const em = actor({ role: 'student', accountId: EM, classIds: [CLASS] })
    expect(can(em, 'submission.view', { type: 'submission', tenantId: TENANT, ownerId: EM })).toBe(true)
    expect(can(em, 'submission.view', { type: 'submission', tenantId: TENANT, ownerId: 'em-khac' })).toBe(false)
    // Không biết chủ là ai thì không cho — mặc định đóng.
    expect(can(em, 'submission.view', { type: 'submission', tenantId: TENANT })).toBe(false)
  })
})

describe('học viên không thấy dữ liệu của học viên khác', () => {
  /*
   * Hai mức cho em đọc đồ của người khác, và cả hai đều CÓ CHỦ Ý — nên phải liệt kê tên từng
   * object, không chỉ tên mức.
   *
   * `class`/`assignment` ở mức `read`: đề bài và lịch lớp là của cả lớp, không của em nào.
   * `account` ở mức `read_own`: tên bạn cùng lớp, hiện đúng một chỗ — bảng tin lớp. Em sửa
   * thì chỉ sửa hồ sơ của chính mình.
   * `path_progress` ở mức `read`: lớp đang ở chặng nào. Là số liệu của LỚP, không của em nào
   * — và cố ý tách khỏi `path` (vẫn `none` với em) để em thấy chặng mà không thấy nội dung
   * cô soạn hay đề sắp giao.
   *
   * Danh sách trắng này là chỗ đắt nhất trong file: thêm một object vào đây là mở một đường
   * cho em đọc đồ của bạn, nên nó phải là một dòng người ta thấy khi đọc diff.
   */
  const DOC_DUOC_CUA_NGUOI_KHAC = new Set(['class', 'assignment', 'account', 'path_progress'])

  it('không object nào lọt ngoài danh sách trắng', () => {
    const em = actor({ role: 'student', accountId: EM, classIds: [CLASS] })
    for (const type of OBJECT_TYPES) {
      const cuaEmKhac = { type, tenantId: TENANT, classId: CLASS, ownerId: 'em-khac' }
      const level = DEFAULTS[type]!.student
      if (!DOC_DUOC_CUA_NGUOI_KHAC.has(type)) {
        expect(can(em, `${type}.view`, cuaEmKhac), `${type} (mức ${level})`).toBe(false)
      }
    }
  })

  it('danh sách trắng không có object nào mang DỮ LIỆU của một em cụ thể', () => {
    /* Tên thì được; band, bài nộp, học phí, nháp của máy thì không. Chốt bằng tên object để
       một lần nới danh sách trắng sang `submission` là đỏ ngay ở đây. */
    for (const nhay of ['submission', 'review', 'draft', 'fee', 'gradebook', 'profile', 'path']) {
      expect(DOC_DUOC_CUA_NGUOI_KHAC.has(nhay), nhay).toBe(false)
    }
  })

  it('em sửa được hồ sơ tài khoản của mình, không sửa của bạn', () => {
    const em = actor({ role: 'student', accountId: EM, classIds: [CLASS] })
    const hs = (ownerId: string) => ({ type: 'account', tenantId: TENANT, classId: CLASS, ownerId })
    expect(can(em, 'account.update', hs(EM))).toBe(true)
    expect(can(em, 'account.update', hs('em-khac'))).toBe(false)
    // `read_own` KHÔNG cho tạo: em không tự mở hồ sơ thứ hai.
    expect(can(em, 'account.create', hs(EM))).toBe(false)
  })

  it('em không bao giờ thấy nháp của máy', () => {
    const em = actor({ role: 'student', accountId: EM, classIds: [CLASS] })
    for (const verb of ['view', 'update'] as const) {
      expect(can(em, `draft.${verb}`, { type: 'draft', tenantId: TENANT, ownerId: EM })).toBe(false)
    }
  })
})

describe('cấp quyền cho trợ giảng', () => {
  it('bốn mức cấp được đúng bằng Không · Chỉ xem · Đề xuất · Tự làm', () => {
    expect([...ASSISTANT_GRANTABLE].sort()).toEqual(['auto', 'none', 'propose', 'read'])
  })

  it('không cấp được mức ngoài danh sách', () => {
    const ngoaiDanhSach = LEVELS.filter((l) => !ASSISTANT_GRANTABLE.has(l))
    for (const level of ngoaiDanhSach) {
      expect(canGrantToAssistant('assignment', level), level).toBe(false)
    }
  })

  it('không cấp được gì chạm trần cứng, kể cả mức thấp nhất', () => {
    for (const type of HARD_CEILING) {
      for (const level of LEVELS) {
        expect(canGrantToAssistant(type, level as Level), `${type}/${level}`).toBe(false)
      }
    }
  })
})

describe('mức quyền không phải thang bậc', () => {
  // Nếu ai đó cài lại can() bằng so sánh `>` thì mấy khẳng định này đỏ.
  it('propose không bao hàm own', () => {
    expect(levelAllows('propose', 'update')).toBe(false)
    expect(levelAllows('own', 'update')).toBe(true)
  })

  it('own không bao hàm propose', () => {
    expect(levelAllows('own', 'draft')).toBe(false)
    expect(levelAllows('propose', 'draft')).toBe(true)
  })

  it('auto:* chỉ tới được từ auto và full', () => {
    for (const level of LEVELS) {
      expect(levelAllows(level, 'auto:recompute'), level).toBe(level === 'auto' || level === 'full')
    }
  })
})


describe('`own` là chủ đề, không phải người viết', () => {
  // ownerId gộp hai quan hệ: người VIẾT RA object, và người object NÓI VỀ. Không tách
  // thì em sửa được nhận xét cô đã gửi và sửa được dòng học phí của mình.
  const em = actor({ role: 'student', accountId: EM, classIds: [CLASS] })
  const cuaEm = (type: string) => ({ type, tenantId: TENANT, classId: CLASS, ownerId: EM })

  it('em sửa được thứ em viết ra', () => {
    expect(can(em, 'submission.update', cuaEm('submission'))).toBe(true)
    expect(can(em, 'post.update', cuaEm('post'))).toBe(true)
  })

  it('em KHÔNG sửa được thứ chỉ nói về em', () => {
    for (const type of OWN_IS_READ_ONLY) {
      expect(can(em, `${type}.update`, cuaEm(type)), type).toBe(false)
      expect(can(em, `${type}.create`, cuaEm(type)), type).toBe(false)
    }
  })

  it('nhưng vẫn xem được, vì đó là chuyện của em', () => {
    for (const type of OWN_IS_READ_ONLY) {
      const mucCuaEm = DEFAULTS[type]?.student
      if (mucCuaEm === 'own') {
        expect(can(em, `${type}.view`, cuaEm(type)), type).toBe(true)
      }
    }
  })

  it('em xuất được dữ liệu của chính mình (permissions.json: export/student = own)', () => {
    expect(can(em, 'export.export', cuaEm('export'))).toBe(true)
    expect(can(em, 'export.export', { type: 'export', tenantId: TENANT, ownerId: 'em-khac' })).toBe(false)
  })
})

describe('action ba đoạn', () => {
  // permissions.json có `fee.message.send`. Tách verb kiểu "mọi thứ sau dấu chấm đầu"
  // cho ra "message.send" — không khớp mức nào, nên đến cô cũng không gửi được.
  it('verb là đoạn cuối, nên cô gửi được tin học phí', () => {
    expect(can(actor(), 'fee.message.send', { type: 'fee', tenantId: TENANT })).toBe(true)
  })

  it('vẫn chỉ cô, không ai khác', () => {
    for (const role of ['assistant', 'student', 'parent', 'system'] as const) {
      const ai = actor({ role, accountId: TRO_GIANG })
      expect(can(ai, 'fee.message.send', { type: 'fee', tenantId: TENANT }), role).toBe(false)
    }
  })
})
