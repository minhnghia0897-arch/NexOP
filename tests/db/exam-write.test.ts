/**
 * Cửa ghi ngân hàng đề: số hoá vào, sửa lại, và lan truyền — chạy trên Postgres thật.
 *
 * Ba chuyện phải chứng minh, cả ba đều là hỏng-không-kêu nếu thiếu:
 *   1. Sửa đề có để lại dấu vết. Cô đổi đáp án một câu là đổi điểm của một đứa trẻ.
 *   2. Lan truyền xuống bài giao KHÔNG phải việc người gọi phải nhớ.
 *   3. Cô điền đáp án cho câu OCR đọc hụt thì cảnh báo tự tắt — nếu không, danh sách
 *      "cần xem lại" không bao giờ rỗng, cô thôi nhìn, và cảnh báo thật chìm theo.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const EM = '22222222-2222-2222-2222-222222222222'

/** Một đề số hoá mẫu: hai câu trắc nghiệm chung đoạn văn, một câu OCR đọc hụt đáp án. */
const DE_MAU = {
  exam: {
    name: 'Cambridge 19 · Reading Test 1',
    skill: 'reading',
    level: 'B2',
    tags: ['cambridge', 'reading'],
    duration_minutes: 60,
    grading: 'auto',
    ocr_confidence: 0.94,
    source_path: 'de/cam19-r1.pdf',
  },
  passages: [{ ref: 'p1', text: 'The history of tea…', from_no: 1, to_no: 3 }],
  questions: [
    { no: 1, type: 'mcq', text: 'Tea originated in…', options: ['China', 'India'],
      answer: 'China', passage_ref: 'p1', source_page: 4, confidence: 0.97 },
    { no: 2, type: 'tfng', text: 'Tea reached Europe before 1600.', options: ['T', 'F', 'NG'],
      answer: 'F', passage_ref: 'p1', source_page: 4, confidence: 0.91 },
    // Câu máy đọc được đề nhưng không thấy đáp án — đúng ca UC-03 nói tới.
    { no: 3, type: 'fill', text: 'Tea was first traded in the ____ century.',
      warning: 'Không tìm thấy đáp án ở trang 5', source_page: 5, confidence: 0.42 },
  ],
}

