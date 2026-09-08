import 'server-only'

/**
 * Kho dữ liệu của bản demo: giả ở CHỖ LƯU, thật ở CHỖ LUẬT.
 *
 * Đây là điểm quyết định của cả bản khung. Cách dễ là để màn hình đọc thẳng mảng dữ liệu
 * mẫu và bấm nút thì đổi state — dựng nhanh, demo đẹp, và sai. Sai vì lúc nối Supabase
 * mới phát hiện quyền, sự kiện và ranh giới máy–người chưa từng chạy lần nào, nên không
 * phải "thay chỗ lưu" mà là viết lại.
 *
 * Nên mọi ghi ở đây đi qua đúng ba cửa mà CSDL thật đang ép:
 *   1. `can(actor, action, object)` — cùng một hàm, cùng `docs/permissions.json`.
 *   2. Ghi `events` TRƯỚC khi có hiệu lực; ghi hỏng thì hành vi không xảy ra.
 *   3. Máy chỉ `draft`/`propose`/`auto:*`. Không API nào cho máy "gửi cho học viên".
 *
 * Chỗ duy nhất khác bản thật: dữ liệu nằm trong bộ nhớ tiến trình. Nghĩa là khởi động lại
 * là về mẫu ban đầu, và trên nền chạy nhiều tiến trình thì mỗi tiến trình một bản. Chấp
 * nhận được cho demo; đó cũng là lý do file này không được dùng ở bản chạy thật.
 */
import { can, type Actor, type TargetObject } from '@/lib/auth/can'

import {
  duLieuBanDau,
  type DuLieuDemo,
  type LoiDanhDau,
  type TaiKhoan,
  type VaiDemo,
} from './du-lieu'

export interface SuKien {
  id: string
  tenantId: string
  classId: string | null
  actorId: string | null
  actorRole: Actor['role']
  action: string
  objectType: string
  objectId: string | null
  payload: Record<string, unknown>
  /** Tính lúc GHI, không tính lúc đọc — giống cột visibility của bảng thật. */
  visibility: string[]
  luc: string
}

interface TrangThai {
  du: DuLieuDemo
  events: SuKien[]
}

/*
 * Một bản duy nhất cho cả tiến trình. Gắn lên globalThis để lần nạp lại nóng của
 * `next dev` không thổi bay dữ liệu cô vừa bấm — nếu không thì mỗi lần sửa một dòng CSS
 * là bản demo quay về đầu, và không ai đi hết được một luồng.
 */
const KHOA = Symbol.for('oblue.demo.kho')
type CoKho = typeof globalThis & { [KHOA]?: TrangThai }

function trangThai(): TrangThai {
  const g = globalThis as CoKho
  g[KHOA] ??= { du: duLieuBanDau(), events: [] }
  return g[KHOA]
}

/** Về lại dữ liệu mẫu. Có nút gọi nó, để người demo thử lại từ đầu. */
export function datLai(): void {
  const g = globalThis as CoKho
  g[KHOA] = { du: duLieuBanDau(), events: [] }
}

export function duLieu(): DuLieuDemo {
  return trangThai().du
}

export function nhatKy(): SuKien[] {
  return [...trangThai().events].reverse()
}

// ───────────────────────────── ai đang làm việc ─────────────────────────────

/** Dựng actor cho `can()` từ vai đang chọn. Cùng hình dạng với bản thật. */
export function actorCuaVai(vai: VaiDemo): Actor {
  const du = duLieu()
  const accountId = du.vai[vai]
  const classIds =
    vai === 'owner'
      ? [] // Cô sở hữu cả tên miền, không liệt kê lớp (can.ts, cửa 3).
      : du.lop.filter((l) => l.hocVienIds.includes(accountId) || vai === 'assistant')
          .map((l) => l.id)

  return {
    accountId,
    tenantId: du.tenant.id,
    role: vai,
    // Trợ giảng chỉ phụ trách lớp 6.5 — để bản demo cho thấy quyền đi theo lớp.
    classIds: vai === 'assistant' ? ['lop-65'] : classIds,
    permissions:
      vai === 'assistant'
        ? { 'lop-65': { submission: 'read', review: 'propose', post: 'own' } }
        : undefined,
  }
}

/*
 * Máy làm việc TRONG một lớp cụ thể, nên actor của nó mang theo lớp đó.
 *
 * Cửa 3 của `can()` chặn actor không có tên trong lớp của object, và chỉ chừa vai owner
 * (cô sở hữu cả tên miền). Máy không phải thành viên lớp nào, nên cách dễ là nới cửa đó
 * cho cả `system` — nhưng không nên: cửa 3 đang là lưới an toàn bắt được một job chạy
 * nhầm lớp. Giữ cửa, và bắt máy khai đúng lớp nó đang xử lý.
 */
