'use client'

/**
 * Dải tab trong một màn — `tabs` của bản mẫu.
 *
 * Nằm ngay dưới đầu màn, có gạch dưới xanh cho tab đang mở, và con số nằm trong viên nhỏ
 * đổi màu theo tab. Con số là thứ cô quét mắt qua để biết chỗ nào có việc.
 */
import type { ReactNode } from 'react'

export interface Tab {
  id: string
  ten: string
  dem?: number
}

export function DaiTab({
  tabs,
  dang,
  doi,
}: {
  tabs: readonly Tab[]
  dang: string
  doi: (id: string) => void
}) {
  return (
    <div className="flex gap-6 overflow-x-auto border-b border-border-light px-8 pt-[18px]">
      {tabs.map((t) => {
        const on = t.id === dang
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => doi(t.id)}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-none items-center gap-2 border-b-2 pb-3 font-display font-semibold transition-colors ${
              on ? 'border-primary text-primary' : 'border-transparent text-text-2 hover:text-text'
            }`}
          >
            {t.ten}
            {t.dem === undefined ? null : (
              <span
                className={`rounded-[8px] px-1.5 py-px text-[11px] font-bold ${
                  on ? 'bg-primary-selected text-primary' : 'bg-field text-text-2'
                }`}
              >
                {t.dem}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Ô nhập viền gradient — `steer` của DESIGN.md. Chỉ dùng cho đăng bài và chỉnh cách máy làm. */
export function OSteer({
  giaTri,
  datGiaTri,
  goiY,
  chip,
  gui,
  chuaGui,
}: {
  giaTri: string
  datGiaTri: (v: string) => void
  goiY: string
  chip: readonly string[]
  gui: () => void
  chuaGui?: ReactNode
}) {
  return (
    <div
      className="mb-4 rounded-l p-0.5 shadow-[var(--sh-prompt)]"
      style={{
        background:
          'linear-gradient(120deg,var(--grad-a),var(--grad-b) 55%,var(--grad-c))',
      }}
    >
      <div className="rounded-[14px] bg-surface px-[18px] pb-3 pt-4">
        <textarea
          aria-label={goiY}
          value={giaTri}
          onChange={(e) => datGiaTri(e.target.value)}
          placeholder={goiY}
          className="min-h-12 w-full resize-none bg-transparent text-[15px] leading-6 text-text outline-none placeholder:text-text-2"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {chip.map((c) => (
              // Gợi ý của bản mẫu. Chưa nối wizard nên để tắt, không giả vờ bấm được.
              <span
                key={c}
                className="rounded-pill border border-border px-3 py-1 text-[12px] text-text-3"
              >
                {c}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={gui}
            disabled={!giaTri.trim()}
            aria-label="Đăng"
            className="grid h-9 w-9 flex-none place-items-center rounded-m bg-send-bg text-text-3 transition-colors hover:text-text disabled:opacity-45"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        {chuaGui}
      </div>
    </div>
  )
}
