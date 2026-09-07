/**
 * Vòng đời tên miền: chờ duyệt → hoạt động → bị khoá, chạy trên Postgres thật.
 *
 * Điều cần chứng minh không phải "có cột status". Điều cần chứng minh là vết sẹo số 3
 * của bản đang chạy: tên miền chưa duyệt phải bị chặn Ở CSDL, không phải ẩn ở giao diện.
 * Nên hầu hết test dưới đây đọc và ghi dưới danh nghĩa người thật, không gọi qua ứng dụng.
 *
 * Và một điều nữa, ngược lại: admin duyệt được tên miền nhưng KHÔNG đọc được nội dung
 * bên trong nó (SRS §2). Bảo đảm đó cũng phải đỏ được ở đây.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const EM = '22222222-2222-2222-2222-222222222222'
const ADMIN = '33333333-3333-3333-3333-333333333333'
const TRO_GIANG = '55555555-5555-5555-5555-555555555555'
const NGUOI_LA = '44444444-4444-4444-4444-444444444444'

maybe('vòng đời tên miền — chờ duyệt, duyệt, khoá', () => {
  let db: Client
  let tenantId: string
  let classId: string
  let subdomain: string
  let soDangKy = 0

  /** Đọc dưới danh nghĩa một account, đúng như một phiên đăng nhập thật. */
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

  async function thu(sql: string, params: unknown[] = []): Promise<string> {
    try {
      await db.query(sql, params)
      return 'KHÔNG NÉM LỖI'
    } catch (e) {
      return (e as Error).message
    }
  }

  async function trangThai(): Promise<{ status: string; approved_at: Date | null; approved_by: string | null; status_reason: string | null }> {
    const { rows } = await db.query(
      'select status, approved_at, approved_by, status_reason from tenants where id = $1',
      [tenantId],
    )
    return rows[0]!
  }

  beforeAll(async () => {
    db = new Client({ connectionString: DATABASE_URL })
    await db.connect()
    await dungLaiSchema(db)

    await db.query(
      `insert into accounts (id, email, phone, name) values
         ($1, 'co.thao@example.com',  null,           'Cô Thảo'),
         ($2, null,                   '+84901000002', 'Nguyễn Minh Anh'),
         ($3, 'admin@oblue.vn',       null,           'Admin nền tảng'),
         ($4, null,                   '+84901000009', 'Người lạ'),
         ($5, null,                   '+84901000004', 'Phạm Lan')`,
      [CO, EM, ADMIN, NGUOI_LA, TRO_GIANG],
    )
    await db.query('insert into platform_admins (account_id, note) values ($1, $2)', [
      ADMIN, 'người duyệt tên miền',
    ])
  })

  afterAll(async () => {
    await db?.end()
  })

  /*
   * Mỗi test bắt đầu từ một tên miền MỚI, vừa đăng ký, còn đang chờ duyệt.
   *
   * Không dọn bảng giữa các test, vì không dọn được: events chỉ thêm (0001), nên
   * `delete from events` ném lỗi, và xoá tenants thì kéo theo events. Thay vì nới
   * bất biến đó cho tiện test, mỗi test lấy một tên miền riêng và mọi truy vấn dưới
   * đây lọc theo tenant_id — cũng gần với dữ liệu thật hơn: chưa bao giờ có phòng sạch.
   */
  beforeEach(async () => {
    soDangKy += 1
    subdomain = `cothao-${soDangKy}`
    const { rows } = await db.query<{ id: string }>('select app.register_tenant($1,$2,$3) as id', [
      subdomain, CO, 'giáo viên IELTS, 40 học viên',
    ])
    tenantId = rows[0]!.id
  })

  /** Đưa tên miền lên hoạt động rồi dựng một lớp có cô và một em, để test phần đọc. */
  async function dungLopDayDu(): Promise<void> {
    await db.query('select app.approve_tenant($1,$2,$3)', [ADMIN, tenantId, 'hồ sơ hợp lệ'])
    const { rows } = await db.query<{ id: string }>(
      `insert into classes (tenant_id, name, status) values ($1,'IELTS 6.5','running') returning id`,
      [tenantId],
    )
    classId = rows[0]!.id
    await db.query(
      `insert into memberships (account_id, tenant_id, class_id, role, status, activated_at)
       values ($1,$2,$3,'student','active',now()),
              ($4,$2,$3,'assistant','active',now())`,
      [EM, tenantId, classId, TRO_GIANG],
    )
  }

  describe('đăng ký — ra ở hàng chờ, chưa làm được gì', () => {
    it('tên miền mới có status pending, chưa có bút phê', async () => {
      const t = await trangThai()
      expect(t.status).toBe('pending')
      expect(t.approved_at).toBeNull()
      expect(t.approved_by).toBeNull()
    })

    it('cô đã là chủ, đã có tư cách thành viên active — nhưng tư cách đó chưa mở gì', async () => {
      const { rows } = await db.query(
        `select role, status from memberships where tenant_id = $1`,
        [tenantId],
      )
      expect(rows).toEqual([{ role: 'owner', status: 'active' }])

      // Tư cách active + tên miền pending = đọc rỗng. Đây là chỗ dễ sai nhất:
      // nhìn memberships thì thấy "đang hoạt động", tưởng là vào được.
      const thay = await asAccount(CO, `select app.is_active_member('${tenantId}') as v`)
      expect(thay[0]!.v).toBe(false)
    })

    it('sự kiện tenant.create được ghi, cô nhìn thấy', async () => {
      const rows = await asAccount<{ action: string; actor_role: string }>(
        CO, `select action, actor_role from events where tenant_id = '${tenantId}'`,
      )
      expect(rows).toEqual([{ action: 'tenant.create', actor_role: 'owner' }])
    })

    it('subdomain trùng thì đăng ký hỏng, và không để lại sự kiện mồ côi', async () => {
      const truoc = await db.query('select count(*)::int as n from events')
      expect(await thu('select app.register_tenant($1,$2,null)', [subdomain, CO])).toMatch(
        /duplicate key/i,
      )
      const sau = await db.query('select count(*)::int as n from events')
      expect(sau.rows[0].n).toBe(truoc.rows[0].n)
    })
  })

  describe('chờ duyệt — chặn cả đọc lẫn ghi, ở CSDL', () => {
    it('cô vẫn thấy đơn của chính mình, kèm trạng thái', async () => {
      // Chặn hết thì cô đăng ký xong nhìn vào trống trơn, không biết đang chờ hay bị từ chối.
      const rows = await asAccount<{ subdomain: string; status: string }>(
        CO, `select subdomain, status from tenants where id = '${tenantId}'`,
      )
      expect(rows).toEqual([{ subdomain, status: 'pending' }])
    })

    it('nhưng không đọc được gì bên trong: memberships rỗng', async () => {
      const rows = await asAccount(CO, `select id from memberships where tenant_id = '${tenantId}'`)
      expect(rows).toHaveLength(0)
    })

    it('và không ghi được gì: record_event từ chối', async () => {
      const loi = await thu(
        `select app.record_event($1,'owner','class.create','class',null,$2,null,'{}'::jsonb,array[$2::uuid])`,
        [tenantId, CO],
      )
      expect(loi).toMatch(/chưa được duyệt|đang bị khoá/)
    })

    it('nên mọi mutation dừng theo — mời học viên cũng không được', async () => {
      // Không phải vì create_invite tự kiểm tra. Vì nó gọi record_event trước tiên.
      const loi = await thu(`select app.create_invite($1,$2,'student',$3,$4)`, [
        tenantId, CO, '+84901000002', 'token-thu-1',
      ])
      expect(loi).toMatch(/chưa được duyệt|đang bị khoá/)
    })

    it('người lạ không thấy tên miền chờ duyệt', async () => {
      const rows = await asAccount(NGUOI_LA, `select id from tenants where id = '${tenantId}'`)
      expect(rows).toHaveLength(0)
    })
  })

  describe('duyệt — chỉ admin, và có ký tên', () => {
    it('người thường không duyệt được, kể cả chính chủ tên miền', async () => {
      expect(await thu('select app.approve_tenant($1,$2,null)', [CO, tenantId])).toMatch(
        /Chỉ admin nền tảng/,
      )
      expect(await thu('select app.approve_tenant($1,$2,null)', [NGUOI_LA, tenantId])).toMatch(
        /Chỉ admin nền tảng/,
      )
      expect((await trangThai()).status).toBe('pending')
    })

    it('admin duyệt thì tên miền sống, và biết ai ký lúc nào', async () => {
      const { rows } = await db.query<{ ok: boolean }>(
        'select app.approve_tenant($1,$2,$3) as ok',
        [ADMIN, tenantId, 'hồ sơ hợp lệ'],
      )
      expect(rows[0]!.ok).toBe(true)

      const t = await trangThai()
      expect(t.status).toBe('active')
      expect(t.approved_by).toBe(ADMIN)
      expect(t.approved_at).not.toBeNull()
    })

    it('sự kiện duyệt ghi vai admin, và cô đọc được', async () => {
      await db.query('select app.approve_tenant($1,$2,$3)', [ADMIN, tenantId, 'hồ sơ hợp lệ'])
      const rows = await asAccount<{ action: string; actor_role: string }>(
        CO,
        `select action, actor_role from events
          where tenant_id = '${tenantId}' and action = 'tenant.approve'`,
      )
      expect(rows).toEqual([{ action: 'tenant.approve', actor_role: 'admin' }])
    })

    it('duyệt lần hai trả về false, không ghi thêm sự kiện', async () => {
      await db.query('select app.approve_tenant($1,$2,null)', [ADMIN, tenantId])
      const truoc = await db.query('select count(*)::int as n from events where tenant_id = $1', [
        tenantId,
      ])

      const { rows } = await db.query<{ ok: boolean }>(
        'select app.approve_tenant($1,$2,null) as ok', [ADMIN, tenantId],
      )
      expect(rows[0]!.ok).toBe(false)

      const sau = await db.query('select count(*)::int as n from events where tenant_id = $1', [
        tenantId,
      ])
      expect(sau.rows[0].n).toBe(truoc.rows[0].n)
    })

    it('duyệt xong thì cô làm việc được ngay', async () => {
      await dungLopDayDu()
      const rows = await asAccount<{ name: string }>(
        CO, `select name from classes where tenant_id = '${tenantId}'`,
      )
      expect(rows).toEqual([{ name: 'IELTS 6.5' }])
    })
  })

  describe('khoá — và mọi người rơi ra ngay, không chỉ ẩn giao diện', () => {
    beforeEach(async () => {
      await dungLopDayDu()
    })

    it('khoá phải kèm lý do', async () => {
      expect(await thu('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, null])).toMatch(
        /phải kèm lý do/,
      )
      expect(await thu('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, '   '])).toMatch(
        /phải kèm lý do/,
      )
      expect((await trangThai()).status).toBe('active')
    })

    it('khoá rồi thì cô và em đọc rỗng ngay lập tức', async () => {
      const lop = `select id from classes where tenant_id = '${tenantId}'`
      expect(await asAccount(CO, lop)).toHaveLength(1)
      expect(await asAccount(EM, lop)).toHaveLength(1)

      await db.query('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, 'quá hạn thanh toán'])

      expect(await asAccount(CO, lop)).toHaveLength(0)
      expect(await asAccount(EM, lop)).toHaveLength(0)
      expect(
        await asAccount(CO, `select id from memberships where tenant_id = '${tenantId}'`),
      ).toHaveLength(0)
    })

    it('và không ai ghi được gì nữa', async () => {
      await db.query('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, 'quá hạn thanh toán'])
      const loi = await thu(`select app.create_invite($1,$2,'student',$3,$4,$5)`, [
        tenantId, CO, '+84901000003', 'token-thu-2', classId,
      ])
      expect(loi).toMatch(/chưa được duyệt|đang bị khoá/)
    })

    it('cô cũng không đọc được bảng tin của lớp nữa', async () => {
      // Đường này đi qua app.owns_class, không qua is_tenant_owner — cửa khác, phải
      // chặn riêng. Bỏ sót thì tên miền bị khoá vẫn hở ra bài đăng, điểm danh, bài giao.
      await db.query(
        `insert into posts (class_id, author_id, body) values ($1,$2,'Bài tập tuần này')`,
        [classId, CO],
      )
      const baiDang = `select id from posts where class_id = '${classId}'`
      expect(await asAccount(CO, baiDang)).toHaveLength(1)

      await db.query('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, 'quá hạn thanh toán'])
      expect(await asAccount(CO, baiDang)).toHaveLength(0)
    })

    it('trợ giảng cũng không đọc được ngân hàng đề nữa', async () => {
      // Trợ giảng vào đề qua app.may_read_exam — cửa thứ ba. Cô thì qua is_tenant_owner,
      // nên nếu chỉ thử với cô sẽ tưởng đã kín.
      await db.query(
        `insert into exams (tenant_id, name, skill) values ($1,'Cambridge 18 Test 1','reading')`,
        [tenantId],
      )
      const de = `select id from exams where tenant_id = '${tenantId}'`
      expect(await asAccount(TRO_GIANG, de)).toHaveLength(1)

      await db.query('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, 'quá hạn thanh toán'])
      expect(await asAccount(TRO_GIANG, de)).toHaveLength(0)
    })

    it('cô vẫn đọc được lý do bị khoá', async () => {
      await db.query('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, 'quá hạn thanh toán'])
      const rows = await asAccount<{ status: string; status_reason: string }>(
        CO, `select status, status_reason from tenants where id = '${tenantId}'`,
      )
      expect(rows).toEqual([{ status: 'suspended', status_reason: 'quá hạn thanh toán' }])
    })

    it('gỡ khoá bằng cách duyệt lại, và mọi thứ trở lại', async () => {
      await db.query('select app.suspend_tenant($1,$2,$3)', [ADMIN, tenantId, 'quá hạn thanh toán'])
      const { rows } = await db.query<{ ok: boolean }>(
        'select app.approve_tenant($1,$2,$3) as ok', [ADMIN, tenantId, 'đã thanh toán'],
      )
      expect(rows[0]!.ok).toBe(true)
      expect((await trangThai()).status).toBe('active')
      expect(
        await asAccount(EM, `select id from classes where tenant_id = '${tenantId}'`),
      ).toHaveLength(1)
    })
  })

  describe('admin duyệt tên miền, nhưng không nhìn thấy bên trong (SRS §2)', () => {
    beforeEach(async () => {
      await dungLopDayDu()
      await db.query(
        `insert into posts (class_id, author_id, body) values ($1,$2,'Bài tập tuần này')`,
        [classId, CO],
      )
      await db.query(
        `insert into exams (tenant_id, name, skill) values ($1,'Cambridge 18 Test 1','reading')`,
        [tenantId],
      )
    })

    it('admin thấy danh sách tên miền — subdomain, chủ, trạng thái', async () => {
      const rows = await asAccount<{ subdomain: string; status: string }>(
        ADMIN, `select subdomain, status from tenants where id = '${tenantId}'`,
      )
      expect(rows).toEqual([{ subdomain, status: 'active' }])
    })

    it('nhưng không thấy lớp, bài đăng, đề, hay ai học ở đó', async () => {
      expect(
        await asAccount(ADMIN, `select id from classes where tenant_id = '${tenantId}'`),
      ).toHaveLength(0)
      expect(
        await asAccount(ADMIN, `select id from posts where class_id = '${classId}'`),
      ).toHaveLength(0)
      expect(
        await asAccount(ADMIN, `select id from exams where tenant_id = '${tenantId}'`),
      ).toHaveLength(0)
      expect(
        await asAccount(ADMIN, `select id from memberships where tenant_id = '${tenantId}'`),
      ).toHaveLength(0)
    })

    it('và không đọc được nhật ký của tên miền', async () => {
      // events lọc theo visibility, và admin chỉ nằm trong visibility của chính
      // hành vi duyệt/khoá — không nằm trong bất cứ sự kiện lớp học nào.
      const rows = await asAccount<{ action: string }>(
        ADMIN, `select action from events where tenant_id = '${tenantId}'`,
      )
      expect(rows.map((r) => r.action).sort()).toEqual(['tenant.approve'])
    })

    it('không ai đọc được bảng platform_admins qua RLS', async () => {
      expect(await asAccount(ADMIN, 'select account_id from platform_admins')).toHaveLength(0)
      expect(await asAccount(CO, 'select account_id from platform_admins')).toHaveLength(0)
    })
  })

  describe('ràng buộc — không đi cửa sau được', () => {
    it('không set active mà thiếu thời điểm duyệt', async () => {
      expect(
        await thu(`update tenants set status = 'active' where id = $1`, [tenantId]),
      ).toMatch(/tenants_live_has_approval/)
    })

    it('không set suspended mà thiếu lý do', async () => {
      await db.query('select app.approve_tenant($1,$2,null)', [ADMIN, tenantId])
      expect(
        await thu(`update tenants set status = 'suspended', status_reason = null where id = $1`, [
          tenantId,
        ]),
      ).toMatch(/tenants_suspended_has_reason/)
    })
  })
})