export function actorMay(lopId: string): Actor {
  return {
    accountId: 'system',
    tenantId: duLieu().tenant.id,
    role: 'system',
    classIds: [lopId],
  }
}

// ───────────────────────────── ghi ─────────────────────────────

export class KhongDuQuyen extends Error {
  constructor(action: string) {
    super(`Không đủ quyền cho "${action}"`)
    this.name = 'KhongDuQuyen'
  }
}

/**
 * Cửa ghi duy nhất. Kiểm quyền → ghi sự kiện → mới cho thay đổi chạy.
 *
 * `thayDoi` nhận dữ liệu và sửa tại chỗ. Nó chỉ được gọi SAU khi sự kiện đã nằm trong
 * nhật ký, đúng thứ tự của bản thật: "ghi thất bại → hành vi không xảy ra".
 */
function ghi<T>(
  actor: Actor,
  action: string,
  object: TargetObject,
  payload: Record<string, unknown>,
  nhinThay: string[],
  thayDoi: (du: DuLieuDemo) => T,
): T {
  if (!can(actor, action, object)) throw new KhongDuQuyen(action)

  const st = trangThai()
  st.events.push({
    id: `ev-${st.events.length + 1}`,
    tenantId: object.tenantId,
    classId: object.classId ?? null,
    actorId: actor.role === 'system' ? null : actor.accountId,
    actorRole: actor.role,
    action,
    objectType: object.type,
    objectId: object.id ?? null,
    payload,
    visibility: nhinThay,
    luc: new Date().toISOString(),
  })

  return thayDoi(st.du)
}

// ───────────────────────────── việc của máy ─────────────────────────────

/**
 * Máy chấm nháp một bài. Lớp 3: có hạn, cô quyết, em không thấy.
 *
 * Vai `system` nên `can()` chặn mọi động từ ngoài draft/propose/auto:* — thử đổi
 * `review.draft` thành `review.send` ở đây thì hàm ném lỗi, không phải chạy được rồi mới sai.
 */
export function mayChamNhap(baiNopId: string, ket: Omit<import('./du-lieu').NhapCham, 'id' | 'baiNopId' | 'hetHan'>): void {
  const du = duLieu()
  const bn = du.baiNop.find((b) => b.id === baiNopId)
  if (!bn) throw new Error('Không có bài nộp này')
  const bg = du.baiGiao.find((g) => g.id === bn.baiGiaoId)!

  ghi(
    actorMay(bg.lopId),
    'review.draft',
    { type: 'review', tenantId: du.tenant.id, classId: bg.lopId, ownerId: bn.hocVienId },
    { bai_nop: baiNopId, tin_cay: ket.tinCay },
    [du.vai.owner],
    (d) => {
      const cu = d.nhapCham.findIndex((n) => n.baiNopId === baiNopId)
      const moi = { id: `nc-${baiNopId}`, baiNopId, hetHan: new Date(Date.now() + 14 * 864e5).toISOString(), ...ket }
      if (cu >= 0) d.nhapCham[cu] = moi
      else d.nhapCham.push(moi)
    },
  )
}

// ───────────────────────────── việc của người ─────────────────────────────

/*
 * Sửa nháp trước khi gửi.
 *
 * Động từ là `propose`, không phải `update`, và đó không phải chuyện chữ nghĩa: mức
 * `propose` cô cấp cho trợ giảng cho phép đúng {view, draft, propose}. Dùng `update` thì
 * trợ giảng bị chặn — mà sửa nháp lại chính là việc của trợ giảng. Đúng hơn về mặt nghĩa
 * nữa: nháp chưa tới tay em nên chưa có gì để "cập nhật", mới chỉ là đề xuất.
 */
export function suaNhap(vai: VaiDemo, baiNopId: string, noiDung: string): void {
  const du = duLieu()
  const bn = du.baiNop.find((b) => b.id === baiNopId)!
  const bg = du.baiGiao.find((g) => g.id === bn.baiGiaoId)!

  ghi(
    actorCuaVai(vai),
    'review.propose',
    { type: 'review', tenantId: du.tenant.id, classId: bg.lopId, ownerId: bn.hocVienId },
    { bai_nop: baiNopId },
    [du.vai.owner],
    (d) => {
      const n = d.nhapCham.find((x) => x.baiNopId === baiNopId)
      if (n) n.nhanXet = noiDung
    },
  )
}

