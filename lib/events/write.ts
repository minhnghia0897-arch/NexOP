import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { can, type Actor, type TargetObject } from '@/lib/auth/can'

import { visibilityFor } from './visibility'

/**
 * Ghi một sự kiện vào nhật ký.
 *
 * Dùng cho sự kiện đứng một mình — `*.view`, `*.export` — tức là những hành vi
 * không kèm thay đổi dữ liệu nào khác.
 *
 * Hành vi CÓ kèm thay đổi thì không đi qua đây. Nó phải là một hàm Postgres mà
 * câu lệnh đầu tiên gọi `app.record_event()`, để sự kiện và thay đổi cùng nằm
 * trong một transaction (xem đầu file supabase/migrations/0001_foundation.sql).
 * Ghi ở đây rồi mutate ở lời gọi sau là hai transaction — sai luật CLAUDE.md,
 * vì thay đổi vẫn có thể thành công khi sự kiện đã hỏng.
 */
export interface EventToRecord {
  actor: Actor
  action: string
  object: TargetObject
  /** Chủ tên miền, để tính visibility. */
  tenantOwnerId: string
  payload?: Record<string, unknown>
}

export class PermissionDenied extends Error {
  constructor(action: string, objectType: string) {
    super(`Không có quyền ${action} trên ${objectType}`)
    this.name = 'PermissionDenied'
  }
}

export async function recordEvent(
  client: SupabaseClient,
  event: EventToRecord,
): Promise<string> {
  // Quyền kiểm ở đây, không kiểm ở nơi gọi — một cửa duy nhất (CLAUDE.md).
  if (!can(event.actor, event.action, event.object)) {
    throw new PermissionDenied(event.action, event.object.type)
  }

  const { data, error } = await client.rpc('record_event', {
    p_tenant_id: event.object.tenantId,
    p_actor_role: event.actor.role,
    p_action: event.action,
    p_object_type: event.object.type,
    p_class_id: event.object.classId ?? null,
    p_actor_id: event.actor.role === 'system' ? null : event.actor.accountId,
    p_object_id: event.object.id ?? null,
    p_payload: event.payload ?? {},
    p_visibility: visibilityFor({
      tenantOwnerId: event.tenantOwnerId,
      actorId: event.actor.role === 'system' ? null : event.actor.accountId,
      actorRole: event.actor.role,
      objectOwnerId: event.object.ownerId,
    }),
  })

  // Ghi hỏng → hành vi không xảy ra. Ném ra, không nuốt.
  if (error) throw new Error(`Ghi sự kiện thất bại: ${error.message}`)

  return data as string
}
