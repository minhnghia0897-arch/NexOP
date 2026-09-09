'use client'

/**
 * Mảnh riêng của app học viên. Bám `oblue-student-demo.html`.
 *
 * Khác app của cô ở giọng: mọi dòng ở đây nói với em, và không dòng nào so em với bạn.
 * Đó không phải phong cách — `gradebook` mức `none` với vai học viên, nên một thành phần
 * "xếp hạng lớp" ở đây sẽ không có dữ liệu để vẽ.
 */
import type { ReactNode } from 'react'

import type { LoiDanhDau } from '@/lib/demo/du-lieu'

/** Vòng band — `hero .ring` của bản mẫu, nền conic theo phần trăm chặng. */
export function Vong({ so, nhan, phanTram }: { so: string; nhan: string; phanTram: number }) {
  return (
    <div
      aria-hidden
      className="relative grid h-[92px] w-[92px] flex-none place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--primary) 0 ${phanTram}%, var(--field) ${phanTram}% 100%)`,
      }}
    >
      <i className="absolute inset-2 rounded-full bg-surface" />
      <span className="relative text-center">
        <b className="block font-display text-[22px] font-semibold leading-none text-text">{so}</b>
        <small className="block text-[10px] text-text-2">{nhan}</small>
      </span>
    </div>
  )
}

/** Một việc em phải làm. `gap` = sắp tới hạn, viền đỏ nhạt như bản mẫu. */
export function Viec({
  mau,
  ten,
  phu,
  gap,
  nut,
}: {
  mau: 'purple' | 'blue' | 'green' | 'orange'
  ten: string
  phu: string
  gap?: boolean
  nut?: ReactNode
}) {
  const nen = {
    purple: 'var(--grad-avatar)',
    blue: 'linear-gradient(135deg,var(--av-blue-a),var(--av-blue-b))',
    green: 'linear-gradient(135deg,var(--av-green-a),var(--av-green-b))',
    orange: 'linear-gradient(135deg,var(--av-orange-a),var(--av-orange-b))',
  }[mau]

  return (
    <div
      className={`mt-3 flex items-center gap-3.5 rounded-l border bg-surface px-[18px] py-4 ${
        gap ? 'border-st-red-line bg-surface-due' : 'border-border-light'
      }`}
    >
      <span
        aria-hidden
        className="grid h-10 w-10 flex-none place-items-center rounded-[12px]"
        style={{ background: nen }}
      />
      <div className="min-w-0 flex-1">
        <b className="block font-display font-semibold text-text">{ten}</b>
        <small className="text-[13px] leading-[19px] text-text-2">{phu}</small>
      </div>
      {nut}
    </div>
  )
}

/** Thanh một tiêu chí. Vạch xanh là mục tiêu — cột nào xa vạch nhất là cột cần luyện. */
export function Tieu({
  ten,
  diem,
  muc,
  len,
}: {
  ten: string
  diem: number
  muc: number
  len?: boolean
}) {
  return (
    <div className="flex items-center gap-3 border-t border-border-light py-2.5 first:border-t-0 first:pt-0">
      <span className="w-[110px] flex-none text-[13px] text-text-2">{ten}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-[5px] bg-field">
        <i
          className="block h-full rounded-[5px] bg-primary"
          style={{ width: `${Math.min(100, (diem / 9) * 100)}%` }}
        />
      </div>
      <i
        aria-hidden
        className="relative -ml-3 h-[18px] w-0.5 flex-none bg-st-green"
        style={{ left: 0 }}
        title={`mục tiêu ${muc}`}
      />
      <b className="w-[58px] flex-none text-right font-display tabular-nums text-text">
        {diem.toFixed(1)}
        {len ? <small className="ml-1 text-[11px] font-semibold text-st-green-deep">↑</small> : null}
      </b>
    </div>
  )
}

/** Cột band theo thời gian — `spark`. Cột cuối là bài mới nhất, tô đậm. */
export function Cot({ ds }: { ds: { nhan: string; band: number }[] }) {
  if (ds.length === 0) return null
  return (
    <>
      <div className="mb-1 mt-6 flex h-16 items-end gap-1.5">
        {ds.map((d, i) => (
          <div
            key={d.nhan}
            className={`relative flex-1 rounded-t-[3px] ${
              i === ds.length - 1 ? 'bg-primary' : 'bg-field'
            }`}
            style={{ height: `${(d.band / 9) * 100}%` }}
          >
            <span className="absolute -top-[18px] left-0 right-0 text-center font-display text-[11px] font-semibold tabular-nums text-text-2">
              {d.band.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 text-[11px] text-text-3">
        {ds.map((d) => (
          <span key={d.nhan} className="flex-1 truncate text-center">
            {d.nhan}
          </span>
        ))}
      </div>
    </>
  )
}

const VACH_LOI: Record<LoiDanhDau['nhom'], string> = {
  grammar: 'border-l-st-red',
  vocab: 'border-l-st-orange',
  structure: 'border-l-st-purple',
}

/** Một chỗ cô đánh dấu: câu em viết, chữ cô sửa, và vì sao. */
export function ChoSua({ loi }: { loi: LoiDanhDau }) {
  return (
    <div className={`mb-3.5 border-l-[3px] pl-3 ${VACH_LOI[loi.nhom]}`}>
      <div className="text-[13px] leading-5 text-text-2">
        <s className="decoration-st-red decoration-2">{loi.trich}</s>
      </div>
      <div className="mt-0.5 text-[13px] leading-5 text-text">
        <b className="font-semibold text-st-green-deep">{loi.sua}</b> — {loi.loai}
      </div>
      {loi.themY ? <div className="mt-1 text-[12px] text-text-3">{loi.themY}</div> : null}
    </div>
  )
}

/** Chuỗi ngày học đều. Ô hôm nay có viền xanh — nhắc mà không mắng. */
export function Chuoi({ ngay }: { ngay: { ten: string; co: boolean; homNay?: boolean }[] }) {
  return (
    <div className="flex gap-1.5">
      {ngay.map((n) => (
        <i
          key={n.ten}
          className={`grid h-7 flex-1 place-items-center rounded-[6px] text-[11px] not-italic ${
            n.co ? 'bg-st-green font-bold text-surface' : 'bg-field text-text-3'
          } ${n.homNay ? 'outline outline-2 -outline-offset-2 outline-primary' : ''}`}
        >
          {n.ten}
        </i>
      ))}
    </div>
  )
}
