'use client'

/**
 * Khung làm việc: topbar 56 · rail 104 · panel 260 · canvas (max 1180).
 *
 * Bám sát design/_reference/oblue-platform-demo.html. DESIGN.md nói rõ: khi mâu thuẫn thì
 * **bản mẫu thắng** — nên kích thước và khoảng cách ở đây lấy từ CSS của bản mẫu chứ không
 * ước lượng bằng mắt.
 *
 * Chỗ cố ý khác bản mẫu, và vì sao: bản mẫu đổi vai bằng cách bấm avatar (`#rolebtn`). Ở
 * bản demo em để một nút ba nấc, vì người xem demo không đoán được rằng avatar bấm được —
 * mà cả sản phẩm này bán ở chỗ "cùng một màn, ba vai thấy ba thứ khác nhau".
 */
import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import type { VaiDemo } from '@/lib/demo/du-lieu'
import { doiVaiXem } from '@/lib/demo/hanh-vi'

/*
 * Mười một mục của bản mẫu, chia ba nhóm bằng gạch ngang.
 *
 * `chiVai` giới hạn mục theo vai đang xem: "Việc của tôi" là màn nhà của trợ giảng, cô
 * không có mục đó (cô đã có Tổng quan). Bản mẫu làm y hệt — `body.ta .rail button[data-s=
 * "tahome"]{display:flex}` — nghĩa là rail cũng co theo quyền, không chỉ nội dung màn.
 *
 * Chỗ cố ý khác bản mẫu: bản mẫu cho Tổng quan và Việc của tôi **cùng một icon bốn ô**.
 * Rail được quét bằng icon chứ không đọc chữ, nên hai mục trùng icon là hai mục không phân
 * biệt được. Việc của tôi dùng icon danh sách-có-tích.
 */
