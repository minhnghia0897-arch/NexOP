'use client'

import { useState } from 'react'

import { Avatar, DauMan, Wrap } from '@/components/ung-dung/khung'
import { KhoiTrong, Nhan, Pill } from '@/components/ung-dung/phan-tu'
import { OSteer } from '@/components/ung-dung/tab-man'
import { useKho } from '@/lib/demo/dung-kho'
import { dangBaiHanhVi } from '@/lib/demo/hanh-vi'
import { duLieu, vaiHienTai } from '@/lib/demo/kho'

function gioViet(iso: string): string {
  const d = new Date(iso)
  const cach = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (cach <= 0) return hm
  if (cach === 1) return `Hôm qua ${hm}`
  return `${d.getDate()}/${d.getMonth() + 1}`
}

/** Bảng tin chung — mọi lớp một chỗ, để cô đăng một lần cho nhiều lớp. */
export default function BangTinChung() {
  useKho()
  const [lopDang, datLopDang] = useState<string | null>(null)
  const [nhap, datNhap] = useState('')
  const [loi, datLoi] = useState<string | null>(null)

  const vai = vaiHienTai()
  const du = duLieu()

  const lopThay =
    vai === 'student'
      ? du.lop.filter((l) => l.hocVienIds.includes(du.vai.student))
      : vai === 'assistant'
        ? du.lop.filter((l) => l.id === 'lop-65')
        : du.lop.filter((l) => l.trangThai === 'running')

  const dich = lopDang ?? lopThay[0]?.id ?? null
  const bai = du.baiDang
    .filter((b) => lopThay.some((l) => l.id === b.lopId))
    .filter((b) => (lopDang ? b.lopId === lopDang : true))

  function dang() {
    datLoi(null)
    if (!dich) return datLoi('Chưa chọn lớp để đăng')
    const r = dangBaiHanhVi(dich, nhap)
    if (r.loi) return datLoi(r.loi)
    datNhap('')
  }

  return (
    <>
      <DauMan
        ten="Bảng tin"
        phu="Mọi lớp một chỗ. Bài đăng đi theo lớp — không có bảng tin chung cho toàn tên miền."
        song={`${bai.length} bài`}
      />
      <Wrap>
        <div className="mb-4 flex flex-wrap gap-2.5">
          <Pill on={lopDang === null} onClick={() => datLopDang(null)}>
            Tất cả lớp
          </Pill>
          {lopThay.map((l) => (
            <Pill key={l.id} on={lopDang === l.id} onClick={() => datLopDang(l.id)}>
              {l.ten}
            </Pill>
          ))}
        </div>

        {vai !== 'student' && dich ? (
          <OSteer
            giaTri={nhap}
            datGiaTri={datNhap}
            goiY={`Đăng cho lớp ${du.lop.find((l) => l.id === dich)?.ten}…`}
            chip={['Giao bài từ ngân hàng đề', 'Nhắc hạn nộp', 'Đính tài liệu']}
            gui={dang}
            chuaGui={
              loi ? (
                <p className="mt-2 rounded-m bg-st-red-soft px-3 py-2 text-[13px] text-st-red">
                  {loi}
                </p>
              ) : null
            }
          />
        ) : null}

        {bai.length === 0 ? (
          <KhoiTrong>Chưa có bài nào trên bảng tin.</KhoiTrong>
        ) : (
          bai.map((b) => {
            const tacGia = b.tacGiaId ? du.taiKhoan.find((t) => t.id === b.tacGiaId) : null
            return (
              <article
                key={b.id}
                className="mb-3 flex gap-3.5 rounded-l border border-border-light bg-surface px-5 py-[18px]"
              >
                {tacGia ? (
                  <Avatar ten={tacGia.ten} mau={tacGia.mau} co={36} />
                ) : (
                  <span
                    aria-hidden
                    className="grid h-9 w-9 flex-none place-items-center rounded-[11px] font-display text-[12px] font-bold text-surface"
                    style={{ background: 'var(--grad-me)' }}
                  >
                    HT
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <b className="font-display font-semibold text-text">
                      {tacGia?.ten ?? 'Hệ thống'}
                    </b>
                    <small className="text-[12px] text-text-3">{gioViet(b.luc)}</small>
                    <Nhan mau="blue">{du.lop.find((l) => l.id === b.lopId)?.ten}</Nhan>
                    {b.loai === 'system' ? <Nhan mau="purple">máy tự đăng</Nhan> : null}
                  </div>
                  <p className="text-[13px] leading-[21px] text-text">{b.noiDung}</p>
                </div>
              </article>
            )
          })
        )}
      </Wrap>
    </>
  )
}
