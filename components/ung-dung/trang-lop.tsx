'use client'

/**
 * Trang lớp — năm tab, mọi tab nằm trong phạm vi một lớp (DESIGN.md §Bố cục).
 *
 * Dựng theo bản mẫu `#s-class`: bảng tin có ô `steer` và bài đăng kèm tệp đính; bài tập là
 * hàng có thanh tiến độ nộp; học viên là bảng sáu cột; điểm là ma trận cột tên dính; chấm
 * bài dùng lại đúng thẻ của màn Chấm bài.
 */
import { useState } from 'react'

import type { BaiDang, Lop, TaiKhoan } from '@/lib/demo/du-lieu'
import { dangBaiHanhVi } from '@/lib/demo/hanh-vi'
import { baiCanCham, duLieu, vaiHienTai } from '@/lib/demo/kho'

import { Avatar, KhoiTrong, Nhan, Nut } from './phan-tu'
import { DaiTab, OSteer } from './tab-man'
import { TheCham } from './the-cham'

const TABS = [
  { id: 'tin', ten: 'Bảng tin' },
  { id: 'bai', ten: 'Bài tập' },
  { id: 'em', ten: 'Học viên' },
  { id: 'diem', ten: 'Điểm' },
  { id: 'cham', ten: 'Chấm bài' },
] as const

