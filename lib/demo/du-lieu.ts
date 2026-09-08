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
  kyNang: 'reading' | 'writing' | 'listening' | 'speaking'
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
  ]

  const baiGiao: BaiGiao[] = [
    { id: 'bg-w1', lopId: 'lop-65', deId: 'de-w1', hanNop: luc(-1, 23), lanThu: 1,
      nhan: 'Task 2 — Community service', cauHoi: CAU_HOI_WRITING },
    { id: 'bg-r1', lopId: 'lop-65', deId: 'de-r1', hanNop: luc(2, 23), lanThu: 1,
      nhan: 'Reading Test 1', cauHoi: CAU_HOI_READING },
    { id: 'bg-w1-70', lopId: 'lop-70', deId: 'de-w1', hanNop: luc(1, 23), lanThu: 1,
      nhan: 'Task 2 — Community service', cauHoi: CAU_HOI_WRITING },
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

  const baiDang: BaiDang[] = [
    { id: 'bd-1', lopId: 'lop-65', tacGiaId: CO_THAO, loai: 'post',
      noiDung: 'Buổi tới cô chữa Writing Task 2 theo bài các em vừa nộp. Em nào chưa nộp thì nộp trước 21h mai nhé.', luc: luc(-1, 8) },
    { id: 'bd-2', lopId: 'lop-65', tacGiaId: null, loai: 'system',
      noiDung: 'Bài mới: Cambridge 19 · Reading Test 1 — hạn nộp 23:00 ngày kia.', luc: luc(0, 7) },
  ]

  return {
    tenant: { id: 'tn-cothao', subdomain: 'cothao', ten: 'Lớp cô Thảo' },
    taiKhoan,
    lop,
    de,
    baiGiao,
    baiNop,
    nhapCham,
    nhanXet: [],
    baiDang,
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
