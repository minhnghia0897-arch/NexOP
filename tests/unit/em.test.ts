/**
 * App của em: những con số trên màn phải SUY RA ĐƯỢC, không phải chữ viết sẵn.
 *
 * Bản mẫu `oblue-student-demo.html` cắm sẵn mọi số ("+0.5 band sau 8 tuần", "3 bài liên
 * tiếp", "14 đã nộp"). Với một bản vẽ thì đủ. Ở bản chạy thì mỗi con số cắm sẵn là một câu
 * sẽ nói dối ngay lần đầu dữ liệu đổi — và nói dối với học viên, về chính học viên.
 *
 * Nên test ở đây soi đúng một việc: con số đó suy từ đâu, và suy SAI thì đỏ ở đâu.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import {
  EM,
  baiCuaEm,
  baiLuyenCuaEm,
  loiCuaEm,
  tienBoBand,
} from '@/lib/demo/em'
import {
  giayLamBai,
  gomLoiLap,
  xepLoiLap,
  type LoiDanhDau,
  type LoiLap,
} from '@/lib/demo/du-lieu'
import {
  DaChotKhongSua,
  baiCanCham,
  cuaLamBai,
  datLai,
  giaoBai,
  duLieu,
  hoSoDayDu,
  lichSuLamBai,
  luuNhapBai,
  moBaiLam,
  nhatKy,
  nopBai,
  phutLamBai,
} from '@/lib/demo/kho'

beforeEach(() => {
  datLai()
})

describe('lỗi đang kéo em lại', () => {
  it('đếm theo SỐ BÀI, không theo số lần gạch', () => {
    /* `bn-hv-01-bg-t2tech` bị gạch "hoà hợp chủ–vị" hai lần trong cùng một bài. */
    const trongMotBai = duLieu()
      .nhanXet.find((n) => n.baiNopId === 'bn-hv-01-bg-t2tech')!
      .co!.filter((c) => c.loai === 'hoà hợp chủ–vị')
    expect(trongMotBai.length).toBeGreaterThan(1)

    const l = loiCuaEm(EM).find((x) => x.ten === 'hoà hợp chủ–vị')!
    // Bốn bài đã chấm, bài nào cũng có lỗi này — năm lần gạch vẫn là bốn bài.
    expect(l.soBai).toBe(4)
    expect(l.tongBai).toBe(4)
  })

  it('mẫu số là bài cô ĐÃ GỬI nhận xét — nháp của máy không tính', () => {
    const daGui = duLieu().nhanXet.filter((n) =>
      duLieu().baiNop.some((b) => b.id === n.baiNopId && b.hocVienId === EM),
    ).length

    // Em có một bài đang chờ cô, và máy đã nháp lỗi cho bài đó.
    const nhap = duLieu().nhapCham.find((n) => n.baiNopId === 'bn-hv-01')
    expect(nhap?.co?.length).toBeGreaterThan(0)

    for (const l of loiCuaEm(EM)) expect(l.tongBai).toBe(daGui)
  })

  it('lỗi còn mắc xếp trước lỗi đã dứt, và lỗi nhiều bài xếp trước', () => {
    const ds = loiCuaEm(EM)
    expect(ds.length).toBeGreaterThan(2)
    expect(ds.some((l) => l.daDut)).toBe(true)
    expect(ds.some((l) => !l.daDut)).toBe(true)

    /*
     * Chốt bằng VỊ TRÍ, không bằng "đầu danh sách còn mắc, cuối đã dứt".
     *
     * Bản đầu em chốt hai đầu, và nó xanh cả khi bỏ hẳn luật xếp: các lỗi cùng `soBai` thì
     * khoá xếp thứ hai tình cờ đẩy một lỗi đã dứt xuống cuối. Test xanh vì may, không vì
     * luật còn đó — đúng loại test đáng sợ nhất, vì nó làm người đọc yên tâm.
     */
    const daDutDauTien = ds.findIndex((l) => l.daDut)
    const conMacCuoi = ds.reduce((m, l, i) => (l.daDut ? m : i), -1)
    expect(conMacCuoi).toBeLessThan(daDutDauTien)

    /*
     * Và soi thẳng bộ so sánh, vì hạt giống KHÔNG phân biệt được luật này: mấy lỗi cùng số
     * bài tình cờ xếp theo tên ra đúng nhóm, nên bỏ hẳn khoá `daDut` mà mọi khẳng định ở
     * trên vẫn xanh. Chỉ cặp dưới đây phân biệt được — lỗi đã dứt ở NHIỀU bài hơn.
     */
    const mau = (ten: string, soBai: number, daDut: boolean): LoiLap => ({
      ten,
      nhom: 'grammar',
      soBai,
      tongBai: 9,
      lienTiep: daDut ? 0 : soBai,
      saoLien: daDut ? 9 : 0,
      daDut,
      trich: '…',
    })
    expect(xepLoiLap(mau('đã dứt', 9, true), mau('còn mắc', 1, false))).toBeGreaterThan(0)

    const conMac = ds.filter((l) => !l.daDut)
    for (let i = 1; i < conMac.length; i += 1) {
      expect(conMac[i - 1]!.soBai).toBeGreaterThanOrEqual(conMac[i]!.soBai)
    }
  })

  it('MỘT bài sạch chưa phải là đã dứt — phải hai bài', () => {
    /*
     * Soi thẳng `gomLoiLap` với bài dựng tay, không đi qua hạt giống.
     *
     * Hạt giống không còn ca "vừa đúng một bài sạch": ba lỗi lặp của Minh Anh có `saoLien`
     * là 0, 0 và 2. Nên một test đi qua `loiCuaEm` không phân biệt được ngưỡng 2 với ngưỡng
     * 1 — nó xanh cả khi luật bị nới, và đó là loại test làm người đọc yên tâm mà không canh
     * gì cả.
     */
    const loi = (loai: string): LoiDanhDau => ({ trich: 't', sua: 's', loai, nhom: 'grammar' })
    const sach = { co: [] as LoiDanhDau[] }
    const co = { co: [loi('x')] }

    const motBaiSach = gomLoiLap([sach, co, co])[0]!
    expect(motBaiSach.saoLien).toBe(1)
    expect(motBaiSach.daDut).toBe(false)

    const haiBaiSach = gomLoiLap([sach, sach, co, co])[0]!
    expect(haiBaiSach.saoLien).toBe(2)
    expect(haiBaiSach.daDut).toBe(true)
  })

  it('chỉ lỗi ở ≥2 bài mới là lỗi LẶP — LOGIC §4.2', () => {
    for (const l of loiCuaEm(EM)) expect(l.soBai).toBeGreaterThanOrEqual(2)

    /*
     * Và hạt giống CÓ lỗi chỉ thấy một bài, để ngưỡng này có việc làm.
     *
     * Không có thì test trên xanh vĩnh viễn mà chẳng canh gì: bỏ hẳn ngưỡng cũng không đỏ.
     * Lỗi lẻ vẫn nằm trên bài của em và cô vẫn thấy khi chấm — nó chỉ không được gọi là
     * "lỗi đang kéo em lại", vì thấy một lần thì chưa kéo ai lại cả.
     */
    const dem = new Map<string, number>()
    for (const b of baiCuaEm(EM).filter((x) => x.nhanXet !== null)) {
      for (const ten of new Set(b.co.filter((c) => c.kieu !== 'khen').map((c) => c.loai))) {
        dem.set(ten, (dem.get(ten) ?? 0) + 1)
      }
    }
    const le = [...dem.entries()].filter(([, n]) => n === 1).map(([t]) => t)
    expect(le.length).toBeGreaterThan(0)
    const trongDs = loiCuaEm(EM).map((l) => l.ten)
    for (const t of le) expect(trongDs).not.toContain(t)
  })

  it('khối lỗi ra đúng ba dòng như bản mẫu: đang nặng · đang mắc · đã dứt', () => {
    const ds = loiCuaEm(EM)
    expect(ds).toHaveLength(3)
    expect(ds[0]!.lienTiep).toBeGreaterThanOrEqual(2)
    expect(ds[1]!.daDut).toBe(false)
    expect(ds[2]!.daDut).toBe(true)
  })

  it('em không đọc được lỗi của bạn cùng lớp', () => {
    // `loiCuaEm` dựng trên `baiCuaEm`, mà hàm đó hỏi `review.view` với actor của EM.
    expect(loiCuaEm('hv-02')).toHaveLength(0)
  })
})

