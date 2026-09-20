/**
 * Đọc dữ liệu cho app của học viên.
 *
 * Tách khỏi `kho.ts` không phải để gọn file, mà vì app của em là một sản phẩm khác: nó
 * không bao giờ được nhìn thấy lớp 3 (nháp), không bao giờ thấy bạn cùng lớp, và không có
 * đường nào tới học phí của người khác. Gom mọi câu đọc của em vào một chỗ thì cái ranh
 * giới đó soi được bằng mắt, thay vì rải khắp chín màn.
 *
 * Mọi hàm ở đây đi qua `can()` với actor học viên THẬT — không phải theo vai đang xem.
 * Cô mở app của em để xem thử thì vẫn thấy đúng những gì em thấy, không hơn.
 */
import { can, type Actor } from '@/lib/auth/can'

import { gomLoiLap, type BaiGiao, type BaiLuyen, type LoiDanhDau, type LoiLap, type NhanXet } from './du-lieu'
import { buoiDaDiemDanh, cuaLamBai, dangChay, diHocTrongLop, duLieu, phutLamBai } from './kho'

/**
 * Em đang đăng nhập trong bản demo.
 *
 * Bản thật lấy từ phiên đăng nhập. Ở đây là một hằng, và để trong lớp đọc dữ liệu chứ
 * không để trong layout: màn nào cũng cần nó, mà nhập từ layout thì màn phụ thuộc ngược
 * vào khung — đổi khung là gãy màn.
 */
export const EM = 'hv-01'

export function actorEm(hocVienId: string): Actor {
  const du = duLieu()
  return {
    accountId: hocVienId,
    tenantId: du.tenant.id,
    role: 'student',
    classIds: du.lop.filter((l) => l.hocVienIds.includes(hocVienId)).map((l) => l.id),
  }
}

/** Lớp em đang học. Em học một lớp thì đây là lớp đó. */
export function lopCuaEm(hocVienId: string) {
  return duLieu().lop.find((l) => l.hocVienIds.includes(hocVienId)) ?? null
}

/**
 * Em đi học bao nhiêu buổi. Hàm NHẬN HAI id, và đó là chỗ quan trọng.
 *
 * `attendance.student` là mức `own`, nên em chỉ đọc được dòng NÓI VỀ em. Nếu hàm chỉ nhận
 * một id rồi tự dựng actor từ chính id đó thì cửa `own` luôn khớp — kiểm quyền thành thủ
 * tục, và không test nào chứng minh được em không đọc được của bạn. Tách người XEM khỏi
 * người ĐƯỢC XEM thì `diHocEm('hv-01', 'hv-02')` trả `null`, và câu đó kiểm được.
 *
 * `attendance` còn nằm trong `own_is_subject_not_author`: em là CHỦ ĐỀ của điểm danh, không
 * phải người ghi ra nó — nên `own` ở đây chỉ cho xem, không cho sửa.
 */
export function diHocEm(
  nguoiXem: string,
  chuThe: string,
): { coMat: number; tong: number } | null {
  const du = duLieu()
  const lop = du.lop.filter((l) => l.hocVienIds.includes(chuThe))

  const duoc = lop.every((l) =>
    can(actorEm(nguoiXem), 'attendance.view', {
      type: 'attendance',
      tenantId: du.tenant.id,
      classId: l.id,
      ownerId: chuThe,
    }),
  )
  if (lop.length === 0 || !duoc) return null

  return lop.reduce(
    (t, l) => {
      const x = diHocTrongLop(l.id, chuThe)
      return { coMat: t.coMat + x.coMat, tong: t.tong + x.tong }
    },
    { coMat: 0, tong: 0 },
  )
}

