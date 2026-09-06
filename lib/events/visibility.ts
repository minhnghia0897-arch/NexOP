/**
 * ARCHITECTURE §4: "visibility tính lúc ghi" — owner luôn thấy; học viên thấy nếu
 * object thuộc về em; trợ giảng thấy nếu chính mình là người làm.
 *
 * Tính lúc ghi chứ không lúc đọc, vì quyền thay đổi theo thời gian: trợ giảng bị gỡ
 * khỏi lớp hôm nay vẫn phải thấy việc mình đã làm hôm qua trong nhật ký của mình, và
 * học viên đã nghỉ không vì thế mà biến mất khỏi lịch sử.
 */
import type { Role } from '@/lib/auth/permissions'

export interface VisibilityInput {
  /** Chủ tên miền — luôn thấy mọi sự kiện trong tên miền của mình. */
  tenantOwnerId: string
  /** Ai gây ra sự kiện. Máy thì không có. */
  actorId: string | null
  actorRole: Role
  /** Account mà object thuộc về, nếu có chủ rõ ràng. */
  objectOwnerId?: string | undefined
}

export function visibilityFor(input: VisibilityInput): string[] {
  const seen = new Set<string>()

  // Cô luôn thấy toàn bộ tên miền của mình (UC-17).
  seen.add(input.tenantOwnerId)

  // Học viên thấy chuyện về chính mình — và chỉ chính mình.
  if (input.objectOwnerId) seen.add(input.objectOwnerId)

  // Trợ giảng thấy việc mình làm, không thấy việc người khác làm.
  if (input.actorRole === 'assistant' && input.actorId) seen.add(input.actorId)

  return [...seen]
}
