'use client'

/**
 * App của học viên. Cùng tên miền, khác khung — CLAUDE.md: "học viên dùng app riêng".
 *
 * Khung này KHÔNG đọc `vaiHienTai()`. Cô mở app của em để xem thử thì vẫn phải thấy đúng
 * những gì em thấy: mọi câu đọc bên trong đi qua `can()` với actor học viên thật. Nếu để
 * nó co theo vai đang xem thì app này thành cửa hậu — cô mở ra, thấy đủ, rồi tưởng em cũng
 * thấy đủ như vậy.
 */
import { useEffect } from 'react'

import { RailEm, TabDayEm, TopbarEm } from '@/components/em/khung'
import { useKho } from '@/lib/demo/dung-kho'
import { duLieu, napTuBoNho } from '@/lib/demo/kho'
import { EM, lopCuaEm, tuanCuaEm } from '@/lib/demo/em'

export default function KhungEm({ children }: { children: React.ReactNode }) {
  useKho()
  useEffect(() => {
    napTuBoNho()
  }, [])

  const du = duLieu()
  const lop = lopCuaEm(EM)
  const co = du.taiKhoan.find((t) => t.id === du.vai.owner)
  const { chuoi } = tuanCuaEm(EM)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      <TopbarEm ten={`${lop?.ten ?? 'Lớp'} · ${co?.ten ?? ''}`} chuoi={chuoi} />
      <div className="flex min-h-0 flex-1">
        <RailEm />
        <main
          className="min-w-0 flex-1 overflow-auto"
          style={{
            background:
              'radial-gradient(900px 420px at 12% 100%, var(--canvas-a), transparent 70%),' +
              'radial-gradient(900px 460px at 88% 95%, var(--canvas-b), transparent 70%)',
          }}
        >
          {children}
        </main>
      </div>
      <TabDayEm />
    </div>
  )
}