describe('cô và em đọc CÙNG một danh sách lỗi', () => {
  it('ngăn hồ sơ của cô và màn Tiến độ của em ra y hệt nhau', () => {
    /*
     * Đây là bất biến đắt nhất trong file này.
     *
     * Trước refactor, hồ sơ phía cô hiện ba dòng chữ viết sẵn trong hạt giống ("3 bài liên
     * tiếp", "Overview Task 1" — một lỗi không có trong bất kỳ dấu nào), còn màn của em đếm
     * thật và ra 4 bài với hai lỗi đã dứt khác. Hai màn nói hai chuyện về cùng một em, và cô
     * là người tin con số của mình — nên cô sẽ nhắc em bằng một con số sai.
     */
    expect(hoSoDayDu('owner', EM)!.loiLap).toEqual(loiCuaEm(EM))
  })

  it('trợ giảng cũng đọc cùng danh sách đó — `review` mức `propose` vẫn đọc được', () => {
    expect(hoSoDayDu('assistant', EM)!.loiLap).toEqual(loiCuaEm(EM))
  })

  it('không có lỗi nào trong danh sách mà không có dấu cô đánh ở đâu cả', () => {
    const coThat = new Set(
      duLieu()
        .nhanXet.flatMap((n) => n.co ?? [])
        .map((c) => c.loai),
    )
    for (const l of hoSoDayDu('owner', EM)!.loiLap) expect(coThat).toContain(l.ten)
  })
})

