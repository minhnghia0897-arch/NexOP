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
  baiTracNghiemCanChot,
  buoiKeTiep,
  chotMotBaiTracNghiem,
  chotTracNghiemCaLop,
  dienDapAnThieu,
  duyetCaCumTinHocPhi,
  duyetTinHocPhi,
  diHocCuaEm,
  diHocTrongLop,
  ghiDiemDanh,
  mayChamCaLoTracNghiem,
  mayNhapTinHocPhi,
  mayChamTracNghiem,
  soLieuTracNghiem,
  suaTinHocPhi,
  tinHocPhiChoDuyet,
  vangLienTiep,
  dangBai,
  datLai,
  datLuat,
  deXuatChoCo,
  dangChay,
  datDapAn,
  duLieu,
  duyetNhanDe,
  hoSoDayDu,
  duyetBaiGiao,
  giaoBai,
  soLieuLop,
  guiNhanXet,
  actorMay,
  lamBaiLuyen,
  luuDeSoHoa,
  luuGhiChu,
  mayChamNhap,
  napTuBoNho,
  nhatKy,
  nopBai,
  suaNhap,
} from '@/lib/demo/kho'
import { duLieuBanDau } from '@/lib/demo/du-lieu'
import { baiCuaEm, diHocEm } from '@/lib/demo/em'
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
      // Bài của lớp 5.5 — ngoài phạm vi trợ giảng (trợ giảng chỉ phụ trách lớp 6.5).
      const du = duLieu()
      const bgKhac = du.baiGiao.find((g) => g.lopId === 'lop-55')!
      const emKhac = du.lop.find((l) => l.id === 'lop-55')!.hocVienIds[0]!
      nopBai(emKhac, bgKhac.id, 'Bài của em lớp 5.5')
      const bnKhac = du.baiNop.find((b) => b.hocVienId === emKhac)!
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
      expect(() => dangBai('assistant', 'lop-55', 'Chào lớp')).toThrow(KhongDuQuyen)
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
      // Em lớp khác thì không. (Mười tám em hv-01..18 đều ở lớp 6.5; lớp khác mang tiền tố riêng.)
      expect(ev.visibility).not.toContain('hv-l55-1')
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

describe('số hoá đề: nhãn là lớp 3, cảnh báo tự dọn mình', () => {
  beforeEach(() => {
    datLai()
  })

  const RD = 'de-ocr-r2'

  it('cô duyệt nhãn thì nhãn thành lớp 1, và có dòng nhật ký', () => {
    const truoc = nhatKy().length
    duyetNhanDe('owner', 'de-ocr-w2')

    expect(duLieu().de.find((d) => d.id === 'de-ocr-w2')!.trangThaiNhan).toBe('da_duyet')
    expect(nhatKy()).toHaveLength(truoc + 1)
    expect(nhatKy()[0]!.action).toBe('exam.update')
  })

  it('trợ giảng không duyệt nhãn được — exam của trợ giảng là chỉ xem', () => {
    expect(() => duyetNhanDe('assistant', 'de-ocr-w2')).toThrow(KhongDuQuyen)
    expect(duLieu().de.find((d) => d.id === 'de-ocr-w2')!.trangThaiNhan).toBe('cho_duyet')
  })

  it('em càng không thấy đường nào tới ngân hàng đề', () => {
    expect(() => duyetNhanDe('student', 'de-ocr-w2')).toThrow(KhongDuQuyen)
  })

  /*
   * Đây là test quan trọng nhất của cả màn số hoá.
   *
   * `app.save_exam_edit` ở migration 0013 tự xoá cảnh báo khi có đáp án. Không tự xoá thì
   * danh sách "cần xem lại" không bao giờ rỗng, cô thôi đọc nó, và cái cờ mất nghĩa — cảnh
   * báo tự giết chính nó. Bản demo phải theo đúng luật đó, không phải chỉ trông giống.
   */
  it('chọn đáp án thì cảnh báo tự mất', () => {
    const truoc = duLieu().de.find((d) => d.id === RD)!.cauHoi.find((c) => c.no === 12)!
    expect(truoc.canhBao).toBeTruthy()
    expect(truoc.dapAn).toBeNull()

    datDapAn('owner', RD, 12, 'its dependence on specific weather conditions.')

    const sau = duLieu().de.find((d) => d.id === RD)!.cauHoi.find((c) => c.no === 12)!
    expect(sau.dapAn).toBe('its dependence on specific weather conditions.')
    expect(sau.canhBao).toBeNull()
  })

  it('bỏ đáp án thì cảnh báo quay lại — câu đó chuyển sang chấm tay', () => {
    datDapAn('owner', RD, 12, 'its dependence on specific weather conditions.')
    datDapAn('owner', RD, 12, null)

    const c = duLieu().de.find((d) => d.id === RD)!.cauHoi.find((q) => q.no === 12)!
    expect(c.dapAn).toBeNull()
    expect(c.canhBao).toContain('chấm tay')
  })

  it('sửa đáp án một đề KHÔNG đụng bài giao đã chụp câu hỏi', () => {
    // migration 0007: bài giao giữ ảnh chụp. Cô sửa đề tuần sau không đổi bài em đang làm dở.
    const bg = duLieu().baiGiao.find((g) => g.deId === 'de-r1')!
    const truoc = JSON.stringify(bg.cauHoi)
    datDapAn('owner', 'de-r1', 5, 'năm 1784')
    const sau = duLieu().baiGiao.find((g) => g.id === bg.id)!
    expect(JSON.stringify(sau.cauHoi)).toBe(truoc)
  })

  it('lưu đề mới thì nó vào ngân hàng của cô, chưa gắn lớp nào', () => {
    const truoc = duLieu().de.length
    const id = luuDeSoHoa('owner', {
      ten: 'Đề mới của cô',
      kyNang: 'reading',
      cachCham: 'auto',
      cauHoi: [],
    })

    expect(duLieu().de).toHaveLength(truoc + 1)
    expect(duLieu().de[0]!.id).toBe(id)
    // Không bài giao nào trỏ về nó — đề thuộc ngân hàng, không thuộc lớp.
    expect(duLieu().baiGiao.some((g) => g.deId === id)).toBe(false)
    expect(nhatKy()[0]!.action).toBe('exam.create')
  })

  it('trợ giảng không tạo đề được', () => {
    expect(() =>
      luuDeSoHoa('assistant', { ten: 'x', kyNang: 'reading', cachCham: 'auto', cauHoi: [] }),
    ).toThrow(KhongDuQuyen)
  })
})

