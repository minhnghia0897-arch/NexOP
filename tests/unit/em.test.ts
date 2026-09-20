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

import { can } from '@/lib/auth/can'

import {
  EM,
  baiCuaEm,
  baiLuyenCuaEm,
  actorEm,
  changCuaLop,
  loiCuaEm,
  lopCuaEm,
  soTuCuaEm,
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
  danhDauThe,
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

describe('viết dở là một trạng thái, không gộp vào "chưa nộp"', () => {
  /*
   * "Chưa nộp" gộp hai việc rất khác nhau: bài em chưa động tới, và bài em viết 180 chữ rồi
   * đóng máy. Bản nháp vẫn nằm nguyên trong kho — chỉ là không màn nào của em nói ra, nên em
   * tưởng phải viết lại từ đầu.
   */
  it('mở bài rồi gõ dở → dangViet bật, và soTuNhap là số từ thật của bản nháp', () => {
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-w2')!
    const truoc = baiCuaEm(EM).find((b) => b.baiGiaoId === bg.id)!
    expect(truoc.dangViet).toBe(false)
    expect(truoc.daNop).toBe(false)

    moBaiLam(EM, bg.id)
    luuNhapBai(EM, bg.id, 'Technology makes our life easier and faster')

    const nay = baiCuaEm(EM).find((b) => b.baiGiaoId === bg.id)!
    expect(nay.dangViet).toBe(true)
    // Đếm từ thật, không phải độ dài chuỗi: 7 từ.
    expect(nay.soTuNhap).toBe(7)
    // Và vẫn CHƯA nộp — hai câu hỏi khác nhau, không cái nào thay cái nào.
    expect(nay.daNop).toBe(false)
  })

  it('nộp xong thì hết "đang viết", và số từ nháp về 0', () => {
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-w2')!
    moBaiLam(EM, bg.id)
    luuNhapBai(EM, bg.id, 'mot hai ba')
    nopBai(EM, bg.id, 'x '.repeat(260))

    const sau = baiCuaEm(EM).find((b) => b.baiGiaoId === bg.id)!
    expect(sau.daNop).toBe(true)
    /*
     * Chỗ này là cái bẫy: dòng bài nộp vẫn còn `soTu` sau khi nộp. Nếu `soTuNhap` đọc thẳng
     * `bn.soTu` thì bài ĐÃ NỘP vẫn khoe "nháp 260 từ · viết tiếp" — một đường dẫn tới màn
     * mà `cuaLamBai` sẽ từ chối.
     */
    expect(sau.dangViet).toBe(false)
    expect(sau.soTuNhap).toBe(0)
  })

  it('"đang viết" đọc từ cuaLamBai, không phải một luật thứ hai', () => {
    /*
     * Hai chỗ tự định nghĩa "đang viết" thì sớm muộn hai chỗ trả lời khác nhau — và chỗ sai
     * sẽ là chỗ em nhìn, vì chỗ kia có test. Nên câu trả lời phải TRÙNG, từng bài một.
     */
    const bg = duLieu().baiGiao.find((g) => g.id === 'bg-w2')!
    moBaiLam(EM, bg.id)

    for (const b of baiCuaEm(EM)) {
      expect(b.dangViet).toBe(cuaLamBai(EM, b.baiGiaoId).dangViet)
    }
  })
})

describe('em thấy CHẶNG của lớp, không thấy lộ trình của cô', () => {
  it('em đọc được chặng lớp đang đi, suy từ buổi đã điểm danh', () => {
    const c = changCuaLop(EM, lopCuaEm(EM)!.id)!
    expect(c).not.toBeNull()

    const lop = duLieu().lop.find((l) => l.hocVienIds.includes(EM))!
    const lt = duLieu().loTrinh.find((x) => x.dangDung.includes(lop.id))!
    const buoiLonNhat = duLieu()
      .diemDanh.filter((d) => d.lopId === lop.id)
      .reduce((m, d) => Math.max(m, d.buoiNo), 0)

    expect(c.buoiDaQua).toBe(buoiLonNhat)

    /* Cô ghi LẠI điểm danh một buổi cũ = thêm một DÒNG, không phải thêm một buổi. Đếm số
       dòng thì con số nhảy, và em đọc "lớp đang ở buổi 13/48" cho một lớp mới đi 12 buổi. */
    const cu = duLieu().diemDanh.find((d) => d.lopId === lop.id)!
    duLieu().diemDanh.push({ ...cu, id: `${cu.id}-ghi-lai` })
    expect(changCuaLop(EM, lop.id)!.buoiDaQua).toBe(buoiLonNhat)
    expect(c.tongBuoi).toBe(lt.soBuoi)
    // Chặng phải THẬT SỰ chứa buổi đó, không phải chặng đầu tiên cho có.
    expect(c.dangO!.tu).toBeLessThanOrEqual(c.buoiDaQua)
    expect(c.dangO!.den).toBeGreaterThanOrEqual(c.buoiDaQua)
  })

  it('KHÔNG rò đề sắp giao, bài về nhà, hay chặng "học viên tụt nhiều nhất"', () => {
    /*
     * Chỗ này quan trọng hơn cả việc em đọc được chặng: hàm đang cầm cả `LoTrinh` trong tay.
     * Trả cả object rồi để giao diện tự lọc thì dữ liệu vẫn tới trình duyệt của em — ai mở
     * công cụ nhà phát triển cũng đọc được, và `chang[].kho` là nhận định của cô về CÁC EM
     * KHÁC.
     */
    const c = changCuaLop(EM, lopCuaEm(EM)!.id)!
    const phang = JSON.stringify(c)

    const lop = duLieu().lop.find((l) => l.hocVienIds.includes(EM))!
    const lt = duLieu().loTrinh.find((x) => x.dangDung.includes(lop.id))!

    for (const b of lt.buoi) {
      if (b.deId) expect(phang).not.toContain(b.deId)
      if (b.baiVeNha) expect(phang).not.toContain(b.baiVeNha)
    }
    for (const ch of lt.chang) {
      if (ch.baiVeNha) expect(phang).not.toContain(ch.baiVeNha)
      if (ch.kiemTra) expect(phang).not.toContain(ch.kiemTra)
    }
    expect(Object.keys(c.dangO!).sort()).toEqual(['den', 'noiDung', 'tu'])
  })

  it('`path` vẫn đóng với em — chặng là object KHÁC, không phải cửa sau vào lộ trình', () => {
    const em = actorEm(EM)
    const o = { tenantId: duLieu().tenant.id, classId: lopCuaEm(EM)!.id }
    expect(can(em, 'path.view', { type: 'path', ...o })).toBe(false)
    expect(can(em, 'path_progress.view', { type: 'path_progress', ...o })).toBe(true)
    // Và em chỉ ĐỌC: chặng không phải thứ em sửa.
    expect(can(em, 'path_progress.update', { type: 'path_progress', ...o })).toBe(false)
  })

  it('em KHÔNG đọc được chặng của lớp mình không học', () => {
    /*
     * Bài này là lý do hàm nhận hai id. Với một id, cửa `can()` luôn khớp — đột biến "bỏ hẳn
     * cửa" từng chạy qua cả 501 bài test mà không bài nào đỏ.
     */
    const lopKhac = duLieu().lop.find((l) => !l.hocVienIds.includes(EM))!
    expect(changCuaLop(EM, lopKhac.id)).toBeNull()
    // Và cô thì đọc được lớp đó — chứng minh `null` ở trên là do QUYỀN, không phải do thiếu dữ liệu.
    expect(lopKhac.id).not.toBe(lopCuaEm(EM)!.id)
  })
})

describe('Sổ từ: thẻ làm từ chỗ cô gạch, không phải từ điển chung', () => {
  it('mọi thẻ đều trỏ về một dấu CÓ THẬT trong nhận xét cô đã gửi', () => {
    /*
     * Luật số một của màn này: thẻ chỉ chứa chữ CÔ ĐÃ VIẾT. Một thẻ máy bịa nằm lẫn giữa thẻ
     * của cô thì em không phân biệt được — mà toàn bộ giá trị nằm ở chỗ "cô đã mất công sửa
     * chính câu này cho em".
     */
    const dauCuaCo = new Map<string, string>()
    for (const b of baiCuaEm(EM)) {
      for (const l of b.nhanXet?.co ?? []) dauCuaCo.set(l.trich, l.sua)
    }

    const the = soTuCuaEm(EM)
    expect(the.length).toBeGreaterThan(0)
    for (const t of the) {
      expect(dauCuaCo.has(t.trich)).toBe(true)
      expect(t.sua).toBe(dauCuaCo.get(t.trich))
    }
  })

  it('lời khen KHÔNG thành thẻ — đó không phải chỗ để sửa', () => {
    const khen = baiCuaEm(EM)
      .flatMap((b) => b.co)
      .filter((l) => l.kieu === 'khen')
      .map((l) => l.trich)

    const khoa = soTuCuaEm(EM).map((t) => t.khoa)
    for (const k of khen) expect(khoa).not.toContain(k)
  })

  it('thẻ KHÔNG tự bịa lời giải thích: `y` là `themY` của cô, hoặc null', () => {
    const themYCuaCo = new Map<string, string | undefined>()
    for (const b of baiCuaEm(EM)) {
      for (const l of b.nhanXet?.co ?? []) themYCuaCo.set(l.trich, l.themY)
    }
    for (const t of soTuCuaEm(EM)) {
      expect(t.y).toBe(themYCuaCo.get(t.trich) ?? null)
    }
  })

  it('em không đọc được thẻ của bạn — sổ từ đi theo bài của chính em', () => {
    const cuaEmKhac = soTuCuaEm('hv-02')
    const khoaCuaEm = new Set(soTuCuaEm(EM).map((t) => t.khoa))
    for (const t of cuaEmKhac) expect(khoaCuaEm.has(t.khoa)).toBe(false)
  })
})

describe('Sổ từ: thẻ tái phạm quay lại, và nói rõ vì sao', () => {
  it('hạt giống có đúng một thẻ tái phạm, và nó trỏ về bài cô gạch LẠI', () => {
    const lai = soTuCuaEm(EM).filter((t) => t.taiPham)
    expect(lai).toHaveLength(1)

    const t = lai[0]!
    expect(t.daNhoLuc).not.toBeNull()
    // Bài gạch lại phải đứng SAU lúc em nói đã nhớ. Ngược lại là một câu chuyện vô nghĩa.
    expect(t.taiPham!.ngay > t.daNhoLuc!).toBe(true)

    // Và bài đó phải thật sự chứa đúng LOẠI lỗi ấy.
    const bai = baiCuaEm(EM).find((b) => b.nhan === t.taiPham!.bai)!
    expect(bai.co.some((l) => l.loai === t.loai)).toBe(true)
  })

  it('đánh "đã nhớ" HÔM NAY thì thẻ không tái phạm — cô chưa gạch lại lần nào sau đó', () => {
    /*
     * Bẫy: nếu chỉ hỏi "cô có gạch loại lỗi này không" mà KHÔNG so mốc thời gian, thì thẻ vừa
     * đánh đã nhớ lập tức quay lại — vì lỗi đó dĩ nhiên có trong bài cũ. Em sẽ gặp một app cãi
     * lại mình ngay giây sau khi mình vừa trả lời.
     */
    const t = soTuCuaEm(EM).find((x) => !x.taiPham && !x.daNhoLuc)!
    danhDauThe(EM, t.khoa, true)

    const sau = soTuCuaEm(EM).find((x) => x.khoa === t.khoa)!
    expect(sau.daNhoLuc).not.toBeNull()
    expect(sau.taiPham).toBeNull()
  })

  it('thẻ tái phạm xếp lên đầu, thẻ đã nhớ xuống cuối', () => {
    const bac = soTuCuaEm(EM).map((t) => (t.taiPham ? 0 : t.daNhoLuc ? 2 : 1))
    expect([...bac].sort((a, b) => a - b)).toEqual(bac)
  })

  it('"chưa nhớ" cũng được ghi — lịch sử ôn chỉ có nghĩa khi ghi cả lần không thuộc', () => {
    const t = soTuCuaEm(EM)[0]!
    danhDauThe(EM, t.khoa, false)

    const e = nhatKy().find(
      (x) => x.action === 'practice_set.update' && x.payload.the === t.khoa,
    )
    expect(e).toBeDefined()
    expect(e!.payload.nho).toBe(false)
    // Và em vẫn KHÔNG bị tính là đã nhớ.
    expect(soTuCuaEm(EM).find((x) => x.khoa === t.khoa)!.daNhoLuc).toBeNull()
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