describe('tiến bộ band', () => {
  it('chênh lệch và số tuần suy từ hai bài đã chấm', () => {
    const daCham = baiCuaEm(EM).filter((b) => b.band !== null)
    const t = tienBoBand(EM)!
    expect(t.chenh).toBe(
      Math.round((daCham[0]!.band! - daCham[daCham.length - 1]!.band!) * 10) / 10,
    )
    expect(t.tuan).toBeGreaterThan(0)
  })

  it('chưa đủ hai bài thì KHÔNG vẽ "+0.0" — trả null', () => {
    // Em mới vào lớp `lop-moi` chưa có bài nào được chấm ở đó.
    expect(tienBoBand('hv-99')).toBeNull()
  })
})

describe('bài luyện nối với lỗi bằng khoá, không bằng chuỗi', () => {
  it('mỗi bài luyện có `loi` khớp một lỗi cô đã đánh dấu trong bài của em đó', () => {
    const bl = baiLuyenCuaEm(EM)
    expect(bl.length).toBeGreaterThan(0)
    const tenLoi = loiCuaEm(EM).map((l) => l.ten)
    for (const b of bl) expect(tenLoi).toContain(b.loi)
  })

  it('câu cho em đọc KHÔNG chứa khoá lỗi — nên dò chuỗi là dò trượt', () => {
    /*
     * Đây là chỗ lỗi cũ nằm: hàm dò trùng so `viLoi.includes(tenLoi)`, mà `viLoi` viết cho
     * em đọc ("Lỗi 'people is'…") còn khoá lỗi là "hoà hợp chủ–vị". Không lần nào dò ra, nên
     * cô bấm "Tạo bài luyện" là em nhận bài thứ hai cho lỗi em đang luyện.
     */
    const b = baiLuyenCuaEm(EM)[0]!
    expect(b.viLoi).not.toContain(b.loi)
  })
})