describe('ghi chú riêng của cô — cắt ở lớp đọc, không ở giao diện', () => {
  beforeEach(() => {
    datLai()
  })

  it('cô đọc và sửa được ghi chú', () => {
    const truoc = hoSoDayDu('owner', 'hv-01')!
    expect(truoc.ghiChu).toContain('thi tháng 12')

    luuGhiChu('owner', 'hv-01', 'Đã nói chuyện với phụ huynh, lùi sang tháng 3.')
    expect(hoSoDayDu('owner', 'hv-01')!.ghiChu).toContain('tháng 3')
  })

  /*
   * Đây là test đáng giá nhất của màn hồ sơ.
   *
   * Trợ giảng XEM ĐƯỢC hồ sơ (`profile` mức `read`), nên ngăn kéo vẫn mở. Nhưng `ghiChu`
   * phải là `null` — không phải chuỗi rỗng, không phải nội dung rồi giao diện tự giấu.
   * Giấu ở giao diện thì dữ liệu vẫn đi tới trình duyệt của trợ giảng, ai mở công cụ nhà
   * phát triển cũng đọc được.
   */
  it('trợ giảng mở được hồ sơ nhưng KHÔNG nhận được nội dung ghi chú', () => {
    const ho = hoSoDayDu('assistant', 'hv-01')!
    expect(ho).not.toBeNull()
    expect(ho.bandTb).toBeGreaterThan(0)
    expect(ho.ghiChu).toBeNull()
    // Và không có trường nào khác lén mang nội dung đó theo.
    expect(JSON.stringify(ho)).not.toContain('thi tháng 12')
  })

  it('trợ giảng không sửa được ghi chú', () => {
    expect(() => luuGhiChu('assistant', 'hv-01', 'x')).toThrow(KhongDuQuyen)
    expect(hoSoDayDu('owner', 'hv-01')!.ghiChu).toContain('thi tháng 12')
  })

  it('em đọc hồ sơ của mình, không đọc của bạn, và không thấy ghi chú', () => {
    const cuaEm = hoSoDayDu('student', 'hv-01')!
    expect(cuaEm.ghiChu).toBeNull()
    expect(hoSoDayDu('student', 'hv-02')).toBeNull()
  })

  it('nhật ký ghi là cô có sửa, nhưng không ghi nội dung', () => {
    luuGhiChu('owner', 'hv-01', 'Bí mật không được lọt ra nhật ký')
    const ev = nhatKy()[0]!
    expect(ev.action).toBe('profile.update')
    expect(ev.visibility).toEqual(['acc-co-thao'])
    expect(JSON.stringify(ev.payload)).not.toContain('Bí mật')
  })
})

