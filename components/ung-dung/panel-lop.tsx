'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import type { Lop } from '@/lib/demo/du-lieu'

import { Ico } from './khung'

/**
 * Panel 260 — danh sách lớp là bộ lọc chung cho mọi màn (DESIGN.md §Bố cục).
 *
 * Bám bản mẫu: đầu panel có nút "Mở lớp mới từ lộ trình", lớp chia hai nhóm Đang chạy /
 * Sắp mở, mỗi lớp có chấm màu riêng, số bài chờ nằm bên phải, và dưới cùng là thẻ tiến độ
 * thiết lập. Chấm màu là cách bản mẫu phân biệt lớp — không phải số thứ tự, không phải
 * emoji (DESIGN.md §Anti-pattern).
 *
 * Giữ nguyên đường dẫn và chỉ đổi query, để chuyển lớp không nhảy màn.
 */
const CHAM: Record<Lop['mau'], string> = {
  blue: 'var(--st-blue)',
  purple: 'var(--st-purple)',
  orange: 'var(--st-orange)',
  green: 'var(--st-green)',
  indigo: 'var(--st-indigo)',
}

function Dong({
  href,
  chon,
  mau,
  ten,
  phu,
  dem,
}: {
  href: Route
  chon: boolean
  mau: string
  ten: string
  phu: string
  dem?: number
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-2.5 rounded-s px-2.5 py-[7px] text-left transition-colors ${
        chon ? 'bg-primary-selected' : 'hover:bg-hover'
      }`}
    >
      <i aria-hidden className="h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: mau }} />
      <span className="min-w-0 flex-1">
        <b
          className={`block truncate font-display text-[13px] font-semibold ${
            chon ? 'text-primary' : 'text-text'
          }`}
        >
          {ten}
        </b>
        <small className="block truncate text-[12px] text-text-2">{phu}</small>
      </span>
      {dem ? <span className="ml-auto text-[12px] text-text-3">{dem}</span> : null}
    </Link>
  )
}

export function PanelLop({
  lop,
  demTheoLop,
  soHocVien,
  soCoTaiKhoan,
}: {
  lop: Lop[]
  demTheoLop: Record<string, number>
  soHocVien: number
  soCoTaiKhoan: number
}) {
  const duong = (usePathname() ?? '/tong-quan') as Route
  const dangChon = useSearchParams()?.get('lop') ?? null

  if (lop.length === 0) return null

  const dangChay = lop.filter((l) => l.trangThai === 'running')
  const sapMo = lop.filter((l) => l.trangThai === 'opening')
  const tongEm = dangChay.reduce((n, l) => n + l.hocVienIds.length, 0)
  const phanTram = soHocVien === 0 ? 0 : Math.round((soCoTaiKhoan / soHocVien) * 100)

  return (
    <aside className="hidden w-panel flex-none flex-col gap-1 overflow-auto border-r border-border-light bg-surface px-3.5 py-[18px] lg:flex">
      <h2 className="mb-3 flex items-center justify-between font-display text-[18px] font-semibold leading-6 text-text">
        Lớp của cô
      </h2>

      {/* Nút của bản mẫu. Chưa nối wizard mở lớp nên để trạng thái tắt, không giả vờ bấm được. */}
      <button
        type="button"
        disabled
        title="Chưa dựng — wizard mở lớp từ lộ trình nằm ở chặng 8"
        className="mb-1.5 flex h-10 items-center gap-2.5 rounded-s bg-primary-selected px-3 font-display font-semibold text-primary opacity-60"
      >
        <Ico s d="M3 4h18v16H3zM3 10h18M9 4v16" />
        Mở lớp mới từ lộ trình
      </button>

      <div className="mb-1.5 mt-5 px-3 font-display font-bold text-text">Đang chạy</div>
      <Dong
        href={duong}
        chon={dangChon === null}
        mau="var(--ink)"
        ten="Tất cả"
        phu={`${dangChay.length} lớp · ${tongEm} học viên`}
      />
      {dangChay.map((l) => (
        <Dong
          key={l.id}
          href={`${duong}?lop=${l.id}` as Route}
          chon={dangChon === l.id}
          mau={CHAM[l.mau]}
          ten={l.ten}
          phu={`${l.hocVienIds.length} học viên`}
          dem={demTheoLop[l.id]}
        />
      ))}

      {sapMo.length > 0 ? (
        <>
          <div className="mb-1.5 mt-5 px-3 font-display font-bold text-text">Sắp mở</div>
          {sapMo.map((l) => (
            <Dong
              key={l.id}
              href={`${duong}?lop=${l.id}` as Route}
              chon={dangChon === l.id}
              mau={CHAM[l.mau]}
              ten={l.ten}
              phu={l.ghiChu ?? l.lich}
            />
          ))}
        </>
      ) : null}

      <div className="mt-auto rounded-m border border-border-light px-3 py-3.5 text-[12px] text-text-2">
        <b className="mb-1.5 block font-display text-[13px] font-semibold text-text">
          Thiết lập lớp học
        </b>
        Bước 4/6 — Bật tài khoản học viên
        <div className="my-1 h-1.5 overflow-hidden rounded-[3px] bg-field">
          <i className="block h-full bg-primary" style={{ width: `${phanTram}%` }} />
        </div>
        {soCoTaiKhoan}/{soHocVien} đã có tài khoản
      </div>
    </aside>
  )
}
