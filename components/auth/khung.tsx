/**
 * Thành phần dùng chung cho các màn đăng nhập và lời mời.
 * Bám bản mẫu design/_reference/oblue-auth-demo.html — bản mẫu thắng khi mâu thuẫn.
 *
 * Không hex ở đây: màu lấy qua tiện ích Tailwind bắc cầu sang design/tokens.css.
 */
import type { ReactNode } from 'react'

/** Thanh địa chỉ giả — cho cô và em thấy mình đang đứng ở tên miền nào. */
export function ThanhDiaChi({ duong }: { duong: string }) {
  return (
    <div className="mx-auto mb-[22px] flex max-w-[520px] items-center gap-2.5 rounded-pill bg-field px-4 py-2 text-[13px] text-text-2">
      <span aria-hidden className="text-st-green-deep">
        🔒
      </span>
      <b className="font-semibold text-text">{duong.split('/')[0]}</b>
      <span>/{duong.split('/').slice(1).join('/')}</span>
    </div>
  )
}

export function The({ children, rong = false }: { children: ReactNode; rong?: boolean }) {
  return (
    <div
      className={`mx-auto rounded-l border border-border-light bg-surface px-[30px] py-7 shadow-[var(--sh-s)] ${
        rong ? 'max-w-[560px]' : 'max-w-[440px]'
      }`}
    >
      {children}
    </div>
  )
}

/** Đầu thẻ: tên lớp của cô, để em biết mình đang mở link của ai trước khi nhập gì. */
export function TenLop({ ten, phu }: { ten: string; phu: string }) {
  return (
    <div className="mb-[18px] flex items-center gap-2.5">
      <span
        aria-hidden
        className="h-11 w-11 flex-none rounded-[14px]"
        style={{ background: 'var(--grad-me)' }}
      />
      <div>
        <b className="block font-display text-base font-semibold text-text">{ten}</b>
        <small className="text-[13px] text-text-2">{phu}</small>
      </div>
    </div>
  )
}

type SacThai = 'xanh-duong' | 'xanh-la' | 'cam'

const NEN: Record<SacThai, string> = {
  'xanh-duong': 'bg-st-blue-soft border-st-blue-line',
  'xanh-la': 'bg-callout-green border-st-green-line',
  cam: 'bg-callout-orange border-st-orange-line',
}

const HUY_HIEU: Record<SacThai, string> = {
  'xanh-duong': 'bg-st-blue',
  'xanh-la': 'bg-st-green',
  cam: 'bg-st-orange',
}

/**
 * Hộp "vì sao" — DESIGN.md: mỗi việc máy làm có một dòng vì sao hoặc chuyện gì tiếp theo.
 * Ở đây nó nói cho em biết đang được mời vào đâu, trước khi em nhập số.
 */
export function HopViSao({
  sacThai = 'xanh-duong',
  nhan,
  children,
}: {
  sacThai?: SacThai
  nhan?: string
  children: ReactNode
}) {
  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-m border p-3 text-[13px] leading-5 ${NEN[sacThai]}`}
    >
      {nhan ? (
        <span
          aria-hidden
          className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] font-display text-[13px] font-bold text-surface ${HUY_HIEU[sacThai]}`}
        >
          {nhan}
        </span>
      ) : null}
      <div>{children}</div>
    </div>
  )
}

export function O({
  nhan,
  ...props
}: { nhan: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1 block font-display text-xs font-semibold text-text-2">{nhan}</span>
      <input
        {...props}
        className="w-full rounded-m border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
      />
    </label>
  )
}

export function NutChinh({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="h-11 w-full rounded-m bg-primary font-display text-[15px] font-semibold text-surface transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {children}
    </button>
  )
}

/** Dòng chữ nhỏ dưới nút — nói thẳng luật, không giấu trong điều khoản. */
export function ChuNho({ children }: { children: ReactNode }) {
  return <p className="mt-3.5 text-xs leading-[18px] text-text-3">{children}</p>
}

export function DongPhu({ children }: { children: ReactNode }) {
  return <p className="mt-3.5 text-center text-[13px] text-text-2">{children}</p>
}