function gioViet(iso: string): string {
  const d = new Date(iso)
  const cach = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (cach <= 0) return hm
  if (cach === 1) return `Hôm qua ${hm}`
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function BaiDangMot({
  bai,
  taiKhoan,
  chuaNop,
}: {
  bai: BaiDang
  taiKhoan: TaiKhoan[]
  chuaNop?: string[]
}) {
  const tacGia = bai.tacGiaId ? taiKhoan.find((t) => t.id === bai.tacGiaId) : null
  return (
    <article className="mb-3 flex gap-3.5 rounded-l border border-border-light bg-surface px-5 py-[18px]">
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
          <b className="font-display font-semibold text-text">{tacGia?.ten ?? 'Hệ thống'}</b>
          <small className="text-[12px] text-text-3">{gioViet(bai.luc)}</small>
          {bai.loai === 'system' ? <Nhan mau="purple">máy tự đăng</Nhan> : null}
        </div>
        <p className="mb-2 text-[13px] leading-[21px] text-text">{bai.noiDung}</p>
        {chuaNop && chuaNop.length > 0 ? (
          <div className="flex flex-wrap gap-3.5 text-[12px] text-text-2">
            <span>{chuaNop.length} em chưa nộp:</span>
            <span className="text-text">{chuaNop.join(', ')}</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function TrangLop({ lop }: { lop: Lop }) {
  const [tab, datTab] = useState<string>('tin')
  const [nhap, datNhap] = useState('')
  const [loi, datLoi] = useState<string | null>(null)

  const vai = vaiHienTai()
  const du = duLieu()
  const laEm = vai === 'student'

  const em = lop.hocVienIds
    .map((id) => du.taiKhoan.find((t) => t.id === id))
    .filter((t): t is TaiKhoan => Boolean(t))

  const baiCuaLop = du.baiGiao.filter((b) => b.lopId === lop.id)
  const dangCham = baiCanCham(vai).filter((b) => b.lopId === lop.id)
  const baiDang = du.baiDang.filter((b) => b.lopId === lop.id)
  const hoSo = du.hoSo.filter((h) => lop.hocVienIds.includes(h.id))

  const tabs = TABS.map((t) => ({
    ...t,
    dem:
      t.id === 'bai'
        ? baiCuaLop.length
        : t.id === 'em'
          ? em.length
          : t.id === 'cham'
            ? dangCham.length
            : undefined,
  })).filter((t) => !(laEm && (t.id === 'em' || t.id === 'diem' || t.id === 'cham')))

  function dang() {
    datLoi(null)
    const r = dangBaiHanhVi(lop.id, nhap)
    if (r.loi) return datLoi(r.loi)
    datNhap('')
  }

  return (
    <>
      <DaiTab tabs={tabs} dang={tab} doi={datTab} />

      <div className="mx-auto max-w-[var(--content-max)] px-8 pb-16 pt-6">
        {tab === 'tin' ? (
          <>
            {!laEm ? (
              <OSteer
                giaTri={nhap}
                datGiaTri={datNhap}
                goiY={`Đăng cho ${em.length} em lớp ${lop.ten}…`}
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

            {baiDang.length === 0 ? (
              <KhoiTrong>Bảng tin lớp chưa có bài nào.</KhoiTrong>
            ) : (
              baiDang.map((b) => (
                <BaiDangMot key={b.id} bai={b} taiKhoan={du.taiKhoan} />
              ))
            )}
          </>
        ) : null}

        {tab === 'bai' ? (
          <div className="overflow-hidden rounded-l border border-border-light bg-surface">
            <div className="grid grid-cols-[2.2fr_1.4fr_1fr_90px] gap-4 border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-semibold text-text-2">
              <span>Bài</span>
              <span>Đã nộp</span>
              <span>Đã chấm</span>
              <span />
            </div>
            {baiCuaLop.map((b) => {
              const nop = du.baiNop.filter((n) => n.baiGiaoId === b.id)
              const muon = nop.filter((n) => n.muon).length
              const nhapCon = du.nhapCham.filter((n) =>
                nop.some((x) => x.id === n.baiNopId),
              ).length
              const pct = em.length === 0 ? 0 : Math.round((nop.length / em.length) * 100)
              return (
                <div
                  key={b.id}
                  className="grid grid-cols-[2.2fr_1.4fr_1fr_90px] items-center gap-4 border-b border-border-light px-5 py-3.5 last:border-0"
                >
                  <div className="min-w-0">
                    <b className="block font-display text-[13px] font-semibold text-text">
                      {b.nhan ?? du.de.find((d) => d.id === b.deId)?.ten}
                    </b>
                    <small className="text-[12px] text-text-2">
                      hạn {new Date(b.hanNop).getDate()}/{new Date(b.hanNop).getMonth() + 1}
                      {b.trongSo ? ` · trọng số ${b.trongSo}%` : ''}
                    </small>
                  </div>
                  <div>
                    <div className="h-1.5 overflow-hidden rounded-[3px] bg-field">
                      <i className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-[12px] text-text-2">
                      {nop.length}/{em.length} nộp{muon ? ` · ${muon} muộn` : ''}
                    </div>
                  </div>
                  <div>
                    {nhapCon > 0 ? (
                      <Nhan mau="purple">{nhapCon} nháp sẵn</Nhan>
                    ) : b.daXong ? (
                      <Nhan mau="green">đã gửi</Nhan>
                    ) : (
                      <Nhan mau="blue">đang mở</Nhan>
                    )}
                  </div>
                  <Nut onClick={() => datTab('cham')}>{nhapCon > 0 ? 'Chấm' : 'Xem'}</Nut>
                </div>
              )
            })}
          </div>
        ) : null}

        {tab === 'em' ? (
          <>
            <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
              <div className="grid min-w-[820px] grid-cols-[2fr_80px_90px_110px_1.4fr_100px] gap-4 border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-semibold text-text-2">
                <span>Học viên</span>
                <span>Band</span>
                <span>Đi học</span>
                <span>Tài khoản</span>
                <span>Lỗi hay gặp</span>
                <span>Học phí</span>
              </div>
              {hoSo.map((h) => {
                const t = du.taiKhoan.find((x) => x.id === h.id)
                if (!t) return null
                return (
                  <div
                    key={h.id}
                    className="grid min-w-[820px] grid-cols-[2fr_80px_90px_110px_1.4fr_100px] items-center gap-4 border-b border-border-light px-5 py-3 text-[13px] last:border-0"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar ten={t.ten} mau={t.mau} co={26} />
                      <b className="truncate font-display font-semibold text-text">{t.ten}</b>
                    </span>
                    <span
                      className={`font-display text-[15px] font-semibold tabular-nums ${
                        h.huong === 'up'
                          ? 'text-st-green-deep'
                          : h.huong === 'down'
                            ? 'text-st-red'
                            : 'text-text'
                      }`}
                    >
                      {h.bandTb.toFixed(1)}
                    </span>
                    <span className="text-text-2">{h.diHoc}</span>
                    <span>
                      {h.coTaiKhoan ? (
                        <Nhan mau="green">Đã bật</Nhan>
                      ) : (
                        <Nhan mau="orange">Chưa</Nhan>
                      )}
                    </span>
                    <span className="truncate text-text-2">{h.loiHayGap}</span>
                    <span className="text-text-2">{h.hanHocPhi}</span>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[13px] text-text-2">
              Hồ sơ là chung cho mọi lớp em đó học — không phải hồ sơ riêng của lớp này.
            </p>
          </>
        ) : null}

        {tab === 'diem' ? (
          <>
            <div className="overflow-auto rounded-l border border-border-light bg-surface">
              <table className="min-w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[200px] border-b border-r border-border-light bg-surface-2 px-3.5 py-2.5 text-left font-display font-semibold text-text">
                      Học viên
                    </th>
                    <th className="border-b border-r border-border-light bg-surface-2 px-3.5 py-2.5 text-center align-top font-display font-semibold text-text">
                      Band TB
                      <small className="mt-0.5 block text-[11px] font-normal text-text-3">
                        có trọng số
                      </small>
                    </th>
                    {baiCuaLop
                      .filter((b) => b.daXong || du.baiNop.some((n) => n.baiGiaoId === b.id))
                      .map((b) => (
                        <th
                          key={b.id}
                          className="whitespace-nowrap border-b border-r border-border-light bg-surface-2 px-3.5 py-2.5 text-center align-top font-display font-semibold text-text"
                        >
                          {b.nhan}
                          <small className="mt-0.5 block text-[11px] font-normal text-text-3">
                            {new Date(b.hanNop).getDate()}/{new Date(b.hanNop).getMonth() + 1}
                          </small>
                          {b.trongSo ? (
                            <span className="block text-[11px] font-semibold text-st-purple-deep">
                              Trọng số {b.trongSo}%
                            </span>
                          ) : null}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {hoSo.map((h) => {
                    const t = du.taiKhoan.find((x) => x.id === h.id)
                    if (!t) return null
                    return (
                      <tr key={h.id}>
                        <td className="sticky left-0 z-10 min-w-[200px] border-b border-r border-border-light bg-surface px-3.5 py-2.5 text-left">
                          <span className="flex items-center gap-2.5">
                            <Avatar ten={t.ten} mau={t.mau} co={26} />
                            <b className="font-display font-semibold text-text">{t.ten}</b>
                          </span>
                        </td>
                        <td
                          className={`border-b border-r border-border-light px-3.5 py-2.5 text-center font-display text-[14px] font-semibold tabular-nums ${
                            h.huong === 'up'
                              ? 'text-st-green-deep'
                              : h.huong === 'down'
                                ? 'text-st-red'
                                : 'text-text'
                          }`}
                        >
                          {h.bandTb.toFixed(1)}
                          {h.huong !== 'flat' ? (
                            <small className="block text-[11px] font-normal text-text-3">
                              {h.huong === 'up' ? '↑ tăng' : '↓ tụt'}
                            </small>
                          ) : null}
                        </td>
                        {baiCuaLop
                          .filter((b) => b.daXong || du.baiNop.some((n) => n.baiGiaoId === b.id))
                          .map((b) => {
                            const o = h.diem[b.id]
                            return (
                              <td
                                key={b.id}
                                className={`border-b border-r border-border-light px-3.5 py-2.5 text-center ${
                                  o?.muon ? 'bg-surface-late' : ''
                                } ${
                                  o?.band == null
                                    ? 'text-text-3'
                                    : 'font-display text-[14px] font-semibold tabular-nums text-text'
                                }`}
                              >
                                {o?.band == null ? 'chưa nộp' : o.band.toFixed(1)}
                                {o?.muon && o.band != null ? (
                                  <small className="block text-[11px] font-normal text-text-3">
                                    nộp muộn
                                  </small>
                                ) : null}
                              </td>
                            )
                          })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px] text-text-2">
              Band TB tính theo trọng số cô đặt cho từng bài. Ô trống là chưa nộp — đó là thông tin
              thật, không phải thiếu dữ liệu.
            </p>
          </>
        ) : null}

        {tab === 'cham' ? (
          dangCham.length === 0 ? (
            <KhoiTrong>Lớp này không còn bài nào chờ chấm.</KhoiTrong>
          ) : (
            dangCham.map((b) => (
              <TheCham key={b.baiNopId} bai={b} laTroGiang={vai === 'assistant'} />
            ))
          )
        ) : null}
      </div>
    </>
  )
}
