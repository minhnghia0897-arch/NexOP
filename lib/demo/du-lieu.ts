/**
 * Dữ liệu mẫu cho bản demo. Chạy trong bộ nhớ, không cần Supabase.
 *
 * DESIGN.md: "Dữ liệu mẫu phải thật: tên Việt, band hợp lý, lỗi cụ thể. Không abc, Test1, 0%."
 * Nên bên dưới là một lớp IELTS thật như cô Thảo sẽ có: 18 em, band trải từ 5.0 tới 7.0, và
 * những lỗi mà người chấm IELTS thật gặp hằng tuần — không phải "lỗi 1", "lỗi 2".
 *
 * Ngày giờ tính lùi từ lúc chạy, để bản demo không bao giờ "hết hạn" thành dữ liệu năm ngoái.
 */

export type VaiDemo = 'owner' | 'assistant' | 'student'

export interface TaiKhoan {
  id: string
  ten: string
  phone?: string
  email?: string
  /** Cặp màu avatar, phân biệt người bằng màu chứ không bằng emoji (DESIGN.md). */
  mau: 'orange' | 'blue' | 'green' | 'purple' | 'off'
}

export interface Lop {
  id: string
  ten: string
  lich: string
  trangThai: 'running' | 'closed' | 'opening'
  hocVienIds: string[]
  /** Chấm màu ở panel. Bản mẫu phân biệt lớp bằng màu, không bằng số thứ tự. */
  mau: 'blue' | 'purple' | 'orange' | 'green' | 'indigo'
  /** Với lớp sắp mở: dòng phụ thay cho sĩ số. */
  ghiChu?: string
}

export interface CauHoi {
  no: number
  loai: 'mcq' | 'fill' | 'tfng' | 'essay'
  de: string
  luaChon?: string[]
  dapAn?: string | null
  canhBao?: string | null
  trangNguon?: number
  /**
   * Chủ đề ngữ pháp của CÂU (khác `De.chuDe` là chủ đề của cả đề).
   *
   * Cột "Sai ở đâu" của bản mẫu đọc "Câu 3, 11, 16 — bị động", không đọc "Câu 3, 11, 16".
   * Không có trường này thì cô phải tự mở đề ra xem ba câu đó hỏi gì — tức là màn chốt điểm
   * không tiết kiệm cho cô phút nào.
   */
  chuDeCau?: string
}

export interface De {
  id: string
  ten: string
  kyNang: 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar' | 'vocabulary'
  trinhDo?: string
  cachCham: 'auto' | 'draft' | 'manual'
  tinCayOcr?: number
  cauHoi: CauHoi[]
  /** Đề vào ngân hàng bằng đường nào. `tay` = cô tự soạn, không qua OCR. */
  nguon?: { loai: 'anh' | 'pdf' | 'tay'; soTrang?: number }
  /**
   * Nhãn máy đề xuất sau khi đọc: cấp · kỹ năng · chủ đề. Cô chỉ DUYỆT, không gõ lại.
   *
   * Nhãn là thứ làm đề tự tìm được sau 10 năm — nên máy đề xuất còn hơn để trống, và
   * `trangThaiNhan` giữ đúng luật lớp 3: có hạn, cô quyết.
   */
  nhanDeXuat?: string[]
  trangThaiNhan?: 'cho_duyet' | 'da_duyet' | 'chu_mo'
  /** Chỗ máy đọc không chắc — trang nào, vì sao. Rỗng nghĩa là máy tự tin. */
  choMo?: string[]
  thoiGianPhut?: number
  chuDe?: string[]
  /** Đoạn văn gắn với câu hỏi (Reading/Listening). Chụp lại cùng đề. */
  doanVan?: { ten: string; noiDung: string; tuCau: number; denCau: number }[]
}

export interface BaiGiao {
  id: string
  lopId: string
  deId: string
  hanNop: string
  lanThu: number
  /** Nhãn ngắn hiện ở đầu thẻ chấm, ví dụ "Task 2 — Education". */
  nhan?: string
  /** Trọng số khi tính band trung bình. Mock nặng hơn Task 1 — cô đặt, không cố định. */
  trongSo?: number
  /** Bài đã xong từ trước, chỉ để dựng bảng điểm — không nằm trong chồng bài chờ. */
  daXong?: boolean
  /**
   * `de_xuat` = trợ giảng đã soạn, cô chưa duyệt. Lớp 3: chưa có hiệu lực với ai.
   *
   * Không tách thành bảng riêng, vì đây vẫn là MỘT bài giao — chỉ khác ở chỗ đã có hiệu
   * lực hay chưa. `permissions.json` cho trợ giảng mức `propose` ở `assignment`, nên hình
   * dạng này bám đúng chính sách: cùng một object, khác động từ tạo ra nó.
   */
  trangThai?: 'de_xuat' | 'dang_chay'
  /** Ai soạn, khi là đề xuất của trợ giảng. */
  deXuatBoi?: string
  /** Buổi trong lộ trình mà bài này lấy ra — để cô thấy bài đến từ đâu. */
  tuBuoi?: { loTrinhId: string; no: number }
  /** Ảnh chụp câu hỏi lúc giao — không phải liên kết sống (migration 0007). */
  cauHoi: CauHoi[]
}

export interface BaiNop {
  id: string
  baiGiaoId: string
  hocVienId: string
  noiDung: string
  soTu: number
  nopLuc: string | null
  muon: boolean
  /**
   * Bài trắc nghiệm: đáp án theo SỐ CÂU, không phải một đoạn văn.
   *
   * Tách riêng khỏi `noiDung` chứ không nhồi JSON vào đó: máy chấm trắc nghiệm phải so từng
   * câu với `cauHoi[].dapAn`, và một chuỗi thì mỗi chỗ đọc lại tự parse theo cách của mình.
   * Bài tự luận không có trường này; bài trắc nghiệm thì `noiDung` rỗng.
   */
  traLoi?: Record<number, string>
}

/**
 * Lỗi máy đánh dấu trong bài.
 *
 * `nhom` quyết định màu vạch bên trái ở bản mẫu: ngữ pháp, từ vựng, hay bố cục — ba loại
 * lỗi khác nhau về bản chất, và cô sửa chúng theo ba cách khác nhau.
 */
export interface LoiDanhDau {
  trich: string
  sua: string
  loai: string
  nhom: 'grammar' | 'vocab' | 'structure'
  /** Dòng nhỏ dưới cùng, ví dụ "Lỗi này lặp 3 bài liên tiếp". Đây là thứ cô cần nhất. */
  themY?: string
}

/** Lớp 3: nháp chấm của máy. Có hạn, cô quyết. Em KHÔNG bao giờ thấy dòng này. */
export interface NhapCham {
  id: string
  baiNopId: string
  band: { tr: number; cc: number; lr: number; gra: number }
  tinCay: number
  co: LoiDanhDau[]
  nhanXet: string
  /** Vì sao cần cô xem kỹ. Rỗng nghĩa là máy tự tin. */
  ganCo: string[]
  hetHan: string
  /** Trợ giảng đã soạn xong và chuyển cho cô. Vẫn là lớp 3 — em chưa thấy gì. */
  choCoDuyet?: { boiId: string }
}

/** Lớp 1: nhận xét cô đã gửi. Chỉ thêm, không sửa — sửa là thêm dòng mới. */
/**
 * Nháp chấm TRẮC NGHIỆM. **Lớp 3 — máy ghi, có hạn, cô quyết.**
 *
 * Không dùng chung `NhapCham` với bài tự luận: `NhapCham` mang bốn tiêu chí IELTS
 * (tr/cc/lr/gra) và một đoạn nhận xét, còn trắc nghiệm là đúng-bao-nhiêu-trên-bao-nhiêu và
 * sai ở câu nào. Nhồi vào một kiểu thì mọi chỗ đọc phải hỏi "bài này loại gì" trước khi
 * dám đọc trường nào — và chỗ nào quên hỏi thì đọc ra `band 0.0` cho một bài 37/40.
 */
export interface NhapTracNghiem {
  id: string
  baiNopId: string
  dung: number
  tong: number
  /** Câu em làm sai — nguyên liệu cho cột "Sai ở đâu" của bản mẫu. */
  cauSai: number[]
  /**
   * Câu máy KHÔNG chấm được vì ĐỀ chưa có đáp án.
   *
   * Khác `cauSai`: đây không phải lỗi của em, mà là chỗ máy không biết. Bản mẫu gọi là
   * "câu chữ mờ" và luật của cô ghi rõ "câu chữ mờ vẫn hỏi cô" — nên câu này không được
   * tính là sai, và bài có nó không bao giờ vào lô chốt tự động.
   */
  cauCanCo: number[]
  tinCay: number
  hetHan: string
}

/**
 * Chấm một bài trắc nghiệm. **Hàm THUẦN** — cùng đầu vào thì cùng đầu ra, không đọc kho.
 *
 * Để ở đây chứ không ở `kho.ts` vì cả hai chỗ cần nó: dữ liệu mẫu dựng nháp chấm sẵn (máy đã
 * chấm từ lúc em nộp, hai ngày trước), và `mayChamTracNghiem` chấm lại khi cô điền đáp án.
 * Hai bản cài đặt thì hai bản lệch nhau, và lệch ở chỗ tệ nhất: bảng mẫu nói một điểm, bấm
 * "chấm lại" ra điểm khác.
 *
 * Câu đề CHƯA CÓ đáp án thì KHÔNG tính là sai — nó vào `cauCanCo`. Tính là sai thì em bị trừ
 * điểm vì đề thiếu đáp án, và điểm sai vẫn trông hợp lý nên không ai soi lại.
 */
export function chamTracNghiem(
  cauHoi: CauHoi[],
  traLoi: Record<number, string>,
  tinCayOcr: number,
): { dung: number; tong: number; cauSai: number[]; cauCanCo: number[]; tinCay: number } {
  const cauSai: number[] = []
  const cauCanCo: number[] = []
  let dung = 0

  for (const c of cauHoi) {
    if (!c.dapAn) {
      cauCanCo.push(c.no)
      continue
    }
    if (traLoi[c.no] === c.dapAn) dung += 1
    else cauSai.push(c.no)
  }

  const tong = cauHoi.length - cauCanCo.length

  /*
   * Tin cậy nói MÁY chắc tới đâu, không nói em làm tốt tới đâu.
   *
   * Nền là độ tin cậy OCR của đề; mỗi câu chưa có đáp án kéo xuống, vì phần đề đó máy chưa
   * đọc được. Điểm của em KHÔNG vào công thức: gộp vào thì một em làm kém đọc thành "máy
   * không chắc", và cô mở bài ra chỉ để xem lại một phép so sánh chuỗi.
   */
  return {
    dung,
    tong,
    cauSai,
    cauCanCo,
    tinCay: cauHoi.length === 0 ? tinCayOcr : Number((tinCayOcr * (tong / cauHoi.length)).toFixed(2)),
  }
}

export interface NhanXet {
  id: string
  baiNopId: string
  band: number
  noiDung: string
  guiLuc: string
  /** Cô đã sửa bao nhiêu so với nháp của máy — nguyên liệu cho "giọng cô". */
  suaTuNhap: boolean
  /** Ai nháp bản này: máy, hay trợ giảng. Chuỗi nháp là thứ màn "Việc của tôi" đọc. */
  nhapBoi?: string
  /** Band bản nháp đề xuất, để so với band cô chốt. Bằng nhau = cô giữ nguyên. */
  bandNhap?: number
  /**
   * Lỗi cô đã duyệt và gửi kèm. Sao chép từ nháp lúc GỬI, không trỏ ngược về nháp:
   * nháp là lớp 3 và bị xoá sau khi gửi; em phải còn đọc được chỗ cô đánh dấu sau đó.
   */
  co?: LoiDanhDau[]
}

