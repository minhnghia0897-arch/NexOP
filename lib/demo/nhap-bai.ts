/**
 * Nháp bài viết của em, giữ trong bộ nhớ trình duyệt.
 *
 * Bản mẫu hứa một câu ở ô viết: "Bài được lưu mỗi 10 giây — tắt máy vẫn còn." Một lời hứa
 * như thế không được là chữ trang trí: em viết 280 từ lúc 11 giờ đêm, máy sập, và thứ duy
 * nhất quyết định em còn học tiếp hay bỏ là dòng chữ đó có thật hay không.
 *
 * KHÔNG đi qua `events`. Nháp chưa nộp không phải sự thật của lớp: cô không thấy, không tính
 * là đã nộp, và em xoá đi thì không còn dấu vết — đúng như một tờ giấy nháp. Nó cũng không
 * nằm trong kho demo (`oblue-demo-v2`), vì kho đó là dữ liệu của cả nền tảng, còn đây là
 * riêng máy của em.
 *
 * Mọi lần đọc/ghi đều bọc try/catch: cửa sổ ẩn danh, bộ nhớ đầy, hoặc người dùng chặn
 * localStorage đều làm hàm này ném — và mất nháp thì đáng tiếc, chứ sập màn viết thì mất cả
 * bài.
 */
const TIEN_TO = 'oblue-nhap-'

export function docNhap(baiGiaoId: string, hocVienId: string): string {
  try {
    return localStorage.getItem(`${TIEN_TO}${hocVienId}-${baiGiaoId}`) ?? ''
  } catch {
    return ''
  }
}

export function luuNhap(baiGiaoId: string, hocVienId: string, noiDung: string): void {
  try {
    localStorage.setItem(`${TIEN_TO}${hocVienId}-${baiGiaoId}`, noiDung)
  } catch {
    /* Không còn chỗ lưu thì thôi — màn viết vẫn chạy. */
  }
}

/** Nộp rồi thì bỏ nháp: để lại thì lần sau mở màn em thấy bài cũ và tưởng chưa nộp. */
export function boNhap(baiGiaoId: string, hocVienId: string): void {
  try {
    localStorage.removeItem(`${TIEN_TO}${hocVienId}-${baiGiaoId}`)
  } catch {
    /* Không xoá được thì cũng không sao: `baiCuaEm` mới là chỗ nói em đã nộp hay chưa. */
  }
}
