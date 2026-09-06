import type { Role } from '@/lib/auth/permissions'

/**
 * Vai đến từ bảng thành viên, không từ nút người dùng bấm (ARCHITECTURE §6).
 *
 * Không có ô chọn vai khi đăng nhập. Nhập SĐT → tra memberships của tên miền đang
 * đứng → một tư cách thì vào thẳng, nhiều thì hỏi một lần rồi nhớ. Cho chọn vai
 * nghĩa là cho người lạ tự khai mình là trợ giảng.
 */

export interface TuCach {
  membershipId: string
  role: Role
  classId: string | null
  status: 'pending' | 'active' | 'left' | 'expired'
}

export type KetQuaDangNhap =
  /** Không tư cách nào ở tên miền này → không tạo tài khoản, chỉ mời đăng ký học thử. */
  | { loai: 'khong-co-tu-cach' }
  /** Đúng một tư cách còn hiệu lực → vào thẳng. */
  | { loai: 'vao-thang'; tuCach: TuCach }
  /** Nhiều tư cách → hỏi một lần. */
  | { loai: 'hoi-mot-lan'; luaChon: TuCach[] }

/**
 * @param tuCachs mọi tư cách của account tại tên miền đang đứng
 * @param lastRole vai đã chọn lần trước, nếu có
 */
export function xacDinhTuCach(
  tuCachs: readonly TuCach[],
  lastRole?: Role | null,
): KetQuaDangNhap {
  // Chỉ tư cách còn hiệu lực mới tính. Đã nghỉ hoặc lời mời hết hạn thì như không có.
  const conHieuLuc = tuCachs.filter((t) => t.status === 'active')

  if (conHieuLuc.length === 0) return { loai: 'khong-co-tu-cach' }
  if (conHieuLuc.length === 1) return { loai: 'vao-thang', tuCach: conHieuLuc[0]! }

  // Đã chọn lần trước thì không hỏi lại — "hỏi 1 lần, nhớ".
  if (lastRole) {
    const daChon = conHieuLuc.filter((t) => t.role === lastRole)
    if (daChon.length === 1) return { loai: 'vao-thang', tuCach: daChon[0]! }
  }

  // Nhiều lớp cùng một vai không phải là hai tư cách để hỏi — vẫn là "em học ở đây".
  const cacVai = new Set(conHieuLuc.map((t) => t.role))
  if (cacVai.size === 1) return { loai: 'vao-thang', tuCach: conHieuLuc[0]! }

  return { loai: 'hoi-mot-lan', luaChon: conHieuLuc }
}

/** Cô vào bằng email, em và trợ giảng vào bằng SĐT (DECISIONS 2026-09). */
export function kenhDangNhapCuaVai(role: Role): 'email' | 'phone' {
  return role === 'owner' ? 'email' : 'phone'
}
