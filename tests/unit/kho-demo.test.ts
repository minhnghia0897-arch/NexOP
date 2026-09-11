/**
 * Kho dữ liệu của bản demo phải theo ĐÚNG luật của bản thật.
 *
 * Nếu không thì bản khung chỉ là hoạt hình: bấm nút thì đổi màn, còn quyền, sự kiện và
 * ranh giới máy–người chưa từng chạy lần nào. Lúc nối Supabase mới lộ ra, và khi đó
 * không phải "thay chỗ lưu" mà là viết lại.
 *
 * Nên test ở đây soi đúng ba điều CSDL thật đang ép, không soi giao diện.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  KhongDuQuyen,
  actorCuaVai,
  baiCanCham,
  dangBai,
  datLai,
  datLuat,
  deXuatChoCo,
  dangChay,
  duLieu,
  duyetBaiGiao,
  giaoBai,
  guiNhanXet,
  actorMay,
  lamBaiLuyen,
  mayChamNhap,
  napTuBoNho,
  nhatKy,
  nopBai,
  suaNhap,
} from '@/lib/demo/kho'
import { duLieuBanDau } from '@/lib/demo/du-lieu'
import { baiCuaEm } from '@/lib/demo/em'
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

/**
 * Bản đã lưu của phiên bản CŨ.
 *
 * Lỗi thật, cô gặp trên bản trực tuyến: bản demo thêm `luat` và `baiLuyen`, khoá lưu vẫn
 * là `oblue-demo-v1`, nên người đã mở bản trước quay lại thì nạp một `du` thiếu hai mảng
 * đó rồi cả trang trắng với "Application error".
 *
 * Bài kiểm bằng trình duyệt không bắt được: lần nào cũng mở bằng hồ sơ sạch, mà chỗ hỏng
 * chỉ tồn tại với người ĐÃ dùng. Nên nó phải nằm ở đây, chỗ dựng được đúng tình huống đó.
 */
describe('bước 1: giao bài từ lộ trình', () => {
  // Describe này nằm ngoài khối chính, nên phải tự dọn: thiếu dòng này thì bài một test
  // giao còn nằm nguyên ở test sau, và "em không giao được" xanh/đỏ tuỳ thứ tự chạy.
  beforeEach(() => {
    datLai()
  })

  const Y = {
    loTrinhId: 'lt-65',
    buoiNo: 31,
    lopId: 'lop-65',
    hanNop: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    trongSo: 5,
  }

  it('cô giao thì bài chạy ngay, và máy đăng lên bảng tin', () => {
    const baiTruoc = duLieu().baiDang.length
    const id = giaoBai('owner', Y)

    const bg = duLieu().baiGiao.find((g) => g.id === id)!
    expect(dangChay(bg)).toBe(true)
    expect(bg.trongSo).toBe(5)
    // Đề đi theo buổi trong lộ trình — cô không chọn lại.
    expect(bg.deId).toBe('de-r1')
    // Câu hỏi CHỤP LẠI lúc giao (migration 0007), không trỏ sống về đề.
    expect(bg.cauHoi.length).toBeGreaterThan(0)

    expect(duLieu().baiDang).toHaveLength(baiTruoc + 1)
    expect(duLieu().baiDang[0]!.loai).toBe('system')

    // Hai sự kiện, đúng thứ tự: cô giao trước, máy đăng sau.
    const [sau, truoc] = nhatKy()
    expect(truoc!.action).toBe('assignment.create')
    expect(sau!.action).toBe('post.auto:assign')
    expect(sau!.actorRole).toBe('system')
  })

  it('trợ giảng đề xuất, bài KHÔNG chạy và em không thấy', () => {
    const id = giaoBai('assistant', Y)
    const bg = duLieu().baiGiao.find((g) => g.id === id)!

    expect(dangChay(bg)).toBe(false)
    expect(bg.deXuatBoi).toBe('acc-pham-lan')
    // Máy chưa đăng gì — chưa có gì để báo cho lớp.
    expect(nhatKy()[0]!.action).toBe('assignment.propose')
    // Và chỉ cô với trợ giảng nhìn thấy dòng đó, không phải cả lớp.
    expect(nhatKy()[0]!.visibility.sort()).toEqual(['acc-co-thao', 'acc-pham-lan'])
  })

  it('em không thấy đề xuất chưa duyệt — cửa chặn ở lớp đọc dữ liệu của em', () => {
    giaoBai('assistant', Y)
    expect(baiCuaEm('hv-01').some((b) => b.nhan.includes('Cambridge 19 Test 1'))).toBe(false)

    // Cô duyệt thì em thấy ngay, và máy đăng lúc đó chứ không phải lúc trợ giảng soạn.
    const id = duLieu().baiGiao.find((g) => !dangChay(g))!.id
    const baiTruoc = duLieu().baiDang.length
    duyetBaiGiao('owner', id)

    expect(duLieu().baiDang).toHaveLength(baiTruoc + 1)
    expect(baiCuaEm('hv-01').some((b) => b.baiGiaoId === id)).toBe(true)
  })

  it('em càng không tự giao bài cho mình', () => {
    expect(() => giaoBai('student', Y)).toThrow(KhongDuQuyen)
    expect(duLieu().baiGiao.some((g) => g.tuBuoi?.no === 31)).toBe(false)
  })

  it('trợ giảng không tự duyệt đề xuất của chính mình', () => {
    const id = giaoBai('assistant', Y)
    expect(() => duyetBaiGiao('assistant', id)).toThrow(KhongDuQuyen)
    expect(dangChay(duLieu().baiGiao.find((g) => g.id === id)!)).toBe(false)
  })

  it('tắt luật nhắc thì máy vẫn đăng, nhưng nói rõ là không nhắc', () => {
    datLuat('owner', 'nhac-nop', false)
    giaoBai('owner', Y)
    expect(duLieu().baiDang[0]!.noiDung).toContain('tắt nhắc tự động')

    datLai()
    datLuat('owner', 'nhac-nop', true)
    giaoBai('owner', Y)
    expect(duLieu().baiDang[0]!.noiDung).toContain('sẽ được nhắc')
  })

  it('giao lại cùng buổi thì đánh số lần, không để em thấy hai dòng trùng tên', () => {
    const a = giaoBai('owner', Y)
    const b = giaoBai('owner', { ...Y, hanNop: new Date(Date.now() + 5 * 86_400_000).toISOString() })

    const bgA = duLieu().baiGiao.find((g) => g.id === a)!
    const bgB = duLieu().baiGiao.find((g) => g.id === b)!
    expect(bgA.lanThu).toBe(1)
    expect(bgB.lanThu).toBe(2)
    expect(bgB.nhan).toContain('lần 2')
    // Em nhìn thấy hai dòng KHÁC TÊN nhau — đó mới là điều quan trọng.
    const tenEm = baiCuaEm('hv-01').map((x) => x.nhan)
    expect(new Set(tenEm).size).toBe(tenEm.length)
  })

  it('buổi không gắn đề thì không giao được — không có gì cho em nộp', () => {
    expect(() => giaoBai('owner', { ...Y, buoiNo: 29 })).toThrow('chưa gắn đề')
  })
})

