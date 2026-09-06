/**
 * Đọc docs/permissions.json thành bảng đã kiểm kiểu.
 *
 * File JSON là nguồn DUY NHẤT của ma trận quyền (README điều 5). Không gõ lại
 * ma trận ở bất kỳ đâu — kể cả trong test. Thêm object mới mà quên cập nhật JSON
 * thì hỏng ở đây, lúc nạp mô-đun, chứ không hỏng giữa một request.
 */
import matrix from '@/docs/permissions.json'

export const LEVELS = ['none', 'read', 'own', 'propose', 'full', 'auto'] as const
export type Level = (typeof LEVELS)[number]

export const ROLES = ['owner', 'assistant', 'student', 'parent', 'system'] as const
export type Role = (typeof ROLES)[number]

/** ARCHITECTURE §4: action theo mẫu <object>.<verb>. */
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
  own: new Set(['view', 'create', 'update']),
  propose: new Set(['view', 'draft', 'propose']),
  // "Tự làm": làm thẳng, không phải xin. Vẫn không vượt được trần cứng và SEND_ACTIONS.
  auto: new Set(['view', 'draft', 'propose', 'create', 'update', 'approve', 'reject']),
  full: new Set(VERBS),
}

export function levelAllows(level: Level, verb: Verb): boolean {
  // auto:* là nhánh riêng: chỉ mức `auto` và `full` chạm tới.
  if (verb.startsWith('auto:')) return level === 'auto' || level === 'full'
  return VERBS_BY_LEVEL[level].has(verb)
}

/** Cô cấp quyền cho trợ giảng — chặn ở đây thay vì tin vào giao diện. */
export function canGrantToAssistant(objectType: ObjectType, level: Level): boolean {
  if (HARD_CEILING.has(objectType)) return false
  return ASSISTANT_GRANTABLE.has(level)
}
