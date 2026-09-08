/**
 * Mảnh dùng lại của giao diện làm việc. Bám design/_reference/oblue-platform-demo.html.
 * Không hex ở đây — màu qua tiện ích Tailwind bắc cầu sang design/tokens.css.
 */
import type { ReactNode } from 'react'

const NEN_AVATAR: Record<string, string> = {
  orange: 'linear-gradient(135deg,var(--av-orange-a),var(--av-orange-b))',
  blue: 'linear-gradient(135deg,var(--av-blue-a),var(--av-blue-b))',
  green: 'linear-gradient(135deg,var(--av-green-a),var(--av-green-b))',
  purple: 'var(--grad-avatar)',
  off: 'linear-gradient(135deg,var(--av-off-a),var(--av-off-b))',
}

/** Phân biệt người bằng màu và chữ đầu, không bằng emoji (DESIGN.md, anti-pattern). */
export function Avatar({ ten, mau, co = 36 }: { ten: string; mau: string; co?: number }) {
  const chu = ten
    .split(' ')
    .slice(-2)
    .map((t) => t[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className="inline-flex flex-none items-center justify-center rounded-full font-display font-semibold text-surface"
      style={{
        width: co,
        height: co,
        fontSize: co * 0.36,
        background: NEN_AVATAR[mau] ?? NEN_AVATAR.off,
      }}
    >
      {chu}
    </span>
  )
}

type SacDo = 'green' | 'orange' | 'red' | 'purple' | 'blue' | 'yellow'

const NHAN: Record<SacDo, string> = {
  green: 'bg-st-green-soft text-st-green-deep',
  orange: 'bg-st-orange-soft text-st-orange-deep',
  red: 'bg-st-red-soft text-st-red',
  purple: 'bg-st-purple-soft text-st-purple-deep',
  blue: 'bg-st-blue-soft text-primary',
  yellow: 'bg-st-yellow-soft text-st-yellow-deep',
}

/** Nhãn nền nhạt chữ đậm. Màu chỉ mang nghĩa trạng thái. */
export function Nhan({ mau = 'blue', children }: { mau?: SacDo; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-s px-2 py-0.5 font-display text-[12px] font-semibold ${NHAN[mau]}`}
    >
      {children}
    </span>
  )
}

/** Số trần, không tô nền màu (DESIGN.md). */
export function ChiSo({ so, nhan, phu }: { so: ReactNode; nhan: string; phu?: string }) {
  return (
    <div className="rounded-box border border-border-light bg-surface px-4 py-3.5">
      <div className="font-display text-[26px] font-bold tabular-nums leading-none text-text">
        {so}
      </div>
      <div className="mt-1.5 font-display text-[13px] font-medium text-text-2">{nhan}</div>
      {phu ? <div className="mt-0.5 text-[12px] leading-[18px] text-text-3">{phu}</div> : null}
    </div>
  )
}

/** Hộp "vì sao" — mỗi việc máy làm phải nói được lý do (DESIGN.md, Copy). */
export function ViSao({ mau = 'green', children }: { mau?: 'green' | 'orange'; children: ReactNode }) {
  return (
    <div
      className={`rounded-m border px-3 py-2 text-[13px] leading-[19px] ${
        mau === 'green'
          ? 'border-st-green-line bg-callout-green text-text-2'
          : 'border-st-orange-line bg-callout-orange text-text-2'
      }`}
    >
      {children}
    </div>
  )
}

/** Thanh tin cậy của máy. Dưới 85% thì đổi màu — ngưỡng của UC-07. */
export function ThanhTinCay({ ti }: { ti: number }) {
  const pct = Math.round(ti * 100)
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-[72px] overflow-hidden rounded-pill bg-field">
        <span
          className="block h-full rounded-pill"
          style={{
            width: `${pct}%`,
            background: pct >= 85 ? 'var(--st-purple)' : 'var(--st-orange)',
          }}
        />
      </span>
      <span className="font-display text-[12px] font-semibold tabular-nums text-text-2">
        {pct}%
      </span>
    </span>
  )
}

export function Nut({
  children,
  kieu = 'phu',
  ...rest
}: { children: ReactNode; kieu?: 'chinh' | 'phu' | 'nhe' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const lop = {
    chinh: 'bg-primary text-surface hover:bg-primary-hover',
    phu: 'border border-border bg-surface text-text hover:bg-hover',
    nhe: 'text-text-2 hover:bg-hover',
  }[kieu]
  return (
    <button
      {...rest}
      className={`inline-flex h-9 items-center gap-1.5 rounded-m px-3.5 font-display text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${lop}`}
    >
      {children}
    </button>
  )
}

export function TieuDeMan({ ten, phu }: { ten: string; phu?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-[22px] font-semibold leading-tight text-text">{ten}</h1>
      {phu ? <p className="mt-1 text-[13px] leading-[19px] text-text-2">{phu}</p> : null}
    </div>
  )
}

export function KhoiTrong({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-box border border-dashed border-border bg-surface px-5 py-10 text-center text-[13px] leading-[19px] text-text-2">
      {children}
    </div>
  )
}
