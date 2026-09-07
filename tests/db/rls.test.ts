/**
 * Test RLS và tính nguyên tử của nhật ký, chạy trên Postgres thật.
 *
 * Đọc migration y như bản sẽ chạy trên Supabase, cộng thêm hai file stub dựng phần
 * Supabase có sẵn (schema `auth`, các vai, quyền bảng). Không mô phỏng RLS — nếu
 * chính sách sai thì ở đây đỏ.
 *
 * Bỏ qua khi không có DATABASE_URL, để `pnpm test` trên máy trống vẫn chạy được.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const EM = '22222222-2222-2222-2222-222222222222'
const EM_KHAC = '33333333-3333-3333-3333-333333333333'
const TRO_GIANG = '44444444-4444-4444-4444-444444444444'
const TENANT = '55555555-5555-5555-5555-555555555555'
const NGUOI_LA = '66666666-6666-6666-6666-666666666666'

maybe('RLS và nhật ký trên Postgres thật', () => {
  let db: Client

  /** Đọc bảng dưới danh nghĩa một account, đúng như phiên đăng nhập thật. */
  async function asAccount<T extends Record<string, unknown>>(
    accountId: string,
    sql: string,
  ): Promise<T[]> {
    await db.query('begin')
    try {
      await db.query('set local role authenticated')
      await db.query('select set_config($1, $2, true)', ['request.jwt.claim.sub', accountId])
      const { rows } = await db.query<T>(sql)
      return rows
    } finally {
      await db.query('rollback')
    }
  }

  beforeAll(async () => {
    db = new Client({ connectionString: DATABASE_URL })
    await db.connect()

    await dungLaiSchema(db)

    await db.query(
      `insert into accounts (id, email, phone, name) values
         ($1, 'co.thao@example.com', null,          'Cô Thảo'),
         ($2, null,                  '+84901000002', 'Nguyễn Minh Anh'),
         ($3, null,                  '+84901000003', 'Trần Thu Hà'),
         ($4, null,                  '+84901000004', 'Phạm Lan'),
         ($5, null,                  '+84901000009', 'Người lạ')`,
      [CO, EM, EM_KHAC, TRO_GIANG, NGUOI_LA],
    )
    // Tên miền đã được admin duyệt (0009). Chưa duyệt thì đọc rỗng và ghi không được,
    // nên mọi test bên dưới sẽ đỏ — đó là ý đồ của cửa chặn, không phải phiền toái.
    await db.query(
      `insert into tenants (id, subdomain, owner_account_id, status, approved_at)
       values ($1, $2, $3, 'active', now())`,
      [TENANT, 'cothao', CO],
    )
    await db.query(
      `insert into memberships (account_id, tenant_id, role, status) values
         ($1, $5, 'owner',     'active'),
         ($2, $5, 'student',   'active'),
         ($3, $5, 'student',   'active'),
         ($4, $5, 'assistant', 'active')`,
      [CO, EM, EM_KHAC, TRO_GIANG, TENANT],
    )
  })

  afterAll(async () => {
    await db?.end()
  })

  describe('accounts — mỗi người chỉ thấy dòng của mình', () => {
    it('em chỉ đọc được đúng một dòng, là em', async () => {
      const rows = await asAccount<{ id: string }>(EM, 'select id from accounts')
      expect(rows.map((r) => r.id)).toEqual([EM])
    })

    it('cô cũng không đọc được dòng tài khoản của em', async () => {
      const rows = await asAccount<{ id: string }>(CO, 'select id from accounts')
      expect(rows.map((r) => r.id)).toEqual([CO])
    })
  })

  describe('tenants — chỉ thành viên còn hoạt động mới thấy', () => {
    it('em thấy tên miền của cô', async () => {
      const rows = await asAccount(EM, 'select id from tenants')
      expect(rows).toHaveLength(1)
    })

    it('người lạ không thấy gì', async () => {
      const rows = await asAccount(NGUOI_LA, 'select id from tenants')
      expect(rows).toHaveLength(0)
    })
  })

  describe('memberships — permissions.json cho mỗi owner', () => {
    it('cô thấy cả bốn tư cách', async () => {
      const rows = await asAccount(CO, 'select id from memberships')
      expect(rows).toHaveLength(4)
    })

    it('trợ giảng không thấy dòng nào, kể cả dòng của chính mình', async () => {
      const rows = await asAccount(TRO_GIANG, 'select id from memberships')
      expect(rows).toHaveLength(0)
    })

    it('em không thấy danh sách lớp có những ai', async () => {
      const rows = await asAccount(EM, 'select id from memberships')
      expect(rows).toHaveLength(0)
    })
  })

  describe('events — đúng bằng visibility tính lúc ghi', () => {
    beforeAll(async () => {
      // Bài của em: cô thấy, em thấy, em khác không.
      await db.query(
        `select app.record_event($1, 'student', 'submission.create', 'submission',
                                 null, $2, null, '{}'::jsonb, $3::uuid[])`,
        [TENANT, EM, [CO, EM]],
      )
      // Việc trợ giảng làm: cô thấy, trợ giảng thấy.
      await db.query(
        `select app.record_event($1, 'assistant', 'review.draft', 'review',
                                 null, $2, null, '{}'::jsonb, $3::uuid[])`,
        [TENANT, TRO_GIANG, [CO, TRO_GIANG]],
      )
    })

    it('cô thấy cả hai', async () => {
      const rows = await asAccount(CO, 'select action from events order by action')
      expect(rows.map((r) => (r as { action: string }).action)).toEqual([
        'review.draft',
        'submission.create',
      ])
    })

    it('em chỉ thấy chuyện của mình', async () => {
      const rows = await asAccount(EM, 'select action from events')
      expect(rows.map((r) => (r as { action: string }).action)).toEqual(['submission.create'])
    })

    it('em khác không thấy bài của em', async () => {
      const rows = await asAccount(EM_KHAC, 'select action from events')
      expect(rows).toHaveLength(0)
    })

    it('trợ giảng chỉ thấy việc mình làm', async () => {
      const rows = await asAccount(TRO_GIANG, 'select action from events')
      expect(rows.map((r) => (r as { action: string }).action)).toEqual(['review.draft'])
    })
  })

  describe('ràng buộc chặn hành vi bị cấm', () => {
    async function thu(sql: string, params: unknown[] = []): Promise<string | null> {
      try {
        await db.query(sql, params)
        return null
      } catch (error) {
        return (error as Error).message
      }
    }

    it('máy không tạo được nhận xét', async () => {
      const loi = await thu(
        `insert into events (tenant_id, actor_role, action, object_type)
         values ($1, 'system', 'review.create', 'review')`,
        [TENANT],
      )
      expect(loi).toMatch(/events_system_may_only_draft/)
    })

    it('trợ giảng không gửi được nhận xét', async () => {
      const loi = await thu(
        `insert into events (tenant_id, actor_id, actor_role, action, object_type)
         values ($1, $2, 'assistant', 'review.send', 'review')`,
        [TENANT, TRO_GIANG],
      )
      expect(loi).toMatch(/events_send_is_owner_only/)
    })

    it('nhật ký không sửa được', async () => {
      expect(await thu(`update events set action = 'x.view'`)).toMatch(/chỉ được thêm/)
    })

    it('nhật ký không xoá được', async () => {
      expect(await thu('delete from events')).toMatch(/chỉ được thêm/)
    })
  })

  describe('ghi sự kiện trước — hỏng thì hành vi không xảy ra', () => {
    beforeAll(async () => {
      // Một mutation mẫu theo đúng hợp đồng: câu lệnh đầu tiên là record_event,
      // rồi mới tới thay đổi. Ở đây thay đổi cố tình hỏng.
      await db.query(`
        create function app.demo_mutation_hong(p_tenant uuid, p_actor uuid) returns void
        language plpgsql as $fn$
        begin
          perform app.record_event(p_tenant, 'owner', 'class.create', 'class',
                                   null, p_actor, null, '{}'::jsonb, array[p_actor]);
          -- Thay đổi thật hỏng ở đây.
          insert into tenants (subdomain, owner_account_id) values ('KHONG HOP LE', p_actor);
        end;
        $fn$;
      `)
    })

    it('mutation hỏng thì sự kiện cũng không còn lại', async () => {
      const truoc = await db.query('select count(*)::int as n from events')

      await expect(
        db.query('select app.demo_mutation_hong($1, $2)', [TENANT, CO]),
      ).rejects.toThrow()

      const sau = await db.query('select count(*)::int as n from events')
      // Cùng một transaction: hỏng thì cả hai cùng lùi, không để lại sự kiện mồ côi.
      expect(sau.rows[0].n).toBe(truoc.rows[0].n)
    })

    it('mutation chạy được thì sự kiện ở lại', async () => {
      await db.query(`
        create function app.demo_mutation_ok(p_tenant uuid, p_actor uuid) returns void
        language plpgsql as $fn$
        begin
          perform app.record_event(p_tenant, 'owner', 'class.create', 'class',
                                   null, p_actor, null, '{}'::jsonb, array[p_actor]);
          insert into tenants (subdomain, owner_account_id) values ('lop-moi', p_actor);
        end;
        $fn$;
      `)

      const truoc = await db.query('select count(*)::int as n from events')
      await db.query('select app.demo_mutation_ok($1, $2)', [TENANT, CO])
      const sau = await db.query('select count(*)::int as n from events')

      expect(sau.rows[0].n).toBe(truoc.rows[0].n + 1)
    })
  })
})
