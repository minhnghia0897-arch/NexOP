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
import type { VaiDemo } from './du-lieu'
import { KhongDuQuyen, dangBai, deXuatChoCo, doiVai, guiNhanXet, suaNhap, vaiHienTai } from './kho'

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
