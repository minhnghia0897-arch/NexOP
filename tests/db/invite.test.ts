/**
 * Vòng đời lời mời và đăng ký học thử, chạy trên Postgres thật.
 *
 * UC-02 và ARCHITECTURE §6 có nhiều nhánh từ chối hơn nhánh thành công, và chính
 * mấy nhánh đó giữ cho người lạ không tự thêm mình vào lớp của cô. Test ở đây đi
 * hết từng nhánh.
 */
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { cheSoDienThoai, chuanHoaSoDienThoai } from '@/lib/domain/tenant/phone'

import { dungLaiSchema } from './schema'

const DATABASE_URL = process.env.DATABASE_URL
const maybe = DATABASE_URL ? describe : describe.skip

const CO = '11111111-1111-1111-1111-111111111111'
const TENANT = '55555555-5555-5555-5555-555555555555'
const LOP = '77777777-7777-7777-7777-777777777777'
const LOP_KHAC = '88888888-8888-8888-8888-888888888888'

/** SĐT cô lưu cho em, ở dạng đã chuẩn hoá. */
const SO_CUA_EM = chuanHoaSoDienThoai('0901234567')!
const SO_NGUOI_LA = chuanHoaSoDienThoai('0912345678')!

interface KetQuaMoi {
  outcome: string
  account_id: string | null
}