/**
 * Bài luyện 5 phút — `practice_set` trong permissions.json.
 *
 * Sinh ra từ một lỗi LẶP, không phải từ một bài. Đó là lý do nó có `viLoi`: bài luyện không
 * nói được vì sao em phải làm thì em không làm.
 */
export interface BaiLuyen {
  id: string
  hocVienId: string
  lopId: string
  ten: string
  viLoi: string
  giaoBoi: string
  cau: CauLuyen[]
  /** Chỉ có sau khi em làm xong. Trước đó là null, và đó là thông tin thật. */
  ketQua?: { dung: number; luc: string }
}

export interface CauLuyen {
  cau: string
  luaChon: string[]
  dung: number
  giaiThichDung: string
  giaiThichSai: string
}

/**
 * Hồ sơ một em trong lớp — nguyên liệu cho tab Học viên và tab Điểm.
 *
 * `diem` khoá theo id bài giao. `null` nghĩa là chưa nộp, và đó là thông tin THẬT chứ
 * không phải thiếu dữ liệu: ô trống trong bảng điểm là thứ cô nhìn để biết ai đang buông.
 */
export interface HoSoHocVien {
  id: string
  bandTb: number
  huong: 'up' | 'down' | 'flat'
  /*
   * KHÔNG có `diHoc` ở đây nữa.
   *
   * Trước là chuỗi `'28/30'` nằm sẵn trong hồ sơ — một con số tổng kết không có gì đỡ bên
   * dưới, nên thẻ lớp và hồ sơ lệch nhau được mà không chỗ nào phát hiện. Giờ đọc bằng
   * `diHocCuaEm()` / `diHocTrongLop()`, tính lại từ bảng `diemDanh` mỗi lần.
   */
  coTaiKhoan: boolean
  loiHayGap: string
  hanHocPhi: string
  diem: Record<string, { band: number | null; muon?: boolean }>
  /** Band em nhắm tới. Không có mục tiêu thì "tăng 0.5" không nói được là đủ hay chưa. */
  mucTieu?: number
  /**
   * Ghi chú riêng của cô về em.
   *
   * `teacher_notes` nằm trong `assistant_hard_ceiling`: trợ giảng KHÔNG đọc được, và cô có
   * muốn cấp cũng không cấp được. Em càng không. Đây là chỗ cô viết "nhà xa, hay đến muộn —
   * không phải lười", và nó chỉ có giá trị khi cô chắc chắn không ai khác đọc.
   */
  ghiChu?: string
  /** Lỗi lặp máy theo dõi, kèm mức nặng — nguyên liệu cho ngăn hồ sơ. */
  loiLap?: { ten: string; y: string; nang: 'do' | 'cam' | 'xanh' }[]
}

/** Một buổi trong lộ trình — kế hoạch, chưa phải bài đã giao. */
export interface BuoiLoTrinh {
  no: number
  noiDung: string
  baiVeNha?: string
  deId?: string
  trongSo?: number
}

export interface LoTrinh {
  id: string
  ten: string
  moTa: string
  soBuoi: number
  dangDung: string[]
  buoi: BuoiLoTrinh[]
}

/** Học phí một em. Lớp 1 — chỉ thêm, và không API nào cho máy tự gửi tin. */
export interface HocPhi {
  hocVienId: string
  chuKy: string
  soTien: number
  hanDong: string
  trangThai: 'da_dong' | 'sap_han' | 'qua_han'
}

/**
 * Một công tắc trong "Luật của cô".
 *
 * `khoa: true` = không có công tắc, đây là luật của nền tảng. Hiện chung một chỗ với các
 * công tắc bật/tắt được là cố ý: cô cần thấy ranh giới giữa "cô quyết" và "không ai quyết".
 */
export interface LuatMay {
  id: string
  ten: string
  phu: string
  bat: boolean
  khoa?: boolean
}

/**
 * Một buổi đã điểm danh. **Lớp 1 — sự thật, chỉ thêm.**
 *
 * Máy không bao giờ ghi bảng này: ai có mặt trong phòng thì chỉ người trong phòng biết.
 * `attendance.system` là `none` trong permissions.json, nên `can()` chặn ngay cả động từ
 * `view` của vai máy — không phải vì quên cấp, mà vì đây là chỗ máy không có việc gì.
 *
 * Bản thật (ARCHITECTURE §2) là MỘT DÒNG MỘT EM MỘT BUỔI: `class_id, session_no,
 * student_id, present`. Ở đây gộp thành một dòng một buổi, nhưng vẫn ghi CẢ `coMat` lẫn
 * `vang` thay vì suy "có mặt = sĩ số trừ vắng": sĩ số hôm nay không nói được ai đang học
 * ở buổi 12, nên suy như thế là đọc sai quá khứ mỗi lần có em vào lớp muộn.
 */
export interface DiemDanh {
  id: string
  lopId: string
  buoiNo: number
  /** Buổi diễn ra lúc nào — không phải lúc cô bấm lưu. */
  luc: string
  /** Ai điểm danh. Trợ giảng có mức `auto` nên ghi thẳng, không qua cô. */
  ghiBoi: string
  coMat: string[]
  /** `phep: false` là vắng KHÔNG phép — đó là thứ sinh ra việc cho cô. */
  vang: { hocVienId: string; phep: boolean }[]
}

export interface BaiDang {
  id: string
  lopId: string
  tacGiaId: string | null
  loai: 'post' | 'system'
  noiDung: string
  luc: string
}

export interface DuLieuDemo {
  tenant: { id: string; subdomain: string; ten: string }
  taiKhoan: TaiKhoan[]
  lop: Lop[]
  de: De[]
  baiGiao: BaiGiao[]
  baiNop: BaiNop[]
  nhapCham: NhapCham[]
  nhapTracNghiem: NhapTracNghiem[]
  nhanXet: NhanXet[]
  baiDang: BaiDang[]
  hoSo: HoSoHocVien[]
  loTrinh: LoTrinh[]
  hocPhi: HocPhi[]
  baiLuyen: BaiLuyen[]
  diemDanh: DiemDanh[]
  luat: LuatMay[]
  /** Ai đang đăng nhập ở mỗi vai — cho công tắc đổi vai của bản demo. */
  vai: Record<VaiDemo, string>
}

const GIO = 3600_000
const NGAY = 24 * GIO

function luc(lechNgay: number, gio = 9): string {
  const d = new Date(Date.now() + lechNgay * NGAY)
  d.setHours(gio, 0, 0, 0)
  return d.toISOString()
}

const CO_THAO = 'acc-co-thao'
const TRO_GIANG = 'acc-pham-lan'

/** 18 em, tên Việt có dấu, không trùng họ dồn một chỗ. */
const HOC_VIEN: { id: string; ten: string; mau: TaiKhoan['mau'] }[] = [
  { id: 'hv-01', ten: 'Nguyễn Minh Anh', mau: 'orange' },
  { id: 'hv-02', ten: 'Trần Thu Hà', mau: 'blue' },
  { id: 'hv-03', ten: 'Lê Quang Huy', mau: 'green' },
  { id: 'hv-04', ten: 'Phạm Bảo Ngọc', mau: 'purple' },
  { id: 'hv-05', ten: 'Vũ Đức Thắng', mau: 'orange' },
  { id: 'hv-06', ten: 'Đỗ Khánh Linh', mau: 'blue' },
  { id: 'hv-07', ten: 'Bùi Nhật Nam', mau: 'green' },
  { id: 'hv-08', ten: 'Hoàng Thùy Dương', mau: 'purple' },
  { id: 'hv-09', ten: 'Ngô Gia Bảo', mau: 'orange' },
  { id: 'hv-10', ten: 'Dương Mai Chi', mau: 'blue' },
  { id: 'hv-11', ten: 'Lý Tuấn Kiệt', mau: 'green' },
  { id: 'hv-12', ten: 'Đinh Hà My', mau: 'purple' },
  { id: 'hv-13', ten: 'Trịnh Anh Khoa', mau: 'orange' },
  { id: 'hv-14', ten: 'Cao Diệu Linh', mau: 'blue' },
  { id: 'hv-15', ten: 'Phan Trọng Nghĩa', mau: 'green' },
  { id: 'hv-16', ten: 'Tạ Vân Anh', mau: 'purple' },
  { id: 'hv-17', ten: 'Hồ Đăng Khôi', mau: 'orange' },
  { id: 'hv-18', ten: 'Mai Phương Thảo', mau: 'blue' },
]

/**
 * Bốn mươi em của ba lớp còn lại.
 *
 * Sinh ra từ hai danh sách họ và tên, không gõ tay bốn mươi dòng — nhưng vẫn là tên Việt có
 * dấu, không phải "Học viên 1..40". Danh sách lớp mà đọc như bảng mã thì cô không tin nó là
 * lớp của mình, và bố cục panel cũng mất nhịp vì mọi dòng dài bằng nhau.
 */
const HO_VIET = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ']
const TEN_VIET = [
  'An Nhiên', 'Bảo Trâm', 'Chí Dũng', 'Diệu Hương', 'Gia Hân', 'Hải Yến', 'Hữu Phước',
  'Khả Ngân', 'Lan Chi', 'Minh Quân', 'Ngọc Diệp', 'Phú Quý', 'Quỳnh Như', 'Song Ngư',
  'Thanh Tùng', 'Trúc Mai', 'Tường Vy', 'Văn Lộc', 'Xuân Mai', 'Yến Nhi',
]
const MAU_AV: TaiKhoan['mau'][] = ['orange', 'blue', 'green', 'purple']

const HOC_VIEN_PHU: { id: string; ten: string; phone: string; mau: TaiKhoan['mau']; lop: string }[] =
  (() => {
    const ket: { id: string; ten: string; phone: string; mau: TaiKhoan['mau']; lop: string }[] = []
    let i = 0
    for (const [tien, so] of [['l55', 16], ['lct', 4], ['lsp', 20]] as const) {
      for (let k = 0; k < so; k++) {
        i += 1
        ket.push({
          id: `hv-${tien}-${k + 1}`,
          ten: `${HO_VIET[i % HO_VIET.length]} ${TEN_VIET[(i * 3) % TEN_VIET.length]}`,
          phone: `+8490200${String(i).padStart(3, '0')}`,
          mau: MAU_AV[i % MAU_AV.length]!,
          lop: tien,
        })
      }
    }
    return ket
  })()

const THEM = (so: number, tien: string): string[] =>
  HOC_VIEN_PHU.filter((h) => h.lop === tien)
    .slice(0, so)
    .map((h) => h.id)

/**
 * Buổi đã dạy của từng lớp. Một con số, dùng cho cả điểm danh lẫn thanh tiến độ thẻ lớp.
 *
 * Lớp 6.5 ở buổi 31 — đúng con số bản mẫu ghi trên ngăn điểm danh.
 */
const BUOI_DA_DAY: Record<string, number> = {
  'lop-65': 31,
  'lop-55': 22,
  'lop-cap-toc': 14,
  'lop-speak': 12,
}

/**
 * Em vào lớp từ buổi nào. Tám em lớp 6.5 vào muộn, nên MẪU SỐ của em nhỏ hơn.
 *
 * Đây là lý do dòng điểm danh phải ghi cả `coMat`: sĩ số hôm nay không cho biết ai đang
 * học ở buổi 12, nên "có mặt = sĩ số trừ vắng" sẽ cộng oan mười chín buổi cho em vào muộn.
 */
const VAO_TU: Record<string, number> = {
  'hv-11': 18, 'hv-12': 18, 'hv-13': 18, 'hv-14': 18, 'hv-15': 18, 'hv-16': 18,
  'hv-17': 22, 'hv-18': 22,
}