describe('thời gian làm bài suy từ hai mốc, không tin lời khai', () => {
  it('mở bài rồi nộp → thời gian là hiệu của hai mốc, và cô đọc được trên thẻ chấm', () => {
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-w2')!
    moBaiLam(EM, bg.id)

    const dong = () =>
      duLieu().baiNop.find((b) => b.baiGiaoId === bg.id && b.hocVienId === EM)!

    // Mở xong: có mốc mở, chưa có mốc nộp → CHƯA đo được.
    expect(dong().moLuc).not.toBeNull()
    expect(dong().nopLuc).toBeNull()
    expect(giayLamBai(dong())).toBeNull()

    // Lùi mốc mở 20 phút để có khoảng đo được mà không phải chờ thật.
    dong().moLuc = new Date(Date.now() - 20 * 60_000).toISOString()
    nopBai(EM, bg.id, 'x '.repeat(260))

    expect(phutLamBai(dong())).toBe(20)
    const the = baiCanCham('owner').find((b) => b.baiNopId === dong().id)
    if (the) expect(the.meta).toContain('viết 20 phút')
  })

  it('KHÔNG có con số thời gian nào đi từ client vào sự kiện', () => {
    /*
     * Bản trước màn nộp gửi kèm `giay_viet` do đồng hồ trình duyệt đếm. Một con số client gửi
     * thì em sửa được, mà cô đọc nó như sự thật. Giờ hai mốc là hai sự kiện, và thời gian là
     * phép trừ — nên không payload nào được mang sẵn số giây.
     */
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-w2')!
    moBaiLam(EM, bg.id)
    nopBai(EM, bg.id, 'x '.repeat(260))

    for (const e of nhatKy().filter((x) => x.objectType === 'submission')) {
      expect(Object.keys(e.payload)).not.toContain('giay_viet')
      expect(Object.keys(e.payload)).not.toContain('duration_s')
    }
  })

  it('bài KHÔNG làm trong app thì không đo được — và không in "viết 0 phút"', () => {
    // Trắc nghiệm làm trên lớp: không có mốc mở.
    const cu = duLieu().baiNop.find((b) => b.moLuc === null)
    expect(cu).toBeDefined()
    expect(giayLamBai(cu!)).toBeNull()

    for (const bai of baiCanCham('owner')) {
      const bn = duLieu().baiNop.find((b) => b.id === bai.baiNopId)!
      if (phutLamBai(bn) === null) expect(bai.meta).not.toContain('viết')
      else expect(bai.meta).toContain('viết')
    }
  })

  it('mốc lệch (nộp trước cả lúc mở) thì nói KHÔNG ĐO ĐƯỢC, không nói 0', () => {
    expect(
      giayLamBai({ moLuc: '2026-09-13T10:00:00.000Z', nopLuc: '2026-09-13T09:00:00.000Z' }),
    ).toBeNull()
  })
})

describe('điều kiện em được làm bài — một chỗ trả lời', () => {
  const BG = 'bg-w2'

  it('bài cô đã giao cho lớp em, chưa nộp → làm được', () => {
    const c = cuaLamBai(EM, BG)
    expect(c.duoc).toBe(true)
    expect(c.vi).toBeNull()
    expect(c.daNop).toBe(false)
  })

  it('mở bài rồi thì đang viết, và mở LẠI không tạo lượt thứ hai', () => {
    moBaiLam(EM, BG)
    expect(cuaLamBai(EM, BG).dangViet).toBe(true)

    const moLuc = duLieu().baiNop.find((b) => b.baiGiaoId === BG)!.moLuc
    const soDong = duLieu().baiNop.length
    const soSuKien = nhatKy().filter((e) => e.action === 'submission.create').length

    moBaiLam(EM, BG)

    expect(duLieu().baiNop.length).toBe(soDong)
    expect(nhatKy().filter((e) => e.action === 'submission.create').length).toBe(soSuKien)
    // Và mốc KHÔNG đặt lại: tải lại trang không được thành "em viết 2 phút".
    expect(duLieu().baiNop.find((b) => b.baiGiaoId === BG)!.moLuc).toBe(moLuc)
  })

  it('bài của lớp khác thì không làm được', () => {
    const cuaLopKhac = duLieu().baiGiao.find(
      (g) => g.lopId !== duLieu().lop.find((l) => l.hocVienIds.includes(EM))?.id,
    )
    expect(cuaLopKhac).toBeDefined()
    const c = cuaLamBai(EM, cuaLopKhac!.id)
    expect(c.duoc).toBe(false)
    expect(c.vi).toBe('khong-trong-lop')
  })

  it('bài trợ giảng mới ĐỀ XUẤT thì chưa tồn tại với em', () => {
    const lop = duLieu().lop.find((l) => l.hocVienIds.includes(EM))!
    const lt = duLieu().loTrinh.find((x) => x.buoi.some((b) => b.deId))!
    const buoi = lt.buoi.find((b) => b.deId)!
    const id = giaoBai('assistant', {
      loTrinhId: lt.id,
      buoiNo: buoi.no,
      lopId: lop.id,
      hanNop: new Date(Date.now() + 86_400_000).toISOString(),
      trongSo: 10,
    })
    // Trợ giảng chỉ ĐỀ XUẤT được, nên bài nằm ở trạng thái chờ cô.
    expect(duLieu().baiGiao.find((g) => g.id === id)!.trangThai).toBe('de_xuat')

    const c = cuaLamBai(EM, id)
    expect(c.duoc).toBe(false)
    expect(c.vi).toBe('chua-giao')
  })
})

