/**
 * Ý định của người dùng → kho. Một chỗ duy nhất, để màn hình không tự gọi kho lung tung.
 *
 * File này giữ đúng hình dạng của lớp server action mà bản thật sẽ có: tên hàm, tham số và
 * kiểu trả về `{ loi?: string }` không đổi. Khi nối Supabase, thân hàm đổi thành lời gọi
 * lên máy chủ; màn hình không phải sửa.
 *
 * Trước đây đây thật sự LÀ server action. Đổi thành hàm chạy ở trình duyệt để xuất được
 * bản tĩnh cho GitHub Pages — xem DECISIONS 2026-09-08, mục bản tĩnh.
 */
import type { De, VaiDemo } from './du-lieu'
import {
  KhongDuQuyen,
  dangBai,
  datDapAn,
  boGiongCham,
  datLuat,
  datTrongSoRubric,
  chotMotBaiTracNghiem,
  chotTracNghiemCaLop,
  dienDapAnThieu,
  deXuatChoCo,
  duyetNhanDe,
  doiVai,
  duyetBaiGiao,
  duyetCaCumTinHocPhi,
  duyetTinHocPhi,
  ghiDiemDanh,
  giaoBai,
  guiNhanXet,
  lamBaiLuyen,
  luuDeSoHoa,
  luuGhiChu,
  nopBai,
  suaNhap,
  suaTinHocPhi,
  taoBaiLuyenTuLoiChung,
  vaiHienTai,
} from './kho'

/*
 * Dịch lời từ chối sang tiếng của cô.
 *
 * DESIGN.md §Copy: mọi màn nói với cô/em bằng ngôi "cô–em". `Không đủ quyền cho
 * "review.send"` đúng nhưng vô nghĩa với người đang dùng. Tên hành vi vẫn nằm trong nhật ký
 * cho người sửa lỗi đọc; màn hình thì nói tiếng người.
 */
function loiChoNguoiDung(e: unknown): string {
  if (e instanceof KhongDuQuyen) {
    return 'Chỗ này chỉ cô làm được. Trợ giảng soạn xong thì chuyển cho cô, cô là người bấm gửi.'
  }
  return (e as Error).message
}

