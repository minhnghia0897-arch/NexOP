'use client'

/**
 * `s-prac` — bài luyện cô giao, và các gói luyện thêm.
 *
 * Dòng cuối màn là dòng quan trọng nhất và không được bỏ: tiền em trả ở đây chia cho cô.
 * Bỏ nó đi thì màn này thành cửa hàng của nền tảng bán chéo vào lớp của cô — đúng thứ
 * `docs/DECISIONS.md` nói là không bao giờ làm.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'

import { DauManEm, WrapEm } from '@/components/em/khung'
import { Nut } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { EM, baiLuyenCuaEm } from '@/lib/demo/em'

function Goi({
  ten,
  gia,
  moTa,
  y,
  noiBat,
  nut,
}: {
  ten: string
  gia: string
  moTa: string
  y: string[]
  noiBat?: boolean
  nut: ReactNode
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-l border px-5 py-[18px] ${
        noiBat ? 'border-st-blue-line bg-st-blue-soft' : 'border-border-light bg-surface'
      }`}
    >
      <h4 className="flex items-center justify-between gap-2 font-display text-[15px] font-semibold text-text">
        {ten}
        <span className="font-display text-primary">{gia}</span>
      </h4>
      <p className="text-[13px] text-text-2">{moTa}</p>
      <ul className="list-disc pl-5 text-[13px] text-text">
        {y.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <div className="mt-auto pt-2">{nut}</div>
    </div>
  )
}

export default function LuyenThem() {
  useKho()
  const luyen = baiLuyenCuaEm(EM)
  const chuaLam = luyen.filter((b) => !b.ketQua)

  return (
    <>
      <DauManEm
        ten="Luyện thêm"
        phu="Bài luyện cô Thảo soạn hoặc duyệt — chấm ngay, theo đúng cách cô chấm"
      />
      <WrapEm>
        <div className="grid gap-4 sm:grid-cols-2">
          <Goi
            noiBat
            ten="Gói theo lỗi của em"
            gia={chuaLam.length > 0 ? 'Đang có' : 'Đã làm hết'}
            moTa="Đi kèm học phí lớp. Bài do cô giao riêng cho em, không phải bài chung."
            y={
              luyen.length > 0
                ? luyen.map(
                    (b) => `${b.ten}${b.ketQua ? ` — đã làm, đúng ${b.ketQua.dung}/${b.cau.length}` : ''}`,
                  )
                : ['Chưa có bài luyện nào — cô chỉ giao khi có lỗi lặp']
            }
            nut={
              chuaLam.length > 0 ? (
                <Link href="/em/luyen">
                  <Nut kieu="chinh">Làm ngay</Nut>
                </Link>
              ) : (
                <Nut disabled>Đã làm xong</Nut>
              )
            }
          />
          <Goi
            ten="Luyện Writing hằng ngày"
            gia="99K / tháng"
            moTa="Một đề mỗi ngày, chấm trong 2 phút theo rubric cô Thảo, tự đổi đề theo lỗi em đang mắc."
            y={[
              '30 đề Task 1 và Task 2 theo cấp 5.5 → 6.5',
              'Nhận xét viết theo cách cô hay viết',
              'Cô Thảo thấy kết quả, em không phải báo',
            ]}
            nut={<Nut disabled>Thử 3 ngày miễn phí</Nut>}
          />
          <Goi
            ten="Mock có chấm tay"
            gia="150K / bài"
            moTa="Cô Thảo chấm tay trực tiếp, trả trong 48 giờ, kèm 10 phút gọi."
            y={['Nên làm trước kỳ thi thật một tháng']}
            nut={<Nut disabled>Đặt lịch</Nut>}
          />
          <Goi
            ten="Luyện nói 1-1"
            gia="Sắp có"
            moTa="Nói theo đề Speaking Part 2, chấm phát âm và độ trôi chảy."
            y={['Chưa mở — em để lại tên, có thì cô báo']}
            nut={<Nut disabled>Báo khi mở</Nut>}
          />
        </div>
        <p className="mt-3.5 text-[12px] leading-[18px] text-text-3">
          Học phí của gói luyện thêm được chia cho cô Thảo. Em mua ở đây là đang trả tiền cho cô,
          không phải cho ứng dụng.
        </p>
      </WrapEm>
    </>
  )
}
