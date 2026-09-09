'use client'

/**
 * Rail 104 trên màn rộng, tab đáy 60 dưới 768px (DESIGN.md §Bố cục).
 *
 * Kích thước lấy từ CSS bản mẫu: nút rộng 76, ô icon 44×36 bo `--r-box`, mục đang mở thì
 * ô icon nền `--primary-selected` kèm viền trong mảnh.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Ico, MUC } from './khung'

/** Bốn mục quan trọng nhất cho tab đáy — màn hẹp không chứa nổi chín mục. */
const MUC_DAY = ['/tong-quan', '/cham-bai', '/lop-hoc', '/nhat-ky']

function Muc({ dang, day = false }: { dang: string; day?: boolean }) {
  return (
    <>
      {MUC.map((m, i) => {
        if ('ngan' in m) {
          return day ? null : (
            <hr key={`ngan-${i}`} className="my-2.5 w-11 border-t border-border-light" />
          )
        }
        if (day && !MUC_DAY.includes(m.href)) return null

        const on = dang.startsWith(m.href)
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-col items-center gap-1.5 rounded-m py-2 text-center text-[12px] leading-4 transition-colors ${
              day ? 'justify-center' : 'w-[76px]'
            } ${on ? 'font-display font-semibold text-primary' : 'text-text-2 hover:bg-hover'}`}
          >
            <span
              className={`grid h-9 w-11 place-items-center rounded-box ${
                on
                  ? 'bg-primary-selected shadow-[inset_0_0_0_1px_var(--primary-selected-hover)]'
                  : ''
              }`}
            >
              <Ico d={m.d} />
            </span>
            {m.ten}
          </Link>
        )
      })}
    </>
  )
}

export function Rail() {
  const dang = usePathname() ?? ''
  return (
    <nav
      aria-label="Điều hướng chính"
      className="hidden w-rail flex-none flex-col items-center gap-1 overflow-auto border-r border-border-light bg-surface py-4 md:flex"
    >
      <Muc dang={dang} />
    </nav>
  )
}

export function TabDay() {
  const dang = usePathname() ?? ''
  return (
    <nav
      aria-label="Điều hướng chính"
      className="grid h-[60px] flex-none grid-cols-4 border-t border-border-light bg-surface md:hidden"
    >
      <Muc dang={dang} day />
    </nav>
  )
}