describe('nộp rồi là CHỐT — không ai sửa được, kể cả em', () => {
  const BG = 'bg-w2'

  beforeEach(() => {
    moBaiLam(EM, BG)
    nopBai(EM, BG, 'bài của em '.repeat(30))
  })

  it('cửa nói đã nộp, và nói rõ là không sửa được', () => {
    const c = cuaLamBai(EM, BG)
    expect(c.duoc).toBe(false)
    expect(c.vi).toBe('da-nop')
    expect(c.noi).toContain('không sửa được')
  })

  it('lưu nháp sau khi nộp bị TỪ CHỐI, và nội dung không đổi', () => {
    const truoc = duLieu().baiNop.find((b) => b.baiGiaoId === BG)!.noiDung
    expect(() => luuNhapBai(EM, BG, 'em viết lại hết')).toThrow(DaChotKhongSua)
    expect(duLieu().baiNop.find((b) => b.baiGiaoId === BG)!.noiDung).toBe(truoc)
  })

  it('nộp lần thứ hai bị TỪ CHỐI, và mốc nộp đầu tiên giữ nguyên', () => {
    const lan1 = duLieu().baiNop.find((b) => b.baiGiaoId === BG)!.nopLuc
    expect(() => nopBai(EM, BG, 'bài khác hẳn')).toThrow(DaChotKhongSua)
    expect(duLieu().baiNop.find((b) => b.baiGiaoId === BG)!.nopLuc).toBe(lan1)
    // Và không sinh dòng thứ hai cho cùng một bài giao.
    expect(duLieu().baiNop.filter((b) => b.baiGiaoId === BG && b.hocVienId === EM)).toHaveLength(1)
  })

  it('mở lại bài đã nộp cũng bị từ chối — không có đường nào về trạng thái đang viết', () => {
    expect(() => moBaiLam(EM, BG)).toThrow(DaChotKhongSua)
    expect(duLieu().baiNop.find((b) => b.baiGiaoId === BG)!.nopLuc).not.toBeNull()
  })
})

describe('lịch sử làm bài đọc từ events, theo đúng visibility', () => {
  const BG = 'bg-w2'

  it('em thấy cả hai mốc của lượt: mở bài và nộp bài', () => {
    moBaiLam(EM, BG)
    nopBai(EM, BG, 'x '.repeat(260))

    const ls = lichSuLamBai('student', EM)
    expect(ls.some((x) => x.viec === 'Mở bài ra làm')).toBe(true)
    expect(ls.some((x) => x.viec.startsWith('Nộp bài'))).toBe(true)
    // Mới nhất trước.
    expect(ls[0]!.viec.startsWith('Nộp bài')).toBe(true)
  })

  it('cô KHÔNG thấy dòng "mở bài" của một bài em chưa nộp — LOGIC §1.3', () => {
    moBaiLam(EM, BG)

    const cua = lichSuLamBai('owner', EM)
    const ten = duLieu().baiGiao.find((g) => g.id === BG)!.nhan!
    expect(cua.some((x) => x.viec === 'Mở bài ra làm' && x.y.includes(ten))).toBe(false)
    // Còn em thì thấy bài của mình.
    expect(lichSuLamBai('student', EM).some((x) => x.viec === 'Mở bài ra làm')).toBe(true)
  })

  it('nộp rồi thì cô thấy — và thấy cả số từ', () => {
    moBaiLam(EM, BG)
    nopBai(EM, BG, 'x '.repeat(260))

    const nop = lichSuLamBai('owner', EM).find((x) => x.viec.startsWith('Nộp bài'))
    expect(nop).toBeDefined()
    expect(nop!.y).toMatch(/\d+ từ/)
  })

  it('em KHÔNG đọc được lịch sử của bạn cùng lớp', () => {
    moBaiLam(EM, BG)
    nopBai(EM, BG, 'x '.repeat(260))
    // `lichSuLamBai` lọc theo visibility với actor của người đang xem, nên một em khác
    // không nằm trong visibility của dòng nào của Minh Anh.
    expect(lichSuLamBai('student', 'hv-02')).toHaveLength(0)
  })
})