maybe('lời mời trên Postgres thật', () => {
  let db: Client
  let soThuTuToken = 0

  async function moiEm(phone = SO_CUA_EM): Promise<string> {
    soThuTuToken += 1
    const token = `token-${soThuTuToken}`
    await db.query(
      `select app.create_invite($1, $2, 'student', $3, $4, $5, 'Nguyễn Minh Anh')`,
      [TENANT, CO, phone, token, LOP],
    )
    return token
  }

  async function nhanLoiMoi(token: string, phone: string): Promise<KetQuaMoi> {
    const { rows } = await db.query<{ accept_invite: string }>(
      'select app.accept_invite($1, $2, $3) as accept_invite',
      [token, phone, 'Nguyễn Minh Anh'],
    )
    // Postgres trả kiểu composite dạng "(accepted,uuid)".
    const [outcome, accountId] = rows[0]!.accept_invite.replace(/^\(|\)$/g, '').split(',')
    return { outcome: outcome!, account_id: accountId ? accountId : null }
  }

  /** Sự kiện cô nhìn thấy về một lời mời. */
  async function suKienCoThay(): Promise<{ action: string; payload: Record<string, unknown> }[]> {
    const { rows } = await db.query(
      `select action, payload from events
        where $1 = any(visibility) and object_type = 'membership'
        order by at`,
      [CO],
    )
    return rows as { action: string; payload: Record<string, unknown> }[]
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
    soThuTuToken = 0
    await db.query(
      `insert into accounts (id, email, name) values ($1, 'co.thao@example.com', 'Cô Thảo')`,
      [CO],
    )
    // Tên miền đã được admin duyệt (0009). Chưa duyệt thì đọc rỗng và ghi không được,
    // nên mọi test bên dưới sẽ đỏ — đó là ý đồ của cửa chặn, không phải phiền toái.
    await db.query(
      `insert into tenants (id, subdomain, owner_account_id, status, approved_at)
       values ($1, $2, $3, 'active', now())`,
      [TENANT, 'cothao', CO],
    )
    await db.query(
      `insert into memberships (account_id, tenant_id, role, status)
       values ($1, $2, 'owner', 'active')`,
      [CO, TENANT],
    )
    // Lớp phải có thật: memberships_class_same_tenant (0004) chặn gắn tư cách vào
    // một lớp không tồn tại hoặc thuộc tên miền khác.
    await db.query(
      `insert into classes (id, tenant_id, name, status) values
         ($1, $3, 'IELTS 6.5 · Tối T3/T5', 'running'),
         ($2, $3, 'IELTS 5.5 · Sáng T7/CN', 'running')`,
      [LOP, LOP_KHAC, TENANT],
    )
  })

  describe('nhánh thành công', () => {
    it('SĐT khớp thì em vào lớp', async () => {
      const token = await moiEm()
      const ketQua = await nhanLoiMoi(token, SO_CUA_EM)

      expect(ketQua.outcome).toBe('accepted')
      expect(ketQua.account_id).toBeTruthy()

      const { rows } = await db.query(
        'select status, account_id, class_id from memberships where invite_token = $1',
        [token],
      )
      expect(rows[0]).toMatchObject({ status: 'active', account_id: ketQua.account_id, class_id: LOP })
    })

    it('em gõ số kiểu khác vẫn vào được, vì đã chuẩn hoá trước', async () => {
      const token = await moiEm()
      // Cô lưu "0901234567", em gõ "+84 90 123 4567" — cùng một người.
      const ketQua = await nhanLoiMoi(token, chuanHoaSoDienThoai('+84 90 123 4567')!)
      expect(ketQua.outcome).toBe('accepted')
    })

    it('SĐT đã có tài khoản ở tên miền khác thì gắn vào, không tạo mới (UC-02)', async () => {
      const daCo = await db.query<{ id: string }>(
        'insert into accounts (phone, name) values ($1, $2) returning id',
        [SO_CUA_EM, 'Nguyễn Minh Anh'],
      )
      const truoc = await db.query<{ n: number }>('select count(*)::int as n from accounts')

      const token = await moiEm()
      const ketQua = await nhanLoiMoi(token, SO_CUA_EM)

      const sau = await db.query<{ n: number }>('select count(*)::int as n from accounts')
      expect(ketQua.account_id).toBe(daCo.rows[0]!.id)
      expect(sau.rows[0]!.n).toBe(truoc.rows[0]!.n)
    })
  })

  describe('nhánh từ chối', () => {
    it('SĐT lệch thì từ chối VÀ cô nhận được thông báo', async () => {
      const token = await moiEm()
      const ketQua = await nhanLoiMoi(token, SO_NGUOI_LA)

      expect(ketQua.outcome).toBe('phone_mismatch')

      // Đây là điểm mấu chốt: từ chối rồi nhưng sự kiện vẫn phải ở lại.
      // Nếu cài bằng cách ném lỗi thì transaction lùi và cô không bao giờ biết.
      const suKien = await suKienCoThay()
      const tuChoi = suKien.find((s) => s.payload.outcome === 'phone_mismatch')
      expect(tuChoi).toBeDefined()
      expect(tuChoi!.payload.tried_phone).toBe(SO_NGUOI_LA)

      const { rows } = await db.query('select status from memberships where invite_token = $1', [token])
      expect(rows[0]).toMatchObject({ status: 'pending' })
    })

    it('link chỉ dùng được một lần', async () => {
      const token = await moiEm()
      expect((await nhanLoiMoi(token, SO_CUA_EM)).outcome).toBe('accepted')
      expect((await nhanLoiMoi(token, SO_CUA_EM)).outcome).toBe('already_used')
    })

    it('link quá 7 ngày thì hết hạn', async () => {
      const token = await moiEm()
      await db.query(
        `update memberships set created_at = now() - interval '8 days' where invite_token = $1`,
        [token],
      )

      expect((await nhanLoiMoi(token, SO_CUA_EM)).outcome).toBe('expired')

      const { rows } = await db.query('select status from memberships where invite_token = $1', [token])
      expect(rows[0]).toMatchObject({ status: 'expired' })
    })

    it('link đúng 6 ngày thì vẫn dùng được', async () => {
      const token = await moiEm()
      await db.query(
        `update memberships set created_at = now() - interval '6 days' where invite_token = $1`,
        [token],
      )
      expect((await nhanLoiMoi(token, SO_CUA_EM)).outcome).toBe('accepted')
    })

    it('token bịa ra thì không tìm thấy', async () => {
      expect((await nhanLoiMoi('token-bia-ra', SO_CUA_EM)).outcome).toBe('not_found')
    })

    it('không nhánh từ chối nào tạo ra tài khoản', async () => {
      const token = await moiEm()
      await nhanLoiMoi(token, SO_NGUOI_LA)
      await nhanLoiMoi('token-bia-ra', SO_NGUOI_LA)

      const { rows } = await db.query<{ n: number }>(
        'select count(*)::int as n from accounts where phone is not null',
      )
      expect(rows[0]!.n).toBe(0)
    })
  })

  describe('đăng ký học thử', () => {
    it('người lạ chỉ tạo được đề xuất, không tạo được tài khoản', async () => {
      await db.query('select app.request_trial($1, $2, $3, $4)', [
        TENANT, SO_NGUOI_LA, 'Người muốn học', 'Em thấy trên Facebook',
      ])

      const taiKhoan = await db.query<{ n: number }>(
        'select count(*)::int as n from accounts where phone = $1',
        [SO_NGUOI_LA],
      )
      expect(taiKhoan.rows[0]!.n).toBe(0)

      const deXuat = await db.query<{ kind: string; payload: Record<string, unknown> }>(
        'select kind, payload from proposals',
      )
      expect(deXuat.rows).toHaveLength(1)
      expect(deXuat.rows[0]!.kind).toBe('invite')
      expect(deXuat.rows[0]!.payload.phone).toBe(SO_NGUOI_LA)
    })

    it('đề xuất có hạn, không treo mãi', async () => {
      await db.query('select app.request_trial($1, $2, $3)', [TENANT, SO_NGUOI_LA, 'Người muốn học'])
      const { rows } = await db.query<{ con_han: boolean }>(
        'select expires_at > now() as con_han from proposals',
      )
      expect(rows[0]!.con_han).toBe(true)
    })

    it('đề xuất chưa quyết thì ba cột quyết định đều rỗng', async () => {
      await db.query('select app.request_trial($1, $2, $3)', [TENANT, SO_NGUOI_LA, 'Người muốn học'])
      const { rows } = await db.query('select decided_by, decided_at, decided_action from proposals')
      expect(rows[0]).toMatchObject({ decided_by: null, decided_at: null, decided_action: null })
    })
  })

  describe('SĐT vào DB phải ở dạng chuẩn', () => {
    it('không ghi được số thô vào accounts', async () => {
      await expect(
        db.query('insert into accounts (phone, name) values ($1, $2)', ['0901234567', 'Số thô']),
      ).rejects.toThrow(/accounts_phone_normalised/)
    })

    it('không ghi được số thô vào lời mời', async () => {
      await expect(
        db.query(
          `insert into memberships (tenant_id, role, status, invite_token, invited_phone)
           values ($1, 'student', 'pending', 'tk', '0901234567')`,
          [TENANT],
        ),
      ).rejects.toThrow(/memberships_invited_phone_normalised/)
    })
  })

  describe('xem trước lời mời khi chưa đăng nhập', () => {
    interface Peek {
      found: boolean
      status: string | null
      subdomain: string | null
      teacher_name: string | null
      role: string | null
      phone_masked: string | null
    }

    async function xemTruoc(token: string): Promise<Peek> {
      // Gọi đúng như trang công khai gọi: vai anon, không phiên đăng nhập.
      await db.query('begin')
      try {
        await db.query('set local role anon')
        const { rows } = await db.query<Peek>('select * from app.peek_invite($1)', [token])
        return rows[0]!
      } finally {
        await db.query('rollback')
      }
    }

    it('người chưa đăng nhập thấy đủ để biết mình được mời vào đâu', async () => {
      const token = await moiEm()
      const peek = await xemTruoc(token)

      expect(peek.found).toBe(true)
      expect(peek.status).toBe('pending')
      expect(peek.subdomain).toBe('cothao')
      expect(peek.teacher_name).toBe('Cô Thảo')
      expect(peek.role).toBe('student')
    })

    it('SĐT trả về đã che — số đầy đủ không rời khỏi DB', async () => {
      const peek = await xemTruoc(await moiEm())

      expect(peek.phone_masked).toBe('0901 ••• 567')
      // Chốt chặn: không đâu trong kết quả có số đầy đủ.
      expect(JSON.stringify(peek)).not.toContain('901234567')
    })

    it('không lộ gì thêm ngoài bảy trường đã định', async () => {
      const peek = await xemTruoc(await moiEm())
      expect(Object.keys(peek).sort()).toEqual([
        'class_id', 'found', 'phone_masked', 'role', 'status', 'subdomain', 'teacher_name',
      ])
    })

    it('cách che trong SQL và trong TS ra cùng một kết quả', async () => {
      // Che ở hai nơi: SQL che để số đầy đủ không rời DB, TS che cho màn của cô.
      // Hai bản cài đặt thì có ngày lệch nhau, nên chốt lại ở đây.
      for (const so of ['0901234567', '0332345678', '0779876543']) {
        const chuan = chuanHoaSoDienThoai(so)!
        soThuTuToken += 1
        const token = `token-che-${soThuTuToken}`
        await db.query(
          `select app.create_invite($1, $2, 'student', $3, $4, null, 'Em')`,
          [TENANT, CO, chuan, token],
        )
        expect((await xemTruoc(token)).phone_masked, so).toBe(cheSoDienThoai(chuan))
      }
    })

    it('token bịa ra thì không lộ gì cả', async () => {
      const peek = await xemTruoc('token-bia-ra')
      expect(peek.found).toBe(false)
      expect(peek.subdomain).toBeNull()
      expect(peek.teacher_name).toBeNull()
      expect(peek.phone_masked).toBeNull()
    })

    it('link đã dùng vẫn xem được, nhưng thấy rõ là đã dùng', async () => {
      const token = await moiEm()
      await nhanLoiMoi(token, SO_CUA_EM)
      expect((await xemTruoc(token)).status).toBe('active')
    })

    it('vai anon không đọc thẳng memberships được — chỉ qua hàm này', async () => {
      await moiEm()
      await db.query('begin')
      try {
        await db.query('set local role anon')
        const { rows } = await db.query('select id from memberships')
        expect(rows).toHaveLength(0)
      } finally {
        await db.query('rollback')
      }
    })
  })

  describe('mời cả lớp — UC-02 dán danh sách từ Excel/Zalo', () => {
    it('cô mời được nhiều em vào cùng một lớp', async () => {
      const soCacEm = ['0901234567', '0332345678', '0779876543', '0912345678']
      for (const [i, so] of soCacEm.entries()) {
        await db.query(
          `select app.create_invite($1, $2, 'student', $3, $4, $5, 'Em ' || $6)`,
          [TENANT, CO, chuanHoaSoDienThoai(so)!, `tk-lop-${i}`, LOP, String(i)],
        )
      }
      const { rows } = await db.query<{ n: number }>(
        `select count(*)::int as n from memberships where status = 'pending'`,
      )
      expect(rows[0]!.n).toBe(soCacEm.length)
    })

    it('nhưng không mời trùng một số hai lần cho cùng lớp', async () => {
      const so = chuanHoaSoDienThoai('0901234567')!
      await db.query(`select app.create_invite($1, $2, 'student', $3, 'tk-a', $4, 'Em')`,
        [TENANT, CO, so, LOP])
      await expect(
        db.query(`select app.create_invite($1, $2, 'student', $3, 'tk-b', $4, 'Em')`,
          [TENANT, CO, so, LOP]),
      ).rejects.toThrow(/memberships_one_pending_invite/)
    })

    it('cùng số nhưng khác lớp thì mời được', async () => {
      const so = chuanHoaSoDienThoai('0901234567')!
      await db.query(`select app.create_invite($1, $2, 'student', $3, 'tk-a', $4, 'Em')`,
        [TENANT, CO, so, LOP])
      await db.query(`select app.create_invite($1, $2, 'student', $3, 'tk-b', $4, 'Em')`,
        [TENANT, CO, so, LOP_KHAC])
      const { rows } = await db.query<{ n: number }>(
        `select count(*)::int as n from memberships where status = 'pending'`)
      expect(rows[0]!.n).toBe(2)
    })

    it('em nhận lời mời rồi thì số đó mời lại được cho lớp khác', async () => {
      const so = chuanHoaSoDienThoai('0901234567')!
      await db.query(`select app.create_invite($1, $2, 'student', $3, 'tk-a', $4, 'Em')`,
        [TENANT, CO, so, LOP])
      await nhanLoiMoi('tk-a', so)
      await db.query(`select app.create_invite($1, $2, 'student', $3, 'tk-b', $4, 'Em')`,
        [TENANT, CO, so, LOP_KHAC])
      expect((await nhanLoiMoi('tk-b', so)).outcome).toBe('accepted')
    })
  })
})