/**
 * Buổi vắng của mười tám em lớp 6.5 — đặt tay, vì đây là lớp mọi màn demo đi qua.
 *
 * Trước đây hồ sơ mang sẵn chuỗi `diHoc: '28/30'`: một con số tổng kết không có gì đỡ bên
 * dưới. Thẻ lớp và hồ sơ có thể nói hai điều khác nhau mà không chỗ nào phát hiện được.
 * Giờ cả hai TÍNH LẠI từ bảng này.
 *
 * Có chuyện để kể: Quang Huy và Gia Bảo vắng hai buổi cuối liên tiếp — luật "vắng 2 buổi
 * liên tiếp → Cần chú ý" bắt được. Đức Thắng vắng đúng buổi vừa rồi, MỘT buổi, nên không
 * bị bắt: đó là chỗ chứng minh luật đếm liên tiếp chứ không đếm tổng.
 */
const VANG_65: Record<string, [number, boolean][]> = {
  'hv-01': [[12, true], [24, true]],
  'hv-03': [[9, false], [14, true], [19, false], [25, false], [30, false], [31, false]],
  'hv-04': [[20, true]],
  'hv-05': [[7, true], [15, false], [22, true], [31, true]],
  'hv-08': [[6, true], [17, false], [27, true]],
  'hv-09': [[4, false], [8, false], [11, true], [16, false], [21, false], [26, true],
            [30, false], [31, false]],
  'hv-10': [[5, true], [13, true], [18, false], [23, true], [29, true]],
  'hv-12': [[26, true]],
  'hv-14': [[21, false], [30, false], [31, false]],
  'hv-16': [[19, true], [28, true]],
  'hv-17': [[24, true]],
}

/**
 * Buổi vắng của bốn mươi em ba lớp còn lại — sinh ra, không gõ tay.
 *
 * Em thứ năm mỗi nhóm vắng hai buổi CUỐI liên tiếp: luật "2 buổi liên tiếp" phải bắt được ở
 * mọi lớp, không riêng lớp có dữ liệu đặt tay. Bản demo mà chỉ một lớp chạy đúng luật thì
 * không phân biệt được "luật chạy" với "dữ liệu mẫu tình cờ trông giống luật chạy".
 */
function vangSinhRa(i: number, het: number): [number, boolean][] {
  const so = i % 5
  const daCo = new Set<number>()
  const ket: [number, boolean][] = []

  for (let k = 0; k < so; k++) {
    const buoi = so === 4 && k < 2 ? het - k : het - 3 - k * 4
    if (buoi < 1 || daCo.has(buoi)) continue
    daCo.add(buoi)
    ket.push([buoi, (i + k) % 3 !== 0])
  }
  return ket
}

/**
 * Dựng bảng điểm danh từ ba thứ trên. Một dòng một buổi, xếp theo thời gian tăng.
 *
 * Lớp `opening` không có dòng nào — chưa dạy buổi nào thì không có gì để điểm danh, và một
 * bảng rỗng đọc đúng hơn là một bảng đầy số 0.
 */
function sinhDiemDanh(lop: Lop[], ghiBoi: string): DiemDanh[] {
  const ket: DiemDanh[] = []

  for (const l of lop) {
    const het = BUOI_DA_DAY[l.id]
    if (het === undefined) continue

    /*
     * Chọn nguồn theo LỚP, không theo em.
     *
     * Viết `VANG_65[id] ?? vangSinhRa(i, het)` thì bảy em lớp 6.5 đi học đủ — em không có
     * dòng nào trong bảng đặt tay — rơi xuống hàm sinh và nhận vắng bịa. Kiểm lại số thì
     * Trọng Nghĩa (7.1, đi đều) bỗng "vắng 2 buổi liên tiếp": dữ liệu mẫu tự kể một câu
     * chuyện không ai viết. Lớp 6.5 đặt tay hết, kể cả em vắng 0 buổi.
     */
    const datTay = l.id === 'lop-65'
    const vangCuaEm = new Map<string, Map<number, boolean>>()
    l.hocVienIds.forEach((id, i) => {
      vangCuaEm.set(id, new Map(datTay ? (VANG_65[id] ?? []) : vangSinhRa(i, het)))
    })

    for (let no = 1; no <= het; no += 1) {
      const coMat: string[] = []
      const vang: { hocVienId: string; phep: boolean }[] = []

      for (const id of l.hocVienIds) {
        if (no < (VAO_TU[id] ?? 1)) continue // em chưa vào lớp — không có dòng nào cho buổi này
        const phep = vangCuaEm.get(id)?.get(no)
        if (phep === undefined) coMat.push(id)
        else vang.push({ hocVienId: id, phep })
      }

      ket.push({
        id: `dd-${l.id}-${no}`,
        lopId: l.id,
        buoiNo: no,
        luc: luc(-Math.round((het - no) * 3.5), 19),
        ghiBoi,
        coMat,
        vang,
      })
    }
  }
  return ket
}

/**
 * Ảnh chụp câu hỏi cho một bài giao (migration 0007).
 *
 * Bài giao KHÔNG dùng chung mảng với đề. Dùng chung thì cô sửa đáp án trong ngân hàng đề là
 * đổi luôn đề bài em đang làm dở — đúng thứ migration 0007 sinh ra để chặn, và test đã bắt
 * được đúng chỗ này.
 */
const chupCauHoi = (c: CauHoi[]): CauHoi[] => structuredClone(c)

const CAU_HOI_WRITING: CauHoi[] = [
  {
    no: 1,
    loai: 'essay',
    de: 'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?',
  },
]

const CAU_HOI_EDUCATION: CauHoi[] = [
  {
    no: 1,
    loai: 'essay',
    de: 'Some people believe that university education should be free for all students, while others think students should pay for their own tuition. Discuss both views and give your own opinion.',
  },
]

const CAU_HOI_READING: CauHoi[] = [
  { no: 1, loai: 'tfng', de: 'Tea was first cultivated in India.', luaChon: ['True', 'False', 'Not Given'], dapAn: 'False', trangNguon: 4 },
  { no: 2, loai: 'tfng', de: 'Tea reached Europe before 1600.', luaChon: ['True', 'False', 'Not Given'], dapAn: 'False', trangNguon: 4 },
  { no: 3, loai: 'mcq', de: 'The main purpose of paragraph 3 is to…', luaChon: ['describe a process', 'compare two regions', 'explain a decline'], dapAn: 'explain a decline', trangNguon: 5 },
  { no: 4, loai: 'fill', de: 'Tea was first traded in the ______ century.', dapAn: 'seventeenth', trangNguon: 5 },
  // Câu máy đọc được đề nhưng không thấy đáp án — ca UC-03 nói tới, và là ca đáng demo nhất.
  { no: 5, loai: 'fill', de: 'The tax on tea was abolished in ______.', dapAn: null, canhBao: 'Không tìm thấy đáp án ở trang 6', trangNguon: 6 },
]

/**
 * Đề trắc nghiệm ngữ pháp — `Trắc nghiệm ngữ pháp 3` của bản mẫu.
 *
 * Hai mươi câu THẬT, không phải bốn mươi câu đệm. Bản mẫu ghi "40 câu", nhưng con số đó là
 * minh hoạ; thứ cần đúng là hình dạng bảng chốt điểm. Bốn mươi câu bịa thì cột "Sai ở đâu"
 * nói về những câu không có nội dung, và cả màn thành trang trí.
 *
 * Nhóm theo CHỦ ĐỀ (`chuDe` của từng câu, qua `NHOM_NGU_PHAP` dưới đây) vì cột "Sai ở đâu"
 * của bản mẫu không đọc "Câu 3, 11, 16" mà đọc "Câu 3, 11, 16 — bị động". Số câu không dạy
 * cô điều gì; tên lỗi thì dạy.
 *
 * Câu 12 KHÔNG có đáp án — máy đọc được đề nhưng không tìm ra đáp án. Đó là "câu chữ mờ"
 * của luật `chot-mcq`, và là ca đáng demo nhất: bài nào chứa nó thì không vào lô chốt.
 */
const NGU_PHAP: [number, string, string[], number, string][] = [
  [1, 'She ______ in Hanoi since 2019.', ['lives', 'has lived', 'is living', 'lived'], 1, 'Hiện tại hoàn thành'],
  [2, 'They ______ the report before the meeting started.', ['finished', 'had finished', 'have finished', 'finish'], 1, 'Quá khứ hoàn thành'],
  [3, 'The results ______ next Monday.', ['will announce', 'will be announced', 'are announcing', 'announce'], 1, 'Bị động'],
  [4, 'Many people ______ that service teaches responsibility.', ['believes', 'believe', 'is believing', 'believing'], 1, 'Hoà hợp chủ–vị'],
  [5, 'If I ______ more time, I would travel more.', ['have', 'had', 'will have', 'would have'], 1, 'Câu điều kiện'],
  [6, 'She asked me where I ______ the money.', ['found', 'had found', 'have found', 'find'], 1, 'Câu tường thuật'],
  [7, 'This is ______ interesting book I have read.', ['a most', 'the most', 'most', 'more'], 1, 'Mạo từ'],
  [8, 'The government ______ a new policy every year.', ['announces', 'announce', 'are announcing', 'have announced'], 0, 'Hoà hợp chủ–vị'],
  [9, 'He has been living here ______ ten years.', ['since', 'for', 'during', 'in'], 1, 'Giới từ thời gian'],
  [10, 'The bridge ______ in 1890 and still stands.', ['built', 'was built', 'has built', 'is building'], 1, 'Bị động'],
  [11, 'Neither the students nor the teacher ______ satisfied.', ['are', 'is', 'were', 'being'], 1, 'Hoà hợp chủ–vị'],
  [12, 'By this time next year she ______ her degree.', ['will finish', 'will have finished', 'finishes', 'is finishing'], -1, 'Tương lai hoàn thành'],
  [13, 'I wish I ______ how to swim.', ['know', 'knew', 'have known', 'will know'], 1, 'Câu điều kiện'],
  [14, 'It was ______ hot day that we stayed indoors.', ['so a', 'such a', 'such', 'so'], 1, 'Mạo từ'],
  [15, 'The book ______ I borrowed was excellent.', ['who', 'which', 'whose', 'what'], 1, 'Đại từ quan hệ'],
  [16, 'A lot of damage ______ by the storm.', ['were caused', 'was caused', 'have caused', 'causing'], 1, 'Bị động'],
  [17, 'She denied ______ the window.', ['to break', 'breaking', 'break', 'broken'], 1, 'Động từ nguyên mẫu / V-ing'],
  [18, 'Hardly ______ when the phone rang.', ['I had sat down', 'had I sat down', 'I sat down', 'did I sit down'], 1, 'Đảo ngữ'],
  [19, 'He is used to ______ up early.', ['get', 'getting', 'got', 'gets'], 1, 'Động từ nguyên mẫu / V-ing'],
  [20, 'The teacher ______ explanation was clear retired last year.', ['who', 'whom', 'whose', 'which'], 2, 'Đại từ quan hệ'],
]

function CAU_HOI_NGU_PHAP(): CauHoi[] {
  return NGU_PHAP.map(([no, de, luaChon, dung, chuDe]) => ({
    no,
    loai: 'mcq' as const,
    de,
    luaChon,
    // `dung: -1` = máy không tìm ra đáp án. Ghi `dapAn: null` + cảnh báo, đúng như câu 5 của
    // đề Reading: đề vẫn lưu được, câu đó chấm tay cho tới khi cô điền.
    dapAn: dung < 0 ? null : luaChon[dung]!,
    ...(dung < 0 ? { canhBao: 'Không tìm thấy đáp án ở trang 3 — chữ mờ' } : {}),
    chuDeCau: chuDe,
  }))
}