function thu(viec: () => void): { loi?: string } {
  try {
    viec()
    return {}
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
}

export function doiVaiXem(v: VaiDemo): void {
  doiVai(v)
}

export function guiNhanXetHanhVi(baiNopId: string): { loi?: string } {
  return thu(() => guiNhanXet(vaiHienTai(), baiNopId))
}

export function suaNhapHanhVi(baiNopId: string, noiDung: string): { loi?: string } {
  return thu(() => suaNhap(vaiHienTai(), baiNopId, noiDung))
}

/** Trợ giảng soạn xong thì chuyển cho cô — không phải gửi thẳng tới em. */
export function deXuatChoCoHanhVi(baiNopId: string, noiDung: string): { loi?: string } {
  return thu(() => deXuatChoCo(vaiHienTai(), baiNopId, noiDung))
}

export function dangBaiHanhVi(lopId: string, noiDung: string): { loi?: string } {
  if (!noiDung.trim()) return { loi: 'Chưa có nội dung' }
  return thu(() => dangBai(vaiHienTai(), lopId, noiDung.trim()))
}

/** Cô bật/tắt một luật máy được tự làm. Trợ giảng bấm vào thì bị chặn ở trần cứng. */
export function datLuatHanhVi(id: string, bat: boolean): { loi?: string } {
  return thu(() => datLuat(vaiHienTai(), id, bat))
}

/** Em nộp bài. Không đi qua `vaiHienTai()`: app của em luôn chạy dưới danh nghĩa của em. */
export function nopBaiHanhVi(
  hocVienId: string,
  baiGiaoId: string,
  noiDung: string,
): { loi?: string } {
  if (noiDung.trim().length === 0) return { loi: 'Em chưa viết gì.' }
  return thu(() => nopBai(hocVienId, baiGiaoId, noiDung))
}

export function lamBaiLuyenHanhVi(
  hocVienId: string,
  baiLuyenId: string,
  dung: number,
): { loi?: string } {
  return thu(() => lamBaiLuyen(hocVienId, baiLuyenId, dung))
}

/**
 * Cô giao một buổi trong lộ trình cho lớp. Trợ giảng bấm cùng nút này thì thành đề xuất.
 *
 * Giao diện KHÔNG tự đoán vai: nó gọi một hàm, `can()` quyết ra hai kết cục. Nếu ở đây có
 * `if vai === ...` thì hôm nào chính sách đổi, nút vẫn làm theo cái if cũ.
 */
export function giaoBaiHanhVi(y: {
  loTrinhId: string
  buoiNo: number
  lopId: string
  hanNop: string
  trongSo: number
}): { loi?: string } {
  if (!y.lopId) return { loi: 'Cô chưa chọn lớp.' }
  if (!y.hanNop) return { loi: 'Cô chưa đặt hạn nộp.' }
  if (new Date(y.hanNop).getTime() <= Date.now()) {
    return { loi: 'Hạn nộp đã qua. Em sẽ nhận bài trong trạng thái muộn ngay khi giao.' }
  }
  return thu(() => void giaoBai(vaiHienTai(), y))
}

export function duyetBaiGiaoHanhVi(baiGiaoId: string): { loi?: string } {
  return thu(() => duyetBaiGiao(vaiHienTai(), baiGiaoId))
}

export function duyetNhanDeHanhVi(deId: string): { loi?: string } {
  return thu(() => duyetNhanDe(vaiHienTai(), deId))
}

export function datDapAnHanhVi(
  deId: string,
  cauNo: number,
  dapAn: string | null,
): { loi?: string } {
  return thu(() => datDapAn(vaiHienTai(), deId, cauNo, dapAn))
}

export function luuDeSoHoaHanhVi(de: Omit<De, 'id'>): { loi?: string } {
  if (!de.ten.trim()) return { loi: 'Đề chưa có tên.' }
  return thu(() => void luuDeSoHoa(vaiHienTai(), de))
}

/**
 * Cô — hoặc trợ giảng — lưu điểm danh một buổi.
 *
 * Không có `if vai === ...` ở đây: một hàm, `can()` quyết. Trợ giảng đi qua được vì
 * `attendance.assistant` là `auto`; em bấm vào thì bị chặn ở mức `own` (chỉ xem).
 */
export function ghiDiemDanhHanhVi(y: {
  lopId: string
  buoiNo: number
  vang: { hocVienId: string; phep: boolean }[]
}): { loi?: string } {
  return thu(() => ghiDiemDanh(vaiHienTai(), y))
}

/**
 * Cô chốt điểm trắc nghiệm cả lớp — một hành động, nhiều nhận xét gửi đi.
 *
 * `review.send` nằm trong `send_actions_owner_only`, nên trợ giảng bấm vào cũng bị chặn ở
 * cửa 4 của `can()` — không phải vì màn này kiểm tra vai, mà vì chính sách nói thế.
 */
export function chotTracNghiemHanhVi(baiGiaoId: string): { loi?: string; so?: number } {
  try {
    const so = chotTracNghiemCaLop(vaiHienTai(), baiGiaoId)
    return { so }
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
}

/** Cô chốt một bài — đường dùng cho bài cam sau khi cô đã xem. */
export function chotMotBaiHanhVi(baiNopId: string): { loi?: string } {
  return thu(() => chotMotBaiTracNghiem(vaiHienTai(), baiNopId))
}

/** Cô điền đáp án còn thiếu cho một câu của bài giao, rồi máy chấm lại cả lô. */
export function dienDapAnThieuHanhVi(
  baiGiaoId: string,
  cauNo: number,
  dapAn: string,
): { loi?: string } {
  if (!dapAn.trim()) return { loi: 'Cô chưa chọn đáp án.' }
  return thu(() => dienDapAnThieu(vaiHienTai(), baiGiaoId, cauNo, dapAn))
}

/**
 * Cô duyệt một tin học phí → xếp lịch gửi 9:00.
 *
 * `fee.message.send` nằm trong `send_actions_owner_only`, nên trợ giảng và máy đều bị chặn ở
 * cửa 4 của `can()` — không phải vì hàm này kiểm vai.
 */
export function duyetTinHocPhiHanhVi(hocVienId: string): { loi?: string } {
  return thu(() => duyetTinHocPhi(vaiHienTai(), hocVienId))
}

/** "Duyệt cả 3" của bản mẫu — mỗi tin vẫn một sự kiện riêng. */
export function duyetCaCumHanhVi(): { loi?: string; so?: number } {
  try {
    return { so: duyetCaCumTinHocPhi(vaiHienTai()) }
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
}

/** Cô sửa tin trước khi gửi. Nháp chưa tới tay em nên sửa được. */
export function suaTinHocPhiHanhVi(hocVienId: string, noiDung: string): { loi?: string } {
  if (!noiDung.trim()) return { loi: 'Tin không được để trống.' }
  return thu(() => suaTinHocPhi(vaiHienTai(), hocVienId, noiDung.trim()))
}

/**
 * Cô tạo bài luyện cho những em mắc một lỗi chung — bước 6 sang bước 5.
 *
 * Trả về SỐ EM đã giao, để màn nói đúng việc đã xảy ra thay vì "đã tạo" chung chung.
 */
export function taoBaiLuyenHanhVi(lopId: string, tenLoi: string): { loi?: string; so?: number } {
  try {
    return { so: taoBaiLuyenTuLoiChung(vaiHienTai(), lopId, tenLoi) }
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
}

/** Cô đổi trọng số một tiêu chí. `rubric` là trần cứng nên trợ giảng bị chặn ở cửa 5. */
export function datTrongSoRubricHanhVi(
  ma: 'tr' | 'cc' | 'lr' | 'gra',
  trongSo: number,
): { loi?: string } {
  if (!Number.isFinite(trongSo)) return { loi: 'Trọng số phải là một con số.' }
  return thu(() => datTrongSoRubric(vaiHienTai(), ma, trongSo))
}

/** Cô bỏ một dòng giọng chấm. */
export function boGiongChamHanhVi(dong: string): { loi?: string } {
  return thu(() => boGiongCham(vaiHienTai(), dong))
}

export function luuGhiChuHanhVi(hocVienId: string, ghiChu: string): { loi?: string } {
  return thu(() => luuGhiChu(vaiHienTai(), hocVienId, ghiChu))
}
