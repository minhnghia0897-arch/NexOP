/**
 * Vòng vận hành tuần (docs/OPERATIONS.md) chạy trên Postgres thật.
 *
 * Test từng mảnh rời không bắt được lỗi ở chỗ nối giữa các mảnh. Bước 7 là ví dụ:
 * `can()` và ràng buộc DB mỗi bên đúng theo cách hiểu riêng của mình, nhưng ghép lại
 * thì tin học phí không bao giờ gửi được — và không ai báo gì.
 *
 * Những bước cần bảng chưa dựng (assignments, submissions, drafts, reviews, profiles,
 * fees) nằm ở chặng 5–9; phần kiểm được tới đâu ghi rõ tới đó.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const EM = '22222222-2222-2222-2222-222222222222'
const TRO_GIANG = '44444444-4444-4444-4444-444444444444'
const TENANT = '55555555-5555-5555-5555-555555555555'
const LOP = '77777777-7777-7777-7777-777777777777'

maybe('vòng vận hành tuần trên Postgres thật', () => {
  let db: Client

  async function ghiSuKien(
    actorRole: string,
    action: string,
    objectType: string,
    actorId: string | null = CO,
  ): Promise<string | null> {
    try {
      await db.query(
        `select app.record_event($1, $2::actor_role, $3, $4, $5, $6, null, '{}'::jsonb, $7::uuid[])`,
        [TENANT, actorRole, action, objectType, LOP, actorId, [CO]],
      )
      return null
    } catch (error) {
      return (error as Error).message
    }
  }

  beforeAll(async () => {
    db = new Client({ connectionString: DATABASE_URL })
    await db.connect()
  })

  afterAll(async () => {
    await db?.end()
  })

  beforeEach(async () => {
    await dungLaiSchema(db)
    await db.query(
      `insert into accounts (id, email, phone, name) values
         ($1, 'co@x.vn', null, 'Cô Thảo'),
         ($2, null, '+84901000002', 'Nguyễn Minh Anh'),
         ($3, null, '+84901000004', 'Phạm Lan')`,
      [CO, EM, TRO_GIANG],
    )
    await db.query('insert into tenants (id, subdomain, owner_account_id) values ($1,$2,$3)', [
      TENANT, 'cothao', CO,
    ])
    await db.query(
      `insert into classes (id, tenant_id, name, status) values ($1,$2,'IELTS 6.5','running')`,
      [LOP, TENANT],
    )
    await db.query(
      `insert into memberships (account_id, tenant_id, class_id, role, status) values
         ($1,$4,null,'owner','active'),
         ($2,$4,$5,'student','active'),
         ($3,$4,$5,'assistant','active')`,
      [CO, EM, TRO_GIANG, TENANT, LOP],
    )
  })

  describe('bước 2 — máy đăng bảng tin (🟢 máy)', () => {
    it('máy tự đăng được bài giao', async () => {
      expect(await ghiSuKien('system', 'post.auto:publish', 'post', null)).toBeNull()
      await db.query(
        `insert into posts (class_id, kind, body) values ($1,'assignment','Task 2 — hạn T3 19:00')`,
        [LOP],
      )
      const { rows } = await db.query('select kind, author_id from posts')
      // Bài máy đăng không có tác giả người — đúng ràng buộc posts_author_matches_kind.
      expect(rows[0]).toMatchObject({ kind: 'assignment', author_id: null })
    })

    it('máy không tự viết bài thường thay cô', async () => {
      expect(await ghiSuKien('system', 'post.create', 'post', null)).toMatch(
        /events_system_may_only_draft/,
      )
    })
  })

  describe('bước 3–4 — máy nháp, cô gửi', () => {
    it('máy nháp được nhận xét', async () => {
      expect(await ghiSuKien('system', 'review.draft', 'review', null)).toBeNull()
    })

    it('máy không chốt được nhận xét', async () => {
      expect(await ghiSuKien('system', 'review.create', 'review', null)).toMatch(
        /events_system_may_only_draft/,
      )
    })

    it('cô gửi được nhận xét', async () => {
      expect(await ghiSuKien('owner', 'review.send', 'review')).toBeNull()
    })

    it('trợ giảng không gửi được, dù nháp thì được', async () => {
      expect(await ghiSuKien('assistant', 'review.draft', 'review', TRO_GIANG)).toBeNull()
      expect(await ghiSuKien('assistant', 'review.send', 'review', TRO_GIANG)).toMatch(
        /events_send_is_owner_only/,
      )
    })
  })

  describe('bước 7 — tin học phí (🟠 dính tiền)', () => {
    // Đây là chỗ đã hỏng: action ba đoạn `fee.message.send` không qua nổi regex cũ,
    // nên theo luật "ghi sự kiện trước", tin học phí không bao giờ gửi được.
    it('cô gửi được tin học phí', async () => {
      expect(await ghiSuKien('owner', 'fee.message.send', 'fee')).toBeNull()
    })

    it('máy nháp được tin nhưng không gửi', async () => {
      expect(await ghiSuKien('system', 'fee.propose', 'fee', null)).toBeNull()
      expect(await ghiSuKien('system', 'fee.message.send', 'fee', null)).toMatch(
        /events_system_may_only_draft|events_send_is_owner_only/,
      )
    })

    it('trợ giảng không gửi được tin học phí', async () => {
      expect(await ghiSuKien('assistant', 'fee.message.send', 'fee', TRO_GIANG)).toMatch(
        /events_send_is_owner_only/,
      )
    })

    it('cửa chặn máy soi đúng đoạn cuối của action ba đoạn', async () => {
      // Luật cũ lấy đoạn thứ hai — với `fee.message.send` ra 'message', không phải verb,
      // nên máy lọt qua. Kiểm bằng một action ba đoạn mà đoạn giữa trông như verb hợp lệ.
      expect(await ghiSuKien('system', 'fee.draft.create', 'fee', null)).toMatch(
        /events_system_may_only_draft/,
      )
      expect(await ghiSuKien('system', 'fee.message.draft', 'fee', null)).toBeNull()
    })
  })

  describe('bước 8 — máy đề xuất, cô quyết', () => {
    it('máy tạo được đề xuất', async () => {
      await db.query('select app.request_trial($1,$2,$3)', [TENANT, '+84909999999', 'Người lạ'])
      const { rows } = await db.query('select decided_at from proposals')
      expect(rows[0]).toMatchObject({ decided_at: null })
    })

    it('máy không tự mở lớp mới', async () => {
      expect(await ghiSuKien('system', 'class.create', 'class', null)).toMatch(
        /events_system_may_only_draft/,
      )
    })
  })

  describe('luật xuyên suốt — nhật ký đi trước và không sửa được', () => {
    it('mỗi bước để lại đúng một dòng nhật ký', async () => {
      await ghiSuKien('owner', 'assignment.create', 'assignment')
      await ghiSuKien('system', 'post.auto:publish', 'post', null)
      await ghiSuKien('owner', 'review.send', 'review')

      const { rows } = await db.query<{ action: string }>('select action from events order by at')
      expect(rows.map((r) => r.action)).toEqual([
        'assignment.create',
        'post.auto:publish',
        'review.send',
      ])
    })

    it('không sửa lại được lịch sử của một bước', async () => {
      await ghiSuKien('owner', 'review.send', 'review')
      await expect(db.query(`update events set action = 'review.draft'`)).rejects.toThrow(
        /chỉ được thêm/,
      )
    })
  })
})
