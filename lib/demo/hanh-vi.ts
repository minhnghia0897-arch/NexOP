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
  datLuat,
  deXuatChoCo,
  duyetNhanDe,
  doiVai,
  duyetBaiGiao,
  giaoBai,
  guiNhanXet,
  lamBaiLuyen,
  luuDeSoHoa,
  luuGhiChu,
  nopBai,
  suaNhap,
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

export function luuGhiChuHanhVi(hocVienId: string, ghiChu: string): { loi?: string } {
  return thu(() => luuGhiChu(vaiHienTai(), hocVienId, ghiChu))
}
