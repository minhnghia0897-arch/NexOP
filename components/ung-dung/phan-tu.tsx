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

/** Phân biệt người bằng màu và chữ đầu, không bằng emoji (DESIGN.md §Anti-pattern). */
export function Avatar({
  ten,
  mau,
  co = 38,
  vuong = true,
}: {
  ten: string
  mau: string
  co?: number
  vuong?: boolean
}) {
  const chu = ten
    .split(' ')
    .slice(-2)
    .map((t) => t[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className={`inline-grid flex-none place-items-center font-display font-semibold text-surface ${
        vuong ? 'rounded-[12px]' : 'rounded-full'
      }`}
      style={{
        width: co,
        height: co,
        fontSize: co * 0.34,
        background: NEN_AVATAR[mau] ?? NEN_AVATAR.off,
      }}
    >
      {chu}
    </span>
  )
}

export function DongNguoi({ ten, mau, phu }: { ten: string; mau: string; phu?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar ten={ten} mau={mau} co={32} />
      <span className="min-w-0">
        <b className="block truncate font-display text-[13px] font-semibold text-text">{ten}</b>
        {phu ? <small className="block truncate text-[12px] text-text-3">{phu}</small> : null}
      </span>
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
      className={`inline-flex items-center rounded-s px-2 py-0.5 font-display text-[11px] font-semibold leading-[18px] ${NHAN[mau]}`}
    >
      {children}
    </span>
  )
}

/** Nhãn tím "theo giọng cô" — dấu của việc máy làm (bản mẫu: `.ai`). */
export function NhanMay({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-s bg-st-purple-soft px-2 py-0.5 font-display text-[11px] font-semibold text-st-purple-deep">
      {children}
    </span>
  )
}

/** Số trần, không tô nền màu. Dòng phụ nói bằng sự việc, không phải nhắc lại con số. */
export function ChiSo({
  nhan,
  so,
  phu,
  sac,
}: {
  nhan: string
  so: ReactNode
  phu?: string
  sac?: 'good' | 'warn'
}) {
  return (
    <div className="rounded-l border border-border-light bg-surface px-5 py-[18px]">
      <div className="font-display text-[13px] text-text-2">{nhan}</div>
      <div
        className={`mt-1.5 font-display text-[28px] font-semibold leading-[38px] tabular-nums ${
          sac === 'good' ? 'text-st-green' : sac === 'warn' ? 'text-st-red' : 'text-text'
        }`}
      >
        {so}
      </div>
      {phu ? <div className="text-[12px] text-text-3">{phu}</div> : null}
    </div>
  )
}

/** Khối trắng có tiêu đề — `blkc` của bản mẫu. */
export function Khoi({
  ten,
  phu,
  children,
}: {
  ten: string
  phu?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-l border border-border-light bg-surface p-6">
      <h3 className="font-display text-[18px] font-semibold text-text">{ten}</h3>
      {phu ? <p className="mb-5 mt-1 text-[13px] text-text-2">{phu}</p> : <div className="mb-5" />}
      {children}
    </section>
  )
}

/** Hộp "vì sao" — mỗi việc máy làm phải nói được lý do (DESIGN.md §Copy). */
export function ViSao({
  mau = 'green',
  children,
}: {
  mau?: 'green' | 'orange'
  children: ReactNode
}) {
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

export function Nut({
  children,
  kieu = 'phu',
  ...rest
}: { children: ReactNode; kieu?: 'chinh' | 'phu' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const lop =
    kieu === 'chinh'
      ? 'bg-primary text-surface hover:bg-primary-hover'
      : 'border border-border text-text-2 hover:border-text-3 hover:text-text'
  return (
    <button
      {...rest}
      className={`inline-flex h-9 items-center gap-1.5 rounded-s px-[18px] font-display text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${lop}`}
    >
      {children}
    </button>
  )
}

export function KhoiTrong({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-l border border-dashed border-border bg-surface px-5 py-10 text-center text-[13px] leading-[19px] text-text-2">
      {children}
    </div>
  )
}

/** Thanh tiến độ duyệt — `prog` của bản mẫu. */
export function ThanhTienDo({ xong, tong }: { xong: number; tong: number }) {
  const pct = tong === 0 ? 0 : Math.round((xong / tong) * 100)
  return (
    <div className="mb-[18px] flex items-center gap-3.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-field">
        <i
          className="block h-full bg-st-green transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-[13px] text-text-2">
        Đã gửi {xong} / {tong}
      </span>
    </div>
  )
}

/** Pill lọc — `route` của bản mẫu. Cái đang chọn nền mực, chữ trắng. */
export function Pill({
  on,
  dem,
  children,
  ...rest
}: { on: boolean; dem?: number; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      type="button"
      aria-pressed={on}
      className={`flex h-10 items-center gap-[9px] rounded-pill border px-[18px] font-display font-medium transition-colors ${
        on
          ? 'border-transparent bg-ink text-surface'
          : 'border-border bg-surface text-text hover:border-text-3'
      }`}
    >
      {children}
      {dem === undefined ? null : (
        <span className="text-[12px] font-bold opacity-70">{dem}</span>
      )}
    </button>
  )
}
