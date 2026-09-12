/**
 * Điểm danh trên Postgres thật — migration 0014.
 *
 * Bản demo có bảng điểm danh riêng và bài kiểm riêng, nhưng bản demo tự ép luật bằng mã của
 * chính nó — nên nó xanh cả khi luật đó sai. Chỗ luật thật sống là đây:
 *
 *   1. `unique (class_id, session_no, student_id)` ở 0004 — điểm danh lại một buổi là SỬA,
 *      không phải thêm dòng. Đây là chỗ ARCHITECTURE §3 ("attendance: chỉ thêm") và bảng
 *      nói hai điều khác nhau, ghi ở LOGIC §8 câu 9.
 *   2. Sự kiện ghi TRƯỚC. Lần điểm danh thứ hai để lại HAI dòng nhật ký dù bảng chỉ có một
 *      dòng — lịch sử "cô đã đổi ý" nằm ở `events`, chỗ có trigger chặn sửa và xoá.
 *   3. RLS: em đọc đúng dòng của em, và không đọc được nhật ký điểm danh.
 *
 * Hai chỗ hai bản không khớp nhau chỉ lộ ra ở đây, không lộ ra ở bản demo: hàm cắm sẵn
 * `actor_role = 'owner'`, và `visibility` thiếu tên cô nên buổi trợ giảng điểm danh thành
 * buổi cô không đọc được trong nhật ký của chính mình.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const EM_A = '22222222-2222-2222-2222-222222222222'
const EM_B = '33333333-3333-3333-3333-333333333333'
const TRO_GIANG = '44444444-4444-4444-4444-444444444444'
const NGUOI_LA = '4a4a4a4a-4a4a-4a4a-4a4a-4a4a4a4a4a4a'
const TENANT = '55555555-5555-5555-5555-555555555555'
const LOP = '77777777-7777-7777-7777-777777777777'
const LOP_KHAC = '88888888-8888-8888-8888-888888888888'
const EM_LOP_KHAC = '9a9a9a9a-9a9a-9a9a-9a9a-9a9a9a9a9a9a'

maybe('điểm danh trên Postgres thật (0014)', () => {
  let db: Client

  async function nhuLa<T extends Record<string, unknown>>(
    accountId: string,
    sql: string,
    args: unknown[] = [],
  ): Promise<T[]> {
    await db.query('begin')
    try {
      await db.query('set local role authenticated')
      await db.query('select set_config($1, $2, true)', ['request.jwt.claim.sub', accountId])
      const { rows } = await db.query<T>(sql, args)
      await db.query('commit')
      return rows
    } catch (e) {
      await db.query('rollback')
      throw e
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
         ($1, 'co.thao@x.vn', null,           'Cô Thảo'),
         ($2, null,           '+84901000002', 'Nguyễn Minh Anh'),
         ($3, null,           '+84901000003', 'Trần Thu Hà'),
         ($4, null,           '+84901000004', 'Phạm Lan'),
         ($5, null,           '+84901000005', 'Người ngoài'),
         ($6, null,           '+84901000006', 'Em lớp khác')`,
      [CO, EM_A, EM_B, TRO_GIANG, NGUOI_LA, EM_LOP_KHAC],
    )
    await db.query(
      `insert into tenants (id, subdomain, owner_account_id, status, approved_at)
         values ($1, 'cothao', $2, 'active', now())`,
      [TENANT, CO],
    )
    await db.query(
      `insert into classes (id, tenant_id, name, status) values
         ($1, $3, 'IELTS 6.5 · Tối T3/T5', 'running'),
         ($2, $3, 'IELTS 5.5 · Sáng T7/CN', 'running')`,
      [LOP, LOP_KHAC, TENANT],
    )
    await db.query(
      `insert into memberships (account_id, tenant_id, class_id, role, status) values
         ($1, $7, null, 'owner',     'active'),
         ($2, $7, $5,   'student',   'active'),
         ($3, $7, $5,   'student',   'active'),
         ($4, $7, $5,   'assistant', 'active'),
         ($6, $7, $8,   'student',   'active')`,
      [CO, EM_A, EM_B, TRO_GIANG, LOP, EM_LOP_KHAC, TENANT, LOP_KHAC],
    )
  })

  const vang = (id: string, phep = false) =>
    JSON.stringify([{ student_id: id, excused: phep }])

  describe('cô ghi, trợ giảng ghi, người ngoài không', () => {
    it('cô điểm danh: ai không có trong danh sách vắng thì có mặt', async () => {
      await nhuLa(CO, 'select app.record_attendance($1, 12, $2::jsonb)', [LOP, vang(EM_A)])

      const rows = await nhuLa<{ student_id: string; present: boolean; excused: boolean }>(
        CO,
        'select student_id, present, excused from attendance order by student_id',
      )
      // Ba thành viên lớp — cả trợ giảng cũng có dòng, vì `memberships` là nguồn sĩ số.
      expect(rows).toHaveLength(3)
      expect(rows.find((r) => r.student_id === EM_A)).toMatchObject({
        present: false,
        excused: false,
      })
      expect(rows.find((r) => r.student_id === EM_B)?.present).toBe(true)
    })

    it('trợ giảng điểm danh THẲNG, và nhật ký ghi đúng vai trợ giảng', async () => {
      await nhuLa(TRO_GIANG, 'select app.record_attendance($1, 12, $2::jsonb)', [
        LOP,
        vang(EM_B, true),
      ])

      const ev = await nhuLa<{ actor_role: string; action: string }>(
        CO,
        `select actor_role, action from events where object_type = 'attendance'`,
      )
      expect(ev).toHaveLength(1)
      // Không cắm 'owner': buổi trợ giảng ghi phải đọc ra là trợ giảng ghi.
      expect(ev[0]).toMatchObject({ actor_role: 'assistant', action: 'attendance.create' })
    })

    it('người ngoài lớp không điểm danh được', async () => {
      await expect(
        nhuLa(NGUOI_LA, 'select app.record_attendance($1, 12, $2::jsonb)', [LOP, '[]']),
      ).rejects.toThrow(/Không có quyền điểm danh/)
    })
  })

  describe('ràng buộc của bảng, không phải lời dặn', () => {
    it('điểm danh lại một buổi: bảng vẫn MỘT dòng mỗi em, nhật ký thành HAI', async () => {
      await nhuLa(CO, 'select app.record_attendance($1, 12, $2::jsonb)', [LOP, vang(EM_A)])
      await nhuLa(CO, 'select app.record_attendance($1, 12, $2::jsonb)', [
        LOP,
        vang(EM_A, true), // cô đổi ý: em có phép
      ])

      const rows = await nhuLa<{ excused: boolean }>(
        CO,
        'select excused from attendance where student_id = $1 and session_no = 12',
        [EM_A],
      )
      expect(rows).toHaveLength(1)
      expect(rows[0]!.excused).toBe(true)

      // Lịch sử "cô đã đổi ý" nằm ở events — nơi trigger 0001 chặn sửa và xoá.
      const ev = await nhuLa(
        CO,
        `select id from events where object_type = 'attendance' and payload->>'buoi_no' = '12'`,
      )
      expect(ev).toHaveLength(2)
    })

    it('em vắng không thuộc lớp bị CHẶN, không bị bỏ qua im lặng', async () => {
      await expect(
        nhuLa(CO, 'select app.record_attendance($1, 12, $2::jsonb)', [
          LOP,
          vang(EM_LOP_KHAC),
        ]),
      ).rejects.toThrow(/không học lớp này/)

      // Và không có dòng nào lọt vào bảng sự thật.
      expect(await nhuLa(CO, 'select id from attendance')).toHaveLength(0)
    })

    it('buổi phải là số dương', async () => {
      await expect(
        nhuLa(CO, 'select app.record_attendance($1, 0, $2::jsonb)', [LOP, '[]']),
      ).rejects.toThrow(/số dương/)
    })

    it('"có mặt mà có phép" không lọt vào bảng được', async () => {
      await expect(
        db.query(
          `insert into attendance (class_id, session_no, student_id, present, excused, recorded_by)
             values ($1, 3, $2, true, true, $3)`,
          [LOP, EM_A, CO],
        ),
      ).rejects.toThrow(/attendance_excused_only_when_absent/)
    })

    it('máy không ghi được: dòng nào cũng phải có người đứng tên', async () => {
      // `attendance.system = none` — Postgres ép bằng NOT NULL, không bằng lời dặn.
      await expect(
        db.query(
          `insert into attendance (class_id, session_no, student_id, present, recorded_by)
             values ($1, 3, $2, true, null)`,
          [LOP, EM_A],
        ),
      ).rejects.toThrow(/recorded_by/)
    })
  })

  describe('em chỉ thấy dòng của mình', () => {
    beforeEach(async () => {
      await nhuLa(CO, 'select app.record_attendance($1, 12, $2::jsonb)', [LOP, vang(EM_A)])
    })

    it('em A thấy đúng một dòng — của em A', async () => {
      const rows = await nhuLa<{ student_id: string }>(
        EM_A,
        'select student_id from attendance',
      )
      expect(rows.map((r) => r.student_id)).toEqual([EM_A])
    })

    it('em A không đọc được dòng của em B bằng cách hỏi thẳng', async () => {
      const rows = await nhuLa(
        EM_A,
        'select student_id from attendance where student_id = $1',
        [EM_B],
      )
      expect(rows).toHaveLength(0)
    })

    it('cô thấy cả lớp', async () => {
      expect(await nhuLa(CO, 'select student_id from attendance')).toHaveLength(3)
    })

    it('em không đọc được nhật ký điểm danh — dòng đó kể cả lớp', async () => {
      const rows = await nhuLa(
        EM_A,
        `select id from events where object_type = 'attendance'`,
      )
      expect(rows).toHaveLength(0)
    })
  })
})
