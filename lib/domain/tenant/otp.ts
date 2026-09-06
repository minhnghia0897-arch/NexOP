import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

/**
 * Mã OTP: sinh, băm, và luật thử.
 *
 * Không mật khẩu (ARCHITECTURE §6), nên mã này là toàn bộ cánh cửa. Ba thứ giữ cửa:
 * mã ngẫu nhiên thật, số lần thử có hạn, và thời gian sống ngắn.
 *
 * Nhà cung cấp (Zalo ZNS hay SMS brandname) chưa chốt — xem docs/PLAN.md §7 câu 1.
 * Phần sinh và kiểm mã không phụ thuộc nhà cung cấp, nên viết trước được; chỗ gửi
 * nằm sau interface `GuiOtp` để cắm vào sau mà không sửa gì ở đây.
 */

export const OTP_SO_CHU_SO = 6
export const OTP_SONG_TRONG_GIAY = 5 * 60
export const OTP_SO_LAN_THU_TOI_DA = 5

/**
 * Sinh mã 6 chữ số bằng nguồn ngẫu nhiên mã hoá.
 * Không dùng Math.random: đoán được thì cửa coi như mở.
 */
export function taoMaOtp(): string {
  return String(randomInt(0, 10 ** OTP_SO_CHU_SO)).padStart(OTP_SO_CHU_SO, '0')
}

/** Token cho link mời `/m/<token>` — đủ dài để không dò ra được. */
export function taoTokenMoi(): string {
  return randomBytes(24).toString('base64url')
}

/**
 * Băm mã trước khi lưu. Muối là id của lần thách thức, nên hai lần khác nhau ra
 * hai chuỗi băm khác nhau dù mã trùng — đọc trộm cả bảng cũng không tra ngược được.
 */
export function bamMa(challengeId: string, code: string): string {
  return createHash('sha256').update(`${challengeId}:${code}`).digest('hex')
}

/** So sánh trong thời gian hằng định, để không lộ mã qua thời gian phản hồi. */
export function maKhop(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8')
  const y = Buffer.from(b, 'utf8')
  if (x.length !== y.length) return false
  return timingSafeEqual(x, y)
}

export interface OtpDaGui {
  challengeId: string
  hetHanLuc: Date
}

/** Kênh gửi thật cắm vào đây. Chưa chốt nhà cung cấp thì dùng bản ghi ra log. */
export interface GuiOtp {
  gui(destination: string, code: string): Promise<void>
}

/**
 * Bản dùng khi phát triển: in mã ra log máy chủ thay vì gửi đi thật.
 * Không bao giờ được chạy ở production — `taoKenhGui` chặn việc đó.
 */
export class GuiOtpRaLog implements GuiOtp {
  async gui(destination: string, code: string): Promise<void> {
    console.info(`[OTP] ${destination} → ${code} (bản phát triển, không gửi thật)`)
  }
}

export function taoKenhGui(): GuiOtp {
  if (process.env.NODE_ENV === 'production') {
    // Thà hỏng lúc khởi động còn hơn âm thầm không gửi mã cho ai cả.
    throw new Error(
      'Chưa cắm nhà cung cấp OTP. Chốt Zalo ZNS hay SMS brandname (docs/PLAN.md §7) rồi cài GuiOtp thật.',
    )
  }
  return new GuiOtpRaLog()
}
