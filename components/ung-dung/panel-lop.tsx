'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import type { Lop } from '@/lib/demo/du-lieu'

/**
 * Bộ lọc lớp, dùng chung cho mọi màn.
 *
 * Giữ nguyên đường dẫn và chỉ đổi query, để chuyển lớp không nhảy màn — cô đang ở Chấm bài
 * mà bấm lớp khác thì vẫn ở Chấm bài, chỉ đổi lớp.
 */
export function PanelLop({ lop, demTheoLop }: { lop: Lop[]; demTheoLop: Record<string, number> }) {
  /*
   * `as Route`: kiểu route của Next chỉ kiểm được đường dẫn viết sẵn trong mã, còn đây là
   * đường dẫn của trang đang mở, dựng lúc chạy. Ép kiểu ở đúng một chỗ này, không rải ra.
   */
  const duong = (usePathname() ?? '/tong-quan') as Route
  const dangChon = useSearchParams()?.get('lop') ?? null

  if (lop.length === 0) return null

  return (
    <aside className="hidden w-panel flex-none border-r border-border-light bg-surface px-3 py-4 lg:block">
      <div className="mb-2 px-2 font-display text-[12px] font-semibold uppercase tracking-wide text-text-3">
        Lớp
      </div>

      <Link
        href={duong}
        className={`mb-1 block rounded-m px-2.5 py-2 text-[13px] transition-colors ${
          dangChon === null
            ? 'bg-primary-selected font-medium text-primary'
            : 'text-text-2 hover:bg-hover'
        }`}
      >
        Tất cả lớp
      </Link>

      {lop.map((l) => (
        <Link
          key={l.id}
          href={`${duong}?lop=${l.id}` as Route}
          className={`mb-1 block rounded-m px-2.5 py-2 transition-colors ${
            dangChon === l.id ? 'bg-primary-selected' : 'hover:bg-hover'
          }`}
        >
          <span
            className={`block font-display text-[13px] font-medium ${
              dangChon === l.id ? 'text-primary' : 'text-text'
            }`}
          >
            {l.ten}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[12px] text-text-3">
            {l.hocVienIds.length} em · {l.lich}
            {demTheoLop[l.id] ? (
              <b className="ml-auto rounded-pill bg-st-orange-soft px-1.5 font-display text-[11px] font-semibold text-st-orange-deep">
                {demTheoLop[l.id]}
              </b>
            ) : null}
          </span>
        </Link>
      ))}
    </aside>
  )
}
