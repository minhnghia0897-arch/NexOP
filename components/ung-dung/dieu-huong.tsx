'use client'

/**
 * Điều hướng: rail 104 trên màn rộng, tab đáy 60 dưới 768px (DESIGN.md §Bố cục).
 *
 * Là thành phần client vì cần biết đang đứng ở màn nào. Next 15 không truyền đường dẫn
 * xuống layout máy chủ, và đoán bằng header thì sai lặng lẽ — mục đang mở không sáng lên
 * mà chẳng có lỗi nào để lần ra.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { MUC } from './khung'

function Muc({ dang }: { dang: string }) {
  return (
    <>
      {MUC.map((m) => {
        const on = dang.startsWith(m.href)
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-m px-1 py-2.5 transition-colors ${
              on ? 'bg-primary-selected text-primary' : 'text-text-2 hover:bg-hover'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={m.icon} />
            </svg>
            <span className="font-display text-[11px] font-medium leading-none">{m.ten}</span>
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
      className="hidden w-rail flex-none flex-col gap-1 border-r border-border-light bg-surface px-2 py-3 md:flex"
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
      className="sticky bottom-0 z-20 grid h-[60px] grid-cols-4 border-t border-border-light bg-surface md:hidden"
    >
      <Muc dang={dang} />
    </nav>
  )
}