/**
 * Trợ giảng soạn xong và chuyển cho cô.
 *
 * Đây mới là việc của trợ giảng, và nó KHÁC "gửi". Bản đầu em cho nút của trợ giảng gọi
 * thẳng `guiNhanXet`, rồi `can()` chặn và màn hình hiện một dòng lỗi — nút hứa một đằng
 * làm một nẻo. Cửa chặn đúng, nhưng đặt nút vào chỗ chắc chắn hỏng là lỗi thiết kế.
 *
 * Sau lệnh này nhận xét vẫn là lớp 3: em chưa thấy gì. Chỉ cô bấm gửi mới thành sự thật.
 */
export function deXuatChoCo(vai: VaiDemo, baiNopId: string, noiDung: string): void {
  const du = duLieu()
  const bn = du.baiNop.find((b) => b.id === baiNopId)!
  const bg = du.baiGiao.find((g) => g.id === bn.baiGiaoId)!
  const actor = actorCuaVai(vai)

  ghi(
    actor,
    'review.propose',
    { type: 'review', tenantId: du.tenant.id, classId: bg.lopId, ownerId: bn.hocVienId },
    { bai_nop: baiNopId, tu: 'tro_giang' },
    [du.vai.owner],
    (d) => {
      const n = d.nhapCham.find((x) => x.baiNopId === baiNopId)
      if (n) {
        n.nhanXet = noiDung
        n.choCoDuyet = { boiId: actor.accountId }
      }
    },
  )
}

/**
 * Gửi nhận xét cho em. Đây là chỗ lớp 3 thành lớp 1.
 *
 * `review.send` nằm trong `send_actions_owner_only`, nên `can()` chặn ở cửa 4 với mọi vai
 * khác owner — kể cả trợ giảng được cấp mức `propose`. Trợ giảng bấm nút này thì hàm ném
 * lỗi, đúng như bản thật, chứ không phải giao diện ẩn nút đi rồi coi như xong.
 */
export function guiNhanXet(vai: VaiDemo, baiNopId: string): void {
  const du = duLieu()
  const bn = du.baiNop.find((b) => b.id === baiNopId)!
  const bg = du.baiGiao.find((g) => g.id === bn.baiGiaoId)!
  const nhap = du.nhapCham.find((n) => n.baiNopId === baiNopId)
  if (!nhap) throw new Error('Chưa có nháp chấm cho bài này')

  const nhapGoc = duLieuBanDau().nhapCham.find((n) => n.baiNopId === baiNopId)
  const band = Number(
    ((nhap.band.tr + nhap.band.cc + nhap.band.lr + nhap.band.gra) / 4).toFixed(1),
  )

  ghi(
    actorCuaVai(vai),
    'review.send',
    { type: 'review', tenantId: du.tenant.id, classId: bg.lopId, ownerId: bn.hocVienId },
    { bai_nop: baiNopId, band },
    // Từ đây em nhìn thấy. Trước đó thì không.
    [du.vai.owner, bn.hocVienId],
    (d) => {
      d.nhanXet.push({
        id: `nx-${baiNopId}-${d.nhanXet.length + 1}`,
        baiNopId,
        band,
        noiDung: nhap.nhanXet,
        guiLuc: new Date().toISOString(),
        suaTuNhap: nhap.nhanXet !== nhapGoc?.nhanXet,
      })
      d.nhapCham = d.nhapCham.filter((n) => n.baiNopId !== baiNopId)
    },
  )
}

/** Đăng bài lên bảng tin lớp. Trợ giảng đăng được (mức `own` cho post). */
export function dangBai(vai: VaiDemo, lopId: string, noiDung: string): void {
  const du = duLieu()
  const actor = actorCuaVai(vai)

  ghi(
    actor,
    'post.create',
    { type: 'post', tenantId: du.tenant.id, classId: lopId, ownerId: actor.accountId },
    { lop: lopId },
    [du.vai.owner, ...(du.lop.find((l) => l.id === lopId)?.hocVienIds ?? [])],
    (d) => {
      d.baiDang.unshift({
        id: `bd-${d.baiDang.length + 1}`,
        lopId,
        tacGiaId: actor.accountId,
        loai: 'post',
        noiDung,
        luc: new Date().toISOString(),
      })
    },
  )
}