export interface BaiTrongHoSo {
  baiGiaoId: string
  nhan: string
  hanNop: string
  daNop: boolean
  muon: boolean
  band: number | null
  nhanXet: NhanXet | null
  co: LoiDanhDau[]
  /** Lúc em nộp — `null` là chưa nộp. */
  nopLuc: string | null
  /** Số phút em ngồi làm, suy từ hai mốc. `null` khi không đo được. */
  phutLam: number | null
  /**
   * Em đã mở bài ra viết nhưng chưa nộp.
   *
   * "Chưa nộp" gộp hai trạng thái rất khác nhau: bài em chưa động tới, và bài em viết dở
   * còn nằm trong máy. Em cần phân biệt — một cái là việc chưa bắt đầu, một cái là việc
   * đang dở dang và sẽ mất nếu quên.
   *
   * Lấy từ `cuaLamBai()` chứ không tự suy lại từ `bn.nopLuc`: đó là chỗ DUY NHẤT định
   * nghĩa "đang viết", và hai chỗ định nghĩa thì sớm muộn hai chỗ trả lời khác nhau.
   */
  dangViet: boolean
  /** Số từ trong bản nháp. 0 khi em mở ra rồi chưa gõ chữ nào. */
  soTuNhap: number
}

/**
 * Mọi bài của em trong lớp — mới nhất trước.
 *
 * Band chỉ hiện khi CÓ nhận xét cô đã gửi. Bài đã nộp mà cô chưa chấm thì band là `null`,
 * và đó là sự thật em cần biết ("đang chờ cô"), không phải chỗ thiếu dữ liệu.
 */
export function baiCuaEm(hocVienId: string): BaiTrongHoSo[] {
  const du = duLieu()
  const actor = actorEm(hocVienId)
  const lop = lopCuaEm(hocVienId)
  if (!lop) return []

  const ket: BaiTrongHoSo[] = []

  for (const bg of du.baiGiao) {
    if (bg.lopId !== lop.id) continue
    // Đề xuất của trợ giảng chưa có hiệu lực. Em không thấy, và hạn của nó cũng chưa chạy.
    if (!dangChay(bg)) continue
    if (!can(actor, 'assignment.view', { type: 'assignment', tenantId: du.tenant.id, classId: bg.lopId })) {
      continue
    }

    const bn = du.baiNop.find((b) => b.baiGiaoId === bg.id && b.hocVienId === hocVienId)
    const nx = bn ? (du.nhanXet.find((n) => n.baiNopId === bn.id) ?? null) : null

    // Nhận xét là lớp 1 nhưng vẫn hỏi quyền: em xem được của em, không xem của bạn.
    const doc =
      nx === null ||
      can(actor, 'review.view', {
        type: 'review',
        tenantId: du.tenant.id,
        classId: bg.lopId,
        ownerId: hocVienId,
      })

    ket.push({
      baiGiaoId: bg.id,
      nhan: bg.nhan ?? du.de.find((d) => d.id === bg.deId)?.ten ?? 'Bài tập',
      hanNop: bg.hanNop,
      // Dòng `writing` KHÔNG phải đã nộp. Trước đây chỉ cần có dòng là "đã nộp", và từ lúc
      // dòng sinh ra ngay khi em mở bài thì em vừa mở ra đã thấy bài mình "đã nộp".
      daNop: Boolean(bn?.nopLuc),
      muon: Boolean(bn?.muon),
      band: doc ? (nx?.band ?? null) : null,
      nhanXet: doc ? nx : null,
      co: doc ? (nx?.co ?? []) : [],
      nopLuc: bn?.nopLuc ?? null,
      phutLam: bn ? phutLamBai(bn) : null,
      dangViet: cuaLamBai(hocVienId, bg.id).dangViet,
      soTuNhap: bn?.nopLuc ? 0 : (bn?.soTu ?? 0),
    })
  }

  return ket.sort((a, b) => b.hanNop.localeCompare(a.hanNop))
}

/** Nhận xét mới nhất em chưa xem hết — thứ app mở ra là thấy. */
export function nhanXetMoiNhat(hocVienId: string): BaiTrongHoSo | null {
  return baiCuaEm(hocVienId).find((b) => b.nhanXet !== null) ?? null
}

/** Bài còn phải nộp: đã giao, chưa nộp. Quá hạn vẫn nộp được, và vẫn ghi là muộn. */
export function baiPhaiNop(hocVienId: string): BaiGiao[] {
  const du = duLieu()
  const chua = new Set(
    baiCuaEm(hocVienId)
      .filter((b) => !b.daNop)
      .map((b) => b.baiGiaoId),
  )
  return du.baiGiao.filter((g) => chua.has(g.id))
}

