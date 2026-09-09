'use client'

/**
 * Khung app học viên — `oblue-student-demo.html`.
 *
 * Khác app của cô ở một chỗ quyết định bố cục: em không có panel lớp. Em học một lớp, nên
 * bộ lọc lớp là một cột trống chiếm 260px. Dưới 768px thì rail đổi thành tab đáy 60px,
 * vì đây là app em mở trên điện thoại, không phải bản thu nhỏ của app cô.
 */
import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { Ico } from '@/components/ung-dung/khung'

export const MUC_EM = [
  { href: '/em/hom-nay', ten: 'Hôm nay', ngan: 'Hôm nay',
    d: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', 'M12 7v5l3 2'] },
  { href: '/em/bai-cua-toi', ten: 'Bài của tôi', ngan: 'Bài',
    d: ['M4 20l4-1 10-10-3-3L5 16z', 'M13 7l3 3'] },
  { href: '/em/tien-do', ten: 'Tiến độ', ngan: 'Tiến độ', d: ['M4 19h16M7 16V9M12 16V5M17 16v-6'] },
  { chia: true },
  { href: '/em/luyen-them', ten: 'Luyện thêm', ngan: 'Luyện',
    d: ['M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9L9.5 8z'] },
  { href: '/em/bang-tin-lop', ten: 'Bảng tin', ngan: 'Lớp', d: ['M4 5h16v11H8l-4 4z'] },
] as const

function dangO(dang: string, href: string): boolean {
  // /em/luyen và /em/nop-bai là màn sâu, mở từ Hôm nay — không mục nào sáng lên, và đúng
  // là không nên: sáng nhầm mục thì em bấm quay lại sẽ tới chỗ không ngờ.
  return dang === href
}

function Muc({ dang, day }: { dang: string; day: boolean }) {
  return (
    <>
      {MUC_EM.map((m, i) =>
        'chia' in m ? (
          day ? null : (
            <hr key={`c-${i}`} className="my-2.5 w-11 border-t border-border-light" />
          )
        ) : (
          <Link
            key={m.href}
            href={m.href}
            aria-current={dangO(dang, m.href) ? 'page' : undefined}
            className={`flex flex-col items-center gap-1.5 rounded-m text-center transition-colors ${
              day ? 'justify-center text-[11px]' : 'w-[76px] py-2 text-[12px] leading-4'
            } ${
              dangO(dang, m.href)
                ? 'font-display font-semibold text-primary'
                : 'text-text-2 hover:bg-hover'
            }`}
          >
            <span
              className={`grid place-items-center rounded-box ${day ? 'h-5' : 'h-9 w-11'} ${
                dangO(dang, m.href) && !day
                  ? 'bg-primary-selected shadow-[inset_0_0_0_1px_var(--primary-selected-hover)]'
                  : ''
              }`}
            >
              <Ico d={m.d} s={day} />
            </span>
            {day ? m.ngan : m.ten}
          </Link>
        ),
      )}
    </>
  )
}

export function RailEm() {
  const dang = usePathname() ?? ''
  return (
    <nav
      aria-label="Điều hướng app học viên"
      className="hidden w-rail flex-none flex-col items-center gap-1 overflow-auto border-r border-border-light bg-surface py-4 md:flex"
    >
      <Muc dang={dang} day={false} />
    </nav>
  )
}

export function TabDayEm() {
  const dang = usePathname() ?? ''
  return (
    <nav
      aria-label="Điều hướng app học viên"
      className="grid h-[60px] flex-none grid-cols-5 border-t border-border-light bg-surface md:hidden"
    >
      <Muc dang={dang} day />
    </nav>
  )
}

function Logo() {
  return (
    <span aria-hidden className="flex flex-none items-end gap-[3px]">
      <i className="block h-[22px] w-[9px] rounded-[6px]" style={{ background: 'var(--st-brand-red)' }} />
      <i className="block h-[26px] w-[9px] rounded-[6px]" style={{ background: 'var(--st-yellow)' }} />
      <i className="block h-[22px] w-[9px] rounded-[6px]" style={{ background: 'var(--st-green)' }} />
    </span>
  )
}

export function TopbarEm({ ten, chuoi }: { ten: string; chuoi: number }) {
  return (
    <div className="flex h-topbar flex-none items-center gap-4 border-b border-border-light bg-surface px-5">
      <Logo />
      <span className="ml-1.5 min-w-0 truncate border-l border-border-light pl-4 font-display font-semibold text-text">
        {ten}
      </span>
      <div className="ml-auto flex flex-none items-center gap-3">
        {chuoi > 0 ? (
          <span className="hidden rounded-s bg-st-green-soft px-2 py-0.5 font-display text-[11px] font-semibold leading-[18px] text-st-green-deep sm:inline">
            Chuỗi {chuoi} ngày
          </span>
        ) : null}
        <Link
          href="/tong-quan"
          className="font-display text-[12px] font-semibold text-text-2 hover:text-primary"
        >
          Về app của cô
        </Link>
      </div>
    </div>
  )
}

/** Đầu màn của app em — hẹp hơn app cô, không có hàng hành động bên phải. */
export function DauManEm({
  ten,
  phu,
  quayVe,
  rong,
  phai,
}: {
  ten: string
  phu?: string
  quayVe?: { href: Route; ten: string }
  /** Phải khớp với `rong` của WrapEm bên dưới — xem ghi chú trong hàm. */
  rong?: boolean
  phai?: ReactNode
}) {
  /*
   * Đầu màn nằm trong cùng một cột với nội dung.
   *
   * Bản mẫu để `.chead` sát mép trái còn `.wrap.n` căn giữa ở 760 — trên màn 1440 thì tiêu
   * đề trôi hẳn ra khỏi cột nội dung, trông như một chỗ hỏng. Đây là chỗ cố ý khác bản mẫu,
   * và khác vì bản mẫu được xem ở khổ hẹp nên lỗi đó không lộ.
   */
  return (
    <div
      className={`mx-auto flex flex-wrap items-center gap-3 px-4 pt-4 sm:px-8 sm:pt-5 ${
        rong ? 'max-w-[1100px]' : 'max-w-[760px]'
      }`}
    >
      <div className="min-w-0">
        {quayVe ? (
          <Link
            href={quayVe.href}
            className="mb-1 inline-flex items-center gap-1.5 font-display text-[13px] font-semibold text-text-2 hover:text-primary"
          >
            ‹ {quayVe.ten}
          </Link>
        ) : null}
        <h1 className="font-display text-[24px] font-semibold leading-[30px] text-text">{ten}</h1>
        {phu ? <div className="mt-0.5 text-[13px] leading-[19px] text-text-2">{phu}</div> : null}
      </div>
      {phai ? <div className="ml-auto flex items-center gap-4">{phai}</div> : null}
    </div>
  )
}

/** Khung nội dung hẹp — `wrap n` của bản mẫu, tối đa 760. */
export function WrapEm({ rong, children }: { rong?: boolean; children: ReactNode }) {
  return (
    <div
      className={`mx-auto px-4 pb-16 pt-5 sm:px-8 sm:pt-6 ${rong ? 'max-w-[1100px]' : 'max-w-[760px]'}`}
    >
      {children}
    </div>
  )
}