describe('bản lưu cũ không được làm vỡ bản mới', () => {
  const KHOA = 'oblue-demo-v2'

  function boNhoGia(): Storage {
    const o = new Map<string, string>()
    return {
      getItem: (k: string) => o.get(k) ?? null,
      setItem: (k: string, v: string) => void o.set(k, v),
      removeItem: (k: string) => void o.delete(k),
      clear: () => o.clear(),
      key: (i: number) => [...o.keys()][i] ?? null,
      get length() {
        return o.size
      },
    } as Storage
  }

  beforeEach(() => {
    ;(globalThis as { localStorage?: Storage }).localStorage = boNhoGia()
    datLai()
  })

  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage
  })

  it('bản lưu thiếu mảng mới thì bị bỏ, demo về dữ liệu mẫu', () => {
    localStorage.setItem(
      KHOA,
      // Đúng hình dạng bản trước: có `hoSo`, chưa có `luat` và `baiLuyen`.
      JSON.stringify({
        du: { tenant: {}, taiKhoan: [], lop: [], de: [], baiGiao: [], baiNop: [],
              nhapCham: [], nhanXet: [], baiDang: [], hoSo: [], loTrinh: [], hocPhi: [],
              vai: { owner: 'x', assistant: 'y', student: 'z' } },
        events: [],
        vai: 'owner',
      }),
    )

    napTuBoNho()

    // Mảng mới phải có mặt — đây chính là chỗ trang cũ ném "Cannot read properties of undefined".
    expect(Array.isArray(duLieu().baiLuyen)).toBe(true)
    expect(Array.isArray(duLieu().luat)).toBe(true)
    // Và bản lưu hỏng bị dọn, không để nó vấp lại ở lần tải sau.
    expect(localStorage.getItem(KHOA)).toBeNull()
  })

  it('bản lưu đúng hình dạng thì vẫn được giữ nguyên', () => {
    dangBai('owner', 'lop-65', 'Bài cô vừa đăng trước khi tải lại')
    const truoc = duLieu().baiDang.length

    datLai()
    // datLai() ghi đè bản lưu bằng dữ liệu mẫu, nên dựng lại tình huống bằng chính bản vừa lưu.
    localStorage.setItem(
      KHOA,
      JSON.stringify({ du: { ...duLieuBanDau(), baiDang: [] }, events: [], vai: 'owner' }),
    )
    napTuBoNho()

    expect(duLieu().baiDang).toHaveLength(0)
    expect(truoc).toBeGreaterThan(0)
  })
})
