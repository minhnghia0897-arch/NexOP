/**
 * Kho dữ liệu của bản demo phải theo ĐÚNG luật của bản thật.
 *
 * Nếu không thì bản khung chỉ là hoạt hình: bấm nút thì đổi màn, còn quyền, sự kiện và
 * ranh giới máy–người chưa từng chạy lần nào. Lúc nối Supabase mới lộ ra, và khi đó
 * không phải "thay chỗ lưu" mà là viết lại.
 *
 * Nên test ở đây soi đúng ba điều CSDL thật đang ép, không soi giao diện.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import {
  KhongDuQuyen,
  actorCuaVai,
  baiCanCham,
  dangBai,
  datLai,
  datLuat,
  deXuatChoCo,
  duLieu,
  guiNhanXet,
  actorMay,
  lamBaiLuyen,
  mayChamNhap,
  nhatKy,
  nopBai,
  suaNhap,
} from '@/lib/demo/kho'
import { can, type Actor } from '@/lib/auth/can'

const BAI = 'bn-hv-01'

describe('kho demo — luật thật, chỗ lưu giả', () => {
  beforeEach(() => {
    datLai()
  })

  describe('máy chỉ nháp và đề xuất', () => {
    it('máy chấm nháp được', () => {
      mayChamNhap(BAI, {
        band: { tr: 6, cc: 6, lr: 6, gra: 6 },
        tinCay: 0.9,
        co: [],
        nhanXet: 'Nháp mới',
        ganCo: [],
      })
      expect(duLieu().nhapCham.find((n) => n.baiNopId === BAI)!.nhanXet).toBe('Nháp mới')
    })

    it('nhưng KHÔNG gửi được cho em — can() chặn ở cửa máy', () => {
      const du = duLieu()
      expect(
        can(actorMay('lop-65'), 'review.send', {
          type: 'review',
          tenantId: du.tenant.id,
          classId: 'lop-65',
          ownerId: 'hv-01',
        }),
      ).toBe(false)
    })

    it('sự kiện của máy không mang tài khoản nào', () => {
      mayChamNhap(BAI, {
        band: { tr: 6, cc: 6, lr: 6, gra: 6 }, tinCay: 0.9, co: [], nhanXet: 'x', ganCo: [],
      })
      const ev = nhatKy()[0]!
      expect(ev.actorRole).toBe('system')
      expect(ev.actorId).toBeNull()
      expect(ev.action).toBe('review.draft')
    })
  })

  describe('"gửi" chỉ do cô', () => {
    it('cô gửi được: nháp thành nhận xét, em nhìn thấy từ lúc đó', () => {
      guiNhanXet('owner', BAI)

      const du = duLieu()
      expect(du.nhapCham.find((n) => n.baiNopId === BAI)).toBeUndefined()
      const nx = du.nhanXet.find((n) => n.baiNopId === BAI)!
      expect(nx.band).toBeGreaterThan(0)

      // Trước khi gửi, em không nằm trong visibility của dòng nào cả.
      const ev = nhatKy().find((e) => e.action === 'review.send')!
      expect(ev.visibility).toContain('hv-01')
    })

    it('trợ giảng KHÔNG gửi được, dù được cấp mức propose cho review', () => {
      // Mức quyền cô cấp không cứu được: send_actions_owner_only chặn ở cửa 4 của can().
      expect(actorCuaVai('assistant').permissions!['lop-65']!.review).toBe('propose')
      expect(() => guiNhanXet('assistant', BAI)).toThrow(KhongDuQuyen)
    })

    it('trợ giảng bị chặn thì KHÔNG có gì đổi, và không có sự kiện nào', () => {
      const truoc = nhatKy().length
      expect(() => guiNhanXet('assistant', BAI)).toThrow()
      expect(nhatKy()).toHaveLength(truoc)
      // Dữ liệu mẫu đã có nhận xét cũ của em; điều phải đúng là KHÔNG có thêm cái nào cho bài này.
      expect(duLieu().nhanXet.some((n) => n.baiNopId === BAI)).toBe(false)
      // Nháp vẫn còn nguyên — hành vi không xảy ra, không phải xảy ra một nửa.
      expect(duLieu().nhapCham.find((n) => n.baiNopId === BAI)).toBeDefined()
    })

    it('em càng không gửi được nhận xét cho chính mình', () => {
      expect(() => guiNhanXet('student', BAI)).toThrow(KhongDuQuyen)
    })
  })

  describe('trợ giảng soạn xong thì CHUYỂN cho cô, không phải gửi hỏng', () => {
    it('trợ giảng đề xuất được, và bản soạn dừng ở lớp 3', () => {
      deXuatChoCo('assistant', BAI, 'Trợ giảng soạn: em chú ý liên kết đoạn.')

      const n = duLieu().nhapCham.find((x) => x.baiNopId === BAI)!
      expect(n.nhanXet).toBe('Trợ giảng soạn: em chú ý liên kết đoạn.')
      expect(n.choCoDuyet?.boiId).toBe('acc-pham-lan')
      // Vẫn chưa có nhận xét nào tới em cho bài này — đó là điểm của cả cơ chế.
      expect(duLieu().nhanXet.some((x) => x.baiNopId === BAI)).toBe(false)
    })

    it('sự kiện là propose, và chỉ cô nhìn thấy', () => {
      deXuatChoCo('assistant', BAI, 'x')
      const ev = nhatKy()[0]!
      expect(ev.action).toBe('review.propose')
      expect(ev.visibility).toEqual(['acc-co-thao'])
      expect(ev.visibility).not.toContain('hv-01')
    })

    it('cô thấy dấu trợ giảng đã soạn trong chồng bài của mình', () => {
      deXuatChoCo('assistant', BAI, 'x')
      const bai = baiCanCham('owner').find((b) => b.baiNopId === BAI)!
      expect(bai.troGiangSoan).toBe('Phạm Lan')
    })

    it('trợ giảng không đề xuất được vào lớp mình không phụ trách', () => {
      // Bài của lớp 7.0 — ngoài phạm vi trợ giảng.
      const du = duLieu()
      const bgKhac = du.baiGiao.find((g) => g.lopId === 'lop-70')!
      nopBai('hv-11', bgKhac.id, 'Bài của em lớp 7.0')
      const bnKhac = du.baiNop.find((b) => b.hocVienId === 'hv-11')!
      expect(() => deXuatChoCo('assistant', bnKhac.id, 'x')).toThrow(KhongDuQuyen)
    })
  })

  describe('trợ giảng sửa nháp được — đó là việc của trợ giảng', () => {
    it('sửa nháp thì được, vì nháp chưa tới tay em', () => {
      suaNhap('assistant', BAI, 'Trợ giảng viết lại cho rõ hơn')
      expect(duLieu().nhapCham.find((n) => n.baiNopId === BAI)!.nhanXet).toBe(
        'Trợ giảng viết lại cho rõ hơn',
      )
    })

    it('cô gửi bản trợ giảng sửa, và hệ thống biết là đã sửa từ nháp máy', () => {
      suaNhap('assistant', BAI, 'Bản đã sửa')
      guiNhanXet('owner', BAI)
      expect(duLieu().nhanXet.find((n) => n.baiNopId === BAI)!.suaTuNhap).toBe(true)
    })

    it('gửi thẳng nháp máy thì ghi là chưa sửa', () => {
      guiNhanXet('owner', BAI)
      expect(duLieu().nhanXet.find((n) => n.baiNopId === BAI)!.suaTuNhap).toBe(false)
    })
  })

  describe('quyền đi theo lớp', () => {
    it('cô thấy chồng bài của mọi lớp', () => {
      expect(baiCanCham('owner')).toHaveLength(7)
    })

    it('trợ giảng chỉ thấy bài của lớp mình phụ trách', () => {
      const cua = baiCanCham('assistant')
      expect(cua.length).toBeGreaterThan(0)
      expect(cua.every((b) => b.lopId === 'lop-65')).toBe(true)
    })

    it('em không thấy chồng bài chấm của ai cả — kể cả của chính mình', () => {
      // ARCHITECTURE: nháp là lớp 3, em không bao giờ thấy band nháp của máy.
      expect(baiCanCham('student')).toHaveLength(0)
    })

    it('trợ giảng không đăng bài được vào lớp mình không phụ trách', () => {
      expect(() => dangBai('assistant', 'lop-70', 'Chào lớp')).toThrow(KhongDuQuyen)
      expect(() => dangBai('assistant', 'lop-65', 'Chào lớp')).not.toThrow()
    })
  })

  describe('sự kiện ghi trước, và ghi đủ', () => {
    it('mỗi hành vi để lại đúng một dòng', () => {
      const truoc = nhatKy().length
      dangBai('owner', 'lop-65', 'Nhắc các em nộp bài')
      expect(nhatKy()).toHaveLength(truoc + 1)
      expect(nhatKy()[0]!.action).toBe('post.create')
    })

    it('bài đăng lên bảng tin thì cả lớp nằm trong visibility', () => {
      dangBai('owner', 'lop-65', 'Nhắc các em nộp bài')
      const ev = nhatKy()[0]!
      expect(ev.visibility).toContain('hv-01')
      expect(ev.visibility).toContain('hv-10')
      // Em lớp khác thì không.
      expect(ev.visibility).not.toContain('hv-11')
    })

    it('em nộp bài thì có sự kiện, và chỉ cô với em thấy', () => {
      nopBai('hv-08', 'bg-w1', 'Bài em viết ' + 'x '.repeat(60))
      const ev = nhatKy()[0]!
      expect(ev.action).toBe('submission.create')
      expect(ev.visibility.sort()).toEqual(['acc-co-thao', 'hv-08'])
    })

    it('nộp muộn được đánh dấu là muộn', () => {
      // bg-w1 đã quá hạn từ hôm qua.
      nopBai('hv-09', 'bg-w1', 'Em nộp muộn')
      const vua = duLieu().baiNop.find((b) => b.hocVienId === 'hv-09' && b.baiGiaoId === 'bg-w1')!
      expect(vua.muon).toBe(true)
    })
  })

  describe('chồng bài xếp đúng thứ tự cô cần', () => {
    it('bài gắn cờ nằm trên đầu', () => {
      const ds = baiCanCham('owner')
      expect(ds[0]!.ganCo.length).toBeGreaterThan(0)
      expect(ds[ds.length - 1]!.ganCo).toHaveLength(0)
    })

    it('bài tin cậy thấp có cờ nói rõ vì sao', () => {
      const thap = baiCanCham('owner').find((b) => b.tinCay < 0.85)!
      expect(thap.ganCo.join(' ')).toMatch(/85%|Lệch/)
    })
  })

  describe('luật của cô — công tắc thật, không phải trang trí', () => {
    it('cô tắt được, và việc đó để lại một dòng nhật ký', () => {
      const truoc = nhatKy().length
      datLuat('owner', 'nhac-nop', false)
      expect(duLieu().luat.find((l) => l.id === 'nhac-nop')!.bat).toBe(false)
      expect(nhatKy()).toHaveLength(truoc + 1)
      expect(nhatKy()[0]!.action).toBe('rubric.update')
    })

    it('trợ giảng không bật/tắt được, và không đổi gì', () => {
      expect(() => datLuat('assistant', 'nhac-nop', false)).toThrow(KhongDuQuyen)
      expect(duLieu().luat.find((l) => l.id === 'nhac-nop')!.bat).toBe(true)
    })

    it('chặn vì TRẦN CỨNG — cô có cấp full cho rubric cũng vẫn chặn', () => {
      /*
       * Test trên chưa chứng minh được điều này: bỏ cửa 5 đi thì trợ giảng vẫn bị cửa 6
       * chặn (mức mặc định của rubric là `none`), nên nó xanh vì hai lý do khác nhau và
       * không phân biệt được. Muốn soi đúng cửa 5 thì phải CẤP quyền rồi xem có lọt không.
       */
      const duocCap: Actor = {
        accountId: 'acc-pham-lan',
        tenantId: 'tn-cothao',
        role: 'assistant',
        classIds: ['lop-65'],
        permissions: { 'lop-65': { rubric: 'full' } },
      }
      // classId phải có: quyền cô cấp là cấp THEO LỚP, không có lớp thì cửa 6 không đọc tới.
      const obj = { type: 'rubric', tenantId: 'tn-cothao', classId: 'lop-65' }
      expect(can(duocCap, 'rubric.update', obj)).toBe(false)
    })

    it('luật khoá thì không ai chạm được, kể cả cô', () => {
      const truoc = nhatKy().length
      datLuat('owner', 'khoa-hoc-phi', true)
      expect(duLieu().luat.find((l) => l.id === 'khoa-hoc-phi')!.bat).toBe(false)
      // Không đổi gì thì cũng không ghi gì — nhật ký không phải chỗ ghi ý định.
      expect(nhatKy()).toHaveLength(truoc)
    })
  })

  describe('bài luyện là của em, và chỉ của em', () => {
    const LUYEN = 'bl-hv-01-chuvi'

    it('em làm bài luyện của em, kết quả về hồ sơ và chỉ cô thấy', () => {
      lamBaiLuyen('hv-01', LUYEN, 4)
      expect(duLieu().baiLuyen.find((b) => b.id === LUYEN)!.ketQua?.dung).toBe(4)
      const ev = nhatKy()[0]!
      expect(ev.action).toBe('practice_set.update')
      expect(ev.visibility.sort()).toEqual(['acc-co-thao', 'hv-01'])
    })

    it('bạn cùng lớp không làm hộ được — cửa 7 so chủ sở hữu', () => {
      expect(() => lamBaiLuyen('hv-02', LUYEN, 5)).toThrow(KhongDuQuyen)
      expect(duLieu().baiLuyen.find((b) => b.id === LUYEN)!.ketQua).toBeUndefined()
    })
  })
})