export const MUC = [
  {
    href: '/tong-quan',
    ten: 'Tổng quan',
    d: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  },
  {
    href: '/viec-cua-toi',
    ten: 'Việc của tôi',
    chiVai: 'assistant',
    d: 'M4 6h2l1 1 2-2M4 12h2l1 1 2-2M4 18h2l1 1 2-2M13 6h7M13 12h7M13 18h7',
  },
  { href: '/cham-bai', ten: 'Chấm bài', d: 'M4 20l4-1 10-10-3-3L5 16zM13 7l3 3' },
  {
    href: '/hoc-vien',
    ten: 'Học viên',
    d: 'M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7M2.5 20a6.5 6.5 0 0 1 13 0M17 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M15.5 20a5 5 0 0 1 6-4.5',
  },
  { href: '/lop-hoc', ten: 'Lớp học', d: 'M3 4h18v16H3zM3 10h18M9 4v16' },
  { ngan: true },
  { href: '/lo-trinh', ten: 'Lộ trình', d: 'M4 18h5l3-12h4l3 12h1' },
  { href: '/ngan-hang-de', ten: 'Ngân hàng đề', d: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7' },
  { href: '/hoc-phi', ten: 'Học phí', d: 'M3 6h18v12H3zM3 10h18' },
  { href: '/bang-tin', ten: 'Bảng tin', d: 'M4 5h16v11H8l-4 4z' },
  { ngan: true },
  {
    href: '/cau-hinh',
    ten: 'Cấu hình',
    d: [
      'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
      'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    ],
  },
] as const

export function Ico({ d, s = false }: { d: string | readonly string[]; s?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={s ? 'h-4 w-4' : 'h-[22px] w-[22px]'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(typeof d === 'string' ? [d] : d).map((nét) => (
        <path key={nét} d={nét} />
      ))}
    </svg>
  )
}

/** Ba vạch màu — dấu hiệu nhận ra sản phẩm ở bản mẫu. */
function Logo() {
  return (
    <span aria-hidden className="flex flex-none items-end gap-[3px]">
      <i
        className="block h-[22px] w-[9px] rounded-[6px]"
        style={{ background: 'var(--st-brand-red)' }}
      />
      <i
        className="block h-[26px] w-[9px] rounded-[6px]"
        style={{ background: 'var(--st-yellow)' }}
      />
      <i
        className="block h-[22px] w-[9px] rounded-[6px]"
        style={{ background: 'var(--st-green)' }}
      />
    </span>
  )
}

const NHAN_VAI: Record<VaiDemo, string> = {
  owner: 'Cô',
  assistant: 'Trợ giảng',
  student: 'Học viên',
}

function DoiVai({ vai }: { vai: VaiDemo }) {
  return (
    <div
      role="group"
      aria-label="Đổi vai"
      className="flex flex-none items-center gap-1 rounded-pill bg-field p-1"
    >
      {(['owner', 'assistant', 'student'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => doiVaiXem(v)}
          aria-pressed={vai === v}
          className={`rounded-pill px-3 py-1 font-display text-[12px] font-semibold transition-colors ${
            vai === v ? 'bg-surface text-text shadow-[var(--sh-s)]' : 'text-text-2 hover:text-text'
          }`}
        >
          {NHAN_VAI[v]}
        </button>
      ))}
    </div>
  )
}

export function Topbar({
  tenTenant,
  vai,
  soCho,
}: {
  tenTenant: string
  vai: VaiDemo
  soCho: number
}) {
  return (
    <div className="flex h-topbar flex-none items-center gap-4 border-b border-border-light bg-surface px-5">
      <Logo />
      <span className="ml-1.5 hidden border-l border-border-light pl-4 font-display font-semibold text-text sm:inline">
        {tenTenant}
      </span>

      {/* Ô tìm kiếm của bản mẫu là chỗ dành sẵn — chưa nối gì, nên không giả vờ bấm được. */}
      <div
        aria-hidden
        className="mx-auto hidden h-9 max-w-[520px] flex-1 items-center gap-2.5 rounded-[18px] bg-field px-4 text-[13px] text-text-3 md:flex"
      >
        <Ico s d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14m9 16-3.5-3.5" />
        Tìm học viên, lớp, đề, bài nộp…
      </div>

      <div className="ml-auto flex flex-none items-center gap-4">
        {soCho > 0 ? (
          <span className="hidden rounded-s bg-st-green-soft px-2 py-0.5 font-display text-[11px] font-semibold leading-[18px] text-st-green-deep lg:inline">
            Máy đã nháp sẵn {soCho} bài
          </span>
        ) : null}
        <DoiVai vai={vai} />
      </div>
    </div>
  )
}

/**
 * Dải cam khi đang ở vai khác cô (DESIGN.md §Thành phần `tabanner`).
 * Nói rõ vai đó KHÔNG làm được gì — đó mới là câu người dùng cần, không phải "bạn là ai".
 */
export function DaiVai({ vai }: { vai: VaiDemo }) {
  if (vai === 'owner') return null
  return (
    <div className="flex-none border-b border-st-orange-line bg-st-orange-soft px-5 py-2 text-[13px] leading-[19px] text-ta-text">
      {vai === 'assistant' ? (
        <>
          <b className="font-display font-semibold">Đang xem như trợ giảng Lan</b> — chỉ lớp IELTS
          6.5 · soạn nhận xét, không gửi · không thấy học phí, rubric, ghi chú của cô
        </>
      ) : (
        <>
          <b className="font-display font-semibold">Đang xem như học viên Minh Anh</b> — chỉ dữ liệu
          của em · không thấy band nháp của máy · không thấy bạn cùng lớp{' '}
          <Link href="/em/hom-nay" className="font-display font-semibold underline">
            Mở app của em →
          </Link>
        </>
      )}
    </div>
  )
}

export function Canvas({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-w-0 flex-1 overflow-auto"
      style={{
        background:
          'radial-gradient(900px 500px at 12% -8%, var(--canvas-a), transparent 60%),' +
          'radial-gradient(760px 460px at 92% 0%, var(--canvas-b), transparent 62%)',
      }}
    >
      {children}
    </main>
  )
}

/** Đầu màn: tên, dòng phụ nói bằng sự việc, và hành động chính bên phải. */
export function DauMan({
  ten,
  phu,
  song,
  hanhDong,
}: {
  ten: string
  phu?: string
  song?: string
  hanhDong?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 px-8 pt-5">
      <div className="min-w-0">
        <h1 className="font-display text-[24px] font-semibold leading-[30px] text-text">{ten}</h1>
        {phu ? <div className="mt-0.5 text-[13px] leading-[19px] text-text-2">{phu}</div> : null}
      </div>
      {song || hanhDong ? (
        <div className="ml-auto flex items-center gap-5">
          {song ? (
            <span className="flex items-center gap-[7px] text-[13px] text-text-2">
              <i aria-hidden className="h-2 w-2 flex-none rounded-full bg-st-green" />
              {song}
            </span>
          ) : null}
          {hanhDong}
        </div>
      ) : null}
    </div>
  )
}

export function Wrap({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[var(--content-max)] px-8 pb-16 pt-6">{children}</div>
}

/** Hành động chính ở đầu màn, kiểu nút chữ của bản mẫu. */
export function NutLien({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 font-display text-[14px] font-medium text-text transition-colors hover:text-primary"
    >
      {children}
    </Link>
  )
}

export { PanelLop } from './panel-lop'
export { Avatar, DongNguoi } from './phan-tu'
