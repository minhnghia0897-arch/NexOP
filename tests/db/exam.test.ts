/**
 * Ngân hàng đề trên Postgres thật — UC-03 (OCR) và UC-04 (soạn câu hỏi).
 *
 * Đề hỏng không kêu. Một câu OCR đọc hụt đáp án sẽ lặng lẽ thành câu không ai chấm:
 * máy bỏ qua vì không có đáp án, cô bỏ qua vì không thấy cảnh báo. Em làm xong rồi
 * không bao giờ nhận điểm câu đó. Mấy ràng buộc dưới đây tồn tại để chuyện đó không
 * xảy ra được, chứ không phải để bắt lỗi lúc chạy.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const CO_KHAC = '99999999-9999-9999-9999-999999999999'
const EM = '22222222-2222-2222-2222-222222222222'
const TRO_GIANG = '44444444-4444-4444-4444-444444444444'
const TENANT = '55555555-5555-5555-5555-555555555555'
const TENANT_KHAC = '66666666-6666-6666-6666-666666666666'
const LOP = '77777777-7777-7777-7777-777777777777'
const DE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

maybe('ngân hàng đề trên Postgres thật', () => {
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

  async function themCau(fields: Record<string, unknown>): Promise<string | null> {
    const cot = Object.keys(fields)
    const giaTri = Object.values(fields)
    const oDanh = cot.map((_, i) => `$${i + 1}`).join(', ')
    try {
      await db.query(`insert into questions (${cot.join(', ')}) values (${oDanh})`, giaTri)
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
         ($1,'co@x.vn',null,'Cô Thảo'), ($2,'coanh@x.vn',null,'Cô Anh'),
         ($3,null,'+84901000002','Nguyễn Minh Anh'), ($4,null,'+84901000004','Phạm Lan')`,
      [CO, CO_KHAC, EM, TRO_GIANG],
    )
    await db.query(
      `insert into tenants (id, subdomain, owner_account_id) values ($1,'cothao',$3), ($2,'coanh',$4)`,
      [TENANT, TENANT_KHAC, CO, CO_KHAC],
    )
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
    await db.query(
      `insert into exams (id, tenant_id, name, skill, grading, ocr_confidence)
       values ($1,$2,'Cambridge 19 · Reading Test 1','reading','auto',0.94)`,
      [DE, TENANT],
    )
  })

  describe('UC-04 — một đề trộn được bốn loại câu', () => {
    it('trắc nghiệm, điền từ, T/F/NG và tự luận cùng nằm trong một đề', async () => {
      expect(await themCau({ exam_id: DE, no: 1, type: 'mcq', text: 'Chọn A/B/C', options: JSON.stringify(['A', 'B', 'C']), answer: 'B' })).toBeNull()
      expect(await themCau({ exam_id: DE, no: 2, type: 'fill', text: 'Điền từ', answer: 'climate' })).toBeNull()
      expect(await themCau({ exam_id: DE, no: 3, type: 'tfng', text: 'Đúng/Sai/Không có', options: JSON.stringify(['TRUE', 'FALSE', 'NOT GIVEN']), answer: 'FALSE' })).toBeNull()
      expect(await themCau({ exam_id: DE, no: 4, type: 'essay', text: 'Viết 250 từ' })).toBeNull()

      const { rows } = await db.query<{ n: number }>('select count(*)::int as n from questions')
      expect(rows[0]!.n).toBe(4)
    })

    it('trắc nghiệm phải có ít nhất hai lựa chọn', async () => {
      expect(await themCau({ exam_id: DE, no: 1, type: 'mcq', text: 'Thiếu lựa chọn', answer: 'B' }))
        .toMatch(/questions_options_match_type/)
      expect(await themCau({ exam_id: DE, no: 2, type: 'mcq', text: 'Một lựa chọn', options: JSON.stringify(['A']), answer: 'A' }))
        .toMatch(/questions_options_match_type/)
    })

    it('tự luận không mang đáp án chấm máy', async () => {
      expect(await themCau({ exam_id: DE, no: 1, type: 'essay', text: 'Viết', answer: 'đáp án' }))
        .toMatch(/questions_essay_has_no_answer/)
    })

    it('số câu không trùng trong cùng một đề', async () => {
      await themCau({ exam_id: DE, no: 1, type: 'fill', text: 'Câu 1', answer: 'x' })
      expect(await themCau({ exam_id: DE, no: 1, type: 'fill', text: 'Câu 1 lần hai', answer: 'y' }))
        .toMatch(/questions_unique_no/)
    })
  })

  describe('UC-04 — "bấm lại đáp án → bỏ chọn → chấm tay"', () => {
    it('bỏ đáp án mà không nói vì sao thì bị chặn', async () => {
      // Đây là chỗ dễ hỏng âm thầm nhất: câu mất đáp án mà không ai biết.
      expect(await themCau({ exam_id: DE, no: 1, type: 'fill', text: 'Điền từ' }))
        .toMatch(/questions_missing_answer_needs_warning/)
    })

    it('bỏ đáp án kèm lý do thì được — đó là chuyển sang chấm tay', async () => {
      expect(await themCau({
        exam_id: DE, no: 1, type: 'fill', text: 'Điền từ',
        warning: 'Cô bỏ đáp án — câu này chấm tay',
      })).toBeNull()
    })
  })

  describe('UC-03 — số hoá đề bằng OCR', () => {
    it('câu OCR không tìm ra đáp án thì mang cảnh báo và trang nguồn', async () => {
      expect(await themCau({
        exam_id: DE, no: 7, type: 'fill', text: 'Chữ mờ ở đây',
        warning: 'Không đọc được đáp án — chữ mờ', source_page: 4, confidence: 0.42,
      })).toBeNull()

      const { rows } = await db.query('select warning, source_page, confidence from questions')
      expect(rows[0]).toMatchObject({ source_page: 4 })
      expect(Number(rows[0]!.confidence)).toBeCloseTo(0.42)
    })

    it('tìm nhanh được mọi câu cần cô xem lại', async () => {
      await themCau({ exam_id: DE, no: 1, type: 'fill', text: 'Rõ', answer: 'climate' })
      await themCau({ exam_id: DE, no: 2, type: 'fill', text: 'Mờ', warning: 'chữ mờ' })
      const { rows } = await db.query<{ no: number }>(
        'select no from questions where warning is not null order by no',
      )
      expect(rows.map((r) => r.no)).toEqual([2])
    })

    it('tin cậy phải nằm trong 0–1, không phải phần trăm', async () => {
      // Ghi 94 thay vì 0.94 thì mọi ngưỡng tin cậy sau này sai hết: UC-07 chốt trắc
      // nghiệm khi ≥0.97, nên một con số sai thang làm máy tự chốt cả đề đọc hỏng.
      // Hai lớp chặn: kiểu numeric(4,3) đỡ số lớn, CHECK đỡ số trong tầm kiểu.
      await expect(
        db.query('update exams set ocr_confidence = 94 where id = $1', [DE]),
      ).rejects.toThrow(/overflow|exams_confidence_range/)

      await expect(
        db.query('update exams set ocr_confidence = 1.5 where id = $1', [DE]),
      ).rejects.toThrow(/exams_confidence_range/)

      await expect(
        db.query('update exams set ocr_confidence = -0.1 where id = $1', [DE]),
      ).rejects.toThrow(/exams_confidence_range/)
    })
  })

  describe('UC-04 — đoạn văn dùng chung cho dải câu', () => {
    let doanVan: string

    beforeEach(async () => {
      const { rows } = await db.query<{ id: string }>(
        `insert into passages (exam_id, text, from_no, to_no)
         values ($1, 'The Antarctic ice sheet…', 1, 5) returning id`,
        [DE],
      )
      doanVan = rows[0]!.id
    })

    it('câu trong dải gắn được vào đoạn', async () => {
      expect(await themCau({ exam_id: DE, no: 3, type: 'fill', text: 'Câu 3', answer: 'ice', passage_id: doanVan })).toBeNull()
    })

    it('câu ngoài dải thì không — em sẽ đọc nhầm đoạn không liên quan', async () => {
      expect(await themCau({ exam_id: DE, no: 9, type: 'fill', text: 'Câu 9', answer: 'x', passage_id: doanVan }))
        .toMatch(/questions_passage_fits/)
    })

    it('không mượn được đoạn văn của đề khác', async () => {
      const { rows } = await db.query<{ id: string }>(
        `insert into exams (tenant_id, name, skill) values ($1,'Đề khác','reading') returning id`,
        [TENANT],
      )
      const deKhac = rows[0]!.id
      expect(await themCau({ exam_id: deKhac, no: 3, type: 'fill', text: 'Câu 3', answer: 'x', passage_id: doanVan }))
        .toMatch(/questions_passage_fits/)
    })

    it('dải ngược thì chặn', async () => {
      await expect(
        db.query(`insert into passages (exam_id, text, from_no, to_no) values ($1,'x',9,3)`, [DE]),
      ).rejects.toThrow(/passages_range_sane/)
    })
  })

  describe('đề thuộc ngân hàng của cô, không thuộc lớp', () => {
    it('xoá lớp thì đề vẫn còn', async () => {
      // DECISIONS 2026-09: lớp đóng thì đề còn, mở lớp mới là đề theo về.
      await db.query('delete from classes where id = $1', [LOP])
      const { rows } = await db.query<{ n: number }>('select count(*)::int as n from exams')
      expect(rows[0]!.n).toBe(1)
    })

    it('xoá đề thì câu hỏi và đoạn văn đi theo', async () => {
      await db.query(`insert into passages (exam_id, text, from_no, to_no) values ($1,'x',1,5)`, [DE])
      await themCau({ exam_id: DE, no: 1, type: 'fill', text: 'Câu', answer: 'x' })
      await db.query('delete from exams where id = $1', [DE])

      const { rows } = await db.query<{ q: number; p: number }>(
        'select (select count(*) from questions)::int as q, (select count(*) from passages)::int as p',
      )
      expect(rows[0]).toMatchObject({ q: 0, p: 0 })
    })
  })

  describe('ai đọc được ngân hàng đề', () => {
    beforeEach(async () => {
      await db.query(`insert into passages (exam_id, text, from_no, to_no) values ($1,'Đoạn',1,5)`, [DE])
      await themCau({ exam_id: DE, no: 1, type: 'fill', text: 'Câu 1', answer: 'climate' })
    })

    it('cô đọc được', async () => {
      expect(await nhuLa(CO, 'select id from exams')).toHaveLength(1)
      expect(await nhuLa(CO, 'select id from questions')).toHaveLength(1)
    })

    it('trợ giảng đọc được (permissions.json: exam/assistant = read)', async () => {
      expect(await nhuLa(TRO_GIANG, 'select id from exams')).toHaveLength(1)
      expect(await nhuLa(TRO_GIANG, 'select id from questions')).toHaveLength(1)
    })

    it('học viên KHÔNG đọc ngân hàng đề', async () => {
      // Em thấy đề qua bài giao, không qua ngân hàng. Mở ra là lộ cả đề chưa giao,
      // gồm cả đề kiểm tra tuần sau.
      expect(await nhuLa(EM, 'select id from exams')).toHaveLength(0)
      expect(await nhuLa(EM, 'select id from questions')).toHaveLength(0)
      expect(await nhuLa(EM, 'select id from passages')).toHaveLength(0)
    })

    it('cô khác không đọc được đề của cô Thảo', async () => {
      expect(await nhuLa(CO_KHAC, 'select id from exams')).toHaveLength(0)
      expect(await nhuLa(CO_KHAC, 'select id from questions')).toHaveLength(0)
    })
  })
})
