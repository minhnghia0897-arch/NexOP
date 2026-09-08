import { Canvas, DaiVai, PanelLop, Topbar } from '@/components/ung-dung/khung'
import { Rail, TabDay } from '@/components/ung-dung/dieu-huong'
import { baiCanCham, duLieu } from '@/lib/demo/kho'
import { vaiHienTai } from '@/lib/demo/phien'

// Vai đọc từ cookie mỗi yêu cầu, nên không dựng sẵn lúc build.
export const dynamic = 'force-dynamic'

export default async function KhungLamViec({ children }: { children: React.ReactNode }) {
  const vai = await vaiHienTai()
  const du = duLieu()

  /*
   * Panel là BỘ LỌC CHUNG (DESIGN.md §Bố cục), nên nó nằm ở layout chứ không nằm trong
   * từng màn: chuyển màn mà mất lớp đang chọn là bắt cô chọn lại mỗi lần.
   *
   * Số bên phải là bài đang chờ cô ở lớp đó — đọc qua `can()` như mọi chỗ khác, nên vai
   * học viên thấy 0 và điều đó là đúng, không phải thiếu dữ liệu.
   */
  const cho = baiCanCham(vai)
  const dem: Record<string, number> = {}
  for (const b of cho) dem[b.lopId] = (dem[b.lopId] ?? 0) + 1

  const lopThay =
    vai === 'student'
      ? du.lop.filter((l) => l.hocVienIds.includes(du.vai.student))
      : vai === 'assistant'
        ? du.lop.filter((l) => l.id === 'lop-65')
        : du.lop

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Topbar tenant={du.tenant.subdomain} vai={vai} />
      <DaiVai vai={vai} />
      <div className="flex flex-1">
        <Rail />
        <PanelLop lop={lopThay} demTheoLop={dem} />
        <Canvas>{children}</Canvas>
      </div>
      <TabDay />
    </div>
  )
}
