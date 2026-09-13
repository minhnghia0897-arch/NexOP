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
import { gomLoiLap, xepLoiLap, type LoiDanhDau, type LoiLap } from '@/lib/demo/du-lieu'
import { baiCanCham, datLai, duLieu, hoSoDayDu, nhatKy, nopBai } from '@/lib/demo/kho'

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

describe('thời gian viết', () => {
  it('nộp bài có ghi số giây, và cô đọc được trên thẻ chấm', () => {
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-w2')!
    nopBai(EM, bg.id, 'x '.repeat(260), 1500)

    const bn = duLieu().baiNop.find((b) => b.baiGiaoId === bg.id && b.hocVienId === EM)!
    expect(bn.giayViet).toBe(1500)

    // Sự kiện mang theo con số, không chỉ dòng dữ liệu — cô xem nhật ký cũng thấy.
    expect(
      nhatKy().some(
        (e) => e.action === 'submission.create' && e.payload.giay_viet === 1500,
      ),
    ).toBe(true)
  })

  it('bài không đo được thời gian thì KHÔNG in "viết 0 phút"', () => {
    // Bài trong hạt giống nộp trước khi có đồng hồ: không có `giayViet`.
    const cu = duLieu().baiNop.find((b) => b.giayViet === undefined)
    expect(cu).toBeDefined()

    for (const bai of baiCanCham('owner')) {
      const bn = duLieu().baiNop.find((b) => b.id === bai.baiNopId)!
      if (bn.giayViet === undefined) expect(bai.meta).not.toContain('viết')
      else expect(bai.meta).toContain('viết')
    }
  })
})
