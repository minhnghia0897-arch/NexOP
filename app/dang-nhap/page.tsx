import { ChuNho, DongPhu, NutChinh, O, The, TenLop, ThanhDiaChi } from '@/components/auth/khung'
import { subdomainHienTai } from '@/lib/tenant/hien-tai'

// Tenant phụ thuộc header của từng yêu cầu, nên không dựng sẵn lúc build.
export const dynamic = 'force-dynamic'

export default async function DangNhap() {
  const subdomain = await subdomainHienTai()

  if (!subdomain) {
    return (
      <main className="px-6 py-16">
        <ThanhDiaChi duong="oblue.vn/dang-nhap" />
        <The>
          <TenLop ten="OBLUE" phu="nền tảng lớp học cho giáo viên ngoại ngữ" />
          <h1 className="mb-1.5 font-display text-xl font-semibold text-text">
            Chưa có tên miền lớp học
          </h1>
          <p className="text-sm leading-[21px] text-text-2">
            Mỗi cô có một tên miền riêng, ví dụ <b className="text-text">cothao.oblue.vn</b>. Em vào
            bằng đúng đường link cô gửi.
          </p>
        </The>
      </main>
    )
  }

  return (
    <main className="px-6 py-16">
      <ThanhDiaChi duong={`${subdomain}.oblue.vn/dang-nhap`} />
      <The>
        <TenLop ten={`Lớp của ${subdomain}`} phu="OBLUE · tên miền của giáo viên" />
        <h1 className="mb-1.5 font-display text-xl font-semibold text-text">Đăng nhập</h1>
        <p className="mb-[18px] text-sm leading-[21px] text-text-2">
          Dùng số điện thoại cô đã lưu cho em. Không cần mật khẩu — mã gửi qua Zalo.
        </p>

        <form action="/api/dang-nhap" method="post">
          <O nhan="Số điện thoại" name="phone" type="tel" placeholder="0901 234 567" autoComplete="tel" />
          <NutChinh type="submit">Nhận mã qua Zalo</NutChinh>
        </form>

        <DongPhu>
          Cô chủ lớp?{' '}
          <a className="font-display font-semibold text-primary" href="?gv">
            Đăng nhập bằng email
          </a>
        </DongPhu>

        <ChuNho>
          Chưa có tên trong lớp nào ở đây? Số này sẽ không nhận được mã.{' '}
          <a className="font-display font-semibold text-primary" href="/hoc-thu">
            Đăng ký học thử
          </a>{' '}
          để cô liên hệ.
        </ChuNho>
      </The>
    </main>
  )
}
