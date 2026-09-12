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

import type { BaiGiao, BaiLuyen, LoiDanhDau, NhanXet } from './du-lieu'
import { dangChay, diHocTrongLop, duLieu } from './kho'

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
      daNop: Boolean(bn),
      muon: Boolean(bn?.muon),
      band: doc ? (nx?.band ?? null) : null,
      nhanXet: doc ? nx : null,
      co: doc ? (nx?.co ?? []) : [],
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
