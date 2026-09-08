'use client'

/**
 * Bảng tin lớp, kèm ô đăng bài.
 *
 * Ô nhập viền gradient là thành phần `steer` của DESIGN.md — chỉ dùng cho "đăng bài" và
 * "chỉnh cách máy làm", không dùng ở chỗ khác. Đây đúng là một trong hai chỗ đó.
 *
 * Vai học viên không có ô nhập: `post` cho student là mức `own`, em đăng được bài của
 * mình về nguyên tắc, nhưng bảng tin lớp trong bản mẫu là chỗ cô nói với lớp. Nút bị ẩn
 * không phải là hàng rào — kho vẫn kiểm quyền, ẩn chỉ để màn hình không mời gọi nhầm.
 */
import { useState, useTransition } from 'react'

import { dangBaiAction } from '@/app/(gv)/actions'
import type { BaiDang, TaiKhoan, VaiDemo } from '@/lib/demo/du-lieu'

import { Nhan, Nut } from './phan-tu'

export function BangTinKhung({
  lopId,
  vai,
  baiDang,
  taiKhoan,
}: {
  lopId: string
  vai: VaiDemo
  baiDang: BaiDang[]
  taiKhoan: TaiKhoan[]
}) {
  const [noiDung, datNoiDung] = useState('')
  const [loi, datLoi] = useState<string | null>(null)
  const [dangChay, batDau] = useTransition()

  function dang() {
    datLoi(null)
    batDau(async () => {
      const r = await dangBaiAction(lopId, noiDung)
      if (r.loi) return datLoi(r.loi)
      datNoiDung('')
    })
  }

  return (
    <section className="rounded-box border border-border-light bg-surface p-5">
      <h2 className="mb-3 font-display text-[15px] font-semibold text-text">Bảng tin lớp</h2>

      {vai !== 'student' ? (
        <div className="mb-4">
          <div
            className="rounded-m p-px"
            style={{
              background: 'linear-gradient(135deg,var(--grad-a),var(--grad-b),var(--grad-c))',
            }}
          >
            <textarea
              value={noiDung}
              onChange={(e) => datNoiDung(e.target.value)}
              rows={2}
              placeholder="Nói gì với lớp?"
              aria-label="Nội dung bài đăng"
              className="w-full resize-y rounded-m border-0 bg-surface px-3.5 py-2.5 text-[13px] leading-[21px] text-text outline-none"
            />
          </div>
          {loi ? (
            <p className="mt-2 rounded-m bg-st-red-soft px-3 py-2 text-[13px] text-st-red">{loi}</p>
          ) : null}
          <div className="mt-2 flex justify-end">
            <Nut kieu="chinh" onClick={dang} disabled={dangChay || !noiDung.trim()}>
              {dangChay ? 'Đang đăng…' : 'Đăng lên bảng tin'}
            </Nut>
          </div>
        </div>
      ) : null}

      {baiDang.length === 0 ? (
        <p className="text-[13px] text-text-3">Chưa có bài nào.</p>
      ) : (
        <ul className="space-y-3">
          {baiDang.map((b) => (
            <li key={b.id} className="rounded-m border border-border-light bg-surface-2 px-3.5 py-3">
              <div className="mb-1.5 flex items-center gap-2">
                <b className="font-display text-[13px] font-semibold text-text">
                  {b.tacGiaId ? taiKhoan.find((t) => t.id === b.tacGiaId)?.ten : 'Hệ thống'}
                </b>
                {b.loai === 'system' ? <Nhan mau="purple">máy tự đăng</Nhan> : null}
              </div>
              <p className="text-[13px] leading-[21px] text-text-2">{b.noiDung}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