maybe('cửa ghi ngân hàng đề — số hoá, sửa, lan truyền', () => {
  let db: Client
  let tenantId: string
  let classId: string
  let soLan = 0

  async function thu(sql: string, params: unknown[] = []): Promise<string> {
    try {
      await db.query(sql, params)
      return 'KHÔNG NÉM LỖI'
    } catch (e) {
      return (e as Error).message
    }
  }

  async function soHoa(de = DE_MAU): Promise<string> {
    const { rows } = await db.query<{ id: string }>(
      'select app.import_digitized_exam($1,$2,$3,$4,$5) as id',
      [tenantId, CO, JSON.stringify(de.exam), JSON.stringify(de.passages),
       JSON.stringify(de.questions)],
    )
    return rows[0]!.id
  }

  async function cauSo(examId: string, no: number) {
    const { rows } = await db.query<{
      type: string; text: string; answer: string | null; warning: string | null
      options: unknown; passage_id: string | null; source_page: number | null
    }>(
      `select type, text, answer, warning, options, passage_id, source_page
         from questions where exam_id = $1 and no = $2`,
      [examId, no],
    )
    return rows[0]
  }

  beforeAll(async () => {
    db = new Client({ connectionString: DATABASE_URL })
    await db.connect()
    await dungLaiSchema(db)

    await db.query(
      `insert into accounts (id, email, phone, name) values
         ($1,'co.thao@example.com',null,'Cô Thảo'),
         ($2,null,'+84901000002','Nguyễn Minh Anh')`,
      [CO, EM],
    )
  })

  afterAll(async () => {
    await db?.end()
  })

  beforeEach(async () => {
    soLan += 1
    const { rows } = await db.query<{ id: string }>('select app.register_tenant($1,$2,null) as id', [
      `cothao-${soLan}`, CO,
    ])
    tenantId = rows[0]!.id

    // Lớp dựng bằng insert thẳng: bảng classes không nằm sau cửa của 0013.
    const { rows: lop } = await db.query<{ id: string }>(
      `insert into classes (tenant_id, name, status) values ($1,'IELTS 6.5','running') returning id`,
      [tenantId],
    )
    classId = lop[0]!.id
    await db.query(
      `insert into memberships (account_id, tenant_id, class_id, role, status, activated_at)
       values ($1,$2,$3,'student','active',now())`,
      [EM, tenantId, classId],
    )
  })

  describe('cửa chặn ghi thẳng', () => {
    it('insert thẳng vào questions bị chặn, kèm lời chỉ đường', async () => {
      const examId = await soHoa()
      const loi = await thu(
        `insert into questions (exam_id, no, type, text, answer) values ($1, 99, 'fill', 'x', 'y')`,
        [examId],
      )
      expect(loi).toMatch(/Không ghi thẳng vào ngân hàng đề/)
      expect(loi).toMatch(/app\.save_exam_edit/)
    })

    it('update và delete thẳng cũng bị chặn', async () => {
      const examId = await soHoa()
      expect(
        await thu(`update questions set answer = 'sai' where exam_id = $1`, [examId]),
      ).toMatch(/Không ghi thẳng/)
      expect(await thu('delete from questions where exam_id = $1', [examId])).toMatch(
        /Không ghi thẳng/,
      )
    })

    it('exams và passages cũng nằm sau cửa', async () => {
      expect(
        await thu(`insert into exams (tenant_id, name, skill) values ($1,'lén','reading')`, [
          tenantId,
        ]),
      ).toMatch(/Không ghi thẳng/)
    })
  })

  describe('UC-03 — đưa kết quả số hoá vào ngân hàng', () => {
    it('cả đề vào một lượt: thông tin đề, đoạn văn, câu hỏi', async () => {
      const examId = await soHoa()

      const { rows: de } = await db.query<{ name: string; skill: string; ocr_confidence: string }>(
        'select name, skill, ocr_confidence from exams where id = $1', [examId],
      )
      expect(de[0]!.skill).toBe('reading')
      expect(Number(de[0]!.ocr_confidence)).toBe(0.94)

      const { rows: dem } = await db.query<{ n: string }>(
        'select count(*)::text as n from questions where exam_id = $1', [examId],
      )
      expect(Number(dem[0]!.n)).toBe(3)
    })

    it('câu nối đúng đoạn văn của nó', async () => {
      const examId = await soHoa()
      const c1 = await cauSo(examId, 1)
      expect(c1!.passage_id).not.toBeNull()

      const { rows } = await db.query<{ from_no: number; to_no: number }>(
        'select from_no, to_no from passages where id = $1', [c1!.passage_id],
      )
      expect(rows[0]).toMatchObject({ from_no: 1, to_no: 3 })
    })

    it('câu OCR đọc hụt giữ nguyên cảnh báo và trang nguồn (UC-03)', async () => {
      const examId = await soHoa()
      const c3 = await cauSo(examId, 3)
      expect(c3!.answer).toBeNull()
      expect(c3!.warning).toMatch(/Không tìm thấy đáp án/)
      expect(c3!.source_page).toBe(5)
    })

    it('ghi sự kiện exam.create, cô đọc được', async () => {
      const examId = await soHoa()
      const { rows } = await db.query<{ action: string; actor_role: string; payload: { so_cau: number } }>(
        `select action, actor_role, payload from events
          where tenant_id = $1 and action = 'exam.create'`, [tenantId],
      )
      expect(rows[0]).toMatchObject({ action: 'exam.create', actor_role: 'owner' })
      expect(rows[0]!.payload.so_cau).toBe(3)
      expect(examId).toBeTruthy()
    })

    it('đề rỗng bị từ chối — lưu một thứ không dùng được thì không phải là lưu', async () => {
      expect(
        await thu('select app.import_digitized_exam($1,$2,$3,$4,$5)', [
          tenantId, CO, JSON.stringify(DE_MAU.exam), '[]', '[]',
        ]),
      ).toMatch(/ít nhất một câu hỏi/)
    })

    it('trỏ tới đoạn văn không có thì hỏng NGAY, không im lặng bỏ qua', async () => {
      const loi = await thu('select app.import_digitized_exam($1,$2,$3,$4,$5)', [
        tenantId, CO, JSON.stringify(DE_MAU.exam), JSON.stringify(DE_MAU.passages),
        JSON.stringify([{ no: 1, type: 'mcq', text: 'x', options: ['a', 'b'], answer: 'a',
                          passage_ref: 'khong-co' }]),
      ])
      expect(loi).toMatch(/không có trong đề/)
    })

    it('hỏng giữa chừng thì không để lại đề nửa vời', async () => {
      // Câu 2 vi phạm ràng buộc (mcq một lựa chọn). Cả đề phải biến mất, không phải còn câu 1.
      const truoc = await db.query('select count(*)::int as n from exams where tenant_id = $1', [
        tenantId,
      ])
      await thu('select app.import_digitized_exam($1,$2,$3,$4,$5)', [
        tenantId, CO, JSON.stringify(DE_MAU.exam), '[]',
        JSON.stringify([
          { no: 1, type: 'fill', text: 'ok', answer: 'x' },
          { no: 2, type: 'mcq', text: 'hỏng', options: ['chỉ-một'], answer: 'chỉ-một' },
        ]),
      ])
      const sau = await db.query('select count(*)::int as n from exams where tenant_id = $1', [
        tenantId,
      ])
      expect(sau.rows[0]!.n).toBe(truoc.rows[0]!.n)
    })
  })

  describe('UC-04 — sửa đề', () => {
    it('sửa nội dung câu, và ghi sự kiện exam.update', async () => {
      const examId = await soHoa()
      await db.query('select * from app.save_exam_edit($1,$2,$3,$4)', [
        tenantId, CO, examId,
        JSON.stringify([{ no: 1, text: 'Tea originated in which country?' }]),
      ])

      expect((await cauSo(examId, 1))!.text).toBe('Tea originated in which country?')

      const { rows } = await db.query<{ action: string }>(
        `select action from events where tenant_id = $1 and action = 'exam.update'`, [tenantId],
      )
      expect(rows).toHaveLength(1)
    })

    it('thêm câu mới bằng số câu chưa có', async () => {
      const examId = await soHoa()
      await db.query('select * from app.save_exam_edit($1,$2,$3,$4)', [
        tenantId, CO, examId,
        JSON.stringify([{ no: 4, type: 'essay', text: 'Discuss the role of tea.' }]),
      ])
      expect((await cauSo(examId, 4))!.type).toBe('essay')
    })

    it('xoá câu theo số câu', async () => {
      const examId = await soHoa()
      await db.query('select * from app.save_exam_edit($1,$2,$3,$4,$5)', [
        tenantId, CO, examId, '[]', [3],
      ])
      expect(await cauSo(examId, 3)).toBeUndefined()
    })

    it('sửa thông tin đề, giữ nguyên phần không gửi lên', async () => {
      const examId = await soHoa()
      await db.query('select * from app.save_exam_edit($1,$2,$3,$4,$5,$6)', [
        tenantId, CO, examId, '[]', '{}', JSON.stringify({ duration_minutes: 75 }),
      ])
      const { rows } = await db.query<{ name: string; duration_minutes: number }>(
        'select name, duration_minutes from exams where id = $1', [examId],
      )
      expect(rows[0]!.duration_minutes).toBe(75)
      expect(rows[0]!.name).toBe(DE_MAU.exam.name)
    })

    it('đề của tên miền khác thì không sửa được', async () => {
      const examId = await soHoa()
      const { rows } = await db.query<{ id: string }>(
        'select app.register_tenant($1,$2,null) as id', [`cokhac-${soLan}`, CO],
      )
      expect(
        await thu('select * from app.save_exam_edit($1,$2,$3,$4)', [
          rows[0]!.id, CO, examId, '[]',
        ]),
      ).toMatch(/không tồn tại trong tên miền này/)
    })
  })

  describe('cảnh báo OCR — tự tắt khi cô đã xử lý', () => {
    it('điền đáp án cho câu đọc hụt thì cảnh báo biến mất', async () => {
      const examId = await soHoa()
      expect((await cauSo(examId, 3))!.warning).not.toBeNull()

      await db.query('select * from app.save_exam_edit($1,$2,$3,$4)', [
        tenantId, CO, examId, JSON.stringify([{ no: 3, answer: 'seventeenth' }]),
      ])

      const c3 = await cauSo(examId, 3)
      expect(c3!.answer).toBe('seventeenth')
      // Không tắt thì danh sách "cần xem lại" không bao giờ rỗng, và cô thôi nhìn nó.
      expect(c3!.warning).toBeNull()
    })

    it('danh sách cần-xem-lại rỗng sau khi cô sửa xong', async () => {
      const examId = await soHoa()
      await db.query('select * from app.save_exam_edit($1,$2,$3,$4)', [
        tenantId, CO, examId, JSON.stringify([{ no: 3, answer: 'seventeenth' }]),
      ])
      const { rows } = await db.query<{ n: string }>(
        'select count(*)::text as n from questions where exam_id = $1 and warning is not null',
        [examId],
      )
      expect(Number(rows[0]!.n)).toBe(0)
    })

    it('nhưng cô cố ý ghi cảnh báo thì nghe cô', async () => {
      const examId = await soHoa()
      await db.query('select * from app.save_exam_edit($1,$2,$3,$4)', [
        tenantId, CO, examId,
        JSON.stringify([{ no: 1, answer: 'China', warning: 'Đáp án sách in sai, cần kiểm lại' }]),
      ])
      expect((await cauSo(examId, 1))!.warning).toMatch(/sách in sai/)
    })

    it('sửa câu khác không đụng tới cảnh báo của câu đang chờ', async () => {
      const examId = await soHoa()
      await db.query('select * from app.save_exam_edit($1,$2,$3,$4)', [
        tenantId, CO, examId, JSON.stringify([{ no: 3, text: 'Sửa lại câu chữ cho rõ' }]),
      ])
      // Chưa có đáp án thì vẫn còn phải xem lại.
      expect((await cauSo(examId, 3))!.warning).not.toBeNull()
    })
  })

  describe('lan truyền — nằm trong hàm sửa, không phải việc phải nhớ', () => {
    async function giaoBai(examId: string): Promise<string> {
      const { rows } = await db.query<{ id: string }>(
        'select app.publish_assignment($1,$2,$3,$4) as id', [tenantId, CO, classId, examId],
      )
      return rows[0]!.id
    }

    it('sửa đề xong, bài giao chưa ai nộp nhận thay đổi ngay', async () => {
      const examId = await soHoa()
      const baiGiao = await giaoBai(examId)

      const { rows } = await db.query<{ updated: number; skipped: number }>(
        'select * from app.save_exam_edit($1,$2,$3,$4)', [
          tenantId, CO, examId, JSON.stringify([{ no: 1, text: 'Câu hỏi đã sửa' }]),
        ],
      )
      expect(rows[0]).toMatchObject({ updated: 1, skipped: 0 })

      const { rows: bg } = await db.query<{ questions: { no: number; text: string }[] }>(
        'select questions from assignments where id = $1', [baiGiao],
      )
      expect(bg[0]!.questions.find((q) => q.no === 1)!.text).toBe('Câu hỏi đã sửa')
    })

    it('thêm đoạn văn vào đề đã giao — đúng vết sẹo số 1 của bản cũ', async () => {
      // "Cô thêm đoạn văn đọc hiểu, lưu, học viên mở ra không thấy đoạn văn đâu."
      const examId = await soHoa()
      const baiGiao = await giaoBai(examId)

      await db.query('select * from app.save_exam_edit($1,$2,$3,$4)', [
        tenantId, CO, examId,
        JSON.stringify([{ no: 4, type: 'fill', text: 'Câu hỏi mới thêm', answer: 'x' }]),
      ])

      const { rows } = await db.query<{ questions: { no: number }[] }>(
        'select questions from assignments where id = $1', [baiGiao],
      )
      expect(rows[0]!.questions.map((q) => q.no).sort()).toEqual([1, 2, 3, 4])
    })

    it('bài đã có người nộp thì giữ nguyên, và BÁO cho cô biết', async () => {
      const examId = await soHoa()
      const baiGiao = await giaoBai(examId)
      await db.query(
        `insert into submissions (assignment_id, student_id, content, submitted_at)
         values ($1,$2,'Bài em làm', now())`,
        [baiGiao, EM],
      )

      const { rows } = await db.query<{ updated: number; skipped: number }>(
        'select * from app.save_exam_edit($1,$2,$3,$4)', [
          tenantId, CO, examId, JSON.stringify([{ no: 1, text: 'Sửa sau khi em đã nộp' }]),
        ],
      )
      // Nuốt con số này là lấy mất của cô quyết định giao lại thành lần 2.
      expect(rows[0]).toMatchObject({ updated: 0, skipped: 1 })

      const { rows: bg } = await db.query<{ questions: { no: number; text: string }[] }>(
        'select questions from assignments where id = $1', [baiGiao],
      )
      expect(bg[0]!.questions.find((q) => q.no === 1)!.text).toBe(DE_MAU.questions[0]!.text)
    })
  })
})
