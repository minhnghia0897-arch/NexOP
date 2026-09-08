'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { KhoiTrong, Nhan, TieuDeMan } from '@/components/ung-dung/phan-tu'
import { TheCham } from '@/components/ung-dung/the-cham'
import { VuaGui } from '@/components/ung-dung/vua-gui'
import { useKho } from '@/lib/demo/dung-kho'
import { baiCanCham, duLieu, vaiHienTai } from '@/lib/demo/kho'

function ChamBaiNoi() {
  useKho()
  const lop = useSearchParams()?.get('lop') ?? null
  const vai = vaiHienTai()
  const du = duLieu()

  // Lọc ở kho bằng can(), rồi mới lọc theo lớp cô đang chọn ở panel.
  const tatCa = baiCanCham(vai)
  const ds = lop ? tatCa.filter((b) => b.lopId === lop) : tatCa
  const canDoc = ds.filter((b) => b.ganCo.length > 0).length

  return (
    <>
      <TieuDeMan
        ten="Chấm bài"
        phu={
          vai === 'student'
            ? 'Em không thấy màn này — nháp chấm là việc của cô và trợ giảng.'
            : `${ds.length} bài máy đã nháp, chờ cô. ${canDoc} bài có cờ, cô đọc kỹ giúp.`
        }
      />

      <VuaGui />

      {ds.length === 0 ? (
        <KhoiTrong>
          {vai === 'student' ? (
            <>
              Em không có gì ở đây. Band nháp của máy là việc nội bộ giữa cô và trợ giảng — em chỉ
              nhận nhận xét sau khi cô đã đọc và bấm gửi.
            </>
          ) : (
            <>Không còn bài nào chờ. Cô nghỉ tay.</>
          )}
        </KhoiTrong>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-text-2">
            <Nhan mau="purple">máy nháp {ds.length}</Nhan>
            {canDoc > 0 ? <Nhan mau="orange">cần cô đọc kỹ {canDoc}</Nhan> : null}
            {lop ? (
              <span>
                đang lọc theo <b className="text-text">{du.lop.find((l) => l.id === lop)?.ten}</b>
              </span>
            ) : null}
          </div>

          <div className="space-y-4">
            {ds.map((b) => (
              <TheCham key={b.baiNopId} bai={b} laTroGiang={vai === 'assistant'} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
/*
 * `useSearchParams` phải nằm trong Suspense thì Next mới dựng sẵn được trang tĩnh: lúc
 * dựng chưa có query nào, nên phần phụ thuộc query phải hoãn tới khi chạy ở trình duyệt.
 */
export default function ChamBai() {
  return (
    <Suspense fallback={null}>
      <ChamBaiNoi />
    </Suspense>
  )
}
