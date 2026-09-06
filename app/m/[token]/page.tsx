import { ManLoiMoi, ManLoiMoiHong } from '@/components/auth/loi-moi'
import { xemTruocLoiMoi } from '@/lib/db/loi-moi'
import { subdomainHienTai } from '@/lib/tenant/hien-tai'

export const dynamic = 'force-dynamic'

/**
 * UC-02: mở link thấy tên cô trước khi nhập gì.
 * Trang chỉ lấy dữ liệu; phần hiển thị nằm ở components/auth/loi-moi.tsx.
 */
export default async function NhanLoiMoi({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const subdomain = await subdomainHienTai()
  const xem = await xemTruocLoiMoi(token)

  if (!xem?.found) {
    return <ManLoiMoiHong subdomain={subdomain} token={token} lyDo="not_found" />
  }
  if (xem.status !== 'pending') {
    return (
      <ManLoiMoiHong
        subdomain={subdomain}
        token={token}
        lyDo={xem.status === 'expired' ? 'expired' : 'already_used'}
      />
    )
  }

  return (
    <ManLoiMoi
      loiMoi={{
        subdomain: xem.subdomain ?? subdomain ?? 'oblue.vn',
        token,
        tenCo: xem.teacher_name ?? 'cô giáo',
        vai: xem.role === 'assistant' ? 'assistant' : 'student',
        soDaLuuDaChe: xem.phone_masked ?? '•••',
      }}
    />
  )
}