describe('lưới thẻ lớp đọc số liệu thật', () => {
  beforeEach(() => {
    datLai()
  })

  it('cô thấy đủ lớp, trợ giảng chỉ thấy lớp mình phụ trách', () => {
    expect(soLieuLop('owner').length).toBeGreaterThan(3)
    const tg = soLieuLop('assistant')
    expect(tg).toHaveLength(1)
    expect(tg[0]!.lop.id).toBe('lop-65')
  })

  it('bài chờ chấm trên thẻ khớp với chồng bài của chính vai đó', () => {
    const the = soLieuLop('owner').find((t) => t.lop.id === 'lop-65')!
    expect(the.cho).toBe(baiCanCham('owner').filter((b) => b.lopId === 'lop-65').length)
  })

  it('giao thêm một bài thì tiến độ buổi của lớp đi lên', () => {
    const truoc = soLieuLop('owner').find((t) => t.lop.id === 'lop-65')!.buoiDaDay!
    giaoBai('owner', {
      loTrinhId: 'lt-65',
      buoiNo: 31,
      lopId: 'lop-65',
      hanNop: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      trongSo: 5,
    })
    expect(soLieuLop('owner').find((t) => t.lop.id === 'lop-65')!.buoiDaDay).toBe(
      Math.max(truoc, 31),
    )
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

/**
 * Điểm danh — sự thật lớp 1, và mọi con số đi học đều tính lại từ nó.
 *
 * Trước đây hồ sơ mang sẵn chuỗi `diHoc: '28/30'`. Con số tổng kết không có gì đỡ bên dưới
 * thì thẻ lớp và hồ sơ lệch nhau được mà không chỗ nào phát hiện — nên phần lớn test dưới
 * đây soi đúng chỗ đó: bảng sự thật đổi thì con số phải đổi theo.
 */
describe('điểm danh: cô và trợ giảng ghi, máy không chạm, em chỉ xem của mình', () => {
  beforeEach(() => {
    datLai()
  })

  it('cô ghi được, và sự kiện ghi TRƯỚC khi bảng đổi', () => {
    const truoc = duLieu().diemDanh.length
    const buoi = buoiKeTiep('lop-65')

    ghiDiemDanh('owner', {
      lopId: 'lop-65',
      buoiNo: buoi,
      vang: [{ hocVienId: 'hv-02', phep: false }],
    })

    expect(duLieu().diemDanh).toHaveLength(truoc + 1)

    const ev = nhatKy()[0]!
    expect(ev.action).toBe('attendance.create')
    expect(ev.objectType).toBe('attendance')
    expect(ev.classId).toBe('lop-65')
    expect(ev.payload).toMatchObject({ buoi_no: buoi, co_mat: 17 })
  })

  it('trợ giảng ghi THẲNG — mức `auto` không phải đề xuất', () => {
    const buoi = buoiKeTiep('lop-65')
    ghiDiemDanh('assistant', {
      lopId: 'lop-65',
      buoiNo: buoi,
      vang: [{ hocVienId: 'hv-03', phep: true }],
    })

    const moi = duLieu().diemDanh.find((d) => d.buoiNo === buoi && d.lopId === 'lop-65')
    expect(moi?.ghiBoi).toBe(duLieu().vai.assistant)
    // Không có bước duyệt nào ở giữa: dòng vào bảng sự thật ngay.
    expect(moi?.vang.map((v) => v.hocVienId)).toEqual(['hv-03'])
    expect(nhatKy()[0]!.actorRole).toBe('assistant')
  })

  it('em bấm vào thì bị chặn — `own` ở attendance chỉ cho XEM', () => {
    expect(() =>
      ghiDiemDanh('student', { lopId: 'lop-65', buoiNo: 99, vang: [] }),
    ).toThrow(KhongDuQuyen)
  })

  it('máy không đọc, không ghi bảng điểm danh', () => {
    const o = { type: 'attendance', tenantId: duLieu().tenant.id, classId: 'lop-65' }
    expect(can(actorMay('lop-65'), 'attendance.create', o)).toBe(false)
    // Kể cả `view`: đây là chỗ máy không có việc gì, không phải chỗ quên cấp.
    expect(can(actorMay('lop-65'), 'attendance.view', o)).toBe(false)
  })

  it('em vắng không thuộc lớp thì bị lọc bỏ, không vào bảng sự thật', () => {
    const buoi = buoiKeTiep('lop-65')
    ghiDiemDanh('owner', {
      lopId: 'lop-65',
      buoiNo: buoi,
      vang: [
        { hocVienId: 'hv-02', phep: false },
        { hocVienId: 'hv-l55-1', phep: false }, // em lớp 5.5
        { hocVienId: 'khong-co-that', phep: false },
      ],
    })

    const moi = duLieu().diemDanh.find((d) => d.buoiNo === buoi && d.lopId === 'lop-65')
    expect(moi?.vang.map((v) => v.hocVienId)).toEqual(['hv-02'])
    expect(moi?.coMat).toHaveLength(17)
  })

  it('nhật ký điểm danh KHÔNG tới em — visibility chỉ cô và người ghi', () => {
    ghiDiemDanh('owner', {
      lopId: 'lop-65',
      buoiNo: buoiKeTiep('lop-65'),
      vang: [{ hocVienId: 'hv-02', phep: false }],
    })

    const ev = nhatKy()[0]!
    expect(ev.visibility).toContain(duLieu().vai.owner)
    // Em vắng KHÔNG được nhìn dòng này: nó kể ai vắng trong cả lớp.
    expect(ev.visibility).not.toContain('hv-02')
    expect(ev.visibility).not.toContain(duLieu().vai.student)
  })

  it('điểm danh lại một buổi: bảng vẫn MỘT dòng, nhật ký thành HAI', () => {
    const buoi = 5
    const soCu = duLieu().diemDanh.length

    ghiDiemDanh('owner', { lopId: 'lop-65', buoiNo: buoi, vang: [] })
    ghiDiemDanh('owner', {
      lopId: 'lop-65',
      buoiNo: buoi,
      vang: [{ hocVienId: 'hv-01', phep: true }],
    })

    /*
     * Không thêm dòng nào: `unique (class_id, session_no, student_id)` của migration 0004
     * chặn dòng thứ hai cho cùng một buổi, nên bản demo phải sửa tại chỗ y như bản thật.
     */
    expect(duLieu().diemDanh).toHaveLength(soCu)
    expect(
      duLieu().diemDanh.filter((d) => d.lopId === 'lop-65' && d.buoiNo === buoi),
    ).toHaveLength(1)

    // Nhưng lịch sử "cô đã đổi ý" còn đủ trong nhật ký — chỗ duy nhất chỉ-thêm thật.
    expect(
      nhatKy().filter(
        (e) => e.objectType === 'attendance' && e.payload['buoi_no'] === buoi,
      ),
    ).toHaveLength(2)

    // Và mỗi buổi vẫn đếm MỘT lần.
    const d = diHocTrongLop('lop-65', 'hv-01')
    expect(d.tong).toBe(31)
    expect(d.coMat).toBe(28) // 29 trước đó, buổi 5 giờ thành vắng
  })

  it('hai dòng cùng một buổi vẫn chỉ đếm MỘT lần', () => {
    /*
     * Test này có vì bản đọc gom theo `buoiNo`, và nếu không có nó thì dòng gom đó là code
     * không đường nào chạy tới: `ghiDiemDanh` sửa tại chỗ nên không bao giờ sinh trùng.
     *
     * Dựng trùng bằng tay đúng như cách nó có thể vào thật — một bản lưu cũ, hay một lần
     * nhập dữ liệu tay. Không có lớp chắn này thì mọi con số "đi học đều" đếm buổi đó hai
     * lần, và con số sai vẫn trông hợp lý nên không ai soi lại.
     */
    const truoc = diHocTrongLop('lop-65', 'hv-01')
    const mau = duLieu().diemDanh.find((d) => d.lopId === 'lop-65' && d.buoiNo === 7)!
    duLieu().diemDanh.push({ ...mau, id: `${mau.id}-trung` })

    expect(diHocTrongLop('lop-65', 'hv-01')).toEqual(truoc)
    expect(buoiKeTiep('lop-65')).toBe(32)
  })

  it('"đi học đều" của thẻ lớp đổi theo bảng sự thật, không phải số cắm sẵn', () => {
    const truoc = soLieuLop('owner').find((t) => t.lop.id === 'lop-65')!.diHocDeu!

    // Cả lớp vắng một buổi mới.
    ghiDiemDanh('owner', {
      lopId: 'lop-65',
      buoiNo: buoiKeTiep('lop-65'),
      vang: duLieu().lop.find((l) => l.id === 'lop-65')!.hocVienIds.map((id) => ({
        hocVienId: id,
        phep: false,
      })),
    })

    expect(soLieuLop('owner').find((t) => t.lop.id === 'lop-65')!.diHocDeu!).toBeLessThan(truoc)
  })

  it('lớp chưa khai giảng không mượn số đi học của lớp khác', () => {
    // hv-02 và hv-07 đã đăng ký lớp 7.0+ nhưng vẫn đang học lớp 6.5.
    expect(diHocCuaEm('hv-02').tong).toBeGreaterThan(0)
    expect(diHocTrongLop('lop-moi', 'hv-02').tong).toBe(0)

    const the = soLieuLop('owner').find((t) => t.lop.id === 'lop-moi')!
    expect(the.diHocDeu).toBeNull()
    // Và chưa dạy buổi nào thì không có "Buổi 1/36" trên thẻ.
    expect(the.buoiDaDay).toBeNull()
  })

  it('"buổi đã dạy" đếm buổi ĐÃ ĐIỂM DANH, không đếm buổi có bài giao', () => {
    // Lớp Speaking đã dạy 12 buổi nhưng bài giao chỉ tới buổi 6.
    const the = soLieuLop('owner').find((t) => t.lop.id === 'lop-speak')!
    expect(the.buoiDaDay).toBe(12)
    expect(buoiKeTiep('lop-speak')).toBe(13)
  })

  it('vắng liên tiếp đếm LIÊN TIẾP, không đếm tổng', () => {
    // Gia Bảo vắng 8 buổi, hai buổi cuối liên tiếp.
    expect(diHocTrongLop('lop-65', 'hv-09')).toEqual({ coMat: 23, tong: 31 })
    expect(vangLienTiep('hv-09')).toBe(2)

    // Đức Thắng vắng 4 buổi nhưng chỉ buổi cuối — không phải em đang rời lớp.
    expect(vangLienTiep('hv-05')).toBe(1)

    // Thu Hà đi đủ.
    expect(vangLienTiep('hv-02')).toBe(0)
  })

  it('em vào lớp muộn có MẪU SỐ của riêng em', () => {
    // Tuấn Kiệt vào từ buổi 18: 14 buổi, không phải 31.
    expect(diHocTrongLop('lop-65', 'hv-11').tong).toBe(14)
    // Đăng Khôi vào từ buổi 22: 10 buổi.
    expect(diHocTrongLop('lop-65', 'hv-17').tong).toBe(10)
    // Mười bảy buổi trước khi em vào KHÔNG phải buổi em nghỉ.
    expect(vangLienTiep('hv-11')).toBe(0)
  })

  it('em đọc được điểm danh CỦA MÌNH, không đọc của bạn', () => {
    expect(diHocEm('hv-01', 'hv-01')).toEqual({ coMat: 29, tong: 31 })
    expect(diHocEm('hv-01', 'hv-02')).toBeNull()
    expect(diHocEm('hv-01', 'hv-l55-1')).toBeNull()
  })

  it('ngăn hồ sơ: cô và trợ giảng thấy số đi học, và thấy cảnh báo vắng liên tiếp', () => {
    for (const vai of ['owner', 'assistant'] as const) {
      const ho = hoSoDayDu(vai, 'hv-09')!
      expect(ho.diHoc).toEqual({ coMat: 23, tong: 31 })
      expect(ho.vangLienTiep).toBe(2)
    }
  })

  it('bảng điểm danh nằm trong bản lưu — bản cũ thiếu nó thì bị bỏ', () => {
    expect(Array.isArray(duLieu().diemDanh)).toBe(true)
    expect(duLieu().diemDanh.length).toBeGreaterThan(0)
    // `diemDanh` có trong dữ liệu mẫu, nên `dungHinhDang` đòi nó ở mọi bản lưu.
    expect(Object.keys(duLieuBanDau())).toContain('diemDanh')
  })
})

/**
 * Bước 4 của vòng vận hành — nửa TRẮC NGHIỆM: "chốt cả lớp" bằng một hành động.
 *
 * Chỗ đáng kiểm nhất không phải phép so chuỗi, mà là ba ranh giới: điểm phải TÍNH LẠI được
 * chứ không cắm sẵn; đề thiếu đáp án thì không bài nào được chốt; và chỉ cô gửi được.
 */
describe('chốt điểm trắc nghiệm cả lớp', () => {
  beforeEach(() => {
    datLai()
  })

  it('điểm suy ra từ đáp án em chọn, không cắm sẵn trong bài nộp', () => {
    const so = soLieuTracNghiem('owner', 'bg-g1')!
    const em = so.dong.find((d) => d.hocVien.id === 'hv-01')!

    // Sửa đáp án em chọn ở một câu em đang làm ĐÚNG → điểm phải tụt đúng 1.
    const bn = duLieu().baiNop.find((b) => b.id === 'bn-g1-hv-01')!
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-g1')!
    const dangDung = bg.cauHoi.find(
      (c) => c.dapAn && bn.traLoi![c.no] === c.dapAn,
    )!
    bn.traLoi![dangDung.no] = dangDung.luaChon!.find((x) => x !== dangDung.dapAn)!

    mayChamTracNghiem('bn-g1-hv-01')
    const sau = soLieuTracNghiem('owner', 'bg-g1')!.dong.find(
      (d) => d.hocVien.id === 'hv-01',
    )!
    expect(sau.dung).toBe(em.dung - 1)
    expect(sau.tong).toBe(em.tong)
  })

  it('đề thiếu đáp án MỘT câu → không bài nào chốt được, cả 18 bài chờ', () => {
    const so = soLieuTracNghiem('owner', 'bg-g1')!
    expect(so.chotDuoc).toBe(0)
    expect(so.cho).toBe(18)
    // Và câu thiếu được nêu tên, không phải chỉ "có gì đó sai".
    expect(so.dong.every((d) => d.cauCanCo.length === 1)).toBe(true)
  })

  it('câu chưa có đáp án KHÔNG bị tính là em làm sai', () => {
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-g1')!
    const so = soLieuTracNghiem('owner', 'bg-g1')!
    // 20 câu, 1 câu chưa có đáp án → mẫu số là 19, không phải 20.
    expect(bg.cauHoi).toHaveLength(20)
    expect(so.dong.every((d) => d.tong === 19)).toBe(true)
  })

  it('cô điền đáp án còn thiếu → máy chấm lại cả lô, lô chốt mở ra', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')

    const so = soLieuTracNghiem('owner', 'bg-g1')!
    expect(so.chotDuoc).toBe(17)
    expect(so.cho).toBe(1)
    // Mẫu số lên 20 vì câu 12 giờ chấm được.
    expect(so.dong.every((d) => d.tong === 20)).toBe(true)
    // Và cảnh báo tự dọn mình, y như `datDapAn` ở ngân hàng đề.
    expect(duLieu().baiGiao.find((g) => g.id === 'bg-g1')!.cauHoi[11]!.canhBao).toBeNull()
  })

  it('KHÔNG ghi đè đáp án đã có — đó là đổi cách chấm bài đã chấm', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    expect(() => dienDapAnThieu('owner', 'bg-g1', 12, 'will finish')).toThrow(/đã có đáp án/)
    // Câu khác, vốn đã có đáp án, cũng không điền lại được.
    expect(() => dienDapAnThieu('owner', 'bg-g1', 1, 'lives')).toThrow(/đã có đáp án/)
  })

  it('đáp án phải là một trong các lựa chọn của câu', () => {
    expect(() => dienDapAnThieu('owner', 'bg-g1', 12, 'sẽ xong')).toThrow(/lựa chọn/)
  })

  it('điền đáp án chỉ chạm dapAn — đề bài em đã đọc KHÔNG đổi', () => {
    const truoc = duLieu().baiGiao.find((g) => g.id === 'bg-g1')!.cauHoi[11]!
    const de = truoc.de
    const luaChon = [...truoc.luaChon!]

    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')

    const sau = duLieu().baiGiao.find((g) => g.id === 'bg-g1')!.cauHoi[11]!
    expect(sau.de).toBe(de)
    expect(sau.luaChon).toEqual(luaChon)
  })

  it('cô chốt cả lớp → 17 nhận xét gửi đi, mỗi bài một sự kiện', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    const truoc = nhatKy().filter((e) => e.action === 'review.send').length

    expect(chotTracNghiemCaLop('owner', 'bg-g1')).toBe(17)

    expect(nhatKy().filter((e) => e.action === 'review.send').length).toBe(truoc + 17)
    expect(duLieu().nhanXet.filter((n) => n.baiNopId.startsWith('bn-g1')).length).toBe(17)
  })

  it('mỗi em chỉ thấy nhận xét CỦA MÌNH — visibility từng dòng, không gộp lô', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    chotTracNghiemCaLop('owner', 'bg-g1')

    for (const e of nhatKy().filter(
      (x) => x.action === 'review.send' && String(x.payload['bai_nop']).startsWith('bn-g1'),
    )) {
      // Đúng hai người: cô và em của bài đó. Gộp cả lô vào một sự kiện thì em thấy điểm bạn.
      expect(e.visibility).toHaveLength(2)
      expect(e.visibility).toContain(duLieu().vai.owner)
    }
  })

  it('bài "Cần chú ý" KHÔNG bị chốt kèm — nút nói "Chốt 17 & mở 1" là nói thật', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    const yeu = soLieuTracNghiem('owner', 'bg-g1')!.dong.find(
      (d) => d.trangThai === 'can_chu_y',
    )!
    chotTracNghiemCaLop('owner', 'bg-g1')

    expect(duLieu().nhanXet.some((n) => n.baiNopId === yeu.baiNopId)).toBe(false)
    // Cô xem rồi chốt riêng thì được.
    chotMotBaiTracNghiem('owner', yeu.baiNopId)
    expect(duLieu().nhanXet.some((n) => n.baiNopId === yeu.baiNopId)).toBe(true)
  })

  it('bài đã chốt vẫn còn trong bảng với nhãn "Đã chốt"', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    chotTracNghiemCaLop('owner', 'bg-g1')

    const so = soLieuTracNghiem('owner', 'bg-g1')!
    // Rụng 17 dòng ngay sau khi cô bấm thì trông như vừa xoá bài của cả lớp.
    expect(so.dong).toHaveLength(18)
    expect(so.dong.filter((d) => d.trangThai === 'da_chot')).toHaveLength(17)
  })

  it('trợ giảng KHÔNG chốt được — `review.send` chỉ của cô', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    expect(() => chotTracNghiemCaLop('assistant', 'bg-g1')).toThrow(KhongDuQuyen)
    expect(duLieu().nhanXet.filter((n) => n.baiNopId.startsWith('bn-g1'))).toHaveLength(0)
  })

  it('em không thấy bảng chốt điểm — nháp là lớp 3', () => {
    const so = soLieuTracNghiem('student', 'bg-g1')!
    expect(so.dong).toHaveLength(0)
    expect(baiTracNghiemCanChot('student')).toHaveLength(0)
  })

  it('công tắc `chot-mcq` TẮT → không có lô nào, cô duyệt từng bài', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    expect(soLieuTracNghiem('owner', 'bg-g1')!.chotDuoc).toBe(17)

    datLuat('owner', 'chot-mcq', false)
    const so = soLieuTracNghiem('owner', 'bg-g1')!
    expect(so.chotDuoc).toBe(0)
    expect(so.cho).toBe(18)
  })

  it('"Sai ở đâu" gọi tên lỗi, không đọc số câu trơn', () => {
    const d = soLieuTracNghiem('owner', 'bg-g1')!.dong.find(
      (x) => x.hocVien.id === 'hv-17',
    )!
    expect(d.saiODau).toMatch(/Câu .+ — .+/)
    // Có chữ, không chỉ có số.
    expect(d.saiODau.replace(/[\d,\s·—]/g, '').length).toBeGreaterThan(5)
  })

  it('tin cậy nói MÁY chắc tới đâu, không nói em làm tốt tới đâu', () => {
    dienDapAnThieu('owner', 'bg-g1', 12, 'will have finished')
    const dong = soLieuTracNghiem('owner', 'bg-g1')!.dong
    const yeu = dong.find((d) => d.trangThai === 'can_chu_y')!
    const gioi = dong.find((d) => d.dung === Math.max(...dong.map((x) => x.dung)))!
    // Em làm kém nhất và em làm tốt nhất có CÙNG độ tin cậy: đề như nhau, máy chắc như nhau.
    expect(yeu.tinCay).toBe(gioi.tinCay)
  })

  it('chấm lại cả lô chạy lại được, không sinh nháp thứ hai', () => {
    const truoc = duLieu().nhapTracNghiem.length
    mayChamCaLoTracNghiem('bg-g1')
    mayChamCaLoTracNghiem('bg-g1')
    expect(duLieu().nhapTracNghiem).toHaveLength(truoc)
  })
})

