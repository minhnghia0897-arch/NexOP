/**
 * Bài giao là ảnh chụp, và giới hạn tần suất — hai bài học nhập từ bản OBLUE đang chạy.
 * Xem docs/SO-SANH-BAN-CU-BAN-MOI.md §3.1 và §3.2.
 *
 * Cả hai đều là chỗ hỏng mà không báo lỗi:
 *   · Câu hỏi đổi dưới chân em không ném exception nào.
 *   · OTP bị dò cạn thì cũng không ai biết.
 * Nên chúng phải được ép ở CSDL, và phải có test chạy thật.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const EM = '22222222-2222-2222-2222-222222222222'
const EM_B = '33333333-3333-3333-3333-333333333333'
const TENANT = '55555555-5555-5555-5555-555555555555'
const LOP = '77777777-7777-7777-7777-777777777777'
const LOP_B = '88888888-8888-8888-8888-888888888888'
const DE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

interface CauHoi {
  no: number
  text: string
}

maybe('bài giao là ảnh chụp, trên Postgres thật', () => {
  let db: Client

  async function giaoBai(lop = LOP, lan = 1): Promise<string> {
    const { rows } = await db.query<{ publish_assignment: string }>(
      `select app.publish_assignment($1,$2,$3,$4,null,$5) as publish_assignment`,
      [TENANT, CO, lop, DE, lan],
    )
    return rows[0]!.publish_assignment
  }

  async function cauHoiCuaBaiGiao(id: string): Promise<CauHoi[]> {
    const { rows } = await db.query<{ questions: CauHoi[] }>(
      'select questions from assignments where id = $1',
      [id],
    )
    return rows[0]!.questions
  }

  async function emNop(baiGiao: string, em = EM): Promise<void> {
    await db.query(
      `insert into submissions (assignment_id, student_id, content, submitted_at)
       values ($1,$2,'Bài em viết', now())`,
      [baiGiao, em],
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
         ($3,null,'+84901000003','Trần Thu Hà')`,
      [CO, EM, EM_B],
    )
    // Tên miền đã được admin duyệt (0009). Chưa duyệt thì đọc rỗng và ghi không được,
    // nên mọi test bên dưới sẽ đỏ — đó là ý đồ của cửa chặn, không phải phiền toái.
    await db.query(
      `insert into tenants (id, subdomain, owner_account_id, status, approved_at)
       values ($1,$2,$3,'active',now())`,
      [TENANT, 'cothao', CO],
    )
    await db.query(
      `insert into classes (id, tenant_id, name, status) values ($1,$3,'IELTS 6.5','running'),
                                                                     ($2,$3,'IELTS 5.5','running')`,
      [LOP, LOP_B, TENANT],
    )
    await db.query(
      `insert into memberships (account_id, tenant_id, class_id, role, status) values
         ($1,$4,null,'owner','active'),
         ($2,$4,$5,'student','active'),
         ($3,$4,$5,'student','active')`,
      [CO, EM, EM_B, TENANT, LOP],
    )
    await db.query(
      `insert into exams (id, tenant_id, name, skill) values ($1,$2,'Cambridge 19 · Reading','reading')`,
      [DE, TENANT],
    )
    await db.query(
      `insert into questions (exam_id, no, type, text, answer) values
         ($1,1,'fill','Câu 1', 'climate'),
         ($1,2,'fill','Câu 2', 'ice')`,
      [DE],
    )
  })

  describe('giao bài chụp lại câu hỏi', () => {
    it('bài giao mang bản chép của câu hỏi, không phải liên kết', async () => {
      const bai = await giaoBai()
      const cau = await cauHoiCuaBaiGiao(bai)
      expect(cau).toHaveLength(2)
      expect(cau.map((c) => c.no)).toEqual([1, 2])
    })

    it('đề chưa có câu hỏi thì không giao được', async () => {
      const { rows } = await db.query<{ id: string }>(
        `insert into exams (tenant_id, name, skill) values ($1,'Đề rỗng','writing') returning id`,
        [TENANT],
      )
      await expect(
        db.query('select app.publish_assignment($1,$2,$3,$4)', [TENANT, CO, LOP, rows[0]!.id]),
      ).rejects.toThrow(/chưa có câu hỏi nào/)
    })

    it('không giao được đề của tên miền khác', async () => {
      await expect(
        db.query('select app.publish_assignment($1,$2,$3,$4)', [
          TENANT, CO, LOP, '00000000-0000-0000-0000-000000000000',
        ]),
      ).rejects.toThrow(/Đề không tồn tại/)
    })

    it('giao lại cùng đề cho cùng lớp phải là lần khác', async () => {
      await giaoBai(LOP, 1)
      await expect(giaoBai(LOP, 1)).rejects.toThrow(/assignments_unique_attempt/)
      await expect(giaoBai(LOP, 2)).resolves.toBeTruthy()
    })

    it('xoá đề thì bài đã giao vẫn còn — em đã làm rồi', async () => {
      const bai = await giaoBai()
      await db.query('delete from exams where id = $1', [DE])

      const cau = await cauHoiCuaBaiGiao(bai)
      expect(cau).toHaveLength(2)
      const { rows } = await db.query('select exam_id from assignments where id = $1', [bai])
      expect(rows[0]).toMatchObject({ exam_id: null })
    })
  })

  describe('cô sửa đề — lan truyền xuống bài chưa ai nộp', () => {
    it('bài chưa ai nộp thì nhận được sửa đổi', async () => {
      // Đúng lỗi bản cũ đã trả giá: cô thêm đoạn văn, lưu, em không thấy đâu.
      const bai = await giaoBai()
      await db.query(
        `insert into questions (exam_id, no, type, text, answer) values ($1,3,'fill','Câu 3 cô mới thêm','snow')`,
        [DE],
      )

      const { rows } = await db.query<{ updated: number; skipped: number }>(
        'select * from app.propagate_exam_edit($1,$2,$3)', [TENANT, CO, DE],
      )
      expect(rows[0]).toMatchObject({ updated: 1, skipped: 0 })
      expect(await cauHoiCuaBaiGiao(bai)).toHaveLength(3)
    })

    it('bài đã có người nộp thì GIỮ NGUYÊN — không đổi đề sau lưng người đã làm xong', async () => {
      // Đây là chỗ bản cũ làm chưa tới: bản cũ lan xuống mọi bài khớp đề.
      const bai = await giaoBai()
      await emNop(bai)

      await db.query(
        `insert into questions (exam_id, no, type, text, answer) values ($1,3,'fill','Câu 3','snow')`,
        [DE],
      )
      const { rows } = await db.query<{ updated: number; skipped: number }>(
        'select * from app.propagate_exam_edit($1,$2,$3)', [TENANT, CO, DE],
      )

      expect(rows[0]).toMatchObject({ updated: 0, skipped: 1 })
      // Em làm 2 câu thì điểm vẫn tính trên 2 câu.
      expect(await cauHoiCuaBaiGiao(bai)).toHaveLength(2)
    })

    it('lan cho lớp chưa nộp, giữ cho lớp đã nộp, trong cùng một lần sửa', async () => {
      const baiA = await giaoBai(LOP)
      const baiB = await giaoBai(LOP_B)
      await emNop(baiA)

      await db.query(
        `insert into questions (exam_id, no, type, text, answer) values ($1,3,'fill','Câu 3','snow')`,
        [DE],
      )
      const { rows } = await db.query<{ updated: number; skipped: number }>(
        'select * from app.propagate_exam_edit($1,$2,$3)', [TENANT, CO, DE],
      )

      expect(rows[0]).toMatchObject({ updated: 1, skipped: 1 })
      expect(await cauHoiCuaBaiGiao(baiA)).toHaveLength(2)
      expect(await cauHoiCuaBaiGiao(baiB)).toHaveLength(3)
    })

    it('cô biết bao nhiêu bài không nhận được sửa đổi', async () => {
      // Trả về con số chứ không im lặng, để cô quyết có giao lại "lần 2" hay không.
      const bai = await giaoBai()
      await emNop(bai)
      await db.query(`update questions set text = 'Sửa lại' where exam_id = $1 and no = 1`, [DE])

      await db.query('select * from app.propagate_exam_edit($1,$2,$3)', [TENANT, CO, DE])
      const { rows } = await db.query<{ payload: { updated: number; skipped: number } }>(
        `select payload from events where action = 'assignment.update'`,
      )
      expect(rows[0]!.payload).toMatchObject({ updated: 0, skipped: 1 })
    })

    it('xoá hết câu hỏi thì KHÔNG đẩy bài giao về rỗng', async () => {
      // Bài rỗng là bài không có gì để làm — cùng kiểu hỏng không kêu. Muốn gỡ thì gỡ
      // bài giao, không phải làm rỗng nó.
      const bai = await giaoBai()
      await db.query('delete from questions where exam_id = $1', [DE])

      const { rows } = await db.query<{ updated: number }>(
        'select * from app.propagate_exam_edit($1,$2,$3)', [TENANT, CO, DE],
      )
      expect(rows[0]!.updated).toBe(0)
      expect(await cauHoiCuaBaiGiao(bai)).toHaveLength(2)
    })

    it('sửa thứ không phải câu hỏi thì không đụng bài giao', async () => {
      const bai = await giaoBai()
      const truoc = await cauHoiCuaBaiGiao(bai)

      await db.query(`update exams set name = 'Tên mới' where id = $1`, [DE])
      const { rows } = await db.query<{ updated: number }>(
        'select * from app.propagate_exam_edit($1,$2,$3)', [TENANT, CO, DE],
      )

      expect(rows[0]!.updated).toBe(0)
      expect(await cauHoiCuaBaiGiao(bai)).toEqual(truoc)
    })
  })

  describe('ai thấy bài giao', () => {
    async function nhuLa(accountId: string, sql: string) {
      await db.query('begin')
      try {
        await db.query('set local role authenticated')
        await db.query('select set_config($1,$2,true)', ['request.jwt.claim.sub', accountId])
        const { rows } = await db.query(sql)
        return rows
      } finally {
        await db.query('rollback')
      }
    }

    it('em trong lớp thấy bài đã đăng', async () => {
      await giaoBai()
      expect(await nhuLa(EM, 'select id from assignments')).toHaveLength(1)
    })

    it('em lớp khác không thấy', async () => {
      await giaoBai(LOP_B)
      expect(await nhuLa(EM, 'select id from assignments')).toHaveLength(0)
    })

    it('bài chưa đăng thì chỉ cô thấy', async () => {
      const bai = await giaoBai()
      await db.query('update assignments set published_at = null where id = $1', [bai])
      expect(await nhuLa(EM, 'select id from assignments')).toHaveLength(0)
      expect(await nhuLa(CO, 'select id from assignments')).toHaveLength(1)
    })

    it('em không thấy bài nộp của bạn', async () => {
      const bai = await giaoBai()
      await emNop(bai, EM)
      await emNop(bai, EM_B)
      const rows = await nhuLa(EM, 'select student_id from submissions')
      expect(rows).toEqual([{ student_id: EM }])
    })

    it('cô thấy cả lớp nộp', async () => {
      const bai = await giaoBai()
      await emNop(bai, EM)
      await emNop(bai, EM_B)
      expect(await nhuLa(CO, 'select id from submissions')).toHaveLength(2)
    })
  })

  describe('một em một bài nộp cho mỗi bài giao', () => {
    it('nộp hai lần cho cùng bài giao thì chặn', async () => {
      const bai = await giaoBai()
      await emNop(bai)
      await expect(emNop(bai)).rejects.toThrow(/submissions_one_per_student/)
    })

    it('nhưng lần 2 là bài giao khác nên nộp lại được', async () => {
      await emNop(await giaoBai(LOP, 1))
      await expect(emNop(await giaoBai(LOP, 2))).resolves.toBeUndefined()
    })
  })
})

maybe('giới hạn tần suất đếm trong CSDL', () => {
  let db: Client

  async function thu(key: string, max = 5, windowS = 120): Promise<boolean> {
    const { rows } = await db.query<{ check_rate_limit: boolean }>(
      'select app.check_rate_limit($1,$2,$3) as check_rate_limit', [key, max, windowS],
    )
    return rows[0]!.check_rate_limit
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
  })

  it('cho qua tới đúng ngưỡng rồi chặn', async () => {
    for (let i = 1; i <= 5; i += 1) {
      expect(await thu('otp:+84901234567'), `lần ${i}`).toBe(true)
    }
    expect(await thu('otp:+84901234567')).toBe(false)
  })

  it('mỗi số điện thoại đếm riêng', async () => {
    for (let i = 0; i < 6; i += 1) await thu('otp:+84901234567')
    expect(await thu('otp:+84909999999')).toBe(true)
  })

  it('lần bị chặn vẫn được ghi lại — muốn biết ai đang dò thì phải thấy cả lần bị chặn', async () => {
    for (let i = 0; i < 8; i += 1) await thu('otp:+84901234567')
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from rate_limit_events where key = 'otp:+84901234567'`,
    )
    expect(rows[0]!.n).toBe(8)
  })

  it('hết cửa sổ thì đếm lại', async () => {
    for (let i = 0; i < 6; i += 1) await thu('otp:+84901234567')
    expect(await thu('otp:+84901234567')).toBe(false)

    // Đẩy lùi mọi lần thử ra ngoài cửa sổ 2 phút.
    await db.query(`update rate_limit_events set at = now() - interval '3 minutes'`)
    expect(await thu('otp:+84901234567')).toBe(true)
  })

  it('mở tab khác không lách được — đếm nằm ở CSDL, không ở trình duyệt', async () => {
    // Hai kết nối riêng, đúng như hai tab. Bản cũ đếm trong sessionStorage nên lách được.
    const tab2 = new Client({ connectionString: DATABASE_URL })
    await tab2.connect()
    try {
      for (let i = 0; i < 5; i += 1) await thu('otp:+84901234567')
      const { rows } = await tab2.query<{ check_rate_limit: boolean }>(
        'select app.check_rate_limit($1,5,120) as check_rate_limit', ['otp:+84901234567'],
      )
      expect(rows[0]!.check_rate_limit).toBe(false)
    } finally {
      await tab2.end()
    }
  })

  it('dọn được dấu vết cũ, giữ lại dấu vết còn trong hạn', async () => {
    await thu('otp:cu')
    await db.query(`update rate_limit_events set at = now() - interval '40 days'`)
    await thu('otp:moi')

    const { rows } = await db.query<{ prune_rate_limit_events: number }>(
      'select app.prune_rate_limit_events()',
    )
    expect(rows[0]!.prune_rate_limit_events).toBe(1)

    const con = await db.query<{ key: string }>('select key from rate_limit_events')
    expect(con.rows.map((r) => r.key)).toEqual(['otp:moi'])
  })
})
