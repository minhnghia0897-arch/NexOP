'use client'

/**
 * `s-feed` — bảng tin lớp. Chỗ DUY NHẤT em thấy tên bạn cùng lớp.
 *
 * Và chỉ thấy tên với bài đăng: không band, không tiến độ, không xếp hạng. Em đăng bài
 * được (`post` mức `own`), nhưng không ghim và không xoá bài người khác.
 */
import { useState } from 'react'

import { DauManEm, WrapEm } from '@/components/em/khung'
import { Avatar, KhoiTrong, Nhan } from '@/components/ung-dung/phan-tu'
import { OSteer } from '@/components/ung-dung/tab-man'
import { useKho } from '@/lib/demo/dung-kho'
import { EM, bangTinCuaEm, lopCuaEm } from '@/lib/demo/em'
import { dangBai } from '@/lib/demo/kho'
import { duLieu } from '@/lib/demo/kho'

function khiNao(iso: string): string {
  const phut = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (phut < 1) return 'vừa xong'
  if (phut < 60) return `${phut} phút trước`
  const gio = Math.floor(phut / 60)
  if (gio < 24) return `${gio} giờ trước`
  return `${Math.floor(gio / 24)} ngày trước`
}

export default function BangTinLop() {
  useKho()
  const [nhap, datNhap] = useState('')
  const [loi, datLoi] = useState<string | null>(null)
  const du = duLieu()
  const lop = lopCuaEm(EM)
  const ds = bangTinCuaEm(EM)

  function gui() {
    if (!nhap.trim() || !lop) return
    try {
      // Em đăng dưới danh nghĩa của em — `dangBai` nhận vai, và vai ở app này luôn là học viên.
      dangBai('student', lop.id, nhap.trim())
      datNhap('')
      datLoi(null)
    } catch (e) {
      datLoi((e as Error).message)
    }
  }

  return (
    <>
      <DauManEm
        ten="Bảng tin lớp"
        phu={`${lop?.ten ?? ''} · ${lop?.lich ?? ''} · ${lop?.hocVienIds.length ?? 0} bạn`}
      />
      <WrapEm>
        {loi ? (
          <div className="mb-4 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-text-2">
            {loi}
          </div>
        ) : null}

        {ds.length === 0 ? (
          <KhoiTrong>Bảng tin lớp chưa có bài nào.</KhoiTrong>
        ) : (
          ds.map((b) => {
            const ai = du.taiKhoan.find((t) => t.id === b.tacGiaId)
            return (
              <div
                key={b.id}
                className="mb-3 flex gap-3.5 rounded-l border border-border-light bg-surface px-5 py-[18px]"
              >
                {ai ? (
                  <Avatar ten={ai.ten} mau={ai.mau} co={36} />
                ) : (
                  <span
                    aria-hidden
                    className="h-9 w-9 flex-none rounded-[11px]"
                    style={{ background: 'var(--grad-avatar)' }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <b className="font-display font-semibold text-text">
                      {ai?.ten ?? 'Thông báo của lớp'}
                    </b>
                    <small className="text-[12px] text-text-3">{khiNao(b.luc)}</small>
                    {b.loai === 'system' ? <Nhan mau="purple">Máy đăng</Nhan> : null}
                    {b.tacGiaId === du.vai.owner ? <Nhan mau="blue">Cô</Nhan> : null}
                  </div>
                  <p className="text-[13px] leading-[21px] text-text">{b.noiDung}</p>
                </div>
              </div>
            )
          })
        )}

        <OSteer
          giaTri={nhap}
          datGiaTri={datNhap}
          goiY="Hỏi cô hoặc cả lớp…"
          chip={['Đính bài của em']}
          gui={gui}
        />
      </WrapEm>
    </>
  )
}