/** Nhận xét nháp: viết theo giọng cô, có lỗi cụ thể, không có câu chung chung. */
function nhapChoBai(
  baiNopId: string,
  band: NhapCham['band'],
  tinCay: number,
  co: LoiDanhDau[],
  nhanXet: string,
  ganCo: string[],
): NhapCham {
  return { id: `nc-${baiNopId}`, baiNopId, band, tinCay, co, nhanXet, ganCo, hetHan: luc(14) }
}


const DOAN_FOG = {
  ten: 'Passage 1 · Đoạn văn gắn với câu 1–13',
  tuCau: 1,
  denCau: 13,
  noiDung:
    'The idea of harvesting water from fog is not new. In the Atacama Desert of Chile, where rainfall is almost nonexistent, communities have long relied on large mesh nets that capture droplets from coastal fog. As the moist air moves inland, it passes through the mesh; droplets coalesce, run down the fibres and collect in gutters below. A single well-sited net can yield several hundred litres on a good day, though output falls sharply when the fog layer sits above the collectors.',
}

/**
 * Ba câu đầu của đề Reading — đúng ba ca mà màn duyệt câu hỏi phải xử được.
 *
 * Câu 12 KHÔNG có đáp án: máy đọc được đề nhưng không tìm ra đáp án trong tệp. Đó là ca
 * quan trọng nhất của cả trình thuật sĩ — đề vẫn lưu được, câu đó chấm tay cho tới khi cô
 * điền. Bỏ ca này đi thì màn duyệt chỉ còn là màn bấm Tiếp tục bốn lần.
 */
function CAU_HOI_FOG_BUILD(): CauHoi[] {
  return [
    {
      no: 1,
      loai: 'mcq',
      de: 'What does the writer say about fog harvesting in the Atacama Desert?',
      luaChon: [
        'It was introduced by foreign scientists.',
        'It has been used by local communities for a long time.',
        'It is more expensive than desalination.',
        'It only works during winter.',
      ],
      dapAn: 'It has been used by local communities for a long time.',
      trangNguon: 1,
    },
    {
      no: 2,
      loai: 'fill',
      de: 'Complete the sentence with NO MORE THAN TWO WORDS: The nets capture droplets from ______.',
      dapAn: 'coastal fog',
      trangNguon: 1,
    },
    {
      no: 12,
      loai: 'mcq',
      de: 'According to paragraph C, the main limitation of the technique is',
      luaChon: [
        'the cost of the mesh material.',
        'the amount of maintenance required.',
        'its dependence on specific weather conditions.',
        'the lack of government support.',
      ],
      dapAn: null,
      canhBao: 'Không tìm thấy đáp án trong tệp — cô chọn đáp án đúng, hoặc để chấm tay.',
      trangNguon: 3,
    },
  ]
}
const CAU_HOI_FOG: CauHoi[] = CAU_HOI_FOG_BUILD()

/**
 * Ba đề máy vừa đọc xong, đang chờ cô duyệt nhãn.
 *
 * Đây là chồng việc thật của màn Ngân hàng đề: không phải "312 đề" mà là BA đề cần cô nhìn.
 * Mỗi đề một kết cục khác nhau — máy chắc, máy gặp chữ mờ, và cô tự soạn không qua OCR —
 * vì một danh sách mà cả ba dòng giống nhau thì không dạy được gì.
 */
const DE_CHO_DUYET: De[] = [
  {
    id: 'de-ocr-w2',
    ten: 'Cambridge 19 — Test 2 Writing',
    kyNang: 'writing',
    trinhDo: 'IELTS 6.5',
    cachCham: 'draft',
    tinCayOcr: 0.94,
    nguon: { loai: 'anh', soTrang: 12 },
    nhanDeXuat: ['Task 2', 'Education', '6.5'],
    trangThaiNhan: 'cho_duyet',
    thoiGianPhut: 40,
    chuDe: ['Education'],
    cauHoi: CAU_HOI_EDUCATION,
  },
  {
    id: 'de-ocr-r2',
    ten: 'Cambridge 19 — Test 2 Reading',
    kyNang: 'reading',
    trinhDo: 'IELTS 6.5',
    cachCham: 'auto',
    tinCayOcr: 0.88,
    nguon: { loai: 'anh', soTrang: 8 },
    nhanDeXuat: ['Reading', '3 passage'],
    trangThaiNhan: 'chu_mo',
    choMo: ['Trang 3 — chữ mờ ở câu 12', 'Trang 6 — chữ mờ ở câu 27'],
    thoiGianPhut: 60,
    chuDe: ['Science', 'Environment'],
    doanVan: [DOAN_FOG],
    cauHoi: CAU_HOI_FOG,
  },
  {
    id: 'de-pdf-env3',
    ten: 'Đề tự soạn — Environment 3',
    kyNang: 'writing',
    trinhDo: 'IELTS 6.0',
    cachCham: 'draft',
    tinCayOcr: 0.99,
    nguon: { loai: 'pdf' },
    nhanDeXuat: ['Task 2', 'Environment', '6.0'],
    trangThaiNhan: 'da_duyet',
    thoiGianPhut: 40,
    chuDe: ['Environment'],
    cauHoi: [
      {
        no: 1,
        loai: 'essay',
        de: 'Some argue that individual action on climate change is meaningless without government regulation. To what extent do you agree?',
      },
    ],
  },
]


/**
 * Đề giấy mười năm của cô, đã số hoá.
 *
 * Sinh ra chứ không gõ tay từng dòng — ngân hàng chỉ có sáu đề thì thanh "theo kỹ năng"
 * không nói được gì, mà đó lại là thứ bán được: "10 năm đề giấy giờ tìm được trong 2 giây".
 * Nội dung câu hỏi để rỗng vì màn này không mở từng đề ra đọc; cái nó cần là nhãn và số đếm.
 */
function khoDeCu(): De[] {
  const BO: [De['kyNang'], string, string[], number][] = [
    ['writing', 'Writing Task 2', ['Education', 'Technology', 'Environment', 'Health', 'Crime', 'Work'], 38],
    ['writing', 'Writing Task 1', ['Line graph', 'Bar chart', 'Pie chart', 'Process', 'Map'], 24],
    ['reading', 'Reading', ['Science', 'History', 'Nature', 'Society'], 21],
    ['listening', 'Listening', ['Section 1', 'Section 2', 'Section 3', 'Section 4'], 16],
    ['speaking', 'Speaking', ['Part 1', 'Part 2', 'Part 3'], 14],
    ['grammar', 'Ngữ pháp', ['Thì', 'Mệnh đề quan hệ', 'Bị động', 'Giới từ'], 11],
  ]

  const ket: De[] = []
  for (const [kyNang, nhom, chuDe, soLuong] of BO) {
    for (let i = 1; i <= soLuong; i++) {
      const cd = chuDe[i % chuDe.length]!
      ket.push({
        id: `de-kho-${kyNang}-${i}`,
        ten: `${nhom} · ${cd} ${Math.ceil(i / chuDe.length)}`,
        kyNang,
        trinhDo: ['IELTS 5.5', 'IELTS 6.5', 'IELTS 7.0+'][i % 3],
        cachCham: kyNang === 'writing' || kyNang === 'speaking' ? 'draft' : 'auto',
        tinCayOcr: 0.9 + ((i * 7) % 9) / 100,
        nguon: { loai: i % 3 === 0 ? 'pdf' : 'anh', soTrang: 2 + (i % 10) },
        nhanDeXuat: [nhom, cd],
        // KHÔNG đặt `trangThaiNhan`: đề này đã vào kho từ lâu, nó không còn nằm trong luồng
        // số hoá nữa. Đặt 'da_duyet' thì tab "Chờ duyệt nhãn" quét cả kho — 127 dòng thay
        // vì 3 — và chồng việc mất nghĩa ngay lập tức.
        trangThaiNhan: undefined,
        chuDe: [cd],
        cauHoi: [],
      })
    }
  }
  return ket
}

