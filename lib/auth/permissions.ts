/**
 * Đọc docs/permissions.json thành bảng đã kiểm kiểu.
 *
 * File JSON là nguồn DUY NHẤT của ma trận quyền (README điều 5). Không gõ lại
 * ma trận ở bất kỳ đâu — kể cả trong test. Thêm object mới mà quên cập nhật JSON
 * thì hỏng ở đây, lúc nạp mô-đun, chứ không hỏng giữa một request.
 */
import matrix from '@/docs/permissions.json'

/**
 * Sáu mức cũ cộng `read_own`.
 *
 * `read_own` = **xem theo phạm vi, sửa của mình**. Nó sinh ra vì năm mức kia không diễn đạt
 * nổi một câu rất thường: trợ giảng phải ĐỌC được hồ sơ học viên trong lớp mình, và phải
 * SỬA được hồ sơ của chính mình. `read` thì không sửa được gì — kể cả tên mình; `own` thì chỉ
 * đọc được của mình — hết thấy học viên. Trước khi có mức này, trợ giảng ở mức `read` không
 * đổi nổi số điện thoại của bản thân, và đó không phải chính sách của ai cả: nó là chỗ mô
 * hình thiếu chữ.
 *
 * Ranh giới giữ nguyên kiểu của `can()`: MỨC quyết định được VIẾT gì, còn PHẠM VI ĐỌC vẫn do
 * các cửa trước (tên miền, lớp) chặn. Nên `read_own` không mở rộng gì về đọc — nó chỉ thêm
 * quyền sửa trên dòng của chính mình.
 */
export const LEVELS = ['none', 'read', 'read_own', 'own', 'propose', 'full', 'auto'] as const
export type Level = (typeof LEVELS)[number]

export const ROLES = ['owner', 'assistant', 'student', 'parent', 'system'] as const
export type Role = (typeof ROLES)[number]

/**
 * ARCHITECTURE §4: action theo mẫu <object>.<verb>.
 * `fee.message.send` trong permissions.json có ba đoạn — verb vẫn là đoạn cuối.
 */
export const VERBS = [
  'create', 'update', 'draft', 'propose', 'send', 'approve', 'reject', 'view', 'export',
] as const
export type Verb = (typeof VERBS)[number] | `auto:${string}`

export type ObjectType = string

function isLevel(value: string): value is Level {
  return (LEVELS as readonly string[]).includes(value)
}

/**
 * `events` ghi mức của owner là "full(class)" — đầy quyền nhưng chỉ trong lớp của mình.
 * Phần "(class)" đã được cửa chặn phạm vi lớp trong can() lo, nên ở đây chỉ bóc mức ra.
 */
function parseLevel(objectType: string, role: string, raw: unknown): Level {
  if (typeof raw !== 'string') {
    throw new Error(`permissions.json: ${objectType}.${role} phải là chuỗi, nhận ${typeof raw}`)
  }
  const level = raw.replace(/\(.*\)$/, '')
  if (!isLevel(level)) {
    throw new Error(`permissions.json: ${objectType}.${role} có mức lạ "${raw}"`)
  }
  return level
}

function buildDefaults(): Record<ObjectType, Record<Role, Level>> {
  const out: Record<string, Record<Role, Level>> = {}

  for (const [objectType, entry] of Object.entries(matrix.objects)) {
    const row = entry as Record<string, unknown>
    const parsed = {} as Record<Role, Level>

    for (const role of ROLES) {
      if (!(role in row)) {
        throw new Error(`permissions.json: ${objectType} thiếu vai "${role}"`)
      }
      parsed[role] = parseLevel(objectType, role, row[role])
    }
    out[objectType] = parsed
  }

  return out
}

export const DEFAULTS = buildDefaults()

export const OBJECT_TYPES = Object.keys(DEFAULTS)

/** Chỉ cô được gửi. Không cấp được, không cấu hình được, không có công tắc. */
export const SEND_ACTIONS: ReadonlySet<string> = new Set(matrix.send_actions_owner_only)

/** Trần cứng vai trợ giảng — bỏ qua mọi quyền cô đã cấp. */
export const HARD_CEILING: ReadonlySet<string> = new Set(matrix.assistant_hard_ceiling)

/**
 * Object mà `own` chỉ là quyền XEM.
 *
 * `ownerId` gộp hai quan hệ rất khác nhau: người VIẾT RA object, và người object NÓI VỀ.
 * Em viết bài nộp của em nên sửa được; nhưng em chỉ là chủ đề của nhận xét và dòng học
 * phí — hai thứ đó của cô. Không tách ra thì `own` cho em sửa nhận xét cô đã gửi.
 * ARCHITECTURE §3: lớp 1 chỉ thêm, lớp 2 máy ghi và cô sửa.
 */
export const OWN_IS_READ_ONLY: ReadonlySet<string> = new Set(matrix.own_is_subject_not_author)

/** Bốn mức cô cấp được cho trợ giảng: Không · Chỉ xem · Đề xuất · Tự làm. */
export const ASSISTANT_GRANTABLE: ReadonlySet<Level> = new Set(
  matrix.assistant_grantable_levels.map((level) => {
    if (!isLevel(level)) throw new Error(`permissions.json: mức cấp được lạ "${level}"`)
    return level
  }),
)

/**
 * Mức quyền KHÔNG phải thang bậc — đừng so sánh bằng `>`.
 * `propose` không bao hàm `own`: trợ giảng mức "Đề xuất" không sửa bài đăng của
 * chính mình nếu post chỉ cấp propose. Muốn thế thì cấp `own`.
 */
const VERBS_BY_LEVEL: Record<Level, ReadonlySet<string>> = {
  none: new Set(),
  read: new Set(['view']),
  // `create` KHÔNG có ở đây: `read_own` là "sửa cái của mình", không phải "tạo thêm cái mới".
  // Trợ giảng sửa hồ sơ của mình, chứ không tự tạo hồ sơ thứ hai.
  read_own: new Set(['view', 'update', 'export']),
  own: new Set(['view', 'create', 'update', 'export']),
  propose: new Set(['view', 'draft', 'propose']),
  // "Tự làm": làm thẳng, không phải xin. Vẫn không vượt được trần cứng và SEND_ACTIONS.
  auto: new Set(['view', 'draft', 'propose', 'create', 'update', 'approve', 'reject']),
  full: new Set(VERBS),
}

export function levelAllows(level: Level, verb: Verb, objectType?: ObjectType): boolean {
  // auto:* là nhánh riêng: chỉ mức `auto` và `full` chạm tới.
  if (verb.startsWith('auto:')) return level === 'auto' || level === 'full'

  // Chủ đề thì chỉ được xem, không được sửa.
  if ((level === 'own' || level === 'read_own') && objectType && OWN_IS_READ_ONLY.has(objectType)) {
    return verb === 'view' || verb === 'export'
  }

  return VERBS_BY_LEVEL[level].has(verb)
}

/** Cô cấp quyền cho trợ giảng — chặn ở đây thay vì tin vào giao diện. */
export function canGrantToAssistant(objectType: ObjectType, level: Level): boolean {
  if (HARD_CEILING.has(objectType)) return false
  return ASSISTANT_GRANTABLE.has(level)
}
