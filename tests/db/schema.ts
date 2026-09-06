import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Client } from 'pg'

const MIGRATIONS = 'supabase/migrations'

/**
 * Dựng lại toàn bộ schema từ đầu, chạy migration y như bản sẽ chạy trên Supabase,
 * kèm hai file stub dựng phần Supabase có sẵn mà Postgres trần không có.
 *
 * Chạy hết mọi migration theo thứ tự tên file, nên migration mới tự động vào test —
 * không phải nhớ cập nhật danh sách ở đây.
 */
export async function dungLaiSchema(db: Client): Promise<void> {
  await db.query('drop schema if exists public cascade')
  await db.query('drop schema if exists app cascade')
  await db.query('create schema public')

  await db.query(readFileSync('tests/db/local-auth-stub.sql', 'utf8'))

  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    await db.query(readFileSync(join(MIGRATIONS, file), 'utf8'))
  }

  await db.query(readFileSync('tests/db/local-grants.sql', 'utf8'))
}