export function duLieuBanDau(): DuLieuDemo {
  const taiKhoan: TaiKhoan[] = [
    { id: CO_THAO, ten: 'Cô Thảo', email: 'co.thao@oblue.vn', mau: 'purple' },
    { id: TRO_GIANG, ten: 'Phạm Lan', phone: '+84901000004', mau: 'green' },
    ...HOC_VIEN.map((h) => ({ id: h.id, ten: h.ten, phone: `+8490100${h.id.slice(-2)}00`, mau: h.mau })),
    ...HOC_VIEN_PHU.map((h) => ({ id: h.id, ten: h.ten, phone: h.phone, mau: h.mau })),
  ]

  const lop: Lop[] = [
    /*
     * Bốn lớp đang chạy, 58 học viên — đúng sĩ số bản mẫu.
     *
     * Mười tám em của lớp 6.5 có tên thật, bài viết thật, hồ sơ thật: đó là lớp mọi màn
     * demo đi qua. Bốn mươi em ba lớp còn lại chỉ cần có mặt để panel và học phí đọc đúng —
     * cho các em đó bài viết nữa là làm chồng bài chấm phình ra mà không kể thêm gì.
     */
    { id: 'lop-65', ten: 'IELTS 6.5 · Tối T3/T5', lich: 'T3, T5 · 19:30', trangThai: 'running',
      mau: 'blue', hocVienIds: HOC_VIEN.map((h) => h.id) },
    { id: 'lop-55', ten: 'IELTS 5.5 · Sáng T7/CN', lich: 'T7, CN · 8:30', trangThai: 'running',
      mau: 'purple', hocVienIds: THEM(16, 'l55') },
    { id: 'lop-cap-toc', ten: 'Writing cấp tốc · 1 kèm 4', lich: 'T2 · 20:00', trangThai: 'running',
      mau: 'orange', hocVienIds: THEM(4, 'lct') },
    { id: 'lop-speak', ten: 'Speaking club · T4', lich: 'T4 · 19:00', trangThai: 'running',
      mau: 'green', hocVienIds: THEM(20, 'lsp') },
    /*
     * Lớp sắp mở: HAI em đã đăng ký, đúng bằng con số trong ghi chú.
     *
     * Để `hocVienIds` rỗng mà ghi chú vẫn viết "2/6" thì thẻ lớp đếm ra 0 và tự mâu thuẫn
     * với chính dòng ngay bên cạnh. Hai em này là em đủ điều kiện lên lớp từ lớp 6.5 —
     * cùng người, lớp mới, đó chính là "mở lớp thứ 3 không kiệt sức".
     */
    { id: 'lop-moi', ten: 'IELTS 7.0+ · nhóm 6', lich: '22/9 · T2, T5 · 19:30',
      trangThai: 'opening', mau: 'indigo', hocVienIds: ['hv-02', 'hv-07'],
      ghiChu: '2/6 đăng ký · khai giảng 22/9' },
  ]

  const de: De[] = [
    { id: 'de-w1', ten: 'Writing Task 2 · Community service', kyNang: 'writing', trinhDo: 'B2–C1',
      cachCham: 'draft', cauHoi: CAU_HOI_WRITING },
    { id: 'de-r1', ten: 'Cambridge 19 · Reading Test 1', kyNang: 'reading', trinhDo: 'B2',
      cachCham: 'auto', tinCayOcr: 0.94, cauHoi: CAU_HOI_READING },
    { id: 'de-w2', ten: 'Writing Task 1 · Bar chart — Museums', kyNang: 'writing',
      trinhDo: 'B2', cachCham: 'draft', cauHoi: CAU_HOI_WRITING },
    /*
     * Đề này trước đây tên là "40 câu" mà mang đúng 5 câu đọc hiểu về trà — dùng chung
     * `CAU_HOI_READING` với đề Reading. Tên nói một đằng, nội dung một nẻo, và nó chưa bao
     * giờ được giao nên không ai phát hiện. Nay có nội dung thật và được giao cho lớp 6.5.
     */
    { id: 'de-g1', ten: 'Trắc nghiệm ngữ pháp 3 · 20 câu', kyNang: 'grammar', trinhDo: 'B1',
      cachCham: 'auto', tinCayOcr: 0.99, thoiGianPhut: 15,
      chuDe: ['Thì', 'Bị động', 'Câu điều kiện', 'Đại từ quan hệ'],
      cauHoi: CAU_HOI_NGU_PHAP() },
    { id: 'de-l1', ten: 'Cambridge 18 · Listening Test 2', kyNang: 'listening', trinhDo: 'B2',
      cachCham: 'auto', tinCayOcr: 0.71, cauHoi: CAU_HOI_READING },
    { id: 'de-w3', ten: 'Cambridge 19 · Test 2 — Task 2 Education', kyNang: 'writing',
      trinhDo: 'B2–C1', cachCham: 'draft', cauHoi: CAU_HOI_EDUCATION },
    ...DE_CHO_DUYET,
    ...khoDeCu(),
  ]

  /*
   * Bốn bài đã xong dựng nên bảng điểm, một bài đang chấm, một bài đang mở.
   *
   * Không có lịch sử thì bảng điểm chỉ có một cột và "band tăng hay tụt" thành vô nghĩa —
   * mà đó mới là thứ cô nhìn bảng điểm để tìm.
   */
  const baiGiao: BaiGiao[] = [
    { id: 'bg-t1a', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-52, 19), lanThu: 1,
      nhan: 'Task 1 — Line graph', trongSo: 5, daXong: true, cauHoi: chupCauHoi(CAU_HOI_WRITING) },
    { id: 'bg-mock1', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-42, 19), lanThu: 1,
      nhan: 'Mock 1', trongSo: 20, daXong: true, cauHoi: chupCauHoi(CAU_HOI_WRITING) },
    { id: 'bg-t2tech', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-31, 19), lanThu: 1,
      nhan: 'Task 2 — Technology', trongSo: 10, daXong: true, cauHoi: chupCauHoi(CAU_HOI_WRITING) },
    { id: 'bg-t1bar', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-21, 19), lanThu: 1,
      nhan: 'Task 1 — Bar chart', trongSo: 5, daXong: true, cauHoi: chupCauHoi(CAU_HOI_WRITING) },
    { id: 'bg-w1', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-1, 23), lanThu: 1,
      nhan: 'Task 2 — Community service', trongSo: 10, cauHoi: chupCauHoi(CAU_HOI_WRITING) },
    { id: 'bg-w2', lopId: 'lop-65', deId: 'de-w3', hanNop: luc(2, 19), lanThu: 1,
      nhan: 'Task 2 — Education', trongSo: 10, cauHoi: chupCauHoi(CAU_HOI_EDUCATION) },
    { id: 'bg-r1', lopId: 'lop-65', deId: 'de-r1', hanNop: luc(2, 23), lanThu: 1,
      nhan: 'Reading Test 1', trongSo: 5, cauHoi: chupCauHoi(CAU_HOI_READING) },
    { id: 'bg-w1-55', lopId: 'lop-55', deId: 'de-w1', hanNop: luc(1, 23), lanThu: 1,
      nhan: 'Task 2 — Community service', trongSo: 10, cauHoi: chupCauHoi(CAU_HOI_WRITING) },
    /*
     * Bài trắc nghiệm cả lớp đã nộp — bước 4 của vòng vận hành.
     *
     * Hạn đã qua và 18/18 em đã nộp: đúng tình huống tối chủ nhật cô mở màn Chấm bài ra và
     * thấy "10 trắc nghiệm đã chấm xong, chỉ cần chốt điểm cả lớp".
     */
    { id: 'bg-g1', lopId: 'lop-65', deId: 'de-g1', hanNop: luc(-2, 23), lanThu: 1,
      nhan: 'Trắc nghiệm ngữ pháp 3', trongSo: 5, cauHoi: chupCauHoi(CAU_HOI_NGU_PHAP()) },
  ]

  // Bảy em đã nộp bài Writing — đây là chồng bài "tối chủ nhật" của cô.
  const daNop = HOC_VIEN.slice(0, 7)
  const baiNop: BaiNop[] = daNop.map((h, i) => ({
    id: `bn-${h.id}`,
    baiGiaoId: 'bg-w1',
    hocVienId: h.id,
    soTu: [268, 301, 254, 289, 312, 243, 276][i]!,
    nopLuc: luc(-1, [20, 21, 22, 20, 23, 21, 22][i]!),
    muon: i === 4,
    noiDung: BAI_MAU[i]!,
  }))

  const nhapCham: NhapCham[] = [
    nhapChoBai('bn-hv-01', { tr: 6.5, cc: 6.0, lr: 6.5, gra: 6.0 }, 0.91,
      [{ trich: 'the goverment', sua: 'the government', loai: 'chính tả', nhom: 'vocab' },
       { trich: 'people is', sua: 'people are', loai: 'hoà hợp chủ–vị', nhom: 'grammar',
         themY: 'Lỗi này lặp 3 bài liên tiếp' }],
      'Bài của em có bố cục rõ, hai thân bài đều có ví dụ. Chỗ cần sửa vẫn là hoà hợp chủ–vị — "people is" lặp lại lần thứ ba trong bốn bài gần đây. Em thử đọc to câu trước khi nộp, lỗi này nghe ra ngay.',
      []),
    nhapChoBai('bn-hv-02', { tr: 7.0, cc: 7.0, lr: 6.5, gra: 6.5 }, 0.88,
      [{ trich: 'In conclusion, I think that', sua: 'To conclude,', loai: 'lặp mở đầu',
         nhom: 'structure' },
       { trich: 'important … significant … important', sua: 'pivotal, far-reaching',
         loai: 'lặp nhóm từ', nhom: 'vocab', themY: 'Ba lần trong một bài' },
       { trich: 'the same could be said of mathematics', sua: 'thêm một câu nối trước ý này',
         loai: 'ý chuyển gấp', nhom: 'structure' }],
      'Lập luận của em chặt, phần phản biện ở đoạn 3 là điểm mạnh. Từ vựng còn lặp ở nhóm "important/significant" — thử thay bằng "pivotal", "far-reaching" cho đúng sắc thái.',
      []),
    nhapChoBai('bn-hv-03', { tr: 5.5, cc: 5.0, lr: 5.5, gra: 5.0 }, 0.74,
      [{ trich: 'Firstly, secondly, finally', sua: 'dùng liên kết đa dạng hơn',
         loai: 'liên kết máy móc', nhom: 'structure', themY: 'Cả lớp sai chỗ này — 6/10 em' },
       { trich: 'I strongly believe strongly', sua: 'I strongly believe', loai: 'lặp từ',
         nhom: 'vocab' }],
      'Em trả lời đúng đề nhưng đoạn 2 mới có một ý, chưa có ví dụ đỡ. Liên kết đang dùng theo công thức "Firstly/Secondly" — giám khảo trừ chỗ này. Em viết lại đoạn 2 với một ví dụ thật từ trường mình.',
      ['Tin cậy 74% — dưới ngưỡng 85%, cô xem kỹ giúp em', 'Lệch 1.5 band so với bài trước của em này']),
    nhapChoBai('bn-hv-04', { tr: 6.0, cc: 6.5, lr: 6.0, gra: 6.0 }, 0.93,
      [{ trich: 'Opponents worry about the burden', sua: 'thêm số liệu hoặc ví dụ',
         loai: 'phản biện chưa có đỡ', nhom: 'structure' }], 
      'Bố cục tốt, mở bài đi thẳng vào vấn đề. Em giữ được mạch đến hết bài. Lần sau thử thêm một câu nhượng bộ ở đoạn 3 để lập luận cân hơn.', []),
    nhapChoBai('bn-hv-05', { tr: 6.5, cc: 6.0, lr: 7.0, gra: 6.0 }, 0.86,
      [{ trich: 'Despite of', sua: 'Despite', loai: 'giới từ thừa', nhom: 'grammar' },
       { trich: 'schools compel attendance, homework and examinations',
         sua: 'thêm ví dụ cụ thể sau câu này', loai: 'khẳng định chưa có đỡ',
         nhom: 'structure' }],
      'Từ vựng của em là điểm sáng — "compulsory", "civic duty" dùng đúng chỗ. Ngữ pháp còn vướng "Despite of", em nhớ "despite" đứng một mình.',
      ['Nộp muộn 40 phút']),
    nhapChoBai('bn-hv-06', { tr: 6.0, cc: 6.0, lr: 6.0, gra: 5.5 }, 0.9,
      [{ trich: 'student which', sua: 'students who', loai: 'đại từ quan hệ', nhom: 'grammar' },
       { trich: 'This is true but a few hours each month is not too much',
         sua: 'This is true, but a few hours each month is not excessive',
         loai: 'thiếu dấu phẩy + từ đời thường', nhom: 'vocab' },
       { trich: 'In conclusion I agree', sua: 'In conclusion, I agree',
         loai: 'thiếu dấu phẩy sau liên từ', nhom: 'grammar',
         themY: 'Lỗi này lặp 2 bài liên tiếp' }],
      'Em bám sát đề và đủ 250 từ. Câu phức còn ít, chủ yếu là câu đơn nối bằng "and". Thử gộp hai câu ngắn thành một câu có mệnh đề quan hệ.',
      []),
    nhapChoBai('bn-hv-07', { tr: 7.0, cc: 6.5, lr: 7.0, gra: 7.0 }, 0.95,
      [{ trich: 'Consider first what service actually teaches.',
         sua: 'câu này mở đoạn tốt — giữ cách viết này',
         loai: 'điểm mạnh, không phải lỗi', nhom: 'vocab' }],
      'Bài chắc tay. Lập luận có chiều sâu, ví dụ cụ thể, ngữ pháp gần như sạch. Em giữ nhịp này. Nếu muốn lên nữa thì để ý nhịp câu — vài câu dài liền nhau làm đoạn 2 hơi nặng.',
      []),
  ]

  /** Lớp 1: nhận xét cô đã gửi. Bơm ở dưới, sau khi có đủ bài nộp lịch sử. */
  const nhanXet: NhanXet[] = []

  const baiDang: BaiDang[] = [
    { id: 'bd-1', lopId: 'lop-65', tacGiaId: CO_THAO, loai: 'post',
      noiDung: 'Buổi tới cô chữa Writing Task 2 theo bài các em vừa nộp. Em nào chưa nộp thì nộp trước 21h mai nhé.', luc: luc(-1, 8) },
    { id: 'bd-2', lopId: 'lop-65', tacGiaId: null, loai: 'system',
      noiDung: 'Bài mới: Cambridge 19 · Reading Test 1 — hạn nộp 23:00 ngày kia.', luc: luc(0, 7) },
    // Câu hỏi chưa ai trả lời: đầu vào của màn "Việc của tôi" bên trợ giảng.
    { id: 'bd-3', lopId: 'lop-65', tacGiaId: 'hv-03', loai: 'post',
      noiDung: 'Cô ơi đề Education này em viết theo hướng "đồng ý một phần" có được không ạ?',
      luc: luc(0, 21) },
  ]

  /*
   * Hồ sơ mười em lớp 6.5. Số liệu đặt sao cho bảng điểm có chuyện để kể: Thu Hà đi lên
   * đều, Bảo Ngọc tụt, Đức Thắng nộp muộn quen tay, Khánh Linh chưa bật tài khoản.
   * Bảng điểm mà em nào cũng 6.0 thì cô nhìn xong không rút ra được gì.
   */
  const hoSo: HoSoHocVien[] = [
    { id: 'hv-01', bandTb: 6.3, huong: 'up', coTaiKhoan: true,
      loiHayGap: 'Hoà hợp chủ–vị ×3', hanHocPhi: '30/9', mucTieu: 6.5,
      ghiChu: 'Bố mẹ muốn em thi tháng 12. Hơi vội — nói chuyện lại sau Mock 2.',
      loiLap: [
        { ten: 'Hoà hợp chủ ngữ – động từ', y: '3 bài liên tiếp · đã giao bài luyện', nang: 'do' },
        { ten: 'Mở đoạn kết quen tay', y: '2/3 bài gần nhất', nang: 'cam' },
        { ten: 'Overview Task 1', y: 'đã dứt từ tuần 5 — không tái phạm', nang: 'xanh' },
      ],
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 6.0 }, 'bg-t2tech': { band: 6.0 },
              'bg-t1bar': { band: 6.5 }, 'bg-w1': { band: null } } },
    { id: 'hv-02', bandTb: 6.9, huong: 'up', coTaiKhoan: true,
      loiHayGap: '—', hanHocPhi: '12/10',
      diem: { 'bg-t1a': { band: 6.0 }, 'bg-mock1': { band: 6.5 }, 'bg-t2tech': { band: 7.0 },
              'bg-t1bar': { band: 7.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-03', bandTb: 5.2, huong: 'down', coTaiKhoan: true,
      loiHayGap: 'Liên kết máy móc ×4', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 5.0 },
              'bg-t1bar': { band: 5.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-04', bandTb: 6.1, huong: 'flat', coTaiKhoan: true,
      loiHayGap: 'Phản biện chưa có đỡ', hanHocPhi: '15/10',
      diem: { 'bg-t1a': { band: 6.0 }, 'bg-mock1': { band: 6.0 }, 'bg-t2tech': { band: 6.5 },
              'bg-t1bar': { band: 6.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-05', bandTb: 6.2, huong: 'flat', coTaiKhoan: true,
      loiHayGap: 'Nộp muộn 4/6', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 6.0, muon: true }, 'bg-mock1': { band: 6.5 },
              'bg-t2tech': { band: 6.0, muon: true }, 'bg-t1bar': { band: null },
              'bg-w1': { band: null, muon: true } } },
    { id: 'hv-06', bandTb: 5.8, huong: 'up', coTaiKhoan: false,
      loiHayGap: 'Câu phức còn ít', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.0 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 6.0 },
              'bg-t1bar': { band: 6.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-07', bandTb: 6.9, huong: 'up', coTaiKhoan: true,
      loiHayGap: '—', hanHocPhi: '12/10',
      diem: { 'bg-t1a': { band: 6.5 }, 'bg-mock1': { band: 6.5 }, 'bg-t2tech': { band: 7.0 },
              'bg-t1bar': { band: 7.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-08', bandTb: 5.5, huong: 'flat', coTaiKhoan: true,
      loiHayGap: 'Bài ngắn ×2', hanHocPhi: '15/10',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 5.5 },
              'bg-t1bar': { band: 5.5 }, 'bg-w1': { band: null } } },
    { id: 'hv-09', bandTb: 4.9, huong: 'down', coTaiKhoan: true,
      loiHayGap: 'Đọc hiểu', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.0 }, 'bg-t2tech': { band: 4.5 },
              'bg-t1bar': { band: 4.5 }, 'bg-w1': { band: null } } },
    { id: 'hv-10', bandTb: 5.6, huong: 'flat', coTaiKhoan: false,
      loiHayGap: 'Bị động ×5', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 5.5 },
              'bg-t1bar': { band: 6.0, muon: true }, 'bg-w1': { band: null } } },
  ]

  /*
   * Mục tiêu band cho những em chưa đặt tay.
   *
   * Làm tròn lên nửa bậc so với band hiện tại, tối thiểu hơn nửa band. Không có mục tiêu thì
   * "tăng 0.5" không nói được là đủ hay chưa — mà đó là câu cô nhìn cột này để hỏi.
   */
  const mucTieuTu = (band: number): number => Math.min(9, Math.ceil((band + 0.5) * 2) / 2)

  /*
   * Tám em vào lớp 6.5 muộn: có hồ sơ, chưa có điểm bài nào.
   *
   * `diem` rỗng và bảng điểm vẫn phải đọc được với ô trống — đó là trạng thái thật của em
   * vào giữa khoá, và cũng là chỗ cô nhìn ra ai đang bị bỏ lại.
   */
  const HO_SO_LOP_KHAC: [string, number, HoSoHocVien['huong'], boolean, string, string][] = [
    ['hv-11', 7.2, 'up', true, '—', '20/10'],
    ['hv-12', 6.8, 'flat', true, 'Dấu câu trong câu ghép', '20/10'],
    ['hv-13', 7.0, 'up', true, '—', '20/10'],
    ['hv-14', 6.5, 'down', true, 'Nghe số liệu ×3', '5/10'],
    ['hv-15', 7.1, 'flat', true, '—', '20/10'],
    ['hv-16', 6.6, 'up', false, 'Phát âm đuôi -ed', '5/10'],
    ['hv-17', 4.2, 'up', true, 'Trật tự từ', '28/9'],
    ['hv-18', 4.5, 'flat', false, 'Thì quá khứ', '28/9'],
  ]

  for (const [id, bandTb, huong, coTaiKhoan, loiHayGap, hanHocPhi] of HO_SO_LOP_KHAC) {
    hoSo.push({
      id, bandTb, huong, coTaiKhoan, loiHayGap, hanHocPhi,
      mucTieu: mucTieuTu(bandTb), diem: {},
    })
  }

  /*
   * Hồ sơ cho bốn mươi em ba lớp còn lại.
   *
   * `coTaiKhoan` cứ ba em một em chưa bật — đúng tỉ lệ bản mẫu (41/58), và đó là con số có
   * nghĩa: em chưa bật tài khoản thì máy không nhắc được, cô phải nhắc tay.
   */
  for (const [i, h] of HOC_VIEN_PHU.entries()) {
    const band = Number((4.5 + ((i * 7) % 25) / 10).toFixed(1))
    hoSo.push({
      id: h.id,
      bandTb: band,
      /*
       * Nghiêng về đi lên và đi ngang: cứ bảy em mới có một em tụt.
       *
       * Chia đều ba hướng thì một phần ba lớp đang tụt, và màn "Cần chú ý" liệt kê 16/58 em
       * — đó là lớp đang vỡ, không phải lớp của cô Thảo. Số em cần can thiệp phải đủ ít để
       * cô làm hết được trong một buổi tối, nếu không thì danh sách đó cũng vô dụng.
       */
      huong: i % 7 === 3 ? 'down' : i % 2 === 0 ? 'up' : 'flat',
      coTaiKhoan: i % 3 !== 2,
      loiHayGap: ['—', 'Thì quá khứ', 'Giới từ', 'Phát âm đuôi -s'][i % 4]!,
      hanHocPhi: ['30/9', '5/10', '15/10', '20/10'][i % 4]!,
      mucTieu: mucTieuTu(band),
      diem: {},
    })
  }

  /*
   * Mười tám em nộp bài trắc nghiệm — SỰ THẬT (lớp 1), chỉ là đáp án em chọn.
   *
   * Điểm KHÔNG nằm ở đây. Điểm là thứ máy suy ra khi so đáp án em chọn với đáp án của đề, và
   * nó phải tính lại được: cô sửa đáp án câu 12 trong ngân hàng đề thì điểm cả lớp đổi theo.
   * Cắm sẵn "17/19" vào bài nộp là biến một con số suy ra thành một con số bịa — đúng lỗi
   * vừa bỏ đi ở `diHoc: '28/30'`.
   *
   * Em sai nhiều hay ít suy từ BAND CỦA CHÍNH EM, không từ chỉ số trong mảng.
   *
   * Lần đầu em viết `(i + no) % max(3, 12 - i)`, và số in ra tự tố cáo: Minh Anh 19/19 (trái
   * với chính ghi chú em vừa viết), rồi tám em cuối chỉ có ba mẫu câu sai lặp lại ba lần —
   * bảng chốt điểm mà cô đọc sẽ thấy ngay là máy phát. Tệ hơn: bảng điểm viết nói Gia Bảo
   * 4.9 còn trắc nghiệm nói em ấy khá — hai bộ dữ liệu kể hai câu chuyện rời nhau về cùng
   * một đứa trẻ. Buộc vào band thì em yếu ở bài viết cũng yếu ở ngữ pháp, và đó là lý do
   * đầu tiên cô tin vào số trên màn.
   *
   * Đáp án sai chọn lựa chọn KẾ TIẾP, không chọn bừa: em học sai thì sai có lý, và chọn bừa
   * thì cột "Sai ở đâu" không gom thành chủ đề nào.
   */
  const CAU_G1 = CAU_HOI_NGU_PHAP()
  const baiNopTracNghiem: BaiNop[] = HOC_VIEN.map((h, i) => {
    const band = hoSo.find((x) => x.id === h.id)?.bandTb ?? 6
    /*
     * SỐ câu sai suy từ band, rồi mới chọn LÀ những câu nào. Không dùng công thức chia lấy dư.
     *
     * Hai lần thử trước đều dùng `(i * 3 + no) % nhịp === 0`, và cả hai lần số in ra đều
     * sai kiểu khác nhau: nhịp nhỏ thì tám em cuối chỉ có ba mẫu câu sai lặp lại, nhịp lớn
     * thì SÁU em được 19/19 — vì với nhịp lớn, chẳng bội số nào của nó rơi vào khoảng 1–20.
     * Chia lấy dư cho ra "trúng hoặc không", nó không cho ra một TỈ LỆ. Muốn điều khiển tỉ lệ
     * thì phải đếm trước rồi chọn sau.
     *
     * Band 7.2 → sai 1 câu (95%); band 4.2 → sai 6 câu (68%). Khoảng đó khớp bản mẫu, chỗ
     * điểm chạy từ 24/40 tới 37/40. Tối thiểu 1: cả lớp 18 em toàn điểm tuyệt đối thì bảng
     * chốt điểm không có gì để cô xem.
     */
    const soSai = Math.min(8, Math.max(1, Math.round((7.5 - band) * 1.7)))

    /* Chọn câu sai: 19 là số nguyên tố nên `(i * 7 + j * 3) % 19` không lặp với j < 19 —
       không phải tự dedupe. `i * 7` đẩy lệch theo em: cùng band không cùng lỗ hổng. */
    const chamDiem = CAU_G1.filter((c) => c.dapAn)
    const sai = new Set<number>()
    for (let j = 0; j < soSai; j += 1) {
      sai.add(chamDiem[(i * 7 + j * 3) % chamDiem.length]!.no)
    }

    const traLoi: Record<number, string> = {}
    for (const c of CAU_G1) {
      const lc = c.luaChon!

      if (!c.dapAn) {
        /*
         * Câu đề CHƯA CÓ đáp án: em chọn theo phân bố riêng, không dựa vào đáp án.
         *
         * Bản đầu em viết `dungIdx = c.dapAn ? indexOf : 0` cho cả câu này, tức là coi lựa
         * chọn A là "đúng". Nó chạy êm cho tới lúc cô điền đáp án câu 12 là "will have
         * finished" (lựa chọn B): khi đó những em bị đánh dấu "làm đúng" hoá ra chọn A —
         * SAI, còn những em bị đánh dấu "làm sai" lại chọn đúng B. Đảo ngược hoàn toàn, và
         * chỉ lộ ra ở màn chốt điểm sau khi đáp án được điền.
         *
         * Không có đáp án thì không có khái niệm đúng-sai để mà suy; chỉ có em đã chọn gì.
         */
        traLoi[c.no] = lc[(i + c.no) % lc.length]!
        continue
      }

      const dungIdx = lc.indexOf(c.dapAn)
      traLoi[c.no] = sai.has(c.no) ? lc[(dungIdx + 1) % lc.length]! : lc[dungIdx]!
    }

    return {
      id: `bn-g1-${h.id}`,
      baiGiaoId: 'bg-g1',
      hocVienId: h.id,
      soTu: 0,
      nopLuc: luc(-2, 19 + (i % 4)),
      muon: i === 9 || i === 14,
      noiDung: '',
      traLoi,
    }
  })

  /*
   * Máy đã chấm nháp từ lúc em nộp — hạn đã qua hai ngày. Dựng bằng CHÍNH hàm chấm, không
   * gõ tay: gõ tay là cắm sẵn điểm, và điểm cắm sẵn thì cô điền đáp án câu 12 xong bảng vẫn
   * nói số cũ.
   */
  const nhapTracNghiem: NhapTracNghiem[] = baiNopTracNghiem.map((b) => {
    const bg = baiGiao.find((g) => g.id === b.baiGiaoId)!
    const deCuaBai = de.find((d) => d.id === bg.deId)
    const k = chamTracNghiem(bg.cauHoi, b.traLoi ?? {}, deCuaBai?.tinCayOcr ?? 0.95)
    return { id: `ntn-${b.id}`, baiNopId: b.id, hetHan: luc(14), ...k }
  })

  const loTrinh: LoTrinh[] = [
    {
      id: 'lt-65',
      ten: 'IELTS 6.5 · 48 buổi',
      moTa: 'Từ 5.0 lên 6.5. Writing và Speaking mỗi tuần, Reading xen kẽ.',
      soBuoi: 48,
      dangDung: ['lop-65'],
      buoi: [
        { no: 28, noiDung: 'Task 2 — Đọc đề và lập dàn ý trong 5 phút',
          baiVeNha: 'Mock 2', deId: 'de-w1', trongSo: 20 },
        { no: 29, noiDung: 'Chữa Mock 2 — lỗi chung của cả lớp' },
        { no: 30, noiDung: 'Thì hiện tại hoàn thành — lớp sai 11/18 bài trước',
          baiVeNha: 'Task 2 — Community service', deId: 'de-w1', trongSo: 10 },
        { no: 31, noiDung: 'Reading — dạng True/False/Not Given',
          baiVeNha: 'Cambridge 19 Test 1', deId: 'de-r1', trongSo: 5 },
      ],
    },
    {
      id: 'lt-55',
      ten: 'IELTS 5.5 · 48 buổi',
      moTa: 'Từ mất gốc lên 5.5. Nặng ngữ pháp nền và vốn từ theo chủ đề.',
      soBuoi: 48,
      dangDung: ['lop-55'],
      buoi: [
        { no: 20, noiDung: 'Thì quá khứ đơn — dạng bất quy tắc hay gặp' },
        { no: 21, noiDung: 'Task 1 — đọc biểu đồ cột và viết câu so sánh',
          baiVeNha: 'Task 1 — Bar chart', deId: 'de-w2', trongSo: 5 },
      ],
    },
    {
      id: 'lt-writing',
      ten: 'Writing 8 tuần · 16 buổi',
      moTa: 'Khoá ngắn, một kèm bốn. Mỗi buổi chữa tay một bài của từng em.',
      soBuoi: 16,
      dangDung: ['lop-cap-toc'],
      buoi: [
        { no: 14, noiDung: 'Task 2 — viết lại phần thân theo nhận xét của cô',
          baiVeNha: 'Task 2 — Education', deId: 'de-w3', trongSo: 15 },
        { no: 15, noiDung: 'Soát lỗi lặp của từng em trước khi kết khoá' },
      ],
    },
    {
      id: 'lt-speak',
      ten: 'Speaking club · 20 buổi',
      moTa: 'Câu lạc bộ nói, không chấm điểm. Mỗi buổi một chủ đề Part 2.',
      soBuoi: 20,
      dangDung: ['lop-speak'],
      buoi: [{ no: 6, noiDung: 'Part 2 — tả một nơi em muốn quay lại' }],
    },
    {
      id: 'lt-70',
      ten: 'IELTS 7.0 · 36 buổi',
      moTa: 'Cho em đã vững 6.5. Nặng về lập luận và độ chính xác từ vựng.',
      soBuoi: 36,
      dangDung: ['lop-moi'],
      buoi: [
        { no: 1, noiDung: 'Câu nhượng bộ — cách viết phản biện không mất lập trường' },
        { no: 2, noiDung: 'Collocation học thuật theo chủ đề Education' },
      ],
    },
  ]

  /* Học phí: hai em quá hạn, ba em sắp tới hạn. Đó là chỗ cô cần nhìn thấy trước. */
  /* Em nào chưa đặt mục tiêu tay thì suy ra — cột "Mục tiêu" trống là cột vô nghĩa. */
  for (const h of hoSo) {
    if (!h.mucTieu) h.mucTieu = mucTieuTu(h.bandTb)
  }

  const hocPhi: HocPhi[] = hoSo.map((h, i) => {
    const trangThai: HocPhi['trangThai'] =
      i % 7 === 0 ? 'qua_han' : i % 3 === 0 ? 'sap_han' : 'da_dong'
    return {
      hocVienId: h.id,
      chuKy: 'Tháng 9/2026',
      soTien: h.id.startsWith('hv-1') && Number(h.id.slice(-2)) >= 17 ? 1_800_000 : 2_400_000,
      hanDong: h.hanHocPhi,
      trangThai,
    }
  })

  /*
   * Lịch sử của em Minh Anh — nguyên liệu của app học viên.
   *
   * Bốn bài đã chấm xong của em, kèm nhận xét CÔ ĐÃ GỬI. Đây là lớp 1: chỉ thêm. App của
   * em đọc đúng những dòng này, nên "Bài của tôi" không phải bảng trang trí — bỏ một dòng
   * ở đây là app của em mất một bài, y như thật.
   *
   * Band lấy thẳng từ `hoSo['hv-01'].diem` để hai màn không kể hai câu chuyện khác nhau.
   */
  const LOI_LAP: LoiDanhDau = {
    trich: 'people is often surprised', sua: 'people are often surprised',
    loai: 'hoà hợp chủ–vị', nhom: 'grammar', themY: 'Lỗi này lặp 3 bài liên tiếp',
  }

  const LICH_SU_MINH_ANH: [string, number, string, boolean, string | null, number | null, LoiDanhDau[]][] = [
    ['bg-t1a', 5.5,
      'Bài đầu tiên của em cô đọc kỹ. Bố cục có, nhưng phần mô tả xu hướng còn liệt kê số liệu thay vì nói xu hướng. Lần sau em thử viết một câu tổng quát trước rồi mới dẫn số.',
      false, null, null,
      [{ trich: 'The number of visitors were rising', sua: 'was rising',
         loai: 'hoà hợp chủ–vị', nhom: 'grammar' },
       { trich: 'go up, go up, go up', sua: 'rose · climbed · increased sharply',
         loai: 'lặp động từ', nhom: 'vocab' }]],
    ['bg-mock1', 6.0,
      'Em lên rõ ở phần mở bài — đi thẳng vào câu hỏi, không vòng vo. Vẫn còn "people is" một lần ở đoạn 2. Cô đánh dấu để em nhớ: danh từ số nhiều thì động từ bỏ -s.',
      true, 'system', 5.5,
      [LOI_LAP,
       { trich: 'Firstly, Secondly, Finally', sua: 'dùng liên kết đa dạng hơn',
         loai: 'liên kết máy móc', nhom: 'structure' }]],
    ['bg-t2tech', 6.0,
      'Lập luận của em có chiều. Hai chỗ hoà hợp chủ–vị lặp lại lần thứ hai rồi — cô giao cho em một bài luyện 5 phút, làm xong cô sẽ thấy trong hồ sơ.',
      true, 'system', 6.5,
      [LOI_LAP,
       { trich: 'the goverment', sua: 'the government', loai: 'chính tả', nhom: 'vocab' },
       { trich: 'Technology make our life easier', sua: 'Technology makes',
         loai: 'hoà hợp chủ–vị', nhom: 'grammar', themY: 'Cùng loại lỗi, lần thứ hai' }]],
    ['bg-t1bar', 6.5,
      'Bài này chắc tay nhất từ đầu khoá. Em giữ đúng cấu trúc này. Chỉ còn hoà hợp chủ–vị — dứt được lỗi đó là Grammar của em lên 6.0, và band chung lên theo.',
      false, 'system', 6.5,
      [{ trich: 'A range of subjects are offered', sua: 'is offered',
         loai: 'hoà hợp chủ–vị', nhom: 'grammar',
         themY: 'Lần thứ ba — cô giao bài luyện 5 phút ở mục Luyện thêm' },
       { trich: 'In conclusion, I think that', sua: 'To conclude,',
         loai: 'mở đoạn kết quen tay', nhom: 'structure' }]],
  ]

  for (const [bgId, band, noiDung, suaTuNhap, nhapBoi, bandNhap, co] of LICH_SU_MINH_ANH) {
    const bnId = `bn-hv-01-${bgId}`
    // Mốc thời gian bám theo hạn của chính bài giao đó, để "nhận xét mới nhất" là bài mới
    // nhất thật — không phải bốn dòng cùng một giờ rồi sắp theo thứ tự khai báo.
    const han = baiGiao.find((g) => g.id === bgId)!.hanNop
    const ngayHan = Math.round((new Date(han).getTime() - Date.now()) / (24 * 3600_000))
    baiNop.push({
      id: bnId, baiGiaoId: bgId, hocVienId: 'hv-01',
      noiDung: BAI_MAU[0]!, soTu: 250 + band * 10, nopLuc: luc(ngayHan, 21), muon: false,
    })
    nhanXet.push({
      id: `nx-${bgId}-hv-01`, baiNopId: bnId, band, noiDung,
      guiLuc: luc(ngayHan + 1, 22), suaTuNhap, co,
      ...(nhapBoi ? { nhapBoi } : {}),
      ...(bandNhap === null ? {} : { bandNhap }),
    })
  }

  /*
   * Hai bài trợ giảng Lan đã nháp và cô đã chốt — nguyên liệu màn "Việc của tôi".
   *
   * Cần cả hai kết cục: một bài cô giữ nguyên band của Lan nhưng viết thêm, một bài cô hạ
   * band. Chỉ có bài "cô giữ nguyên" thì màn đó thành lời khen, không nói được Lan cần sửa gì.
   */
  const NHAP_CUA_LAN: [string, string, number, number, string][] = [
    ['bg-t1bar', 'hv-06', 5.5, 5.5,
      'Lan nháp sát bài. Cô giữ nguyên band, chỉ thêm một câu: em làm rất nhanh — đọc lại đề trước khi viết.'],
    ['bg-t2tech', 'hv-09', 5.5, 5.0,
      'Cô hạ 0.5 so với nháp của Lan: cả hai đoạn thân đều thiếu ví dụ, Task Response không thể 6 khi lập luận chưa có gì đỡ.'],
  ]

  for (const [bgId, hvId, bandNhap, band, noiDung] of NHAP_CUA_LAN) {
    const bnId = `bn-${hvId}-${bgId}`
    baiNop.push({
      id: bnId, baiGiaoId: bgId, hocVienId: hvId,
      noiDung: BAI_MAU[2]!, soTu: 261, nopLuc: luc(-2), muon: false,
    })
    nhanXet.push({
      id: `nx-${bgId}-${hvId}`, baiNopId: bnId, band, noiDung,
      guiLuc: luc(-2, 20), suaTuNhap: band !== bandNhap, nhapBoi: TRO_GIANG, bandNhap,
    })
  }

  /*
   * Bài luyện của em — sinh ra từ LỖI LẶP, không phải từ một bài.
   *
   * Câu 4 cố tình là bẫy ngược: ở đó "is considering" mới đúng. Bài luyện chỉ dạy "đừng dùng
   * số nhiều với -s" thì em học thành phản xạ máy móc, và phản xạ máy móc sai chỗ khác.
   */
  const baiLuyen: BaiLuyen[] = [
    {
      id: 'bl-hv-01-chuvi',
      hocVienId: 'hv-01',
      lopId: 'lop-65',
      ten: '5 câu hoà hợp chủ ngữ – động từ',
      viLoi: 'Lỗi "people is" lặp 3 bài liên tiếp — cô đánh dấu ở Mock 1, Task 2 Technology và bài vừa nộp',
      giaoBoi: CO_THAO,
      cau: [
        {
          cau: 'Many people ___ that community service teaches responsibility.',
          luaChon: ['believes', 'believe', 'is believing', 'believing'],
          dung: 1,
          giaiThichDung: 'Đúng. "People" là số nhiều nên động từ bỏ -s. Đây chính là câu em viết sai ở Mock 1.',
          giaiThichSai: '"People" đã là số nhiều — không thêm -s vào động từ. Câu em viết ở Mock 1 là "people is", cùng một lỗi.',
        },
        {
          cau: 'The government ___ a new policy on tuition fees every year.',
          luaChon: ['announces', 'announce', 'are announcing', 'have announced'],
          dung: 0,
          giaiThichDung: 'Đúng. "The government" là danh từ tập hợp số ít trong tiếng Anh học thuật — động từ có -s.',
          giaiThichSai: 'Tập hợp nhưng số ít: "the government announces". Bài Community service em viết "the goverment" cũng chính là chỗ này.',
        },
        {
          cau: 'A society in which students volunteer regularly ___ lower crime rates.',
          luaChon: ['have', 'are having', 'has', 'having'],
          dung: 2,
          giaiThichDung: 'Đúng — và em vượt được cái bẫy: chủ ngữ là "a society", không phải "students". Mệnh đề xen giữa không đổi chủ ngữ.',
          giaiThichSai: 'Chủ ngữ là "a society" (số ít), không phải "students". Mệnh đề "in which students volunteer" chỉ xen vào giữa — đây là bẫy hay gặp nhất.',
        },
        {
          cau: 'Right now the ministry ___ three different proposals.',
          luaChon: ['considers', 'consider', 'are considering', 'is considering'],
          dung: 3,
          giaiThichDung: 'Đúng — câu này ngược lại. "Right now" là hành động đang diễn ra nên tiếp diễn mới đúng, và "the ministry" số ít nên "is".',
          giaiThichSai: 'Câu này cố tình ngược: "right now" = đang diễn ra, nên tiếp diễn đúng. Không phải cứ tránh tiếp diễn là an toàn — phải nhìn nghĩa.',
        },
        {
          cau: 'Neither the students nor the teacher ___ satisfied with the new timetable.',
          luaChon: ['are', 'is', 'were', 'being'],
          dung: 1,
          giaiThichDung: 'Đúng. Với "neither … nor", động từ theo danh từ ĐỨNG GẦN nhất — ở đây là "the teacher", số ít.',
          giaiThichSai: 'Với "neither … nor", động từ chia theo danh từ đứng gần nó nhất: "the teacher" → "is". Đây là mức 6.5, cô đưa vào để em thấy đích.',
        },
      ],
    },
  ]

  const diemDanh: DiemDanh[] = sinhDiemDanh(lop, CO_THAO)

  const luat: LuatMay[] = [
    { id: 'nhac-nop', bat: true, ten: 'Nhắc nộp bài, nhắc lịch',
      phu: 'Chỉ với học viên đã bật tài khoản · 9:00–21:30' },
    { id: 'chot-mcq', bat: true, ten: 'Chốt điểm trắc nghiệm khi tin cậy ≥ 97%',
      phu: 'Câu chữ mờ vẫn hỏi cô' },
    { id: 'sinh-bai-luyen', bat: true, ten: 'Sinh bài luyện 5 phút khi lỗi lặp ≥ 2 bài',
      phu: 'Gắn kèm nhận xét cô đã duyệt' },
    { id: 'gui-tu-luan', bat: false, ten: 'Gửi nhận xét tự luận không cần cô duyệt',
      phu: 'Cô đang tắt — mọi nhận xét tự luận đều qua tay cô' },
    { id: 'nhan-phu-huynh', bat: false, ten: 'Nhắn phụ huynh',
      phu: 'Chỉ khi cô bật cho từng em; gửi tiến bộ và việc cụ thể, không gửi điểm' },
    { id: 'khoa-hoc-phi', bat: false, khoa: true,
      ten: 'Gửi tin dính học phí khi cô chưa duyệt',
      phu: 'Không có công tắc. `send_actions_owner_only` trong permissions.json chặn ở tầng quyền.' },
    { id: 'khoa-so-sanh', bat: false, khoa: true, ten: 'So sánh em này với em khác cho em xem',
      phu: 'Không có công tắc. Bảng điểm cả lớp là mức `none` với vai học viên.' },
    { id: 'khoa-xuat', bat: true, khoa: true, ten: 'Cô xuất toàn bộ dữ liệu bất cứ lúc nào',
      phu: 'Không tắt được. Học viên thuộc về cô, không thuộc về nền tảng.' },
  ]

  /*
   * Trả về BẢN SAO SÂU, không phải đối tượng gốc.
   *
   * Các hằng ở đầu file (`DE_CHO_DUYET`, `CAU_HOI_*`, `HOC_VIEN`…) là đối tượng dùng chung.
   * Không sao chép thì mọi lần `datLai()` trả về ĐÚNG những đối tượng đã bị sửa lần trước:
   * cô duyệt một nhãn, đặt lại dữ liệu mẫu, nhãn vẫn còn duyệt. Lỗi này đã lộ ra trong test
   * — hai bài kiểm quyền xanh giả vì đề đã bị đổi từ bài kiểm trước đó.
   *
   * `structuredClone` giữ nguyên quan hệ dùng chung BÊN TRONG bản sao, nên chỗ bài giao
   * dùng chung mảng câu hỏi với đề phải cắt riêng — xem `chupCauHoi` bên dưới.
   */
  return structuredClone({
    tenant: { id: 'tn-cothao', subdomain: 'cothao', ten: 'Lớp IELTS của cô Thảo' },
    taiKhoan,
    lop,
    de,
    baiGiao,
    // Hai loại bài nộp, MỘT bảng: bài tự luận mang `noiDung`, bài trắc nghiệm mang
    // `traLoi`. Cùng là `submissions` ở bản thật, cùng một chính sách quyền.
    baiNop: [...baiNop, ...baiNopTracNghiem],
    nhapCham,
    nhapTracNghiem,
    nhanXet,
    baiDang,
    hoSo,
    loTrinh,
    hocPhi,
    baiLuyen,
    diemDanh,
    luat,
    vai: { owner: CO_THAO, assistant: TRO_GIANG, student: 'hv-01' },
  })
}

