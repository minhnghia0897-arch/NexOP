'use client'

/**
 * Ô giao bài — bước 1 của vòng vận hành, mở ra từ một buổi trong lộ trình.
 *
 * Ba ô nhập, không hơn: lớp nào · hạn bao giờ · nặng bao nhiêu. Đề đã gắn sẵn trong buổi,
 * nên cô không phải chọn lại — đó chính là chỗ lộ trình tiết kiệm thời gian, và thêm một ô
 * "chọn đề" ở đây là xoá mất lý do lộ trình tồn tại.
 *
 * Ô này chỉ cô mở được, và đó là hệ quả của chính sách chứ không phải quyết định của màn:
 * `path` cho trợ giảng mức `none`, nên trợ giảng không thấy lộ trình, nên không có đường nào
 * tới đây. `giaoBai` trong kho vẫn giữ hai động từ (`create` cho cô, `propose` cho trợ
 * giảng) vì `assignment` cho trợ giảng mức `propose` — khả năng đó CÓ, chỉ là chưa có lối
 * vào nào hợp lệ. Xem `docs/LOGIC.md` §8 câu 7.
 */
import { useState } from 'react'

import type { BuoiLoTrinh, Lop } from '@/lib/demo/du-lieu'
import { giaoBaiHanhVi } from '@/lib/demo/hanh-vi'

import { Nut } from './phan-tu'

/** Mặc định: 23:00 sau ba ngày nữa — đủ để em làm, chưa xa tới mức quên. */
function hanMacDinh(): string {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  d.setHours(23, 0, 0, 0)
  // `datetime-local` cần giờ địa phương không có múi, nên cắt tay chứ không dùng toISOString.
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}T${hai(d.getHours())}:${hai(d.getMinutes())}`
}

export function GiaoBai({
  loTrinhId,
  buoi,
  lop,
  uuTien,
  dong,
}: {
  loTrinhId: string
  buoi: BuoiLoTrinh
  lop: Lop[]
  /** Lớp đang dùng lộ trình này — xếp lên đầu và chọn sẵn. */
  uuTien: readonly string[]
  dong: () => void
}) {
  /*
   * Lớp đang dùng lộ trình này lên đầu danh sách và được chọn sẵn.
   *
   * Cô vẫn giao chéo sang lớp khác được — đó là việc có thật, một buổi hay dùng lại cho lớp
   * sau. Nhưng chọn sẵn đúng lớp thì cô bấm Giao một lần là xong, còn để `lop[0]` thì có hôm
   * cô giao bài IELTS 6.5 vào lớp Nền tảng B1 mà không nhận ra.
   */
  const xepLop = [...lop].sort(
    (a, b) => Number(uuTien.includes(b.id)) - Number(uuTien.includes(a.id)),
  )
  const [lopId, datLopId] = useState(xepLop[0]?.id ?? '')
  const [han, datHan] = useState(hanMacDinh)
  const [trongSo, datTrongSo] = useState(buoi.trongSo ?? 10)
  const [loi, datLoi] = useState<string | null>(null)
  const [xong, datXong] = useState<string | null>(null)

  function gui() {
    const r = giaoBaiHanhVi({
      loTrinhId,
      buoiNo: buoi.no,
      lopId,
      hanNop: new Date(han).toISOString(),
      trongSo,
    })
    if (r.loi) {
      datLoi(r.loi)
      return
    }
    datLoi(null)
    datXong(lop.find((l) => l.id === lopId)?.ten ?? 'lớp')
  }

  if (xong !== null) {
    return (
      <div className="mt-3 rounded-m border border-st-green-line bg-callout-green px-3.5 py-3 text-[13px] leading-[20px] text-text-2">
        <b className="block font-display font-semibold text-text">Đã giao cho {xong}</b>
        Máy đã đăng lên bảng tin lớp. Xem dòng vừa ghi ở Cấu hình → Nhật ký hành vi.
        <button
          type="button"
          onClick={dong}
          className="ml-2 font-display font-semibold text-primary underline"
        >
          Đóng
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-m border border-border bg-surface-2 px-3.5 py-3">
      {loi ? (
        <div className="mb-2.5 rounded-s border border-st-orange-line bg-callout-orange px-3 py-2 text-[12px] leading-[18px] text-text-2">
          {loi}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[180px] flex-1 text-[12px] text-text-2">
          Giao cho lớp
          <select
            value={lopId}
            onChange={(e) => datLopId(e.target.value)}
            className="mt-1 block h-9 w-full rounded-s border border-border bg-surface px-2 text-[13px] text-text"
          >
            {xepLop.map((l) => (
              <option key={l.id} value={l.id}>
                {l.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[190px] flex-1 text-[12px] text-text-2">
          Hạn nộp
          <input
            type="datetime-local"
            value={han}
            onChange={(e) => datHan(e.target.value)}
            className="mt-1 block h-9 w-full rounded-s border border-border bg-surface px-2 text-[13px] text-text"
          />
        </label>

        <label className="w-[104px] text-[12px] text-text-2">
          Trọng số %
          <input
            type="number"
            min={0}
            max={100}
            value={trongSo}
            onChange={(e) => datTrongSo(Number(e.target.value))}
            className="mt-1 block h-9 w-full rounded-s border border-border bg-surface px-2 text-[13px] tabular-nums text-text"
          />
        </label>

        <Nut kieu="chinh" onClick={gui}>
          Giao ngay
        </Nut>
        <Nut onClick={dong}>Thôi</Nut>
      </div>

      <p className="mt-2.5 text-[12px] leading-[18px] text-text-3">
        Đề đã gắn sẵn trong buổi này, cô không phải chọn lại. Câu hỏi được chụp lại lúc giao —
        cô sửa đề tuần sau không đổi đề bài em đang làm dở.
      </p>
    </div>
  )
}
