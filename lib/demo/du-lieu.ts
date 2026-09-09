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
}

export interface De {
  id: string
  ten: string
  kyNang: 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar' | 'vocabulary'
  trinhDo?: string
  cachCham: 'auto' | 'draft' | 'manual'
  tinCayOcr?: number
  cauHoi: CauHoi[]
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
  diHoc: string
  coTaiKhoan: boolean
  loiHayGap: string
  hanHocPhi: string
  diem: Record<string, { band: number | null; muon?: boolean }>
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
  nhanXet: NhanXet[]
  baiDang: BaiDang[]
  hoSo: HoSoHocVien[]
  loTrinh: LoTrinh[]
  hocPhi: HocPhi[]
  baiLuyen: BaiLuyen[]
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

export function duLieuBanDau(): DuLieuDemo {
  const taiKhoan: TaiKhoan[] = [
    { id: CO_THAO, ten: 'Cô Thảo', email: 'co.thao@oblue.vn', mau: 'purple' },
    { id: TRO_GIANG, ten: 'Phạm Lan', phone: '+84901000004', mau: 'green' },
    ...HOC_VIEN.map((h) => ({ id: h.id, ten: h.ten, phone: `+8490100${h.id.slice(-2)}00`, mau: h.mau })),
  ]

  const lop: Lop[] = [
    { id: 'lop-65', ten: 'IELTS 6.5 · Tối T3/T5', lich: 'T3, T5 · 19:30', trangThai: 'running',
      mau: 'blue', hocVienIds: HOC_VIEN.slice(0, 10).map((h) => h.id) },
    { id: 'lop-70', ten: 'IELTS 7.0 · Thứ 7', lich: 'T7 · 14:00', trangThai: 'running',
      mau: 'purple', hocVienIds: HOC_VIEN.slice(10, 16).map((h) => h.id) },
    { id: 'lop-nen', ten: 'Nền tảng B1 · Sáng T2/T4', lich: 'T2, T4 · 18:00', trangThai: 'running',
      mau: 'orange', hocVienIds: HOC_VIEN.slice(16).map((h) => h.id) },
    { id: 'lop-moi', ten: 'IELTS 7.0+ · nhóm 6', lich: 'Khai giảng 22/9', trangThai: 'opening',
      mau: 'indigo', hocVienIds: [], ghiChu: 'Khai giảng 22/9 · 2/6' },
  ]

  const de: De[] = [
    { id: 'de-w1', ten: 'Writing Task 2 · Community service', kyNang: 'writing', trinhDo: 'B2–C1',
      cachCham: 'draft', cauHoi: CAU_HOI_WRITING },
    { id: 'de-r1', ten: 'Cambridge 19 · Reading Test 1', kyNang: 'reading', trinhDo: 'B2',
      cachCham: 'auto', tinCayOcr: 0.94, cauHoi: CAU_HOI_READING },
    { id: 'de-w2', ten: 'Writing Task 1 · Bar chart — Museums', kyNang: 'writing',
      trinhDo: 'B2', cachCham: 'draft', cauHoi: CAU_HOI_WRITING },
    { id: 'de-g1', ten: 'Trắc nghiệm ngữ pháp 3 · 40 câu', kyNang: 'grammar', trinhDo: 'B1',
      cachCham: 'auto', tinCayOcr: 0.99, cauHoi: CAU_HOI_READING },
    { id: 'de-l1', ten: 'Cambridge 18 · Listening Test 2', kyNang: 'listening', trinhDo: 'B2',
      cachCham: 'auto', tinCayOcr: 0.71, cauHoi: CAU_HOI_READING },
    { id: 'de-w3', ten: 'Cambridge 19 · Test 2 — Task 2 Education', kyNang: 'writing',
      trinhDo: 'B2–C1', cachCham: 'draft', cauHoi: CAU_HOI_EDUCATION },
  ]

  /*
   * Bốn bài đã xong dựng nên bảng điểm, một bài đang chấm, một bài đang mở.
   *
   * Không có lịch sử thì bảng điểm chỉ có một cột và "band tăng hay tụt" thành vô nghĩa —
   * mà đó mới là thứ cô nhìn bảng điểm để tìm.
   */
  const baiGiao: BaiGiao[] = [
    { id: 'bg-t1a', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-52, 19), lanThu: 1,
      nhan: 'Task 1 — Line graph', trongSo: 5, daXong: true, cauHoi: CAU_HOI_WRITING },
    { id: 'bg-mock1', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-42, 19), lanThu: 1,
      nhan: 'Mock 1', trongSo: 20, daXong: true, cauHoi: CAU_HOI_WRITING },
    { id: 'bg-t2tech', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-31, 19), lanThu: 1,
      nhan: 'Task 2 — Technology', trongSo: 10, daXong: true, cauHoi: CAU_HOI_WRITING },
    { id: 'bg-t1bar', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-21, 19), lanThu: 1,
      nhan: 'Task 1 — Bar chart', trongSo: 5, daXong: true, cauHoi: CAU_HOI_WRITING },
    { id: 'bg-w1', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-1, 23), lanThu: 1,
      nhan: 'Task 2 — Community service', trongSo: 10, cauHoi: CAU_HOI_WRITING },
    { id: 'bg-w2', lopId: 'lop-65', deId: 'de-w3', hanNop: luc(2, 19), lanThu: 1,
      nhan: 'Task 2 — Education', trongSo: 10, cauHoi: CAU_HOI_EDUCATION },
    { id: 'bg-r1', lopId: 'lop-65', deId: 'de-r1', hanNop: luc(2, 23), lanThu: 1,
      nhan: 'Reading Test 1', trongSo: 5, cauHoi: CAU_HOI_READING },
    { id: 'bg-w1-70', lopId: 'lop-70', deId: 'de-w1', hanNop: luc(1, 23), lanThu: 1,
      nhan: 'Task 2 — Community service', trongSo: 10, cauHoi: CAU_HOI_WRITING },
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
    { id: 'hv-01', bandTb: 6.3, huong: 'up', diHoc: '28/30', coTaiKhoan: true,
      loiHayGap: 'Hoà hợp chủ–vị ×3', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 6.0 }, 'bg-t2tech': { band: 6.0 },
              'bg-t1bar': { band: 6.5 }, 'bg-w1': { band: null } } },
    { id: 'hv-02', bandTb: 6.9, huong: 'up', diHoc: '30/30', coTaiKhoan: true,
      loiHayGap: '—', hanHocPhi: '12/10',
      diem: { 'bg-t1a': { band: 6.0 }, 'bg-mock1': { band: 6.5 }, 'bg-t2tech': { band: 7.0 },
              'bg-t1bar': { band: 7.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-03', bandTb: 5.2, huong: 'down', diHoc: '24/30', coTaiKhoan: true,
      loiHayGap: 'Liên kết máy móc ×4', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 5.0 },
              'bg-t1bar': { band: 5.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-04', bandTb: 6.1, huong: 'flat', diHoc: '29/30', coTaiKhoan: true,
      loiHayGap: 'Phản biện chưa có đỡ', hanHocPhi: '15/10',
      diem: { 'bg-t1a': { band: 6.0 }, 'bg-mock1': { band: 6.0 }, 'bg-t2tech': { band: 6.5 },
              'bg-t1bar': { band: 6.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-05', bandTb: 6.2, huong: 'flat', diHoc: '26/30', coTaiKhoan: true,
      loiHayGap: 'Nộp muộn 4/6', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 6.0, muon: true }, 'bg-mock1': { band: 6.5 },
              'bg-t2tech': { band: 6.0, muon: true }, 'bg-t1bar': { band: null },
              'bg-w1': { band: null, muon: true } } },
    { id: 'hv-06', bandTb: 5.8, huong: 'up', diHoc: '30/30', coTaiKhoan: false,
      loiHayGap: 'Câu phức còn ít', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.0 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 6.0 },
              'bg-t1bar': { band: 6.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-07', bandTb: 6.9, huong: 'up', diHoc: '30/30', coTaiKhoan: true,
      loiHayGap: '—', hanHocPhi: '12/10',
      diem: { 'bg-t1a': { band: 6.5 }, 'bg-mock1': { band: 6.5 }, 'bg-t2tech': { band: 7.0 },
              'bg-t1bar': { band: 7.0 }, 'bg-w1': { band: null } } },
    { id: 'hv-08', bandTb: 5.5, huong: 'flat', diHoc: '27/30', coTaiKhoan: true,
      loiHayGap: 'Bài ngắn ×2', hanHocPhi: '15/10',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 5.5 },
              'bg-t1bar': { band: 5.5 }, 'bg-w1': { band: null } } },
    { id: 'hv-09', bandTb: 4.9, huong: 'down', diHoc: '22/30', coTaiKhoan: true,
      loiHayGap: 'Đọc hiểu', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.0 }, 'bg-t2tech': { band: 4.5 },
              'bg-t1bar': { band: 4.5 }, 'bg-w1': { band: null } } },
    { id: 'hv-10', bandTb: 5.6, huong: 'flat', diHoc: '25/30', coTaiKhoan: false,
      loiHayGap: 'Bị động ×5', hanHocPhi: '30/9',
      diem: { 'bg-t1a': { band: 5.5 }, 'bg-mock1': { band: 5.5 }, 'bg-t2tech': { band: 5.5 },
              'bg-t1bar': { band: 6.0, muon: true }, 'bg-w1': { band: null } } },
  ]

  /*
   * Tám em còn lại ở lớp 7.0 và Nền tảng B1. Hai lớp đó chưa có bài nào được chấm nên
   * `diem` rỗng — và bảng vẫn phải đọc được với ô trống, vì đó là trạng thái thật của một
   * lớp mới mở.
   */
  const HO_SO_LOP_KHAC: [string, number, HoSoHocVien['huong'], string, boolean, string, string][] = [
    ['hv-11', 7.2, 'up', '14/14', true, '—', '20/10'],
    ['hv-12', 6.8, 'flat', '13/14', true, 'Dấu câu trong câu ghép', '20/10'],
    ['hv-13', 7.0, 'up', '14/14', true, '—', '20/10'],
    ['hv-14', 6.5, 'down', '11/14', true, 'Nghe số liệu ×3', '5/10'],
    ['hv-15', 7.1, 'flat', '14/14', true, '—', '20/10'],
    ['hv-16', 6.6, 'up', '12/14', false, 'Phát âm đuôi -ed', '5/10'],
    ['hv-17', 4.2, 'up', '9/10', true, 'Trật tự từ', '28/9'],
    ['hv-18', 4.5, 'flat', '10/10', false, 'Thì quá khứ', '28/9'],
  ]

  for (const [id, bandTb, huong, diHoc, coTaiKhoan, loiHayGap, hanHocPhi] of HO_SO_LOP_KHAC) {
    hoSo.push({ id, bandTb, huong, diHoc, coTaiKhoan, loiHayGap, hanHocPhi, diem: {} })
  }

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
      id: 'lt-70',
      ten: 'IELTS 7.0+ · 32 buổi',
      moTa: 'Cho em đã vững 6.5. Nặng về lập luận và độ chính xác từ vựng.',
      soBuoi: 32,
      dangDung: ['lop-70'],
      buoi: [
        { no: 12, noiDung: 'Câu nhượng bộ — cách viết phản biện không mất lập trường' },
        { no: 13, noiDung: 'Collocation học thuật theo chủ đề Education' },
      ],
    },
    {
      id: 'lt-nen',
      ten: 'Nền tảng B1 · 24 buổi',
      moTa: 'Xây lại ngữ pháp và vốn từ trước khi vào IELTS.',
      soBuoi: 24,
      dangDung: ['lop-nen'],
      buoi: [{ no: 8, noiDung: 'Thì quá khứ đơn — dạng bất quy tắc hay gặp' }],
    },
  ]

  /* Học phí: hai em quá hạn, ba em sắp tới hạn. Đó là chỗ cô cần nhìn thấy trước. */
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

  return {
    tenant: { id: 'tn-cothao', subdomain: 'cothao', ten: 'Lớp IELTS của cô Thảo' },
    taiKhoan,
    lop,
    de,
    baiGiao,
    baiNop,
    nhapCham,
    nhanXet,
    baiDang,
    hoSo,
    loTrinh,
    hocPhi,
    baiLuyen,
    luat,
    vai: { owner: CO_THAO, assistant: TRO_GIANG, student: 'hv-01' },
  }
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
