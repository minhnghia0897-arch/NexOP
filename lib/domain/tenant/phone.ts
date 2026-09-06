/**
 * Chuẩn hoá số điện thoại Việt Nam về một dạng duy nhất: `+84` + 9 chữ số.
 *
 * Vì sao cần: UC-02 nói "SĐT khác SĐT cô lưu → từ chối". Cô nhập số bằng tay hoặc
 * dán từ Excel/Zalo, nên cùng một người sẽ ra `0901234567`, `+84 901 234 567`,
 * `84.901.234.567`. So chuỗi thô thì em bị từ chối oan khi mở link mời của chính mình.
 *
 * Danh bạ Zalo của giáo viên còn đầy số 11 chữ số từ trước đợt chuyển đầu số 2018.
 * Không quy đổi thì những em đó không bao giờ khớp.
 */

/** Đầu số 11 chữ số cũ → đầu số 10 chữ số hiện hành (chuyển đổi 2018). */
const DOI_DAU_SO_2018: Readonly<Record<string, string>> = {
  // Viettel
  '162': '32', '163': '33', '164': '34', '165': '35',
  '166': '36', '167': '37', '168': '38', '169': '39',
  // MobiFone
  '120': '70', '121': '79', '122': '77', '126': '76', '128': '78',
  // VinaPhone
  '123': '83', '124': '84', '125': '85', '127': '81', '129': '82',
  // Vietnamobile
  '186': '56', '188': '58',
  // Gmobile
  '199': '59',
}

/**
 * Đầu số di động hợp lệ, tính theo 2 chữ số đầu của phần 9 số.
 * Gồm cả đầu số vốn có (09x, 08x) lẫn đầu số sinh ra từ chuyển đổi 2018.
 */
const DAU_SO_DI_DONG = new Set([
  '86', '96', '97', '98', '32', '33', '34', '35', '36', '37', '38', '39', // Viettel
  '88', '91', '94', '81', '82', '83', '84', '85',                         // VinaPhone
  '89', '90', '93', '70', '76', '77', '78', '79',                         // MobiFone
  '92', '52', '56', '58',                                                 // Vietnamobile
  '99', '59',                                                             // Gmobile
])

/**
 * Trả về dạng chuẩn `+84XXXXXXXXX`, hoặc `null` nếu không phải số di động VN.
 * Dùng `null` chứ không ném, để chỗ nhập hàng loạt báo được từng dòng hỏng.
 */
export function chuanHoaSoDienThoai(input: string): string | null {
  // Bỏ mọi thứ không phải chữ số, giữ dấu + đứng đầu để phân biệt mã quốc gia.
  const raw = input.trim()
  const coDauCong = raw.startsWith('+')
  let digits = raw.replace(/\D/g, '')

  if (digits.length === 0) return null

  // +84… hoặc 84… → bỏ mã quốc gia. Chỉ coi là mã quốc gia khi phần còn lại đủ dài,
  // vì "0845..." (VinaPhone) cũng bắt đầu bằng 84 sau khi bỏ số 0.
  if (digits.startsWith('84') && (coDauCong || digits.length >= 11)) {
    digits = digits.slice(2)
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1)
  } else if (coDauCong) {
    // Có dấu + nhưng không phải mã Việt Nam.
    return null
  }

  // Số 11 chữ số cũ: 3 chữ số đầu là đầu số cũ, 7 chữ số sau giữ nguyên.
  if (digits.length === 10) {
    const dauSoCu = digits.slice(0, 3)
    const dauSoMoi = DOI_DAU_SO_2018[dauSoCu]
    if (!dauSoMoi) return null
    digits = dauSoMoi + digits.slice(3)
  }

  if (digits.length !== 9) return null
  if (!DAU_SO_DI_DONG.has(digits.slice(0, 2))) return null

  return `+84${digits}`
}

/** Dạng dễ đọc cho giao diện: `090 123 4567`. */
export function hienThiSoDienThoai(chuan: string): string {
  const digits = chuan.replace(/\D/g, '').replace(/^84/, '')
  if (digits.length !== 9) return chuan
  return `0${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
}

/** Hai số có phải cùng một người không — dùng cho cửa khớp SĐT của lời mời. */
export function cungMotSo(a: string, b: string): boolean {
  const x = chuanHoaSoDienThoai(a)
  const y = chuanHoaSoDienThoai(b)
  return x !== null && x === y
}

export interface DongDanhBa {
  ten: string
  soDienThoai: string
}

export interface KetQuaDan {
  hopLe: DongDanhBa[]
  hong: { dong: number; noiDung: string; lyDo: string }[]
}

/**
 * Dán danh sách học viên từ Excel hoặc Zalo (UC-02).
 * Mỗi dòng: tên và số, cách nhau bằng tab, phẩy, chấm phẩy hoặc khoảng trắng dài.
 * Trùng số trong cùng lần dán chỉ giữ dòng đầu — dán hai lần một người là chuyện thường.
 */
export function danDanhSachHocVien(text: string): KetQuaDan {
  const hopLe: DongDanhBa[] = []
  const hong: KetQuaDan['hong'] = []
  const daThay = new Set<string>()

  text.split(/\r?\n/).forEach((line, index) => {
    const noiDung = line.trim()
    if (noiDung.length === 0) return

    const phan = noiDung.split(/\t|[,;]|\s{2,}/).map((p) => p.trim()).filter(Boolean)

    // Số thường nằm cuối; nếu không thì tìm phần nào chuẩn hoá được.
    let soDienThoai: string | null = null
    let viTriSo = -1
    for (let i = phan.length - 1; i >= 0; i -= 1) {
      const thu = chuanHoaSoDienThoai(phan[i]!)
      if (thu) {
        soDienThoai = thu
        viTriSo = i
        break
      }
    }

    if (!soDienThoai) {
      hong.push({ dong: index + 1, noiDung, lyDo: 'không tìm thấy số di động hợp lệ' })
      return
    }

    const ten = phan.filter((_, i) => i !== viTriSo).join(' ').trim()
    if (ten.length === 0) {
      hong.push({ dong: index + 1, noiDung, lyDo: 'thiếu tên học viên' })
      return
    }

    if (daThay.has(soDienThoai)) return
    daThay.add(soDienThoai)
    hopLe.push({ ten, soDienThoai })
  })

  return { hopLe, hong }
}

/**
 * Che giữa số: `+84901234567` → `0901 ••• 567`. Dạng lấy từ bản mẫu đã duyệt.
 *
 * Dùng ở màn lời mời, để em nhận ra số của mình và biết link gửi đúng người.
 * Che 3 trên 10 chữ số là đủ cho việc nhận ra, không phải để giấu số — ai cầm được
 * link thì đã cầm được link rồi; cửa thật là bước nhập đủ số và khớp với số cô lưu.
 */
export function cheSoDienThoai(chuan: string): string {
  const digits = chuan.replace(/\D/g, '').replace(/^84/, '')
  if (digits.length !== 9) return '•••'
  return `0${digits.slice(0, 3)} ••• ${digits.slice(-3)}`
}
