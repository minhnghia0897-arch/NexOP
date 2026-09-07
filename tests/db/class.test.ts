/**
 * Quyền theo lớp, chạy trên Postgres thật.
 *
 * Tiêu chí "xong khi" của chặng 3 trong docs/PLAN.md: rời lớp thì không đọc được dữ
 * liệu lớp đó ở BẤT KỲ đường nào. Đây là chỗ kiểm câu đó, chứ không phải kiểm bằng
 * cách đọc lại chính sách và gật đầu.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const CO_KHAC = '99999999-9999-9999-9999-999999999999'
const EM_A = '22222222-2222-2222-2222-222222222222'
const EM_B = '33333333-3333-3333-3333-333333333333'
const TRO_GIANG = '44444444-4444-4444-4444-444444444444'
const TENANT = '55555555-5555-5555-5555-555555555555'
const TENANT_KHAC = '66666666-6666-6666-6666-666666666666'
const LOP_A = '77777777-7777-7777-7777-777777777777'
const LOP_B = '88888888-8888-8888-8888-888888888888'

maybe('quyền theo lớp trên Postgres thật', () => {
  let db: Client

  async function nhuLa<T extends Record<string, unknown>>(
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
  })

  afterAll(async () => {
    await db?.end()
  })

  beforeEach(async () => {
    await dungLaiSchema(db)

    await db.query(
      `insert into accounts (id, email, phone, name) values
         ($1, 'co.thao@x.vn', null,          'Cô Thảo'),
         ($2, 'co.anh@x.vn',  null,          'Cô Anh'),
         ($3, null,           '+84901000002','Nguyễn Minh Anh'),
         ($4, null,           '+84901000003','Trần Thu Hà'),
         ($5, null,           '+84901000004','Phạm Lan')`,
      [CO, CO_KHAC, EM_A, EM_B, TRO_GIANG],
    )
    await db.query(
      `insert into tenants (id, subdomain, owner_account_id, status, approved_at) values
         ($1,'cothao',$3,'active',now()), ($2,'coanh',$4,'active',now())`,
      [TENANT, TENANT_KHAC, CO, CO_KHAC],
    )
    await db.query(
      `insert into classes (id, tenant_id, name, status) values
         ($1, $3, 'IELTS 6.5 · Tối T3/T5', 'running'),
         ($2, $3, 'IELTS 5.5 · Sáng T7/CN', 'running')`,
      [LOP_A, LOP_B, TENANT],
    )
    await db.query(
      `insert into memberships (account_id, tenant_id, class_id, role, status) values
         ($1, $6, null,  'owner',     'active'),
         ($2, $6, $4,    'student',   'active'),
         ($3, $6, $5,    'student',   'active'),
         ($7, $6, $4,    'assistant', 'active')`,
      [CO, EM_A, EM_B, LOP_A, LOP_B, TENANT, TRO_GIANG],
    )
    await db.query(
      `insert into posts (class_id, author_id, kind, body) values
         ($1, $3, 'post', 'Bài của lớp 6.5'),
         ($2, $3, 'post', 'Bài của lớp 5.5')`,
      [LOP_A, LOP_B, CO],
    )
  })

  describe('không rò dữ liệu giữa hai lớp', () => {
    it('em lớp A chỉ thấy lớp A', async () => {
      const rows = await nhuLa<{ id: string }>(EM_A, 'select id from classes')
      expect(rows.map((r) => r.id)).toEqual([LOP_A])
    })

    it('em lớp A không thấy bảng tin lớp B', async () => {
      const rows = await nhuLa<{ body: string }>(EM_A, 'select body from posts')
      expect(rows.map((r) => r.body)).toEqual(['Bài của lớp 6.5'])
    })

    it('trợ giảng chỉ thấy lớp cô cho', async () => {
      const rows = await nhuLa<{ id: string }>(TRO_GIANG, 'select id from classes')
      expect(rows.map((r) => r.id)).toEqual([LOP_A])
    })

    it('cô thấy cả hai lớp mà không cần có tên trong lớp nào', async () => {
      const rows = await nhuLa(CO, 'select id from classes')
      expect(rows).toHaveLength(2)
    })

    it('cô khác không thấy lớp của cô Thảo', async () => {
      const rows = await nhuLa(CO_KHAC, 'select id from classes')
      expect(rows).toHaveLength(0)
    })
  })

  describe('rời lớp thì mất quyền ngay', () => {
    it('em nghỉ thì không đọc được lớp lẫn bảng tin nữa', async () => {
      expect(await nhuLa(EM_A, 'select id from classes')).toHaveLength(1)

      await db.query(`update memberships set status='left' where account_id=$1`, [EM_A])

      expect(await nhuLa(EM_A, 'select id from classes')).toHaveLength(0)
      expect(await nhuLa(EM_A, 'select id from posts')).toHaveLength(0)
      expect(await nhuLa(EM_A, 'select id from attendance')).toHaveLength(0)
    })
  })

  describe('lộ trình là tài sản của cô', () => {
    beforeEach(async () => {
      await db.query(`insert into paths (tenant_id, name) values ($1, 'IELTS 0 → 6.5')`, [TENANT])
    })

    it('cô thấy lộ trình của mình', async () => {
      expect(await nhuLa(CO, 'select id from paths')).toHaveLength(1)
    })

    it('trợ giảng và học viên không thấy lộ trình', async () => {
      expect(await nhuLa(TRO_GIANG, 'select id from paths')).toHaveLength(0)
      expect(await nhuLa(EM_A, 'select id from paths')).toHaveLength(0)
    })
  })

  describe('điểm danh — em không thấy em khác', () => {
    beforeEach(async () => {
      await db.query(
        `insert into attendance (class_id, session_no, student_id, present) values
           ($1, 1, $2, true), ($1, 1, $3, false)`,
        [LOP_A, EM_A, EM_B],
      )
    })

    it('cô thấy cả lớp', async () => {
      expect(await nhuLa(CO, 'select id from attendance')).toHaveLength(2)
    })

    it('em chỉ thấy dòng của mình, không thấy bạn vắng hay không', async () => {
      const rows = await nhuLa<{ student_id: string }>(EM_A, 'select student_id from attendance')
      expect(rows.map((r) => r.student_id)).toEqual([EM_A])
    })
  })

  describe('lớp và tư cách phải cùng tên miền', () => {
    it('không gắn được học viên vào lớp của cô khác', async () => {
      // Không có ràng buộc này thì "quyền đi theo lớp" mất nghĩa hoàn toàn.
      await expect(
        db.query(
          `insert into memberships (account_id, tenant_id, class_id, role, status)
           values ($1, $2, $3, 'student', 'active')`,
          [EM_A, TENANT_KHAC, LOP_A],
        ),
      ).rejects.toThrow(/memberships_class_same_tenant/)
    })

    it('xoá lớp thì tư cách trong lớp đó đi theo', async () => {
      await db.query('delete from classes where id = $1', [LOP_A])
      const { rows } = await db.query<{ n: number }>(
        'select count(*)::int as n from memberships where class_id = $1',
        [LOP_A],
      )
      expect(rows[0]!.n).toBe(0)
    })

    it('xoá lộ trình thì lớp vẫn còn — lớp đã chạy rồi', async () => {
      const { rows: p } = await db.query<{ id: string }>(
        `insert into paths (tenant_id, name) values ($1, 'Lộ trình') returning id`,
        [TENANT],
      )
      await db.query('update classes set path_id = $1 where id = $2', [p[0]!.id, LOP_A])
      await db.query('delete from paths where id = $1', [p[0]!.id])

      const { rows } = await db.query('select path_id from classes where id = $1', [LOP_A])
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ path_id: null })
    })
  })

  describe('điểm danh không ghi trùng', () => {
    it('một em một buổi chỉ một dòng', async () => {
      await db.query(
        `insert into attendance (class_id, session_no, student_id, present) values ($1,1,$2,true)`,
        [LOP_A, EM_A],
      )
      await expect(
        db.query(
          `insert into attendance (class_id, session_no, student_id, present) values ($1,1,$2,false)`,
          [LOP_A, EM_A],
        ),
      ).rejects.toThrow(/attendance_one_per_session/)
    })
  })
})
