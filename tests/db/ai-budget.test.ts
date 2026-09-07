/**
 * Hạn mức AI và cache số hoá, chạy trên Postgres thật.
 *
 * Hai vết sẹo cuối nhập từ bản OBLUE đang chạy (docs/SO-SANH-BAN-CU-BAN-MOI.md §3.3, §3.4).
 * Cả hai cùng một kiểu hỏng: không exception, không cảnh báo, chỉ hoá đơn cuối tháng.
 *
 * Nên điều phải chứng minh là con số CHẶN THẬT — không phải là có bảng để ghi.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const NGUOI_LA = '22222222-2222-2222-2222-222222222222'
/** 20 học viên — đúng khách hàng SRS mô tả: giáo viên đã có lớp. */
const SO_HOC_VIEN = 20

const SHA = 'a'.repeat(64)

maybe('hạn mức AI và cache số hoá', () => {
  let db: Client
  let tenantId: string
  let soDangKy = 0

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

  async function so(sql: string, params: unknown[] = []): Promise<number> {
    const { rows } = await db.query<{ v: string }>(sql, params)
    return Number(rows[0]!.v)
  }

  /** Xin phép gọi AI; trả id, hoặc null nếu vượt trần. */
  async function xin(task: string, giaVnd: number): Promise<string | null> {
    const { rows } = await db.query<{ id: string | null }>(
      'select app.claim_ai_call($1,$2,$3) as id', [tenantId, task, giaVnd],
    )
    return rows[0]!.id
  }

  beforeAll(async () => {
    db = new Client({ connectionString: DATABASE_URL })
    await db.connect()
    await dungLaiSchema(db)

    await db.query(
      `insert into accounts (id, email, name) values ($1,'co.thao@example.com','Cô Thảo'),
                                                    ($2,'nguoi.la@example.com','Người lạ')`,
      [CO, NGUOI_LA],
    )
    for (let i = 0; i < SO_HOC_VIEN; i += 1) {
      await db.query(
        `insert into accounts (id, phone, name) values ($1, $2, $3)`,
        [hocVienId(i), `+849010${String(i).padStart(5, '0')}`, `Học viên ${i}`],
      )
    }
  })

  function hocVienId(i: number): string {
    return `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`
  }

  afterAll(async () => {
    await db?.end()
  })

  beforeEach(async () => {
    soDangKy += 1
    const { rows } = await db.query<{ id: string }>('select app.register_tenant($1,$2,null) as id', [
      `cothao-${soDangKy}`, CO,
    ])
    tenantId = rows[0]!.id
  })

  /** Gắn n học viên hoạt động vào tên miền — đây là thứ quyết định trần. */
  async function themHocVien(n: number): Promise<void> {
    for (let i = 0; i < n; i += 1) {
      await db.query(
        `insert into memberships (account_id, tenant_id, role, status, activated_at)
         values ($1,$2,'student','active',now())`,
        [hocVienId(i), tenantId],
      )
    }
  }

  describe('trần tháng — theo số học viên hoạt động', () => {
    it('chưa có học viên nào thì vẫn có sàn, không phải số không', async () => {
      // Công thức thuần tuý cho cô mới 0đ, tức là chưa kịp thấy sản phẩm hay ở đâu đã cụt.
      expect(await so('select app.ai_budget_vnd($1)::text as v', [tenantId])).toBe(50000)
    })

    it('3 học viên vẫn nằm dưới sàn', async () => {
      await themHocVien(3)
      expect(await so('select app.ai_budget_vnd($1)::text as v', [tenantId])).toBe(50000)
    })

    it('20 học viên thì công thức thắng sàn: 3.000đ mỗi em', async () => {
      await themHocVien(SO_HOC_VIEN)
      expect(await so('select app.ai_budget_vnd($1)::text as v', [tenantId])).toBe(60000)
    })

    it('học viên đã nghỉ không tính vào trần', async () => {
      await themHocVien(SO_HOC_VIEN)
      await db.query(
        `update memberships set status = 'left' where tenant_id = $1 and role = 'student'`,
        [tenantId],
      )
      expect(await so('select app.ai_budget_vnd($1)::text as v', [tenantId])).toBe(50000)
    })

    it('trần đặt riêng đè lên công thức', async () => {
      await themHocVien(SO_HOC_VIEN)
      await db.query('update tenants set ai_budget_vnd = 500000 where id = $1', [tenantId])
      expect(await so('select app.ai_budget_vnd($1)::text as v', [tenantId])).toBe(500000)
    })
  })

  describe('xin phép — con số chặn thật', () => {
    beforeEach(async () => {
      await themHocVien(SO_HOC_VIEN) // trần 60.000đ
    })

    it('trong hạn thì đi qua, và trừ vào phần đã tiêu', async () => {
      const id = await xin('digitize', 20000)
      expect(id).not.toBeNull()
      expect(await so('select app.ai_spent_vnd($1)::text as v', [tenantId])).toBe(20000)
    })

    it('vượt trần thì trả NULL — và đó là lệnh không được gọi', async () => {
      expect(await xin('digitize', 50000)).not.toBeNull()
      expect(await xin('grade', 20000)).toBeNull()
    })

    it('đúng bằng trần thì vẫn được đi; hơn một đồng là không', async () => {
      expect(await xin('digitize', 60000)).not.toBeNull()
      expect(await xin('grade', 1)).toBeNull()
    })

    it('lần bị chặn vẫn để lại dấu, và không tính tiền', async () => {
      await xin('digitize', 60000)
      await xin('grade', 5000)

      const { rows } = await db.query<{ allowed: boolean; est_cost_vnd: string }>(
        'select allowed, est_cost_vnd from ai_usage where tenant_id = $1 order by at', [tenantId],
      )
      expect(rows.map((r) => r.allowed)).toEqual([true, false])
      // Bị chặn nghĩa là không gọi, nên không tốn gì — nhưng vẫn thấy được là có đụng trần.
      expect(Number(rows[1]!.est_cost_vnd)).toBe(0)
      expect(await so('select app.ai_spent_vnd($1)::text as v', [tenantId])).toBe(60000)
    })

    it('cô nhìn thấy trong nhật ký là mình hết hạn mức', async () => {
      // Hết hạn mức mà máy im lặng thì cô tưởng hệ thống hỏng — mất niềm tin, không mất tiền.
      await xin('digitize', 60000)
      await xin('grade', 5000)

      const rows = await asAccount<{ action: string; actor_role: string }>(
        CO, `select action, actor_role from events
              where tenant_id = '${tenantId}' and action like 'ai.%'`,
      )
      // `auto:` vì máy ghi — ARCHITECTURE §4 chỉ cho máy sinh draft/propose/auto:*.
      expect(rows).toEqual([{ action: 'ai.auto:limit', actor_role: 'system' }])
    })

    it('nhiều lần chưa quyết toán vẫn cộng dồn bằng ước tính', async () => {
      // Không có vế này thì hai chục yêu cầu song song đều thấy ngân sách còn nguyên.
      for (let i = 0; i < 6; i += 1) expect(await xin('grade', 10000)).not.toBeNull()
      expect(await xin('grade', 10000)).toBeNull()
    })

    it('ước tính âm bị từ chối thẳng', async () => {
      expect(await thu('select app.claim_ai_call($1,$2,$3)', [tenantId, 'grade', -1])).toMatch(
        /không âm/,
      )
    })
  })

  describe('quyết toán — sổ tiền, chỉ ghi một lần', () => {
    beforeEach(async () => {
      await themHocVien(SO_HOC_VIEN)
    })

    it('chi phí thật thay chỗ ước tính', async () => {
      const id = await xin('digitize', 20000)
      await db.query('select app.settle_ai_call($1,$2)', [id, 7500])
      expect(await so('select app.ai_spent_vnd($1)::text as v', [tenantId])).toBe(7500)
    })

    it('rẻ hơn dự tính thì phần thừa trả lại ngân sách ngay', async () => {
      const id = await xin('digitize', 55000)
      expect(await xin('grade', 10000)).toBeNull()

      await db.query('select app.settle_ai_call($1,$2)', [id, 5000])
      expect(await xin('grade', 10000)).not.toBeNull()
    })

    it('không quyết toán được hai lần', async () => {
      const id = await xin('digitize', 20000)
      await db.query('select app.settle_ai_call($1,$2)', [id, 7500])
      expect(await thu('select app.settle_ai_call($1,$2)', [id, 100])).toMatch(/đã quyết toán rồi/)
    })

    it('không quyết toán được một lần chưa từng xảy ra', async () => {
      expect(
        await thu('select app.settle_ai_call($1,$2)', [
          '99999999-9999-9999-9999-999999999999', 100,
        ]),
      ).toMatch(/Không có lần gọi nào/)
    })

    it('không sửa được phần còn lại của dòng', async () => {
      const id = await xin('digitize', 20000)
      expect(
        await thu('update ai_usage set est_cost_vnd = 1 where id = $1', [id]),
      ).toMatch(/bất biến/)
    })

    it('không xoá được sổ tiền', async () => {
      const id = await xin('digitize', 20000)
      expect(await thu('delete from ai_usage where id = $1', [id])).toMatch(/không xoá được/)
    })

    it('ràng buộc chặn dòng bị-chặn-mà-có-tiền', async () => {
      expect(
        await thu(
          `insert into ai_usage (tenant_id, task, est_cost_vnd, allowed)
           values ($1,'grade',1000,false)`,
          [tenantId],
        ),
      ).toMatch(/ai_usage_denied_costs_nothing/)
    })
  })

  describe('ai_usage — tiền của cô, cô đọc được, người khác thì không', () => {
    it('cô đọc được sổ chi của mình', async () => {
      await themHocVien(SO_HOC_VIEN)
      await xin('digitize', 1000)
      const rows = await asAccount(CO, `select id from ai_usage where tenant_id = '${tenantId}'`)
      expect(rows).toHaveLength(1)
    })

    it('người ngoài không đọc được', async () => {
      await themHocVien(SO_HOC_VIEN)
      await xin('digitize', 1000)
      const rows = await asAccount(
        NGUOI_LA, `select id from ai_usage where tenant_id = '${tenantId}'`,
      )
      expect(rows).toHaveLength(0)
    })
  })

  describe('cache số hoá — dùng chung theo băm tệp', () => {
    const MODEL = 'model-nho-v1'
    const PROMPT = 'ocr-2026-09'

    beforeEach(async () => {
      await db.query('delete from digitize_cache')
    })

    it('chưa có thì trả NULL', async () => {
      const { rows } = await db.query<{ v: unknown }>(
        'select app.lookup_digitize_cache($1,$2,$3) as v', [SHA, MODEL, PROMPT],
      )
      expect(rows[0]!.v).toBeNull()
    })

    it('cất rồi tra lại thì trúng', async () => {
      await db.query('select app.store_digitize_cache($1,$2,$3,$4,$5)', [
        SHA, MODEL, PROMPT, JSON.stringify({ questions: [{ no: 1 }] }), 12,
      ])
      const { rows } = await db.query<{ v: { questions: unknown[] } }>(
        'select app.lookup_digitize_cache($1,$2,$3) as v', [SHA, MODEL, PROMPT],
      )
      expect(rows[0]!.v.questions).toHaveLength(1)
    })

    it('tên miền khác cũng trúng — đó là điểm của cache dùng chung', async () => {
      // Cùng một quyển Cambridge, hai cô, một lần gọi AI.
      await db.query('select app.store_digitize_cache($1,$2,$3,$4)', [
        SHA, MODEL, PROMPT, JSON.stringify({ questions: [] }),
      ])
      const { rows } = await db.query<{ v: unknown }>(
        'select app.lookup_digitize_cache($1,$2,$3) as v', [SHA, MODEL, PROMPT],
      )
      expect(rows[0]!.v).not.toBeNull()
    })

    it('đổi model là trượt cache, không trả bản bóc cũ', async () => {
      // Thiếu vế này thì nâng cấp model xong máy "vẫn đọc sai y như hôm qua".
      await db.query('select app.store_digitize_cache($1,$2,$3,$4)', [
        SHA, MODEL, PROMPT, JSON.stringify({ questions: [] }),
      ])
      const { rows } = await db.query<{ v: unknown }>(
        'select app.lookup_digitize_cache($1,$2,$3) as v', [SHA, 'model-lon-v2', PROMPT],
      )
      expect(rows[0]!.v).toBeNull()
    })

    it('đổi phiên bản prompt cũng là trượt cache', async () => {
      await db.query('select app.store_digitize_cache($1,$2,$3,$4)', [
        SHA, MODEL, PROMPT, JSON.stringify({ questions: [] }),
      ])
      const { rows } = await db.query<{ v: unknown }>(
        'select app.lookup_digitize_cache($1,$2,$3) as v', [SHA, MODEL, 'ocr-2026-12'],
      )
      expect(rows[0]!.v).toBeNull()
    })

    it('đếm số lần trúng, để biết cache có đáng giữ không', async () => {
      await db.query('select app.store_digitize_cache($1,$2,$3,$4)', [
        SHA, MODEL, PROMPT, JSON.stringify({}),
      ])
      await db.query('select app.lookup_digitize_cache($1,$2,$3)', [SHA, MODEL, PROMPT])
      await db.query('select app.lookup_digitize_cache($1,$2,$3)', [SHA, MODEL, PROMPT])
      expect(await so('select hits::text as v from digitize_cache where file_sha256 = $1', [SHA]))
        .toBe(2)
    })

    it('băm sai hình dạng bị từ chối', async () => {
      // Nhận bừa một chuỗi làm khoá là mở đường nhét bản bóc giả vào cache của mọi người.
      for (const xau of ['khong-phai-bam', 'A'.repeat(64), 'a'.repeat(63)]) {
        expect(
          await thu('select app.store_digitize_cache($1,$2,$3,$4)', [
            xau, MODEL, PROMPT, JSON.stringify({}),
          ]),
        ).toMatch(/digitize_cache_sha_shape/)
      }
    })

    it('cất lại cùng khoá thì ghi đè, không nhân đôi', async () => {
      await db.query('select app.store_digitize_cache($1,$2,$3,$4)', [
        SHA, MODEL, PROMPT, JSON.stringify({ v: 1 }),
      ])
      await db.query('select app.store_digitize_cache($1,$2,$3,$4)', [
        SHA, MODEL, PROMPT, JSON.stringify({ v: 2 }),
      ])
      expect(await so('select count(*)::text as v from digitize_cache', [])).toBe(1)
      const { rows } = await db.query<{ v: { v: number } }>(
        'select app.lookup_digitize_cache($1,$2,$3) as v', [SHA, MODEL, PROMPT],
      )
      expect(rows[0]!.v.v).toBe(2)
    })

    it('không ai đọc được cache qua RLS', async () => {
      await db.query('select app.store_digitize_cache($1,$2,$3,$4)', [
        SHA, MODEL, PROMPT, JSON.stringify({}),
      ])
      expect(await asAccount(CO, 'select file_sha256 from digitize_cache')).toHaveLength(0)
      expect(await asAccount(NGUOI_LA, 'select file_sha256 from digitize_cache')).toHaveLength(0)
    })
  })
})