/**
 * Bài tự luận em nộp được ngay trong app.
 *
 * Trắc nghiệm cũng là bài phải nộp, nhưng màn nộp bài là một ô soạn thảo có đếm từ — mở nó
 * cho bài Reading thì em bấm vào và thấy sai đề. Hai nút cùng chữ "Nộp bài" mà một nút dẫn
 * tới đề khác là kiểu hỏng khó chịu nhất: nó trông như chạy được.
 */
export function baiTuLuanPhaiNop(hocVienId: string): BaiGiao[] {
  return baiPhaiNop(hocVienId).filter((g) => g.cauHoi.some((c) => c.loai === 'essay'))
}

/**
 * Tuần học của em, và chuỗi ngày đều.
 *
 * Một chỗ tính duy nhất, vì con số này hiện ở hai nơi (nhãn trên đầu và ô tuần). Hai chỗ
 * tự tính thì sớm muộn lệch nhau, và người đọc tin cái nào cũng sai.
 */
export function tuanCuaEm(hocVienId: string) {
  const du = duLieu()
  const TEN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  const homNay = (new Date().getDay() + 6) % 7
  const dauTuan = new Date()
  dauTuan.setHours(0, 0, 0, 0)
  dauTuan.setDate(dauTuan.getDate() - homNay)

  // Ngày có việc = có nộp bài hoặc có làm bài luyện. Đọc từ dữ liệu, không bịa.
  const moc = [
    ...du.baiNop.filter((b) => b.hocVienId === hocVienId && b.nopLuc).map((b) => b.nopLuc!),
    ...du.baiLuyen
      .filter((b) => b.hocVienId === hocVienId && b.ketQua)
      .map((b) => b.ketQua!.luc),
  ]

  const ngay = TEN.map((ten, i) => {
    const d = new Date(dauTuan)
    d.setDate(dauTuan.getDate() + i)
    const co = moc.some((m) => new Date(m).toDateString() === d.toDateString())
    return { ten, co, homNay: i === homNay }
  })

  let chuoi = 0
  for (let i = homNay; i >= 0; i--) {
    if (!ngay[i]!.co) break
    chuoi++
  }
  return { ngay, chuoi }
}

export function baiLuyenCuaEm(hocVienId: string): BaiLuyen[] {
  const du = duLieu()
  const actor = actorEm(hocVienId)
  return du.baiLuyen.filter((b) =>
    can(actor, 'practice_set.view', {
      type: 'practice_set',
      id: b.id,
      tenantId: du.tenant.id,
      classId: b.lopId,
      ownerId: b.hocVienId,
    }),
  )
}

/** Hồ sơ năng lực của em. `profile` mức `own` — cô ghi, em đọc. */
export function hoSoCuaEm(hocVienId: string) {
  const du = duLieu()
  const actor = actorEm(hocVienId)
  const lop = lopCuaEm(hocVienId)
  const doc = can(actor, 'profile.view', {
    type: 'profile',
    tenantId: du.tenant.id,
    classId: lop?.id,
    ownerId: hocVienId,
  })
  return doc ? (du.hoSo.find((h) => h.id === hocVienId) ?? null) : null
}

/**
 * Bảng tin lớp. Đây là chỗ DUY NHẤT em thấy tên bạn cùng lớp.
 *
 * Hỏi `class.view`, không hỏi `post.view` từng bài — và chỗ này đáng ghi lại vì em suýt
 * làm sai. Mức `post` của vai học viên là `own`, mà `own` so `ownerId` với người đang đọc:
 * hỏi `post.view` trên bài của cô thì em bị chặn, và bảng tin lớp rỗng trơn.
 *
 * `own` ở `post` nói về quyền VIẾT (em đăng bài của em, không ghim, không xoá bài người
 * khác). Còn phạm vi ĐỌC của bảng tin là phạm vi của lớp: bài đăng lên lớp thì cả lớp thấy,
 * đó là định nghĩa của bảng tin. Nên câu hỏi đúng là "em có ở trong lớp này không".
 */
