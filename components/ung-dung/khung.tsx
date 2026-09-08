/**
 * Khung làm việc của cô: topbar 56 · rail 104 · panel 260 · canvas (max 1180).
 * Bám design/_reference/oblue-platform-demo.html và DESIGN.md §Bố cục.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'

import { doiVai } from '@/app/(gv)/actions'
import type { VaiDemo } from '@/lib/demo/du-lieu'

import { Avatar } from './phan-tu'

export const MUC = [
  { href: '/tong-quan', ten: 'Tổng quan', icon: 'M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { href: '/cham-bai', ten: 'Chấm bài', icon: 'M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm10 1v5h5M8 14h8M8 17h5' },
  { href: '/lop-hoc', ten: 'Lớp học', icon: 'M4 6h16M4 12h16M4 18h10' },
  { href: '/nhat-ky', ten: 'Nhật ký', icon: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
] as const

const TEN_VAI: Record<VaiDemo, string> = {
  owner: 'Cô Thảo · chủ lớp',
  assistant: 'Phạm Lan · trợ giảng',
  student: 'Nguyễn Minh Anh · học viên',
}

/**
 * Dải cam khi đang ở vai trợ giảng (DESIGN.md §Thành phần `tabanner`).
 * Người đang làm việc phải luôn biết mình đang đứng ở vai nào, vì cùng một nút
 * ("Gửi nhận xét" / "Gửi cho cô duyệt") mang hai nghĩa khác nhau.
 */
function DaiVai({ vai }: { vai: VaiDemo }) {
  if (vai === 'owner') return null
  return (
    <div className="border-b border-st-orange-line bg-st-orange-soft px-6 py-2 text-[13px] leading-[19px] text-ta-text">
      {vai === 'assistant' ? (
        <>
          Đang xem ở vai <b className="font-display font-semibold">trợ giảng</b>. Nhận xét gửi đi
          sẽ về hàng chờ của cô, không tới thẳng học viên.
        </>
      ) : (
        <>
          Đang xem ở vai <b className="font-display font-semibold">học viên</b>. Em chỉ thấy dữ
          liệu của em, và không bao giờ thấy band nháp của máy.
        </>
      )}
    </div>
  )
}

function DoiVai({ vai }: { vai: VaiDemo }) {
  return (
    <form action={doiVai} className="flex items-center gap-1 rounded-pill bg-field p-1">
      {(['owner', 'assistant', 'student'] as const).map((v) => (
        <button
          key={v}
          name="vai"
          value={v}
          className={`rounded-pill px-3 py-1 font-display text-[12px] font-semibold transition-colors ${
            vai === v ? 'bg-surface text-text shadow-[var(--sh-s)]' : 'text-text-2 hover:text-text'
          }`}
        >
          {v === 'owner' ? 'Cô' : v === 'assistant' ? 'Trợ giảng' : 'Học viên'}
        </button>
      ))}
    </form>
  )
}

export function Topbar({ tenant, vai }: { tenant: string; vai: VaiDemo }) {
  return (
    <header className="sticky top-0 z-20 flex h-topbar items-center gap-4 border-b border-border-light bg-surface px-5">
      <Link href="/tong-quan" className="flex items-center gap-2.5">
        <span aria-hidden className="h-7 w-7 rounded-m" style={{ background: 'var(--grad-me)' }} />
        <b className="font-display text-[15px] font-semibold text-text">OBLUE</b>
      </Link>
      <span className="rounded-pill bg-field px-2.5 py-1 text-[12px] text-text-2">
        {tenant}.oblue.vn
      </span>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-[13px] text-text-2 sm:inline">{TEN_VAI[vai]}</span>
        <DoiVai vai={vai} />
      </div>
    </header>
  )
}

/**
 * Panel 260 — danh sách lớp là bộ lọc chung cho mọi màn (DESIGN.md §Bố cục).
 * Là thành phần client vì "lớp đang chọn" nằm ở query string của trang hiện tại.
 */
export { PanelLop } from './panel-lop'

export function Canvas({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-w-0 flex-1 px-6 py-6"
      style={{
        background:
          'radial-gradient(900px 500px at 12% -8%, var(--canvas-a), transparent 60%),' +
          'radial-gradient(760px 460px at 92% 0%, var(--canvas-b), transparent 62%)',
      }}
    >
      <div className="mx-auto max-w-[var(--content-max)]">{children}</div>
    </main>
  )
}

export { DaiVai }

export function DongNguoi({ ten, mau, phu }: { ten: string; mau: string; phu?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Avatar ten={ten} mau={mau} co={32} />
      <span className="min-w-0">
        <b className="block truncate font-display text-[13px] font-semibold text-text">{ten}</b>
        {phu ? <small className="block truncate text-[12px] text-text-3">{phu}</small> : null}
      </span>
    </span>
  )
}