/** Bảy bài viết thật, mỗi bài một giọng khác nhau — để màn chấm bài không đọc như một người. */
const BAI_MAU: string[] = [
  'In recent years, many educators have argued that community service should become a mandatory part of secondary education. I largely agree with this view, although the goverment must design such programmes carefully.\n\nFirst, unpaid work exposes teenagers to lives very different from their own. A student from a comfortable family who spends a term helping at a shelter learns something no textbook delivers. In my own school, people is often surprised by how much they take for granted.\n\nSecond, service builds skills that employers value. Organising a charity event requires planning, negotiation and patience.\n\nHowever, compulsory service can become an empty exercise if schools treat it as a box to tick. The hours must be meaningful and supervised.\n\nIn conclusion, I support making community service compulsory, provided that schools invest in the quality of the placements.',
  'The proposal that high schools should require unpaid community service divides opinion sharply. In my view the benefits outweigh the drawbacks, though the argument against compulsion deserves serious attention.\n\nThe strongest case for the policy is civic: democracies depend on citizens who understand their communities. Adolescence is precisely when such habits form.\n\nA second, more practical benefit concerns employability. Universities and employers increasingly look for evidence of initiative.\n\nCritics reply that forcing altruism is a contradiction, and they have a point. Volunteering under threat of a failing grade is not volunteering. Yet the same could be said of mathematics, which few students would choose freely and none regret learning.\n\nIn conclusion, I think that the policy is justified if schools protect its spirit as well as its letter.',
  'I strongly believe strongly that students should do community service in school. There are many reasons for this opinion.\n\nFirstly, students can learn many things from community service. They can meet many people and learn about society. This is very important for their future.\n\nSecondly, community service is good for the community. Old people and poor people need help. Students can help them.\n\nFinally, community service can help students get a good job in the future. Companies like people who help others.\n\nIn conclusion, I think community service should be compulsory in high school because it is good for students and good for society.',
  'Whether schools should compel students to perform unpaid community work is a question that touches both education and ethics. My position is that they should, with safeguards.\n\nThe educational case is straightforward. Classrooms teach students about society; service places them inside it. A teenager who has spent six months tutoring younger children understands inequality in a way no lesson conveys.\n\nThere is also a benefit to the school itself. Institutions that send students into the neighbourhood build relationships that outlast any individual cohort.\n\nOpponents worry about the burden on students already stretched by examinations. This is a real concern, and it argues for modest hour requirements rather than for abandoning the idea.\n\nOverall, I support compulsory service, provided the commitment stays proportionate.',
  'Despite of the criticism it attracts, compulsory community service deserves a place in the high school curriculum. I agree with this proposal for two main reasons.\n\nThe first concerns civic duty. A society functions when its members accept obligations to one another, and schools are where such obligations are first learned. Making service compulsory signals that participation is expected, not optional.\n\nThe second reason is developmental. Adolescents benefit from responsibility outside the family and the classroom. Being trusted with a real task, for real people who depend on it, changes how a young person sees themselves.\n\nI accept that compulsion sits awkwardly with the idea of volunteering. But schools compel attendance, homework and examinations without controversy; service is no different in kind.\n\nFor these reasons I support the policy.',
  'Community service should be a compulsory part of high school programmes and I agree with this idea.\n\nOne reason is that students can learn about their community. Many student which live in cities do not know how other people live. When they do community service they can see and understand.\n\nAnother reason is that it helps students grow up. They must be responsible and come on time. This is a good habit for work later.\n\nSome people say students are too busy with exams. This is true but a few hours each month is not too much.\n\nIn conclusion I agree that community service should be compulsory because it teaches students about society and about responsibility.',
  'The suggestion that unpaid community service should be compulsory in secondary schools raises a genuine tension between the value of the activity and the principle of free choice. On balance I support the requirement.\n\nConsider first what service actually teaches. Reliability, for instance, is difficult to learn in a classroom where the only person affected by absence is oneself. In a soup kitchen or a reading programme, absence has visible consequences, and adolescents respond to that visibility.\n\nThe objection from principle is the serious one: compelled generosity is not generosity. I would answer that the school is not trying to produce a feeling but a habit, and habits are formed by repetition long before they are chosen.\n\nA practical caution remains. Programmes assembled hastily produce students who file paperwork for a term and learn nothing.\n\nMy conclusion, then, is qualified support: compulsory service, yes, but only where the school invests in placements worth the students’ time.',
]