export function bangTinCuaEm(hocVienId: string) {
  const du = duLieu()
  const actor = actorEm(hocVienId)
  const lop = lopCuaEm(hocVienId)
  if (!lop) return []
  if (!can(actor, 'class.view', { type: 'class', tenantId: du.tenant.id, classId: lop.id })) {
    return []
  }
  return du.baiDang
    .filter((b) => b.lopId === lop.id)
    .sort((a, b) => b.luc.localeCompare(a.luc))
}

/**
 * Lỗi lặp của riêng em — khối "Lỗi đang kéo em lại" của `s-prog`.
 *
 * Bản mẫu có BA dòng: hai lỗi còn mắc và một lỗi "đã dứt". Bản trước em vẽ đúng một dòng,
 * lấy từ chuỗi `hoSo.loiHayGap` — một chuỗi thì không bao giờ ra được ba dòng, và quan trọng
 * hơn: nó không nói được lỗi nào ĐANG nặng lên, lỗi nào em đã dứt. Mà "em đã dứt được một
 * lỗi" là dòng duy nhất trên màn này khen em bằng dữ liệu.
 *
 * Cách gộp nằm ở `gomLoiLap` — dùng CHUNG với ngăn hồ sơ của cô, nên hai màn không thể ra
 * hai con số về cùng một em. Ở đây chỉ khác một chỗ: nguồn bài.
 *
 * Chỉ đọc `nhanXet` cô ĐÃ GỬI (qua `baiCuaEm`, đã lọc quyền từng bài). Nháp của máy là lớp
 * 3, mức `none` với em: lỗi máy vừa đoán ra trong bài em nộp tối qua không được hiện ở đây
 * trước khi cô đọc.
 */
export function loiCuaEm(hocVienId: string): LoiLap[] {
  // `baiCuaEm` xếp mới nhất trước; chỉ lấy bài đã có nhận xét, vì bài chưa chấm không nói
  // được gì về lỗi — em chưa nộp cũng không phải là em không mắc.
  return gomLoiLap(
    baiCuaEm(hocVienId)
      .filter((b) => b.nhanXet !== null)
      .map((b) => ({ co: b.co })),
  )
}

/**
 * Band đầu và band mới nhất, kèm số tuần giữa hai bài — ô "+0.5 band sau 8 tuần".
 *
 * `null` khi chưa đủ hai bài đã chấm: một bài thì không có "tiến bộ", và vẽ "+0.0" vào chỗ
 * đó là nói với em rằng em đứng yên, trong khi sự thật là chưa đo được.
 */
export function tienBoBand(hocVienId: string): { chenh: number; tuan: number } | null {
  const daCham = baiCuaEm(hocVienId).filter((b) => b.band !== null)
  if (daCham.length < 2) return null
  const moi = daCham[0]!
  const cu = daCham[daCham.length - 1]!
  const ms = new Date(moi.hanNop).getTime() - new Date(cu.hanNop).getTime()
  return {
    chenh: Math.round((moi.band! - cu.band!) * 10) / 10,
    tuan: Math.max(1, Math.round(ms / (7 * 86_400_000))),
  }
}

export interface TheSoTu {
  /** `trich` của chỗ cô gạch — một thẻ là một câu CHÍNH EM đã viết sai. */
  khoa: string
  /** Mặt trước: nguyên văn em viết. */
  trich: string
  /** Mặt sau: nguyên văn cô sửa. */
  sua: string
  loai: string
  /** Bài nào, gửi ngày nào — để em biết thẻ này từ đâu ra. */
  tuBai: string
  ngay: string
  /** Lời cô viết thêm cho chỗ này. Không có thì thôi — máy KHÔNG bịa lời giải thích. */
  y: string | null
  /** Em đã đánh "đã nhớ" lúc nào. `null` là chưa đánh bao giờ. */
  daNhoLuc: string | null
  /**
   * Thẻ quay lại vì cô gạch LẠI đúng loại lỗi này, sau lúc em nói đã nhớ.
   *
   * Đây là thứ một danh sách 100 từ không làm được: nó biết em đã hứa gì, và biết lời hứa
   * đó có giữ được không — bằng chữ của cô, không bằng bài tự kiểm của máy.
   */
  taiPham: { bai: string; ngay: string } | null
}

