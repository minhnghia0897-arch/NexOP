/**
 * Cửa của em trên Postgres thật: nộp được đúng bài của mình, và nộp rồi là CHỐT.
 *
 * Ba điều ở đây không kiểm được bằng test đơn vị, vì chúng là luật của CSDL chứ không của
 * ứng dụng:
 *   · RLS bật mà thiếu chính sách `insert` thì KHÔNG AI nộp được — 0007 đúng như thế, và
 *     không test nào bắt được vì chưa test nào thử nộp dưới vai `authenticated`.
 *   · "Đã nộp không sửa được" phải chặn cả CÔ và cả một câu UPDATE chạy tay. Chỉ RLS thì
 *     không đủ: chủ bảng đi vòng qua RLS.
 *   · `duration_s` phải là cột TÍNH. Cột thường thì client ghi số nào cô cũng đọc số đó.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const EM = '22222222-2222-2222-2222-222222222222'
const EM_KHAC = '33333333-3333-3333-3333-333333333333'
const NGOAI_LOP = '44444444-4444-4444-4444-444444444444'
const TENANT = '55555555-5555-5555-5555-555555555555'
const LOP = '77777777-7777-7777-7777-777777777777'
const DE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

maybe('cửa nộp bài của em, trên Postgres thật', () => {
  let db: Client
  let baiGiao: string

  /** Chạy SQL dưới danh nghĩa một account — đúng như phiên đăng nhập thật, RLS có hiệu lực. */
  async function nhuLa<T extends Record<string, unknown>>(
    accountId: string,
    sql: string,
    tham: unknown[] = [],
  ): Promise<T[]> {
    await db.query('begin')
    try {
      await db.query('set local role authenticated')
      await db.query('select set_config($1, $2, true)', ['request.jwt.claim.sub', accountId])
      const { rows } = await db.query<T>(sql, tham)
      await db.query('commit')
      return rows
    } catch (e) {
      await db.query('rollback')
      throw e
    }
  }

  /** Em mở bài: dòng `writing`, chưa nộp. */
  async function moBai(em = EM): Promise<string> {
    const rows = await nhuLa<{ id: string }>(
      em,
      `insert into submissions (assignment_id, student_id, content)
       values ($1,$2,'') returning id`,
      [baiGiao, em],
    )
    return rows[0]!.id
  }

  async function nop(id: string, em = EM, noiDung = 'Bài em viết đủ dài'): Promise<void> {
    await nhuLa(
      em,
      `update submissions set content = $2, words = 4, submitted_at = now() where id = $1`,
      [id, noiDung],
    )
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
         ($1,'co@x.vn',null,'Cô Thảo'),
         ($2,null,'+84901000002','Nguyễn Minh Anh'),
         ($3,null,'+84901000003','Trần Thu Hà'),
         ($4,null,'+84901000004','Em lớp khác')`,
      [CO, EM, EM_KHAC, NGOAI_LOP],
    )
    await db.query(
      `insert into tenants (id, subdomain, owner_account_id, status, approved_at)
       values ($1,'cothao',$2,'active',now())`,
      [TENANT, CO],
    )
    await db.query(
      `insert into classes (id, tenant_id, name, status) values ($1,$2,'IELTS 6.5','running')`,
      [LOP, TENANT],
    )
    await db.query(
      `insert into memberships (account_id, tenant_id, class_id, role, status) values
         ($1,$5,null,'owner','active'),
         ($2,$5,$6,'student','active'),
         ($3,$5,$6,'student','active'),
         ($4,$5,null,'student','active')`,
      [CO, EM, EM_KHAC, NGOAI_LOP, TENANT, LOP],
    )
    await db.query(`select set_config('app.exam_write', 'on', false)`)
    await db.query(
      `insert into exams (id, tenant_id, name, skill) values ($1,$2,'Task 2 — Education','writing')`,
      [DE, TENANT],
    )
    await db.query(
      `insert into questions (exam_id, no, type, text) values ($1,1,'essay','Viết 250 từ')`,
      [DE],
    )
    const { rows } = await db.query<{ publish_assignment: string }>(
      `select app.publish_assignment($1,$2,$3,$4,null,1) as publish_assignment`,
      [TENANT, CO, LOP, DE],
    )
    baiGiao = rows[0]!.publish_assignment
  })

  describe('cửa vào — 0007 bật RLS mà không có chính sách insert nào', () => {
    it('em mở được bài của lớp mình', async () => {
      const id = await moBai()
      expect(id).toBeTruthy()
    })

    it('em KHÔNG mở bài dưới tên bạn cùng lớp', async () => {
      await expect(
        nhuLa(
          EM,
          `insert into submissions (assignment_id, student_id, content) values ($1,$2,'')`,
          [baiGiao, EM_KHAC],
        ),
      ).rejects.toThrow(/row-level security/i)
    })

    it('em ngoài lớp KHÔNG mở được bài của lớp này', async () => {
      await expect(
        nhuLa(
          NGOAI_LOP,
          `insert into submissions (assignment_id, student_id, content) values ($1,$2,'')`,
          [baiGiao, NGOAI_LOP],
        ),
      ).rejects.toThrow(/row-level security/i)
    })

    it('dòng mới KHÔNG được nộp luôn — phải qua trạng thái writing', async () => {
      /*
       * Chặn `submitted_at` ngay lúc tạo là chặn đường "một lần gọi API là nộp xong". Không
       * chặn thì mốc mở — thứ duy nhất đo được thời gian làm bài — không bao giờ tồn tại.
       */
      await expect(
        nhuLa(
          EM,
          `insert into submissions (assignment_id, student_id, content, submitted_at)
           values ($1,$2,'Bài xong sẵn', now())`,
          [baiGiao, EM],
        ),
      ).rejects.toThrow(/row-level security/i)
    })
  })

  describe('cửa chốt — nộp rồi thì không ai sửa được', () => {
    it('em sửa được nháp CHƯA nộp', async () => {
      const id = await moBai()
      await nhuLa(EM, `update submissions set content = 'em viết thêm' where id = $1`, [id])
      const { rows } = await db.query<{ content: string }>(
        'select content from submissions where id = $1',
        [id],
      )
      expect(rows[0]!.content).toBe('em viết thêm')
    })

    it('EM không sửa được sau khi nộp — RLS làm câu UPDATE thành không-dòng-nào', async () => {
      /*
       * Với em thì KHÔNG có lỗi nào ném ra: `submissions_write_own` có `submitted_at is null`
       * trong `using`, nên dòng đã nộp không còn nằm trong tầm câu UPDATE — nó sửa 0 dòng và
       * trả về êm ru. Đó là cách RLS hoạt động, và là lý do test này chốt NỘI DUNG thay vì
       * chốt một lời từ chối: "không có lỗi" ở đây không có nghĩa là "sửa được".
       */
      const id = await moBai()
      await nop(id, EM, 'Bài em nộp lần đầu')
      await nhuLa(EM, `update submissions set content = 'em viết lại hết' where id = $1`, [id])

      const { rows } = await db.query<{ content: string }>(
        'select content from submissions where id = $1',
        [id],
      )
      expect(rows[0]!.content).toBe('Bài em nộp lần đầu')
    })

    it('CÔ cũng không sửa được — và đây là chỗ RLS một mình không đủ', async () => {
      /*
       * `submissions_write_own` chỉ nói về em. Cô là chủ lớp và ở bản thật cô đi qua đường
       * khác; một câu UPDATE chạy tay trong bảng điều khiển Supabase thì đi qua vai chủ bảng,
       * mà chủ bảng bỏ qua RLS. Nên bất biến này phải là TRIGGER.
       */
      const id = await moBai()
      await nop(id)
      await expect(
        db.query(`update submissions set content = 'cô sửa hộ' where id = $1`, [id]),
      ).rejects.toThrow(/không sửa được/)
    })

    it('không ai lùi được bài đã nộp về trạng thái đang viết', async () => {
      const id = await moBai()
      await nop(id)
      await expect(
        db.query(`update submissions set submitted_at = null where id = $1`, [id]),
      ).rejects.toThrow(/không sửa được/)
    })

    it('không ai đổi được bài đã nộp sang chủ khác', async () => {
      const id = await moBai()
      await nop(id)
      await expect(
        db.query(`update submissions set student_id = $2 where id = $1`, [id, EM_KHAC]),
      ).rejects.toThrow(/không sửa được/)
    })

    it('xoá bài đã nộp cũng không được — lớp 1 chỉ thêm', async () => {
      const id = await moBai()
      await nop(id)
      await expect(db.query('delete from submissions where id = $1', [id])).rejects.toThrow(
        /không xoá được/,
      )
    })

    it('bài CHƯA nộp thì xoá được — nháp không phải sự thật của lớp', async () => {
      const id = await moBai()
      await db.query('delete from submissions where id = $1', [id])
      const { rows } = await db.query('select 1 from submissions where id = $1', [id])
      expect(rows).toHaveLength(0)
    })

    it('UPDATE trùng giá trị vẫn đi qua — job chạy lại không được hoá thành lỗi', async () => {
      const id = await moBai()
      await nop(id)
      await db.query(
        `update submissions set content = content, words = words where id = $1`,
        [id],
      )
      const { rows } = await db.query<{ n: string }>(
        'select count(*) as n from submissions where id = $1',
        [id],
      )
      expect(rows[0]!.n).toBe('1')
    })
  })

  describe('thời gian làm bài là cột TÍNH, không phải lời khai', () => {
    it('chưa nộp thì chưa có thời gian', async () => {
      const id = await moBai()
      const { rows } = await db.query<{ duration_s: number | null }>(
        'select duration_s from submissions where id = $1',
        [id],
      )
      expect(rows[0]!.duration_s).toBeNull()
    })

    it('nộp rồi thì thời gian là hiệu của hai mốc', async () => {
      const id = await moBai()
      // Lùi mốc mở 20 phút để có khoảng đo được mà không phải chờ thật. Dòng chưa nộp nên
      // trigger chốt chưa chặn.
      await db.query(
        `update submissions set created_at = now() - interval '20 minutes' where id = $1`,
        [id],
      )
      await nop(id)
      const { rows } = await db.query<{ duration_s: number }>(
        'select duration_s from submissions where id = $1',
        [id],
      )
      expect(rows[0]!.duration_s).toBeGreaterThanOrEqual(1199)
      expect(rows[0]!.duration_s).toBeLessThanOrEqual(1202)
    })

    it('KHÔNG ai ghi được vào duration_s — kể cả chủ bảng', async () => {
      const id = await moBai()
      await expect(
        db.query(`update submissions set duration_s = 60 where id = $1`, [id]),
      ).rejects.toThrow(/generated|can only be updated to DEFAULT/i)
    })
  })

  describe('cô đọc được bài của lớp mình, em không đọc được bài của bạn', () => {
    it('em chỉ thấy bài của em', async () => {
      const cua = await moBai()
      const cuaBan = await moBai(EM_KHAC)
      const thay = await nhuLa<{ id: string }>(EM, 'select id from submissions')
      expect(thay.map((r) => r.id)).toContain(cua)
      expect(thay.map((r) => r.id)).not.toContain(cuaBan)
    })

    it('cô thấy bài đã nộp của lớp mình', async () => {
      const id = await moBai()
      await nop(id)
      const thay = await nhuLa<{ id: string }>(CO, 'select id from submissions')
      expect(thay.map((r) => r.id)).toContain(id)
    })
  })
})