/**
 * Bước 7 — máy nháp tin học phí, CÔ gửi.
 *
 * Đây là bước dính tiền, nên ranh giới quan trọng hơn nội dung: máy không gửi được, trợ giảng
 * không THẤY, và tin của em đang buông không được nhắc tiền. Cái cuối không phải chuyện văn
 * phong — nó là cả lý do bước này tồn tại.
 */
describe('bước 7: tin học phí — máy nháp, cô gửi', () => {
  beforeEach(() => {
    datLai()
  })

  it('máy nháp BA loại tin khác nhau từ tình trạng thật của em', () => {
    const tin = tinHocPhiChoDuyet('owner')
    expect(tin).toHaveLength(3)
    expect(new Set(tin.map((t) => t.loai))).toEqual(
      new Set(['tien_bo', 'dang_buong', 'vuot_muc_tieu']),
    )
    // Ba nội dung khác nhau hẳn, không phải một mẫu điền tên.
    expect(new Set(tin.map((t) => t.noiDung)).size).toBe(3)
  })

  it('tin cho em ĐANG BUÔNG không nhắc học phí — đó là chủ ý', () => {
    const t = tinHocPhiChoDuyet('owner').find((x) => x.loai === 'dang_buong')!
    for (const cam of ['học phí', 'gia hạn', 'đóng tiền', 'thanh toán']) {
      // Trừ đúng một câu: "cô KHÔNG nhắc học phí".
      const noiDung = t.noiDung.replace('Cô không nhắc học phí', '')
      expect(noiDung.toLowerCase()).not.toContain(cam)
    }
    expect(t.noiDung).toContain('không nhắc học phí')
  })

  it('tin VƯỢT MỤC TIÊU đề nghị lên lớp, không đề nghị gia hạn lớp cũ', () => {
    const t = tinHocPhiChoDuyet('owner').find((x) => x.loai === 'vuot_muc_tieu')!
    expect(t.noiDung).toContain('không gia hạn lớp này')
    // Và nêu tên lớp thật, không mời vào một lớp không tồn tại.
    expect(t.noiDung).toMatch(/7\.0\+/)
    expect(duLieu().lop.some((l) => l.trangThai === 'opening')).toBe(true)
  })

  it('mỗi tin nêu VÌ SAO gửi bây giờ', () => {
    for (const t of tinHocPhiChoDuyet('owner')) {
      expect(t.viSao.length).toBeGreaterThan(30)
    }
  })

  it('máy KHÔNG gửi được — `fee.message.send` chỉ của cô', () => {
    const may = actorMay('lop-65')
    expect(
      can(may, 'fee.message.send', {
        type: 'fee',
        tenantId: duLieu().tenant.id,
        classId: 'lop-65',
      }),
    ).toBe(false)
    // Nhưng máy ĐỀ XUẤT được — đó là ranh giới, không phải chặn hết.
    expect(
      can(may, 'proposal.propose', {
        type: 'proposal',
        tenantId: duLieu().tenant.id,
        classId: 'lop-65',
      }),
    ).toBe(true)
  })

  it('trợ giảng KHÔNG thấy tin học phí, và không duyệt được', () => {
    expect(tinHocPhiChoDuyet('assistant')).toHaveLength(0)
    expect(() => duyetTinHocPhi('assistant', 'hv-01')).toThrow(KhongDuQuyen)
  })

  it('em không thấy tin nháp — lớp 3 không tới em', () => {
    expect(tinHocPhiChoDuyet('student')).toHaveLength(0)
    expect(() => duyetTinHocPhi('student', 'hv-01')).toThrow(KhongDuQuyen)
  })

  it('cô duyệt → sự kiện `fee.message.send`, xếp lịch 9:00', () => {
    const em = tinHocPhiChoDuyet('owner')[0]!.hocVienId
    duyetTinHocPhi('owner', em)

    const ev = nhatKy()[0]!
    expect(ev.action).toBe('fee.message.send')
    expect(ev.payload['gui_luc']).toBe('09:00')
    // Em thấy tin CỦA EM. Không có id em nào khác.
    expect(ev.visibility).toEqual([duLieu().vai.owner, em])
  })

  it('nhật ký KHÔNG chứa nội dung tin — tin nói về band và tiền của một em', () => {
    const t = tinHocPhiChoDuyet('owner')[0]!
    suaTinHocPhi('owner', t.hocVienId, 'Nội dung rất riêng tư về hoàn cảnh của em.')
    duyetTinHocPhi('owner', t.hocVienId)

    const ky = JSON.stringify(nhatKy())
    expect(ky).not.toContain('rất riêng tư')
    expect(ky).not.toContain(t.noiDung.slice(0, 40))
  })

  it('cô sửa được tin trước khi gửi, KHÔNG sửa được sau khi đã xếp lịch', () => {
    const em = tinHocPhiChoDuyet('owner')[0]!.hocVienId
    suaTinHocPhi('owner', em, 'Cô viết lại theo ý cô.')
    expect(duLieu().deXuat.find((d) => d.hocVienId === em)!.noiDung).toBe(
      'Cô viết lại theo ý cô.',
    )

    duyetTinHocPhi('owner', em)
    expect(() => suaTinHocPhi('owner', em, 'đổi ý')).toThrow(/đã xếp lịch/)
  })

  it('"Duyệt cả cụm" gửi mỗi tin một sự kiện, không gộp một', () => {
    const so = tinHocPhiChoDuyet('owner').length
    expect(duyetCaCumTinHocPhi('owner')).toBe(so)

    const ev = nhatKy().filter((e) => e.action === 'fee.message.send')
    expect(ev).toHaveLength(so)
    // Mỗi sự kiện đúng hai người: cô và em của tin đó.
    for (const e of ev) expect(e.visibility).toHaveLength(2)
    expect(tinHocPhiChoDuyet('owner')).toHaveLength(0)
  })

  it('máy nháp lại thì ghi đè, không sinh tin thứ hai cho cùng một em', () => {
    const truoc = duLieu().deXuat.length
    const em = tinHocPhiChoDuyet('owner')[0]!.hocVienId
    mayNhapTinHocPhi(em)
    mayNhapTinHocPhi(em)
    expect(duLieu().deXuat).toHaveLength(truoc)
  })

  it('tin nháp có HẠN — lớp 3 không sống mãi', () => {
    for (const t of duLieu().deXuat) {
      expect(new Date(t.hetHan).getTime()).toBeGreaterThan(Date.now())
    }
  })
})
