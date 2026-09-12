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
 * ── Vì sao file này chạy được ở trình duyệt ──
 *
 * Bản đầu có `import 'server-only'` và mọi ghi đi qua server action, đúng hình dạng bản
 * thật. Nhưng GitHub Pages chỉ phục vụ file tĩnh, không có máy chủ nào chạy server action,
 * nên bản demo lúc đó không ai mở được nếu không tự cài môi trường.
 *
 * Đánh đổi đã chọn (DECISIONS 2026-09-08): bỏ `server-only`, cho kho chạy ngay trên trình
 * duyệt. Cái GIỮ được là toàn bộ luật — `can()`, `events`, ba lớp dữ liệu, và cả bộ test.
 * Cái MẤT là hình dạng đường ghi: bản thật gửi ý định lên máy chủ rồi máy chủ mới kiểm
 * quyền, còn ở đây trình duyệt tự kiểm. Với dữ liệu mẫu thì không có gì để mất, nhưng nó
 * nghĩa là lúc nối Supabase phải dựng lại đường ghi cho từng màn, không phải đổi một file.
 *
 * Dữ liệu nằm trong bộ nhớ tab, lưu thêm vào localStorage để tải lại trang không mất.
 */
import { can, type Actor, type TargetObject } from '@/lib/auth/can'

import {
  chamTracNghiem,
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

/** Vai đang xem. Ở trong kho luôn để đổi vai cũng là một thay đổi có người nghe. */
let vaiDangXem: VaiDemo = 'owner'

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
  vaiDangXem = 'owner'
  luuLai()
  bao()
}

// ───────────────────────── nghe thay đổi ─────────────────────────
//
// Màn hình là thành phần client, nên chúng phải biết lúc nào dữ liệu đổi. Dùng
// useSyncExternalStore của React: kho giữ một số phiên bản, mỗi lần ghi thì tăng lên.

let phienBan = 0
const nguoiNghe = new Set<() => void>()

function bao(): void {
  phienBan += 1
  for (const f of nguoiNghe) f()
}

export function dangKyNghe(f: () => void): () => void {
  nguoiNghe.add(f)
  return () => nguoiNghe.delete(f)
}

export function soPhienBan(): number {
  return phienBan
}

/*
 * Mã mới, không trùng.
 *
 * `Date.now()` một mình là không đủ: hai bài giao trong cùng một mili giây ra CÙNG một mã,
 * rồi `find(g => g.id === id)` trả về bài đầu và bài thứ hai thành vô hình. Lỗi này đã xảy
 * ra thật ngay ở test đầu tiên — và nếu nó lọt, người dùng gặp nó lúc bấm Giao hai lần liền.
 */
let dem = 0
function maMoi(tien: string): string {
  dem += 1
  return `${tien}-${Date.now().toString(36)}-${dem}`
}

// ───────────────────────── giữ qua lần tải lại ─────────────────────────
//
// Không có localStorage thì tải lại trang là mất bài cô vừa gửi — và người xem demo sẽ
// tưởng hệ thống hỏng chứ không nghĩ là mình vừa làm mới trang.

const KHOA_LUU = 'oblue-demo-v2'

/**
 * Bản đã lưu của HÔM TRƯỚC không nhất thiết cùng hình dạng với bản hôm nay.
 *
 * Đây là lỗi đã xảy ra thật: bản demo thêm `luat` và `baiLuyen`, khoá lưu vẫn là `-v1`, nên
 * người đã mở bản cũ quay lại là nạp một `du` thiếu hai mảng đó — rồi `du.baiLuyen.filter`
 * ném lỗi và cả trang trắng với "Application error". Bài kiểm bằng trình duyệt không bắt
 * được, vì lần nào cũng mở bằng hồ sơ sạch: chỗ hỏng chỉ tồn tại với người ĐÃ dùng.
 *
 * Nên hai lớp, không một:
 *   1. Đổi khoá khi hình dạng đổi — sửa được lần này.
 *   2. So khoá của bản lưu với bản mẫu, thiếu cái nào thì bỏ cả bản lưu — bắt được cả lần
 *      sau, khi em quên làm việc (1). Lỗi này có chính vì em đã quên.
 *
 * Bỏ bản lưu nghĩa là demo về lại dữ liệu mẫu. Mất vài thao tác người xem vừa bấm, nhưng
 * hơn hẳn một trang trắng — và trang trắng thì họ không biết là do đâu.
 */
function dungHinhDang(du: unknown): du is DuLieuDemo {
  if (typeof du !== 'object' || du === null) return false
  const mau = duLieuBanDau() as unknown as Record<string, unknown>
  const co = du as Record<string, unknown>
  return Object.keys(mau).every((k) => k in co)
}

function luuLai(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const st = (globalThis as CoKho)[KHOA]
    if (st) localStorage.setItem(KHOA_LUU, JSON.stringify({ ...st, vai: vaiDangXem }))
  } catch {
    // Chế độ riêng tư hoặc hết chỗ. Demo vẫn chạy, chỉ là tải lại thì về mẫu.
  }
}

function doTuBoNho(): TrangThai | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(KHOA_LUU)
    if (!raw) return null
    const x = JSON.parse(raw) as TrangThai & { vai?: VaiDemo }
    if (!dungHinhDang(x.du) || !Array.isArray(x.events)) {
      localStorage.removeItem(KHOA_LUU)
      return null
    }
    if (x.vai) vaiDangXem = x.vai
    return { du: x.du, events: x.events }
  } catch {
    return null
  }
}

/*
 * Nạp bản đã lưu — gọi SAU khi trang đã gắn xong, không gọi lúc dựng.
 *
 * Trang tĩnh dựng sẵn bằng dữ liệu mẫu. Nếu lần vẽ đầu ở trình duyệt đã đọc localStorage
 * thì hai bên lệch nhau và React kêu hydrat hoá sai. Nạp trong effect thì lần vẽ đầu khớp,
 * rồi mới đổi sang bản của người xem.
 */
export function napTuBoNho(): void {
  // Dọn bản lưu của khoá cũ: nó không còn ai đọc, và để lại thì chiếm chỗ của người dùng.
  try {
    localStorage?.removeItem('oblue-demo-v1')
  } catch {
    // Không đọc được localStorage thì cũng chẳng có gì để dọn.
  }

  const cu = doTuBoNho()
  if (!cu) return
  const g = globalThis as CoKho
  g[KHOA] = cu
  bao()
}

export function vaiHienTai(): VaiDemo {
  return vaiDangXem
}

