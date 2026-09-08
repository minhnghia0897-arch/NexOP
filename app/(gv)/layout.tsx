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
   * Số bên phải là bài đang chờ ở lớp đó — đọc qua `can()` như mọi chỗ khác, nên vai học
   * viên thấy 0 và điều đó là đúng, không phải thiếu dữ liệu.
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

  const soEm = new Set(du.lop.flatMap((l) => l.hocVienIds)).size
  const coTaiKhoan = du.taiKhoan.filter((t) => t.phone).length

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      <Topbar tenTenant={du.tenant.ten} vai={vai} soCho={cho.length} />
      <DaiVai vai={vai} />
      <div className="flex min-h-0 flex-1">
        <Rail />
        {/* Panel đọc query để biết lớp đang chọn — cần Suspense thì mới dựng tĩnh được. */}
        <Suspense fallback={null}>
          <PanelLop
            lop={lopThay}
            demTheoLop={dem}
            soHocVien={soEm}
            soCoTaiKhoan={Math.min(coTaiKhoan, soEm)}
          />
        </Suspense>
        <Canvas>{children}</Canvas>
      </div>
      <TabDay />
    </div>
  )
}
