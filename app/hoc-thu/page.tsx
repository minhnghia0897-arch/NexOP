import { ChuNho, HopViSao, NutChinh, O, The, TenLop, ThanhDiaChi } from '@/components/auth/khung'
import { subdomainHienTai } from '@/lib/tenant/hien-tai'

export const dynamic = 'force-dynamic'

/**
 * UC-18 / ARCHITECTURE §6: SĐT không có tư cách nào ở tên miền thì KHÔNG tạo tài khoản.
 * Trang này chỉ ghi một đề xuất chờ cô duyệt — người lạ không tự thêm mình vào lớp.
 */
export default async function HocThu() {
  const subdomain = await subdomainHienTai()
  const ten = subdomain ? `Lớp của ${subdomain}` : 'OBLUE'

  return (
    <main className="px-6 py-16">
      <ThanhDiaChi duong={`${subdomain ?? 'oblue.vn'}${subdomain ? '.oblue.vn' : ''}/hoc-thu`} />
      <The>
        <TenLop ten={ten} phu="Đăng ký học thử" />

        <HopViSao nhan="?">
          <b className="font-display font-semibold text-text">
            Số của em chưa có trong lớp nào ở đây
          </b>
          <br />
          Chưa tạo được tài khoản. Để lại thông tin, cô sẽ liên hệ và mời vào lớp phù hợp.
        </HopViSao>

        <form action="/api/hoc-thu" method="post">
          <O nhan="Tên" name="name" autoComplete="name" placeholder="Nguyễn Minh Anh" />
          <O nhan="Số điện thoại (Zalo)" name="phone" type="tel" placeholder="0901 234 567" autoComplete="tel" />

          <label className="mb-2.5 block">
            <span className="mb-1 block font-display text-xs font-semibold text-text-2">Mục tiêu</span>
            <select
              name="goal"
              className="w-full rounded-m border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
            >
              <option>IELTS 6.5</option>
              <option>IELTS 5.5</option>
              <option>Chưa biết — muốn test đầu vào</option>
            </select>
          </label>

          <NutChinh type="submit">Gửi cho cô</NutChinh>
        </form>

        <ChuNho>
          Yêu cầu này vào mục &ldquo;Chờ duyệt&rdquo; của cô. Cô duyệt → em nhận link mời → mới
          thành học viên. Không ai tự thêm mình vào lớp của cô.
        </ChuNho>
      </The>
    </main>
  )
}