/** Em nộp bài. */
export function nopBai(hocVienId: string, baiGiaoId: string, noiDung: string): void {
  const du = duLieu()
  const bg = du.baiGiao.find((g) => g.id === baiGiaoId)!
  const actor: Actor = {
    accountId: hocVienId,
    tenantId: du.tenant.id,
    role: 'student',
    classIds: [bg.lopId],
  }

  ghi(
    actor,
    'submission.create',
    { type: 'submission', tenantId: du.tenant.id, classId: bg.lopId, ownerId: hocVienId },
    { bai_giao: baiGiaoId },
    [du.vai.owner, hocVienId],
    (d) => {
      d.baiNop.push({
        id: `bn-${hocVienId}-${baiGiaoId}`,
        baiGiaoId,
        hocVienId,
        noiDung,
        soTu: noiDung.trim().split(/\s+/).filter(Boolean).length,
        nopLuc: new Date().toISOString(),
        muon: Date.now() > new Date(bg.hanNop).getTime(),
      })
    },
  )
}

// ───────────────────────────── đọc ─────────────────────────────

export interface BaiCanCham {
  baiNopId: string
  hocVien: { id: string; ten: string; mau: TaiKhoan['mau'] }
  lopId: string
  lopTen: string
  deTen: string
  soTu: number
  muon: boolean
  nopLuc: string | null
  noiDung: string
  band: { tr: number; cc: number; lr: number; gra: number }
  bandTb: number
  tinCay: number
  co: LoiDanhDau[]
  nhanXet: string
  ganCo: string[]
  /** Tên người đã soạn hộ cô, nếu có. */
  troGiangSoan: string | null
}

/** Chồng bài chờ cô — sắp bài gắn cờ lên trước, vì đó là bài cô phải tự đọc. */
export function baiCanCham(vai: VaiDemo): BaiCanCham[] {
  const du = duLieu()
  const actor = actorCuaVai(vai)

  const ket: BaiCanCham[] = []

  for (const n of du.nhapCham) {
    const bn = du.baiNop.find((b) => b.id === n.baiNopId)
    const bg = bn && du.baiGiao.find((g) => g.id === bn.baiGiaoId)
    const hv = bn && du.taiKhoan.find((t) => t.id === bn.hocVienId)
    if (!bn || !bg || !hv) continue

    /*
     * Lọc bằng đúng hàm quyền, không phải bằng `if vai === ...` rải rác.
     *
     * Và lọc bằng `review.propose`, không phải `submission.view`: em XEM ĐƯỢC bài nộp của
     * chính em, nên lọc theo bài nộp thì em nhìn thấy chồng bài chấm — mà nháp là lớp 3,
     * em không bao giờ được thấy band máy đoán. Ai sửa được nháp thì mới thấy chồng bài.
     *
     * Đây là chỗ lẽ ra nên hỏi `draft.view`. `draft` là một trong năm thực thể còn thiếu
     * trong permissions.json (docs/LOGIC.md §8.1), nên tạm hỏi câu gần nhất mà đã có
     * chính sách thật, thay vì tự đặt ra một chính sách mới ở đây.
     */
    const doc = can(actor, 'review.propose', {
      type: 'review',
      tenantId: du.tenant.id,
      classId: bg.lopId,
      ownerId: bn.hocVienId,
    })
    if (!doc) continue

    const b = n.band
    ket.push({
        baiNopId: n.baiNopId,
      hocVien: { id: hv.id, ten: hv.ten, mau: hv.mau },
      lopId: bg.lopId,
      lopTen: du.lop.find((l) => l.id === bg.lopId)?.ten ?? '',
      deTen: du.de.find((d) => d.id === bg.deId)?.ten ?? '',
      soTu: bn.soTu,
      muon: bn.muon,
      nopLuc: bn.nopLuc,
      noiDung: bn.noiDung,
      band: b,
      bandTb: Number(((b.tr + b.cc + b.lr + b.gra) / 4).toFixed(1)),
      tinCay: n.tinCay,
      co: n.co,
      nhanXet: n.nhanXet,
      ganCo: n.ganCo,
      troGiangSoan: n.choCoDuyet
        ? (du.taiKhoan.find((t) => t.id === n.choCoDuyet!.boiId)?.ten ?? null)
        : null,
    })
  }

  // Bài gắn cờ lên trước — đó là bài cô phải tự đọc, không phải bài bấm duyệt cho nhanh.
  return ket.sort(
    (a, b) => b.ganCo.length - a.ganCo.length || a.hocVien.ten.localeCompare(b.hocVien.ten, 'vi'),
  )
}
