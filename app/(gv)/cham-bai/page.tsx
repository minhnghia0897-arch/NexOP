'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { KhoiTrong, Pill, ThanhTienDo } from '@/components/ung-dung/phan-tu'
import { TheCham } from '@/components/ung-dung/the-cham'
import { VuaGui } from '@/components/ung-dung/vua-gui'
import { useKho } from '@/lib/demo/dung-kho'
import { baiCanCham, duLieu, vaiHienTai } from '@/lib/demo/kho'

function ChamBaiNoi() {
  useKho()
  const lop = useSearchParams()?.get('lop') ?? null
  const vai = vaiHienTai()
  const du = duLieu()
  const [chiCanDoc, datChiCanDoc] = useState(false)

  const tatCa = baiCanCham(vai)
  const trongLop = lop ? tatCa.filter((b) => b.lopId === lop) : tatCa
  const canDoc = trongLop.filter((b) => b.ganCo.length > 0)
  const ds = chiCanDoc ? canDoc : trongLop

  // Đã gửi bao nhiêu trong phiên này — thanh tiến độ nói bằng việc thật, không phải %.
  const daGui = du.nhanXet.length
  const tong = daGui + trongLop.length

  if (vai === 'student') {
    return (
      <>
        <DauMan
          ten="Chấm bài"
          phu="Em không thấy màn này — nháp chấm là việc của cô và trợ giảng."
        />
        <Wrap>
          <KhoiTrong>
            Band nháp của máy là việc nội bộ giữa cô và trợ giảng. Em chỉ nhận nhận xét sau khi cô
            đã đọc và bấm gửi.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  return (
    <>
      <DauMan
        ten="Chấm bài"
        phu="Nhận xét nháp viết theo cách cô chấm — cô duyệt, sửa, hoặc viết lại. Không gửi gì khi cô chưa bấm."
        song={`Nháp xong ${trongLop.length} bài · ${canDoc.length} bài cần mắt cô`}
      />
      <Wrap>
        <VuaGui />

        <div className="mb-5 flex flex-wrap gap-2.5">
          <Pill on={!chiCanDoc} dem={trongLop.length} onClick={() => datChiCanDoc(false)}>
            Tất cả bài chờ
          </Pill>
          <Pill on={chiCanDoc} dem={canDoc.length} onClick={() => datChiCanDoc(true)}>
            Cần mắt cô
          </Pill>
          {lop ? (
            <span className="flex h-10 items-center text-[13px] text-text-2">
              đang lọc theo <b className="ml-1 text-text">{du.lop.find((l) => l.id === lop)?.ten}</b>
            </span>
          ) : null}
        </div>

        {tong > 0 ? <ThanhTienDo xong={daGui} tong={tong} /> : null}

        {ds.length === 0 ? (
          <KhoiTrong>
            {chiCanDoc
              ? 'Không bài nào bị gắn cờ. Cô duyệt lướt phần còn lại là xong.'
              : 'Không còn bài nào chờ. Cô nghỉ tay.'}
          </KhoiTrong>
        ) : (
          ds.map((b) => <TheCham key={b.baiNopId} bai={b} laTroGiang={vai === 'assistant'} />)
        )}
      </Wrap>
    </>
  )
}

/*
 * `useSearchParams` phải nằm trong Suspense thì Next mới dựng sẵn được trang tĩnh: lúc dựng
 * chưa có query nào, nên phần phụ thuộc query phải hoãn tới khi chạy ở trình duyệt.
 */
export default function ChamBai() {
  return (
    <Suspense fallback={null}>
      <ChamBaiNoi />
    </Suspense>
  )
}