/**
 * Sổ từ của em — thẻ ôn làm từ chính chỗ cô gạch trong bài của em.
 *
 * Ba luật của màn này, và cả ba đều là luật chứ không phải lựa chọn giao diện:
 *
 * 1. **Thẻ chỉ chứa chữ CÔ ĐÃ VIẾT.** Không sinh thêm từ "liên quan", không tự viết lời giải
 *    thích. Một thẻ máy bịa nằm lẫn giữa thẻ của cô thì em không phân biệt được, mà toàn bộ
 *    giá trị nằm ở chỗ "đây là chỗ cô đã mất công sửa cho chính em".
 * 2. **Mọi chỗ cô gạch đều thành thẻ** — không đoán chỗ nào "đáng làm thẻ". Đoán thì có chỗ
 *    bị bỏ mà không ai biết; và `sua` của cô dù là câu thay hay lời dặn thì đều là chữ thật.
 *    Lời khen (`kieu === 'khen'`) thì không: đó không phải chỗ để sửa.
 * 3. **Không đọc bài của ai khác.** `baiCuaEm` đã đi qua `can()` với actor học viên thật.
 */
export function soTuCuaEm(hocVienId: string): TheSoTu[] {
  const bai = baiCuaEm(hocVienId).filter((b) => b.nhanXet !== null)
  const danhGia = duLieu().danhGiaThe.filter((d) => d.hocVienId === hocVienId)

  /*
   * Lời hứa GẦN NHẤT, không phải lần nhớ gần nhất.
   *
   * Lọc `nho === true` rồi lấy mốc mới nhất thì "chưa nhớ" không xoá được lời hứa cũ: em bấm
   * "chưa nhớ" xong thẻ vẫn nói "em đánh đã nhớ ngày 30/8" và vẫn tính là tái phạm. Em vừa
   * thành thật nhận là chưa thuộc, và app lấy đúng câu đó làm bằng chứng buộc tội em.
   *
   * Nên: lấy đánh giá mới nhất, và chỉ tính là lời hứa khi đánh giá ấy là "đã nhớ".
   */
  const nhoLuc = (khoa: string): string | null => {
    const cua = danhGia.filter((d) => d.khoa === khoa)
    if (cua.length === 0) return null
    const moiNhat = cua.reduce((a, b) => (a.luc > b.luc ? a : b))
    return moiNhat.nho ? moiNhat.luc : null
  }

  const the = new Map<string, TheSoTu>()

  for (const b of bai) {
    const guiLuc = b.nhanXet!.guiLuc
    for (const l of b.co) {
      if (l.kieu === 'khen') continue
      // `baiCuaEm` xếp mới nhất trước, nên lần gặp ĐẦU tiên là lần cô gạch gần đây nhất.
      if (the.has(l.trich)) continue
      the.set(l.trich, {
        khoa: l.trich,
        trich: l.trich,
        sua: l.sua,
        loai: l.loai,
        tuBai: b.nhan,
        ngay: guiLuc,
        y: l.themY ?? null,
        daNhoLuc: nhoLuc(l.trich),
        taiPham: null,
      })
    }
  }

  /*
   * Thẻ tái phạm: em nói "đã nhớ" lúc T, sau T cô vẫn gạch lại ĐÚNG LOẠI lỗi đó.
   *
   * So theo LOẠI chứ không theo câu: em không viết lại y nguyên một câu sai, em mắc lại cùng
   * một lỗi ở câu khác. So theo câu thì thẻ gần như không bao giờ quay lại, và luật thành ra
   * một luật chỉ đúng trên giấy.
   */
  for (const t of the.values()) {
    if (!t.daNhoLuc) continue
    for (const b of bai) {
      const guiLuc = b.nhanXet!.guiLuc
      if (guiLuc <= t.daNhoLuc) continue
      if (!b.co.some((l) => l.kieu !== 'khen' && l.loai === t.loai)) continue
      t.taiPham = { bai: b.nhan, ngay: guiLuc }
      break
    }
  }

  /*
   * Thứ tự ôn: tái phạm trước (em đã hứa mà chưa giữ được), rồi thẻ chưa đánh dấu, rồi thẻ
   * đã nhớ. Trong cùng bậc thì mới nhất trước — chỗ cô vừa sửa là chỗ còn nóng.
   */
  const bac = (t: TheSoTu): number => (t.taiPham ? 0 : t.daNhoLuc ? 2 : 1)
  return [...the.values()].sort((a, b) => bac(a) - bac(b) || b.ngay.localeCompare(a.ngay))
}

