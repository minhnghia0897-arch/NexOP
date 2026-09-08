'use client'

import { Suspense, useEffect } from 'react'

import { Rail, TabDay } from '@/components/ung-dung/dieu-huong'
import { Canvas, DaiVai, PanelLop, Topbar } from '@/components/ung-dung/khung'
import { useKho } from '@/lib/demo/dung-kho'
import { baiCanCham, duLieu, napTuBoNho, vaiHienTai } from '@/lib/demo/kho'

export default function KhungLamViec({ children }: { children: React.ReactNode }) {
  useKho()

  // Nạp bản người xem đã lưu SAU khi trang gắn xong — xem ghi chú ở kho.napTuBoNho.
  useEffect(() => {
    napTuBoNho()
  }, [])

  const vai = vaiHienTai()
  const du = duLieu()

  /*
   * Panel là BỘ LỌC CHUNG (DESIGN.md §Bố cục), nên nó nằm ở layout chứ không nằm trong
   * từng màn: chuyển màn mà mất lớp đang chọn là bắt cô chọn lại mỗi lần.
   *
   * Số bên phải là bài đang chờ cô ở lớp đó — đọc qua `can()` như mọi chỗ khác, nên vai
   * học viên thấy 0 và điều đó là đúng, không phải thiếu dữ liệu.
   */
  const dem: Record<string, number> = {}
  for (const b of baiCanCham(vai)) dem[b.lopId] = (dem[b.lopId] ?? 0) + 1

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
        {/* Panel đọc query để biết lớp đang chọn — xem ghi chú Suspense ở các màn. */}
        <Suspense fallback={null}>
          <PanelLop lop={lopThay} demTheoLop={dem} />
        </Suspense>
        <Canvas>{children}</Canvas>
      </div>
      <TabDay />
    </div>
  )
}