export function doiVai(v: VaiDemo): void {
  vaiDangXem = v
  luuLai()
  bao()
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
    id: maMoi('ev'),
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

  const ket = thayDoi(st.du)
  luuLai()
  bao()
  return ket
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

/**
 * Máy chấm một bài TRẮC NGHIỆM. **Lớp 3 — nháp, cô chốt.**
 *
 * So đáp án em chọn với đáp án của BÀI GIAO (ảnh chụp lúc giao), không với đề trong ngân
 * hàng: cô sửa đáp án hôm nay thì bài em làm tuần trước không được đổi đề bài — đúng thứ
 * migration 0007 sinh ra để chặn.
 *
 * Câu đề CHƯA CÓ đáp án thì máy không đoán: nó ghi vào `cauCanCo` và KHÔNG tính là sai.
 * Tính là sai thì em bị trừ điểm vì đề thiếu đáp án, và không ai phát hiện — điểm vẫn trông
 * hợp lý. Luật của cô ghi đúng thế: "câu chữ mờ vẫn hỏi cô".
 */
export function mayChamTracNghiem(baiNopId: string): void {
  const du = duLieu()
  const bn = du.baiNop.find((b) => b.id === baiNopId)
  if (!bn) throw new Error('Không có bài nộp này')
  const bg = du.baiGiao.find((g) => g.id === bn.baiGiaoId)
  if (!bg) throw new Error('Không có bài giao này')

  // Cùng hàm thuần mà dữ liệu mẫu dùng — xem `chamTracNghiem` trong du-lieu.ts.
  const de = du.de.find((d) => d.id === bg.deId)
  const k = chamTracNghiem(bg.cauHoi, bn.traLoi ?? {}, de?.tinCayOcr ?? 0.95)
  const { dung, tong, cauCanCo, tinCay } = k

  ghi(
    actorMay(bg.lopId),
    'review.draft',
    { type: 'review', tenantId: du.tenant.id, classId: bg.lopId, ownerId: bn.hocVienId },
    { bai_nop: baiNopId, dung, tong, tin_cay: tinCay, cau_can_co: cauCanCo },
    [du.vai.owner],
    (d) => {
      const moi = {
        id: `ntn-${baiNopId}`,
        baiNopId,
        hetHan: new Date(Date.now() + 14 * 864e5).toISOString(),
        ...k,
      }
      const cu = d.nhapTracNghiem.findIndex((n) => n.baiNopId === baiNopId)
      if (cu >= 0) d.nhapTracNghiem[cu] = moi
      else d.nhapTracNghiem.push(moi)
    },
  )
}

/** Máy chấm cả lô. Chạy lại được: mỗi bài ghi đè nháp cũ, không sinh dòng thứ hai. */
export function mayChamCaLoTracNghiem(baiGiaoId: string): number {
  const du = duLieu()
  const nop = du.baiNop.filter((b) => b.baiGiaoId === baiGiaoId && b.nopLuc !== null)
  for (const b of nop) mayChamTracNghiem(b.id)
  return nop.length
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
        id: maMoi(`nx-${baiNopId}`),
        baiNopId,
        band,
        noiDung: nhap.nhanXet,
        guiLuc: new Date().toISOString(),
        suaTuNhap: nhap.nhanXet !== nhapGoc?.nhanXet,
        // Đóng băng lỗi vào lớp 1. Nháp bị xoá ngay dưới đây — không sao chép thì em mở
        // nhận xét ra chỉ thấy một đoạn văn, không thấy chỗ nào trong bài cần sửa.
        co: nhap.co,
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
        id: maMoi('bd'),
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

/** Bài giao đã có hiệu lực. Đề xuất của trợ giảng chưa tính — em không thấy, hạn chưa chạy. */
export function dangChay(bg: import('./du-lieu').BaiGiao): boolean {
  return (bg.trangThai ?? 'dang_chay') === 'dang_chay'
}

function batDauNgay(iso: string): string {
  return new Date(iso).toISOString()
}

/**
 * Bước 1 của vòng vận hành: giao một buổi trong lộ trình cho lớp.
 *
 * Cô hỏi `assignment.create` → bài chạy ngay. Trợ giảng hỏi `assignment.propose` → bài nằm
 * ở trạng thái `de_xuat`, chờ cô. Không có nhánh `if vai === 'assistant'` nào ở đây: hai
 * động từ khác nhau vì `permissions.json` cho hai vai hai mức khác nhau, và `can()` là chỗ
 * duy nhất biết điều đó.
 *
 * Đề đi theo lộ trình chứ không nhân bản — CLAUDE.md: "đề thuộc ngân hàng của cô, chỉ khi
 * GIAO mới gắn vào lớp". Nhưng câu hỏi thì chụp lại tại thời điểm giao (migration 0007):
 * cô sửa đề tuần sau không được đổi đề bài em đang làm dở.
 */
export function giaoBai(
  vai: VaiDemo,
  y: { loTrinhId: string; buoiNo: number; lopId: string; hanNop: string; trongSo: number },
): string {
  const du = duLieu()
  const lt = du.loTrinh.find((l) => l.id === y.loTrinhId)
  const buoi = lt?.buoi.find((b) => b.no === y.buoiNo)
  if (!buoi?.deId) throw new Error('Buổi này chưa gắn đề')

  const de = du.de.find((d) => d.id === buoi.deId)
  if (!de) throw new Error('Không tìm thấy đề của buổi này')

  const actor = actorCuaVai(vai)
  const laCo = vai === 'owner'
  const id = maMoi('bg-giao')

  /*
   * Giao lại cùng một buổi cho cùng một lớp là việc CÓ THẬT — cả lớp làm tệ thì cô cho làm
   * lại. Nên không chặn; nhưng phải đánh số lần.
   *
   * Không đánh số thì em mở app ra thấy hai dòng "Nộp Mock 2" giống hệt nhau và không biết
   * nộp cái nào. Bảng điểm cũng có hai cột cùng tên. `lanThu` đã có sẵn trong mô hình từ
   * đầu cho đúng việc này.
   */
  const lanTruoc = du.baiGiao.filter(
    (g) => g.lopId === y.lopId && g.tuBuoi?.loTrinhId === y.loTrinhId && g.tuBuoi.no === y.buoiNo,
  ).length
  const lanThu = lanTruoc + 1
  const nhan = buoi.baiVeNha ?? de.ten

  ghi(
    actor,
    laCo ? 'assignment.create' : 'assignment.propose',
    { type: 'assignment', id, tenantId: du.tenant.id, classId: y.lopId, ownerId: actor.accountId },
    { de: de.id, buoi: y.buoiNo, han: y.hanNop, trong_so: y.trongSo, lan_thu: lanThu },
    // Đề xuất thì chỉ cô thấy. Bài đã chạy thì cả lớp thấy — đó là điểm khác nhau duy nhất
    // giữa hai nhánh, và nó nằm ở đây chứ không rải trong giao diện.
    laCo
      ? [du.vai.owner, ...(du.lop.find((l) => l.id === y.lopId)?.hocVienIds ?? [])]
      : [du.vai.owner, actor.accountId],
    (d) => {
      d.baiGiao.push({
        id,
        lopId: y.lopId,
        deId: de.id,
        hanNop: batDauNgay(y.hanNop),
        lanThu,
        nhan: lanThu > 1 ? `${nhan} (lần ${lanThu})` : nhan,
        trongSo: y.trongSo,
        trangThai: laCo ? 'dang_chay' : 'de_xuat',
        ...(laCo ? {} : { deXuatBoi: actor.accountId }),
        tuBuoi: { loTrinhId: y.loTrinhId, no: y.buoiNo },
        // Chụp lại, không trỏ về đề (migration 0007). Trỏ về thì cô sửa đề tuần sau là đổi
        // luôn đề bài em đang làm dở.
        cauHoi: structuredClone(de.cauHoi),
      })
    },
  )

  if (laCo) mayDangBaiGiao(id)
  return id
}

/** Cô duyệt bài trợ giảng đã soạn. Từ đây mới có hiệu lực với em. */
export function duyetBaiGiao(vai: VaiDemo, baiGiaoId: string): void {
  const du = duLieu()
  const bg = du.baiGiao.find((g) => g.id === baiGiaoId)
  if (!bg || dangChay(bg)) return

  ghi(
    actorCuaVai(vai),
    'assignment.create',
    { type: 'assignment', id: baiGiaoId, tenantId: du.tenant.id, classId: bg.lopId },
    { duyet_de_xuat_cua: bg.deXuatBoi ?? null },
    [du.vai.owner, ...(du.lop.find((l) => l.id === bg.lopId)?.hocVienIds ?? [])],
    (d) => {
      const m = d.baiGiao.find((g) => g.id === baiGiaoId)
      if (m) m.trangThai = 'dang_chay'
    },
  )

  mayDangBaiGiao(baiGiaoId)
}

/**
 * Bước 2: máy đăng bài giao lên bảng tin lớp.
 *
 * `post` của vai `system` là mức `auto`, nên máy ĐƯỢC đăng thẳng — khác hẳn nhận xét, chỗ
 * máy chỉ nháp. Ranh giới không phải "máy không được làm gì", mà là: máy không phát ra
 * phán xét về một đứa trẻ; thông báo một việc cô vừa quyết thì được.
 *
 * Việc nhắc trước hạn phụ thuộc công tắc `nhac-nop`. Tắt thì máy chỉ đăng, không nhắc —
 * và nói thẳng điều đó trong bài đăng, để cô không tưởng em đã được nhắc.
 */
function mayDangBaiGiao(baiGiaoId: string): void {
  const du = duLieu()
  const bg = du.baiGiao.find((g) => g.id === baiGiaoId)
  if (!bg) return

  const lop = du.lop.find((l) => l.id === bg.lopId)
  const nhac = du.luat.find((l) => l.id === 'nhac-nop')?.bat ?? false
  const coTaiKhoan = (lop?.hocVienIds ?? []).filter(
    (id) => du.hoSo.find((h) => h.id === id)?.coTaiKhoan,
  ).length

  const han = new Date(bg.hanNop)
  const khi = `${han.getDate()}/${han.getMonth() + 1} lúc ${String(han.getHours()).padStart(2, '0')}:${String(han.getMinutes()).padStart(2, '0')}`

  ghi(
    actorMay(bg.lopId),
    'post.auto:assign',
    { type: 'post', tenantId: du.tenant.id, classId: bg.lopId },
    { bai_giao: baiGiaoId, nhac },
    [du.vai.owner, ...(lop?.hocVienIds ?? [])],
    (d) => {
      d.baiDang.unshift({
        id: maMoi('bd-auto'),
        lopId: bg.lopId,
        tacGiaId: null,
        loai: 'system',
        noiDung: nhac
          ? `Bài mới: ${bg.nhan} — hạn ${khi}. ${coTaiKhoan} em đã bật tài khoản sẽ được nhắc trước 24 giờ và 2 giờ.`
          : `Bài mới: ${bg.nhan} — hạn ${khi}. Cô đang tắt nhắc tự động, nên các em tự nhớ hạn giúp cô.`,
        luc: new Date().toISOString(),
      })
    },
  )
}

/**
 * Cô duyệt nhãn máy đề xuất cho một đề.
 *
 * Nhãn là lớp 3: máy ghi, có hạn, cô quyết. Duyệt xong nó thành lớp 1 — và từ đó đề tìm
 * được bằng nhãn. Đây là cả giá trị của việc số hoá: không phải "có tệp", mà là "tìm ra".
 */
export function duyetNhanDe(vai: VaiDemo, deId: string): void {
  const du = duLieu()
  const de = du.de.find((d) => d.id === deId)
  if (!de || de.trangThaiNhan === 'da_duyet') return

  ghi(
    actorCuaVai(vai),
    'exam.update',
    { type: 'exam', id: deId, tenantId: du.tenant.id },
    { duyet_nhan: de.nhanDeXuat ?? [] },
    [du.vai.owner],
    (d) => {
      const m = d.de.find((x) => x.id === deId)
      if (m) m.trangThaiNhan = 'da_duyet'
    },
  )
}

/**
 * Cô chọn đáp án cho một câu trong lúc duyệt đề số hoá.
 *
 * Đúng logic `app.save_exam_edit` ở migration 0013: có đáp án thì cảnh báo TỰ MẤT. Không
 * tự xoá thì danh sách "cần xem lại" không bao giờ rỗng, cô thôi đọc nó, và cái cờ mất
 * nghĩa. Bỏ đáp án thì cảnh báo quay lại — câu đó chuyển sang chấm tay.
 */
export function datDapAn(vai: VaiDemo, deId: string, cauNo: number, dapAn: string | null): void {
  const du = duLieu()
  const de = du.de.find((d) => d.id === deId)
  if (!de) return

  ghi(
    actorCuaVai(vai),
    'exam.update',
    { type: 'exam', id: deId, tenantId: du.tenant.id },
    { cau: cauNo, dap_an: dapAn },
    [du.vai.owner],
    (d) => {
      const c = d.de.find((x) => x.id === deId)?.cauHoi.find((q) => q.no === cauNo)
      if (!c) return
      c.dapAn = dapAn
      c.canhBao = dapAn
        ? null
        : 'Chưa có đáp án — câu này chấm tay cho tới khi cô điền.'
    },
  )
}

/** Đề vừa số hoá xong, cô bấm Lưu ở bước 4. */
export function luuDeSoHoa(
  vai: VaiDemo,
  de: Omit<import('./du-lieu').De, 'id'>,
): string {
  const du = duLieu()
  const id = maMoi('de')

  ghi(
    actorCuaVai(vai),
    'exam.create',
    { type: 'exam', id, tenantId: du.tenant.id },
    { ten: de.ten, so_cau: de.cauHoi.length, tin_cay: de.tinCayOcr ?? null },
    [du.vai.owner],
    (d) => {
      d.de.unshift({ ...de, id })
    },
  )
  return id
}

/**
 * Cô lưu ghi chú riêng về một em.
 *
 * `visibility` chỉ có cô, và đó không phải phép lịch sự: ghi chú kiểu "nhà xa, hay đến muộn
 * — không phải lười" chỉ có giá trị khi cô chắc chắn không ai khác đọc. Trợ giảng bị chặn ở
 * MỨC (`profile` của trợ giảng là `read`, không sửa được); còn việc trợ giảng không ĐỌC được
 * nội dung thì `hoSoDayDu` lo, ở lớp đọc dữ liệu chứ không ở giao diện.
 */
export function luuGhiChu(vai: VaiDemo, hocVienId: string, ghiChu: string): void {
  const du = duLieu()
  const lop = du.lop.find((l) => l.hocVienIds.includes(hocVienId))

  ghi(
    actorCuaVai(vai),
    'profile.update',
    {
      type: 'profile',
      id: hocVienId,
      tenantId: du.tenant.id,
      classId: lop?.id,
      ownerId: hocVienId,
    },
    // Không ghi NỘI DUNG ghi chú vào nhật ký: nhật ký cô cho trợ giảng xem được phần của họ,
    // và một payload đầy đủ là một đường rò. Ghi độ dài là đủ để truy "cô có sửa không".
    { ghi_chu_dai: ghiChu.length },
    [du.vai.owner],
    (d) => {
      const h = d.hoSo.find((x) => x.id === hocVienId)
      if (h) h.ghiChu = ghiChu
    },
  )
}

/**
 * Cô — hoặc trợ giảng — điểm danh một buổi. **Lớp 1: chỉ thêm.**
 *
 * Đây là chỗ mức `auto` của trợ giảng có nghĩa thật: `attendance.assistant` là `auto` nên
 * trợ giảng ghi THẲNG, không phải đề xuất rồi chờ cô duyệt. Bản mẫu ghi đúng thế trong lời
 * mời trợ giảng ("nháp nhận xét, bảng tin, điểm danh"), và đó là việc phải làm ngay trong
 * phòng — bắt nó chờ cô duyệt thì đến mai cô duyệt một buổi học đã tan.
 *
 * Máy KHÔNG gọi được hàm này: `attendance.system` là `none`, nên `can()` chặn ở cửa 6.
 *
 * Chỉ nhận danh sách VẮNG. Ai đang học lớp mà không có tên trong đó thì có mặt — vì trong
 * phòng cô chỉ gọi tên người thiếu, và bắt cô tích mười bảy cái để ghi một người vắng là
 * bắt cô làm việc cho máy.
 */
export function ghiDiemDanh(
  vai: VaiDemo,
  y: { lopId: string; buoiNo: number; vang: { hocVienId: string; phep: boolean }[] },
): void {
  const du = duLieu()
  const lop = du.lop.find((l) => l.id === y.lopId)
  if (!lop) throw new Error('Không có lớp này')

  // Vắng phải là em CỦA LỚP. Không lọc thì một id gõ sai vào thẳng bảng sự thật, và bảng
  // sự thật thì chỉ thêm — không có đường sửa lại cho sạch.
  const vang = y.vang.filter((v) => lop.hocVienIds.includes(v.hocVienId))
  const coMat = lop.hocVienIds.filter((id) => !vang.some((v) => v.hocVienId === id))

  const actor = actorCuaVai(vai)

  ghi(
    actor,
    'attendance.create',
    { type: 'attendance', tenantId: du.tenant.id, classId: y.lopId },
    /*
     * Payload ghi ĐỦ TÊN em vắng — khác `profile.update` ở trên, chỗ đó chỉ ghi độ dài.
     *
     * Ở đây "ai vắng" CHÍNH LÀ sự thật cần truy lại, không phải nội dung riêng tư của cô.
     * Đường rò được bịt bằng `visibility` thay vì bằng cách ghi thiếu: danh sách chỉ có cô
     * và người điểm danh, và `events.student` là mức `own` nên em không mở được dòng không
     * mang tên chủ — mà dòng này không mang tên chủ nào.
     */
    {
      buoi_no: y.buoiNo,
      co_mat: coMat.length,
      vang: vang.map((v) => ({ hoc_vien_id: v.hocVienId, phep: v.phep })),
    },
    [du.vai.owner, actor.accountId],
    /*
     * Điểm danh lại một buổi đã ghi = SỬA TẠI CHỖ, không thêm dòng thứ hai.
     *
     * Thoạt nhìn thì trái với ARCHITECTURE §3 ("attendance: chỉ thêm") — và đúng là §3
     * nói thế. Nhưng bảng thật ở migration 0004 có
     * `unique (class_id, session_no, student_id)`, nên dòng thứ hai cho cùng một buổi BỊ
     * CHẶN ở tầng CSDL. Bản demo thêm dòng thì chạy êm ở đây rồi đổ ngay hôm nối Supabase.
     *
     * Ràng buộc ấy đang chặn một lỗi thật: điểm danh hai lần một buổi thì mọi con số
     * "đi học đều" đếm buổi đó hai lần. Nên giữ ràng buộc, và để `events` giữ lịch sử —
     * chỗ đó có trigger chặn cả UPDATE lẫn DELETE (0001), chắc hơn một bảng không có gì
     * ép. Mỗi lần cô đổi ý vẫn còn nguyên một dòng nhật ký với giá trị cũ.
     *
     * Đã ghi thành LOGIC §8 câu 9. Đổi ý thì sửa ARCHITECTURE §3 và migration 0014.
     */
    (d) => {
      const cu = d.diemDanh.find((x) => x.lopId === y.lopId && x.buoiNo === y.buoiNo)
      if (cu) {
        cu.luc = new Date().toISOString()
        cu.ghiBoi = actor.accountId
        cu.coMat = coMat
        cu.vang = vang
        return
      }
      d.diemDanh.push({
        id: maMoi(`dd-${y.lopId}-${y.buoiNo}`),
        lopId: y.lopId,
        buoiNo: y.buoiNo,
        luc: new Date().toISOString(),
        ghiBoi: actor.accountId,
        coMat,
        vang,
      })
    },
  )
}

/**
 * Buổi điểm danh của một lớp, MỚI NHẤT TRƯỚC.
 *
 * Vẫn gom theo `buoiNo` dù `ghiDiemDanh` đã sửa tại chỗ: chỗ này là chỗ duy nhất mọi câu
 * đếm đi qua, nên nó là chỗ rẻ nhất để giữ bất biến "một buổi đếm một lần" — kể cả khi một
 * bản lưu cũ, hay một lần nhập dữ liệu tay, để lại hai dòng cùng buổi.
 */
function buoiDaDiemDanh(lopId: string): import('./du-lieu').DiemDanh[] {
  const theoBuoi = new Map<number, import('./du-lieu').DiemDanh>()
  for (const d of duLieu().diemDanh) {
    if (d.lopId === lopId) theoBuoi.set(d.buoiNo, d)
  }
  return [...theoBuoi.values()].sort((a, b) => b.buoiNo - a.buoiNo)
}

/**
 * Em đi được bao nhiêu buổi trên bao nhiêu buổi CỦA EM. **Lớp 2 — tính lại được.**
 *
 * Mẫu số là số buổi em có trong bảng, không phải số buổi lớp đã dạy: em vào lớp từ buổi 18
 * thì mười bảy buổi trước đó không phải buổi em nghỉ. Trước đây con số này là chuỗi
 * `diHoc: '28/30'` nằm sẵn trong hồ sơ — không có gì đỡ, và không ai phát hiện khi nó lệch
 * với thẻ lớp.
 */
export function diHocCuaEm(hocVienId: string): { coMat: number; tong: number } {
  const du = duLieu()
  let coMat = 0
  let tong = 0

  for (const l of du.lop) {
    if (!l.hocVienIds.includes(hocVienId)) continue
    const x = diHocTrongLop(l.id, hocVienId)
    coMat += x.coMat
    tong += x.tong
  }
  return { coMat, tong }
}

/**
 * Đi học của em TRONG MỘT LỚP.
 *
 * Phải có bản theo lớp riêng, không dùng `diHocCuaEm` cho thẻ lớp được: hai em lớp 7.0+ vẫn
 * đang học lớp 6.5, nên cộng xuyên lớp làm thẻ "IELTS 7.0+ · nhóm 6" — lớp CHƯA dạy buổi
 * nào — hiện "Đi học đều 100%". Con số mượn từ lớp khác, và nó trông hợp lý nên không ai
 * soi lại.
 */
export function diHocTrongLop(
  lopId: string,
  hocVienId: string,
): { coMat: number; tong: number } {
  let coMat = 0
  let tong = 0

  for (const d of buoiDaDiemDanh(lopId)) {
    if (d.coMat.includes(hocVienId)) {
      coMat += 1
      tong += 1
    } else if (d.vang.some((v) => v.hocVienId === hocVienId)) {
      tong += 1
    }
  }
  return { coMat, tong }
}

/**
 * Em vắng mấy buổi LIÊN TIẾP tính từ buổi gần nhất. **Lớp 2.**
 *
 * Bản mẫu: "Vắng 2 buổi liên tiếp → tự vào Cần chú ý". Liên tiếp chứ không phải tổng —
 * em vắng tám buổi rải đều cả khoá là em hay có việc; em vắng hai buổi cuối là em đang rời
 * lớp, và hai chuyện đó cô xử lý khác nhau.
 */
export function vangLienTiep(hocVienId: string): number {
  const du = duLieu()
  const l = du.lop.find((x) => x.hocVienIds.includes(hocVienId))
  if (!l) return 0

  let dem = 0
  for (const d of buoiDaDiemDanh(l.id)) {
    if (d.vang.some((v) => v.hocVienId === hocVienId)) dem += 1
    else if (d.coMat.includes(hocVienId)) break
    // Em chưa vào lớp ở buổi này: không tính, cũng không cắt chuỗi.
  }
  return dem
}

/**
 * Vai này điểm danh được lớp này không?
 *
 * Một hàm cho giao diện hỏi, để KHÔNG màn nào viết `vai === 'owner' || vai === 'assistant'`.
 * Viết thế là component tự kiểm quyền — CLAUDE.md cấm, và lý do rất cụ thể: hôm nào cô hạ
 * `attendance` của trợ giảng xuống `read`, cái `if` kia vẫn mở nút, và trợ giảng bấm vào
 * mới biết là không được.
 */
export function duocDiemDanh(vai: VaiDemo, lopId: string): boolean {
  return can(actorCuaVai(vai), 'attendance.create', {
    type: 'attendance',
    tenantId: duLieu().tenant.id,
    classId: lopId,
  })
}

/** Buổi tiếp theo phải điểm danh. Chưa dạy buổi nào thì là buổi 1. */
export function buoiKeTiep(lopId: string): number {
  const da = buoiDaDiemDanh(lopId)
  return (da[0]?.buoiNo ?? 0) + 1
}

/** Em vắng buổi vừa rồi — ngăn điểm danh nhắc cô để cô để mắt, chứ không tự bỏ tích. */
export function vangBuoiTruoc(lopId: string): string[] {
  const da = buoiDaDiemDanh(lopId)
  return (da[0]?.vang ?? []).map((v) => v.hocVienId)
}

/**
 * Bật/tắt một luật của cô.
 *
 * Hỏi `rubric.update`: "máy được tự làm gì" là một phần của cách cô chấm, và `rubric` là
 * trần cứng của trợ giảng — nên trợ giảng bị chặn ở cửa 5, trước cả khi xét mức quyền cô cấp.
 * Luật `khoa` thì không hàm nào chạm được: nó không phải công tắc, nó là luật nền tảng.
 */
export function datLuat(vai: VaiDemo, id: string, bat: boolean): void {
  const du = duLieu()
  const l = du.luat.find((x) => x.id === id)
  if (!l || l.khoa) return

  ghi(
    actorCuaVai(vai),
    'rubric.update',
    { type: 'rubric', tenantId: du.tenant.id },
    { luat: id, bat },
    [du.vai.owner],
    (d) => {
      const m = d.luat.find((x) => x.id === id)
      if (m) m.bat = bat
    },
  )
}

/**
 * Em làm xong một bài luyện.
 *
 * `practice_set` mức `own` cho vai học viên, nên `can()` chặn ngay nếu bài luyện là của bạn
 * khác — cửa 7 so `ownerId` với người đang làm. Kết quả về hồ sơ của em, và cô thấy;
 * bạn cùng lớp thì không, nên `visibility` chỉ có hai người.
 */
export function lamBaiLuyen(hocVienId: string, baiLuyenId: string, dung: number): void {
  const du = duLieu()
  const bl = du.baiLuyen.find((b) => b.id === baiLuyenId)
  if (!bl) return

  const actor: Actor = {
    accountId: hocVienId,
    tenantId: du.tenant.id,
    role: 'student',
    classIds: [bl.lopId],
  }

  ghi(
    actor,
    'practice_set.update',
    {
      type: 'practice_set',
      id: baiLuyenId,
      tenantId: du.tenant.id,
      classId: bl.lopId,
      ownerId: bl.hocVienId,
    },
    { dung, tong: bl.cau.length },
    [du.vai.owner, hocVienId],
    (d) => {
      const m = d.baiLuyen.find((b) => b.id === baiLuyenId)
      if (m) m.ketQua = { dung, luc: new Date().toISOString() }
    },
  )
}

/**
 * Hồ sơ một em, cắt theo vai đang đọc.
 *
 * `ghiChu` bị cắt cho MỌI vai trừ cô, và cắt ở đây — lớp đọc dữ liệu — chứ không ở giao
 * diện. Cắt ở giao diện thì dữ liệu vẫn đi tới trình duyệt của trợ giảng và chỉ là không
 * vẽ ra; ai mở công cụ nhà phát triển cũng đọc được. `teacher_notes` trong
 * `assistant_hard_ceiling` nói "không đọc được", không nói "không hiện ra".
 */
export function hoSoDayDu(vai: VaiDemo, hocVienId: string) {
  const du = duLieu()
  const h = du.hoSo.find((x) => x.id === hocVienId)
  if (!h) return null

  const lop = du.lop.find((l) => l.hocVienIds.includes(hocVienId))
  const actor = actorCuaVai(vai)
  const doc = can(actor, 'profile.view', {
    type: 'profile',
    tenantId: du.tenant.id,
    classId: lop?.id,
    ownerId: hocVienId,
  })
  if (!doc) return null

  const tk = du.taiKhoan.find((t) => t.id === hocVienId)

  /* Bài gần đây: mới nhất trước. `band: null` nghĩa là ĐANG CHỜ CÔ, không phải thiếu dữ
     liệu — và đó là dòng cô cần thấy nhất khi mở hồ sơ một em. */
  const baiGanDay = du.baiNop
    .filter((b) => b.hocVienId === hocVienId)
    .map((b) => {
      const bg = du.baiGiao.find((g) => g.id === b.baiGiaoId)
      const nx = du.nhanXet.find((n) => n.baiNopId === b.id)
      return {
        nhan: bg?.nhan ?? 'Bài tập',
        band: nx?.band ?? null,
        luc: b.nopLuc ?? '',
      }
    })
    .sort((a, b) => b.luc.localeCompare(a.luc))
    .slice(0, 6)

  /*
   * Điểm danh hỏi quyền RIÊNG, không đi ké `profile.view`.
   *
   * Hai object khác nhau trong permissions.json thì hai lần hỏi. Đi ké thì hôm nào cô hạ
   * `attendance` của trợ giảng xuống `none`, ngăn hồ sơ vẫn hiện số buổi vắng — vì nó chưa
   * từng hỏi về `attendance`. Trợ giảng hiện là `auto` nên vẫn thấy; cái được giữ là chỗ
   * hỏi, không phải kết quả hôm nay.
   */
  const xemDiemDanh = can(actor, 'attendance.view', {
    type: 'attendance',
    tenantId: du.tenant.id,
    classId: lop?.id,
    ownerId: hocVienId,
  })

  const { ghiChu, ...conLai } = h
  return {
    ...conLai,
    ten: tk?.ten ?? hocVienId,
    mau: tk?.mau ?? 'off',
    baiGanDay,
    ghiChu: vai === 'owner' ? (ghiChu ?? '') : null,
    diHoc: xemDiemDanh ? diHocCuaEm(hocVienId) : null,
    vangLienTiep: xemDiemDanh ? vangLienTiep(hocVienId) : null,
    lop: lop ?? null,
  }
}

/**
 * Cô điền ĐÁP ÁN CÒN THIẾU cho một câu của BÀI GIAO — không phải của đề trong ngân hàng.
 *
 * Chỗ này lộ ra khi dựng bảng chốt điểm, và nó chặn cả bước 4 của vòng vận hành: đề có một
 * câu máy không tìm ra đáp án, nên cả 18 bài đều "chờ cô". Cô điền đáp án vào NGÂN HÀNG ĐỀ
 * thì không giải quyết được — `propagate_exam_edit` (0007) bỏ qua mọi bài giao đã có người
 * nộp, và bỏ qua là ĐÚNG cho phần đề bài.
 *
 * Nhưng điền một đáp án CÒN THIẾU khác về bản chất với sửa đề bài:
 *
 * - Sửa `de` / `luaChon` là đổi thứ em ĐÃ ĐỌC. Không được, kể cả cô. Đó là 0007.
 * - Điền `dapAn` đang rỗng là đổi thứ em CHƯA BAO GIỜ THẤY. Em không nhìn đáp án; nó chỉ
 *   dùng để chấm. Không cho điền thì cô phải chấm tay 18 lần cho một câu.
 *
 * Nên hàm này hẹp đúng bằng thế, và ba giới hạn dưới đây là lý do nó an toàn:
 *   1. Chỉ khi đáp án đang rỗng. KHÔNG ghi đè đáp án đã có — đó mới là đổi cách chấm bài
 *      đã chấm, và cô muốn thế thì phải chấm lại từng bài, không phải lặng lẽ đổi một ô.
 *   2. Chỉ chạm `dapAn` và `canhBao`. `de` và `luaChon` không đổi.
 *   3. Chấm lại ngay cả lô, để điểm và bảng khớp nhau trong cùng một hành động.
 *
 * Đã ghi thành LOGIC §8 câu 11 — bản thật cần migration 0015 mở đúng cửa hẹp này.
 */
export function dienDapAnThieu(
  vai: VaiDemo,
  baiGiaoId: string,
  cauNo: number,
  dapAn: string,
): void {
  const du = duLieu()
  const bg = du.baiGiao.find((g) => g.id === baiGiaoId)
  if (!bg) throw new Error('Không có bài giao này')

  const c = bg.cauHoi.find((x) => x.no === cauNo)
  if (!c) throw new Error(`Bài giao không có câu ${cauNo}`)
  if (c.dapAn) throw new Error('Câu này đã có đáp án. Ghi đè là đổi cách chấm bài đã chấm.')
  if (!dapAn.trim()) throw new Error('Đáp án không được rỗng')
  if (c.luaChon && !c.luaChon.includes(dapAn)) {
    throw new Error('Đáp án phải là một trong các lựa chọn của câu đó')
  }

  ghi(
    actorCuaVai(vai),
    'assignment.update',
    { type: 'assignment', id: baiGiaoId, tenantId: du.tenant.id, classId: bg.lopId },
    { cau_no: cauNo, dap_an: dapAn },
    [du.vai.owner],
    (d) => {
      const g = d.baiGiao.find((x) => x.id === baiGiaoId)!
      const cau = g.cauHoi.find((x) => x.no === cauNo)!
      cau.dapAn = dapAn
      cau.canhBao = null
    },
  )

  // Chấm lại cả lô NGAY, trong cùng một hành động của cô. Để cô phải bấm thêm một nút
  // "chấm lại" là mở đường cho trạng thái nửa vời: đáp án đã có mà điểm vẫn là điểm cũ.
  mayChamCaLoTracNghiem(baiGiaoId)
}

/** Dưới mức này thì cô nên xem, dù máy chấm chắc chắn. Bản mẫu gắn cờ bài 24/40 = 60%. */
const NGUONG_CAN_CHU_Y = 0.7

/** Tin cậy tối thiểu để vào lô chốt — luật `chot-mcq` của cô. */
const NGUONG_TIN_CAY = 0.97

/** Công tắc của cô. Tắt thì không có lô nào — cô duyệt từng bài. */
const batChotMcq = (): boolean =>
  duLieu().luat.find((l) => l.id === 'chot-mcq')?.bat ?? false

export interface DongTracNghiem {
  baiNopId: string
  hocVien: { id: string; ten: string; mau: string }
  dung: number
  tong: number
  tinCay: number
  /** Câu sai, đã gom theo chủ đề: "Câu 3, 11, 16 — bị động". */
  saiODau: string
  trangThai: 'san_sang' | 'xem_lai_cau' | 'can_chu_y' | 'da_chot'
  cauCanCo: number[]
}

/**
 * Những bài giao trắc nghiệm còn bài chưa chốt — nguồn cho đường "Trắc nghiệm" ở màn Chấm bài.
 *
 * Lọc theo NHÁP còn tồn, không theo `cachCham` của đề: đề trắc nghiệm mà cả lớp đã chốt điểm
 * thì không còn việc gì, và để nó nằm đó là để một con số 0 trên đường dẫn.
 */
export function baiTracNghiemCanChot(
  vai: VaiDemo,
): { baiGiaoId: string; lopId: string; lopTen: string; chuaChot: number }[] {
  const du = duLieu()
  const actor = actorCuaVai(vai)
  const theoBai = new Map<string, number>()

  for (const n of du.nhapTracNghiem) {
    const bn = du.baiNop.find((b) => b.id === n.baiNopId)
    const bg = bn && du.baiGiao.find((g) => g.id === bn.baiGiaoId)
    if (!bn || !bg) continue
    if (
      !can(actor, 'draft.view', {
        type: 'draft',
        tenantId: du.tenant.id,
        classId: bg.lopId,
        ownerId: bn.hocVienId,
      })
    ) {
      continue
    }
    theoBai.set(bg.id, (theoBai.get(bg.id) ?? 0) + 1)
  }

  return [...theoBai.entries()].map(([baiGiaoId, chuaChot]) => {
    const bg = du.baiGiao.find((g) => g.id === baiGiaoId)!
    return {
      baiGiaoId,
      lopId: bg.lopId,
      lopTen: du.lop.find((l) => l.id === bg.lopId)?.ten ?? '',
      chuaChot,
    }
  })
}

/**
 * Bảng chốt điểm trắc nghiệm của một bài giao — `#q2` của bản mẫu.
 *
 * Ba trạng thái, và cả ba đều nói CÔ NÊN LÀM GÌ, không nói con số:
 * - `san_sang`   máy chắc, điểm ổn → nằm trong lô chốt một lần
 * - `xem_lai_cau` đề thiếu đáp án ở câu nào đó → cô điền đáp án trước
 * - `can_chu_y`  máy chắc nhưng em làm kém → cô nên xem trước khi gửi
 *
 * Hai trạng thái cam KHÔNG nằm trong lô chốt. Bản mẫu cũng vậy: nút ghi "Chốt 8 & mở 2".
 */
export function soLieuTracNghiem(
  vai: VaiDemo,
  baiGiaoId: string,
): { dong: DongTracNghiem[]; tinCayTb: number | null; chotDuoc: number; cho: number } | null {
  const du = duLieu()
  const bg = du.baiGiao.find((g) => g.id === baiGiaoId)
  if (!bg) return null

  const actor = actorCuaVai(vai)
  const dong: DongTracNghiem[] = []

  for (const bn of du.baiNop.filter((b) => b.baiGiaoId === baiGiaoId && b.nopLuc !== null)) {
    /* Hỏi `draft.view` như `baiCanCham`: nháp là lớp 3, em không bao giờ thấy. Hỏi
       `submission.view` thì em mở được cả bảng điểm của lớp — đúng thứ luật cứng cấm. */
    if (
      !can(actor, 'draft.view', {
        type: 'draft',
        tenantId: du.tenant.id,
        classId: bg.lopId,
        ownerId: bn.hocVienId,
      })
    ) {
      continue
    }

    const daGui = du.nhanXet.some((x) => x.baiNopId === bn.id)
    const tk = du.taiKhoan.find((t) => t.id === bn.hocVienId)
    if (!tk) continue

    /*
     * Bài đã chốt thì nháp bị xoá (nháp là lớp 3, hết vai thì đi), nên phải TÍNH LẠI để dòng
     * còn đứng đó với nhãn "Đã chốt".
     *
     * Bỏ qua bài đã chốt thì bấm "Chốt 17" xong bảng rụng 17 trong 18 dòng ngay trước mắt cô
     * — trông như vừa xoá mất bài của cả lớp. Tính lại được vì `chamTracNghiem` là hàm thuần
     * trên ảnh chụp câu hỏi của bài giao: cùng đầu vào, cùng đầu ra, không cần lưu thêm gì.
     */
    const de = du.de.find((d) => d.id === bg.deId)
    const n =
      du.nhapTracNghiem.find((x) => x.baiNopId === bn.id) ??
      (daGui
        ? chamTracNghiem(bg.cauHoi, bn.traLoi ?? {}, de?.tinCayOcr ?? 0.95)
        : null)
    if (!n) continue

    /* Gom câu sai theo chủ đề. Cột này của bản mẫu đọc "Câu 3, 11, 16 — bị động": tên lỗi
       mới là thứ dạy cô điều gì, số câu thì không. */
    const theoChuDe = new Map<string, number[]>()
    for (const no of n.cauSai) {
      const cd = bg.cauHoi.find((c) => c.no === no)?.chuDeCau ?? 'khác'
      theoChuDe.set(cd, [...(theoChuDe.get(cd) ?? []), no])
    }
    const saiODau =
      n.cauSai.length === 0
        ? 'Không sai câu nào'
        : [...theoChuDe.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 2)
            .map(([cd, nos]) => `Câu ${nos.join(', ')} — ${cd.toLowerCase()}`)
            .join(' · ')

    dong.push({
      baiNopId: bn.id,
      hocVien: { id: tk.id, ten: tk.ten, mau: tk.mau },
      dung: n.dung,
      tong: n.tong,
      tinCay: n.tinCay,
      saiODau,
      cauCanCo: n.cauCanCo,
      trangThai: daGui
        ? 'da_chot'
        : /* Công tắc `chot-mcq` TẮT → không bài nào vào lô, cô xem từng bài.
             Đây là chỗ công tắc có nghĩa thật: nó không đổi con số nào, nó đổi việc cô phải
             làm. Không đọc công tắc ở đây thì nó thành đồ trang trí ở màn Cấu hình. */
          !batChotMcq()
          ? 'can_chu_y'
          : n.cauCanCo.length > 0 || n.tinCay < NGUONG_TIN_CAY
            ? 'xem_lai_cau'
            : n.tong > 0 && n.dung / n.tong < NGUONG_CAN_CHU_Y
              ? 'can_chu_y'
              : 'san_sang',
    })
  }

  dong.sort((a, b) => a.hocVien.ten.localeCompare(b.hocVien.ten, 'vi'))
  const chuaChot = dong.filter((d) => d.trangThai !== 'da_chot')

  return {
    dong,
    tinCayTb:
      chuaChot.length === 0
        ? null
        : Number(
            (chuaChot.reduce((t, d) => t + d.tinCay, 0) / chuaChot.length).toFixed(2),
          ),
    chotDuoc: dong.filter((d) => d.trangThai === 'san_sang').length,
    cho: dong.filter((d) => d.trangThai === 'xem_lai_cau' || d.trangThai === 'can_chu_y')
      .length,
  }
}

/**
 * Cô chốt điểm cả lớp — MỘT hành động, nhiều nhận xét.
 *
 * Chỉ chốt bài `san_sang`. Bài cam thì để nguyên, và đó là chỗ nút của bản mẫu nói thật:
 * "Chốt 8 & mở 2" — không phải "Chốt tất cả".
 *
 * Không có đường nào cho MÁY gọi hàm này: `review.send` nằm trong `send_actions_owner_only`
 * nên cả trợ giảng cũng bị chặn ở cửa 4 của `can()`. Bản mẫu vẽ cô bấm nút, và
 * `OPERATIONS.md` bước 4 ghi "🔵 Cô" — máy chấm xong, cô mới gửi.
 *
 * Mỗi bài một sự kiện `review.send`, không phải một sự kiện cho cả lô: em chỉ được nhìn
 * nhận xét của chính em, mà `visibility` thì gắn vào từng dòng sự kiện.
 */
export function chotTracNghiemCaLop(vai: VaiDemo, baiGiaoId: string): number {
  const so = soLieuTracNghiem(vai, baiGiaoId)
  if (!so) throw new Error('Không có bài giao này')

  let dem = 0
  for (const d of so.dong) {
    if (d.trangThai !== 'san_sang') continue
    chotMotBaiTracNghiem(vai, d.baiNopId)
    dem += 1
  }
  return dem
}

/**
 * Chốt MỘT bài trắc nghiệm. Cũng là đường cô dùng cho bài cam sau khi đã xem.
 *
 * Band quy từ tỉ lệ đúng sang thang 9 rồi làm tròn nửa bậc — cùng thang với bài tự luận, vì
 * bảng điểm của lớp trộn cả hai loại và một cột 0–9 cạnh một cột 0–20 thì không đọc được.
 */
export function chotMotBaiTracNghiem(vai: VaiDemo, baiNopId: string): void {
  const du = duLieu()
  const bn = du.baiNop.find((b) => b.id === baiNopId)
  if (!bn) throw new Error('Không có bài nộp này')
  const bg = du.baiGiao.find((g) => g.id === bn.baiGiaoId)!
  const n = du.nhapTracNghiem.find((x) => x.baiNopId === baiNopId)
  if (!n) throw new Error('Chưa có nháp chấm trắc nghiệm cho bài này')

  const band = n.tong === 0 ? 0 : Math.round((n.dung / n.tong) * 9 * 2) / 2

  ghi(
    actorCuaVai(vai),
    'review.send',
    { type: 'review', tenantId: du.tenant.id, classId: bg.lopId, ownerId: bn.hocVienId },
    { bai_nop: baiNopId, dung: n.dung, tong: n.tong, band },
    // Từ đây em nhìn thấy điểm của CHÍNH EM. Không có id em nào khác trong danh sách này.
    [du.vai.owner, bn.hocVienId],
    (d) => {
      d.nhanXet.push({
        id: maMoi(`nx-${baiNopId}`),
        baiNopId,
        band,
        noiDung:
          n.cauSai.length === 0
            ? `Em làm đúng cả ${n.tong} câu. Giữ nhịp này.`
            : `Em đúng ${n.dung}/${n.tong} câu. Xem lại câu ${n.cauSai.join(', ')}.`,
        guiLuc: new Date().toISOString(),
        suaTuNhap: false,
      })
      d.nhapTracNghiem = d.nhapTracNghiem.filter((x) => x.baiNopId !== baiNopId)
    },
  )
}

/**
 * Số liệu cho lưới thẻ lớp.
 *
 * Tính từ dữ liệu thật, không cắm số: band trung bình lấy từ hồ sơ các em trong lớp, mức
 * đổi lấy từ hướng đi của chính các em đó, "quá hạn" đếm bài đã qua hạn mà còn người chưa
 * nộp. Cắm số thì thẻ đẹp mà tắt một luật đi con số vẫn y nguyên, và cô sẽ tin nhầm nó.
 */
export function soLieuLop(vai: VaiDemo): {
  lop: import('./du-lieu').Lop
  soEm: number
  bandTb: number | null
  doiBand: number | null
  cho: number
  quaHan: number
  buoiDaDay: number | null
  soBuoi: number | null
  tenLoTrinh: string | null
  buoiToi: string
  diHocDeu: number | null
}[] {
  const du = duLieu()
  const cho = baiCanCham(vai)

  const thay =
    vai === 'owner'
      ? du.lop
      : vai === 'assistant'
        ? du.lop.filter((l) => l.id === 'lop-65')
        : du.lop.filter((l) => l.hocVienIds.includes(du.vai.student))

  return thay.map((l) => {
    const hoSo = du.hoSo.filter((h) => l.hocVienIds.includes(h.id))
    const band = hoSo.filter((h) => h.bandTb > 0)
    const lt = du.loTrinh.find((x) => x.dangDung.includes(l.id))

    /*
     * "Buổi đã dạy" = số buổi ĐÃ ĐIỂM DANH, không phải buổi lớn nhất có bài giao.
     *
     * Trước đây đếm theo bài giao, và ba trong bốn lớp lệch: lớp Speaking đã dạy 12 buổi
     * nhưng chỉ giao bài từ buổi 6, nên thẻ đọc thành "Buổi 6/20" — lớp trông như đang
     * chậm một nửa. Bài về nhà nói về bài về nhà; buổi đã dạy thì điểm danh mới biết.
     *
     * Lớp có lộ trình mà chưa điểm danh buổi nào thì lấy buổi nhỏ nhất của lộ trình — lớp
     * đang ở đầu chặng đó, chưa phải "đã dạy 0 buổi".
     */
    const daDiemDanh = buoiKeTiep(l.id) - 1
    const buoiDaDay =
      l.trangThai === 'opening'
        ? /* Lớp chưa khai giảng KHÔNG có buổi đã dạy — kể cả buổi 1.
             Để nó là 0-rồi-làm-tròn-lên-1 thì thẻ đọc "Buổi 1/36" cho một lớp mở ngày 22/9,
             và thanh tiến độ đè mất dòng "2/6 đăng ký · khai giảng 22/9" cần nằm ở đó. */
          null
        : daDiemDanh > 0
          ? daDiemDanh
          : lt
            ? Math.min(...lt.buoi.map((b) => b.no))
            : null

    const quaHan = du.baiGiao.filter(
      (g) =>
        g.lopId === l.id &&
        !g.daXong &&
        dangChay(g) &&
        new Date(g.hanNop).getTime() < Date.now() &&
        l.hocVienIds.some(
          (id) => !du.baiNop.some((b) => b.baiGiaoId === g.id && b.hocVienId === id),
        ),
    ).length

    /* "Đi học đều" TÍNH LẠI từ bảng điểm danh, không đọc con số tổng kết trong hồ sơ.
       Trước đây hồ sơ mang chuỗi `diHoc: '28/30'` — thẻ lớp và hồ sơ có thể lệch nhau mà
       không chỗ nào phát hiện, vì không có bảng sự thật nào để đối chiếu. */
    const diHoc = hoSo
      .map((h) => diHocTrongLop(l.id, h.id))
      .filter((x) => x.tong > 0)

    return {
      lop: l,
      soEm: l.hocVienIds.length,
      bandTb:
        band.length === 0
          ? null
          : Number((band.reduce((t, h) => t + h.bandTb, 0) / band.length).toFixed(1)),
      doiBand:
        band.length === 0
          ? null
          : Number(
              (
                (band.filter((h) => h.huong === 'up').length -
                  band.filter((h) => h.huong === 'down').length) /
                band.length
              ).toFixed(1),
            ),
      cho: cho.filter((b) => b.lopId === l.id).length,
      quaHan,
      buoiDaDay,
      soBuoi: lt?.soBuoi ?? null,
      tenLoTrinh: lt?.ten ?? null,
      // Lớp sắp mở: `lich` là ngày khai giảng, `ghiChu` là dòng phụ dưới thanh tiến độ.
      // Nhét ghi chú vào cả hai chỗ thì thẻ đọc thành "Khai giảng: khai giảng 22/9".
      buoiToi: l.lich,
      diHocDeu:
        diHoc.length === 0
          ? null
          : Math.round(
              (diHoc.reduce((t, x) => t + x.coMat / x.tong, 0) / diHoc.length) * 100,
            ),
    }
  })
}

// ───────────────────────────── đọc ─────────────────────────────

/**
 * "nộp hôm qua" dễ đọc hơn "nộp 21:04 07/09".
 *
 * Cô cần biết bài này CŨ tới đâu, không cần biết đúng phút nào. Nộp muộn thì nói thẳng là
 * muộn — đó là thứ đổi cách cô viết nhận xét.
 */
function nopLucNoiSao(iso: string | null, muon: boolean): string {
  if (!iso) return 'chưa nộp'
  const ngay = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  const khi = ngay <= 0 ? 'nộp hôm nay' : ngay === 1 ? 'nộp hôm qua' : `nộp ${ngay} ngày trước`
  return muon ? `${khi}, muộn` : khi
}

export interface BaiCanCham {
  baiNopId: string
  hocVien: { id: string; ten: string; mau: TaiKhoan['mau'] }
  lopId: string
  lopTen: string
  deTen: string
  /** Dòng meta của bản mẫu: lớp · nhãn bài · số từ · nộp lúc nào. */
  meta: string
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
     * Hỏi `draft.view`, không hỏi `submission.view`: em XEM ĐƯỢC bài nộp của chính em, nên
     * lọc theo bài nộp thì em nhìn thấy cả chồng bài chấm — mà nháp là lớp 3, em không bao
     * giờ được thấy band máy đoán. Chính sách `draft` (permissions.json) cho em mức `none`,
     * nên câu hỏi này chặn đúng chỗ thay vì chặn nhờ một câu hỏi gần đúng.
     */
    const doc = can(actor, 'draft.view', {
      type: 'draft',
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
      meta: [
        du.lop.find((l) => l.id === bg.lopId)?.ten,
        bg.nhan,
        `${bn.soTu} từ`,
        nopLucNoiSao(bn.nopLuc, bn.muon),
      ]
        .filter(Boolean)
        .join(' · '),
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
