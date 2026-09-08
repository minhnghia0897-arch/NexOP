'use server'

/**
 * Mọi thay đổi đi qua server action, không qua state của trình duyệt.
 *
 * Giữ đúng hình dạng của bản thật: trình duyệt gửi ý định, máy chủ kiểm quyền và ghi sự
 * kiện. Đổi sang Supabase là đổi thân hàm trong lib/demo/kho.ts, không đụng tới đây.
 */
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import type { VaiDemo } from '@/lib/demo/du-lieu'
import { KhongDuQuyen, dangBai, datLai, deXuatChoCo, guiNhanXet, suaNhap } from '@/lib/demo/kho'
import { COOKIE_VAI, vaiHienTai } from '@/lib/demo/phien'

export async function doiVai(formData: FormData): Promise<void> {
  const vai = String(formData.get('vai'))
  const c = await cookies()
  c.set(COOKIE_VAI, vai === 'assistant' || vai === 'student' ? vai : 'owner', { path: '/' })
  revalidatePath('/', 'layout')
}

/*
 * Dịch lời từ chối sang tiếng của cô.
 *
 * DESIGN.md §Copy: mọi màn nói với cô/em bằng ngôi "cô–em". `Không đủ quyền cho
 * "review.send"` là tiếng của lập trình viên — đúng nhưng vô nghĩa với người đang dùng.
 * Tên hành vi vẫn nằm trong nhật ký cho người sửa lỗi đọc; màn hình thì nói tiếng người.
 */
function loiChoNguoiDung(e: unknown): string {
  if (e instanceof KhongDuQuyen) {
    return 'Chỗ này chỉ cô làm được. Trợ giảng soạn xong thì chuyển cho cô, cô là người bấm gửi.'
  }
  return (e as Error).message
}

/**
 * Trả về lời từ chối để màn hình nói được VÌ SAO.
 *
 * Không nuốt lỗi thành "không có gì xảy ra": bấm nút mà màn hình đứng im thì người dùng
 * tưởng hệ thống hỏng.
 */
export async function guiNhanXetAction(baiNopId: string): Promise<{ loi?: string }> {
  const vai: VaiDemo = await vaiHienTai()
  try {
    guiNhanXet(vai, baiNopId)
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
  revalidatePath('/', 'layout')
  return {}
}

export async function suaNhapAction(baiNopId: string, noiDung: string): Promise<{ loi?: string }> {
  const vai: VaiDemo = await vaiHienTai()
  try {
    suaNhap(vai, baiNopId, noiDung)
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
  revalidatePath('/', 'layout')
  return {}
}

/** Trợ giảng soạn xong thì chuyển cho cô — không phải gửi thẳng tới em. */
export async function deXuatChoCoAction(
  baiNopId: string,
  noiDung: string,
): Promise<{ loi?: string }> {
  const vai: VaiDemo = await vaiHienTai()
  try {
    deXuatChoCo(vai, baiNopId, noiDung)
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
  revalidatePath('/', 'layout')
  return {}
}

export async function dangBaiAction(lopId: string, noiDung: string): Promise<{ loi?: string }> {
  const vai: VaiDemo = await vaiHienTai()
  if (!noiDung.trim()) return { loi: 'Chưa có nội dung' }
  try {
    dangBai(vai, lopId, noiDung.trim())
  } catch (e) {
    return { loi: loiChoNguoiDung(e) }
  }
  revalidatePath('/', 'layout')
  return {}
}

export async function datLaiAction(): Promise<void> {
  datLai()
  revalidatePath('/', 'layout')
}