export interface ChangCuaLop {
  buoiDaQua: number
  tongBuoi: number
  /** Chặng lớp đang đi. `null` khi lộ trình chưa chia chặng. */
  dangO: { tu: number; den: number; noiDung: string } | null
  /** Chặng kế tiếp — để em biết sắp tới học gì, không phải học bằng đề nào. */
  changToi: string | null
}

/**
 * Lớp của em đang đi tới đâu trên lộ trình.
 *
 * Cô chốt 2026-09-20: em ĐƯỢC thấy chặng. Nhưng `path` vẫn là `none` với em — lộ trình là
 * tài sản của cô, là thứ để mở lớp thứ năm mà không soạn lại. Nên đây là một object KHÁC
 * (`path_progress`), và nó chỉ mang bốn con số/chuỗi dưới đây.
 *
 * Thứ hàm này cố ý KHÔNG trả về, dù đang cầm cả `LoTrinh` trong tay:
 *   · `buoi[].deId` — đề sắp giao. Biết trước đề là hỏng cả việc giao bài.
 *   · `buoi[].baiVeNha` và `chang[].baiVeNha` — cách cô soạn.
 *   · `chang[].kho` — "chặng học viên tụt nhiều nhất" là nhận định của cô về CÁC EM KHÁC.
 *
 * Trả cả object rồi để giao diện tự lọc thì dữ liệu vẫn đi tới trình duyệt của em, và ai mở
 * công cụ nhà phát triển cũng đọc được. Cắt ở đây, không cắt ở chỗ vẽ.
 */
export function changCuaLop(nguoiXem: string, lopId: string): ChangCuaLop | null {
  const du = duLieu()

  /*
   * Hàm nhận HAI id, và đó là chỗ quan trọng — cùng bài học `diHocEm` đã ghi ở trên.
   *
   * Bản đầu chỉ nhận `hocVienId` rồi tự tìm lớp của chính em đó. Cửa `can()` khi ấy luôn
   * khớp, vì lớp đem đi hỏi chính là lớp của người hỏi: kiểm quyền thành thủ tục. Đột biến
   * "bỏ hẳn cửa" chạy qua 501 bài test mà không bài nào đỏ.
   *
   * Tách người XEM khỏi LỚP được xem thì `changCuaLop('hv-01', 'lop-55')` phải trả `null`,
   * và câu đó kiểm được.
   */
  if (
    !can(actorEm(nguoiXem), 'path_progress.view', {
      type: 'path_progress',
      tenantId: du.tenant.id,
      classId: lopId,
    })
  ) {
    return null
  }

  const lop = du.lop.find((l) => l.id === lopId)
  if (!lop) return null

  const lt = du.loTrinh.find((x) => x.dangDung.includes(lop.id))
  if (!lt) return null

  /* Dùng lại `buoiDaDiemDanh` của kho chứ không tự lọc `diemDanh`: nó đã khử trùng theo
     `buoiNo` rồi. Tự đếm ở đây là viết luật thứ hai, và luật thứ hai sẽ đếm số DÒNG — sai
     ngay lần đầu cô ghi lại điểm danh một buổi cũ. Mảng đã xếp mới nhất trước. */
  const buoiDaQua = buoiDaDiemDanh(lop.id)[0]?.buoiNo ?? 0

  const dangO = lt.chang.find((c) => buoiDaQua >= c.tu && buoiDaQua <= c.den) ?? null
  const toi = lt.chang.find((c) => c.tu > buoiDaQua) ?? null

  return {
    buoiDaQua,
    tongBuoi: lt.soBuoi,
    dangO: dangO ? { tu: dangO.tu, den: dangO.den, noiDung: dangO.noiDung } : null,
    changToi: toi ? toi.noiDung : null,
  }
}
