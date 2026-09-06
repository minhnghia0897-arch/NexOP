/**
 * Hàm quyền DUY NHẤT. Mọi API route và server action gọi nó trước khi làm gì.
 * Không component nào tự kiểm tra quyền (CLAUDE.md, luật cứng).
 *
 * Thứ tự các cửa chặn dưới đây không đổi được — xem docs/LOGIC.md §3.
 * Mỗi cửa trả false là dừng hẳn, không cửa nào sau đó cứu lại được.
 */
import {
  DEFAULTS,
  HARD_CEILING,
  SEND_ACTIONS,
  levelAllows,
  type Level,
  type ObjectType,
  type Role,
  type Verb,
} from './permissions'

export interface Actor {
  accountId: string
  tenantId: string
  role: Role
  /** Lớp actor thuộc về. Vai owner để rỗng nghĩa là mọi lớp của tên miền. */
  classIds: readonly string[]
  /** Quyền cô cấp riêng, theo lớp rồi tới loại object. */
  permissions?: Readonly<Record<string, Readonly<Record<string, Level>>>>
}

export interface TargetObject {
  type: ObjectType
  id?: string
  tenantId: string
  classId?: string
  /** Account mà object này thuộc về — cơ sở cho mức `own`. */
  ownerId?: string
}

/** Máy đọc được để làm việc, nhưng chỉ ghi ra nháp và đề xuất (ARCHITECTURE §4). */
const SYSTEM_VERBS: ReadonlySet<string> = new Set(['view', 'draft', 'propose'])

function systemMayAttempt(verb: Verb): boolean {
  return verb.startsWith('auto:') || SYSTEM_VERBS.has(verb)
}

export function can(actor: Actor, action: string, object: TargetObject): boolean {
  const verb = action.slice(action.indexOf('.') + 1) as Verb
  if (!action.includes('.') || verb.length === 0) return false

  // 1. Máy: đọc thì được, nhưng ghi thì chỉ nháp/đề xuất/tự chạy.
  //    Chặn trước mọi thứ khác để không mức nào cấp ngược lại được.
  if (actor.role === 'system' && !systemMayAttempt(verb)) return false

  // 2. Khác tên miền thì không bàn thêm.
  if (object.tenantId !== actor.tenantId) return false

  // 3. Object thuộc một lớp mà actor không ở trong đó.
  //    Owner không liệt kê lớp — cô sở hữu cả tên miền.
  if (object.classId && actor.role !== 'owner' && !actor.classIds.includes(object.classId)) {
    return false
  }

  // 4. Gửi tới người thật: chỉ cô.
  if (SEND_ACTIONS.has(action) && actor.role !== 'owner') return false

  // 5. Trần cứng trợ giảng — bỏ qua mọi quyền đã cấp.
  if (actor.role === 'assistant' && HARD_CEILING.has(object.type)) return false

  // 6. Mức: cô cấp riêng theo lớp thắng mặc định theo vai.
  const granted = object.classId
    ? actor.permissions?.[object.classId]?.[object.type]
    : undefined
  const level = granted ?? DEFAULTS[object.type]?.[actor.role]

  // Object lạ, chưa có trong permissions.json → từ chối. Mặc định đóng, không mở.
  if (level === undefined) return false

  // 7. `own` chỉ áp lên đồ của chính mình. Không biết chủ là ai thì không cho.
  if (level === 'own' && object.ownerId !== actor.accountId) return false

  return levelAllows(level, verb)
}
