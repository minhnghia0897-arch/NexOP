'use client'

/**
 * Ngăn kéo hồ sơ học viên — `.drawer` của bản mẫu, rộng 520, trượt từ phải.
 *
 * "Cô thấy mọi thứ trong 1 màn": band hiện tại · mục tiêu · hạn học phí · lỗi lặp · bài gần
 * đây · ghi chú riêng. Ngăn kéo chứ không phải trang riêng, vì cô đang quét danh sách và
 * muốn xem một em rồi quay lại — mở trang mới là mất chỗ đang đứng.
 *
 * **Ghi chú của cô chỉ cô thấy.** Và nó bị cắt ở lớp đọc dữ liệu (`hoSoDayDu`), không phải
 * ở đây — nên trợ giảng mở cùng ngăn này cũng không có gì để giấu: dữ liệu chưa từng tới
 * trình duyệt của họ.
 */
import { useEffect, useState } from 'react'

import { luuGhiChuHanhVi } from '@/lib/demo/hanh-vi'
import { hoSoDayDu } from '@/lib/demo/kho'
import type { VaiDemo } from '@/lib/demo/du-lieu'

import { Avatar, KhoiTrong, Nut } from './phan-tu'

const SAC_LOI = { do: 'bg-st-red', cam: 'bg-st-orange', xanh: 'bg-st-green' } as const

export function NganHoSo({
  hocVienId,
  vai,
  dong,
}: {
  hocVienId: string
  vai: VaiDemo
  dong: () => void
}) {
  const ho = hoSoDayDu(vai, hocVienId)
  const [ghiChu, datGhiChu] = useState(ho?.ghiChu ?? '')
  const [luuXong, datLuuXong] = useState(false)
  const [loi, datLoi] = useState<string | null>(null)

  // Esc đóng ngăn. Ngăn kéo mở đè lên danh sách, nên phải có đường ra bằng bàn phím.
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [dong])

  if (!ho) return null

  const em = ho
  const tenEm = em.ten ?? hocVienId

  return (
    <>
      <div
        aria-hidden
        onClick={dong}
        className="fixed inset-0 z-40 bg-ink/25"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Hồ sơ ${tenEm}`}
        className="fixed inset-y-0 right-0 z-50 flex w-[520px] max-w-full flex-col bg-surface shadow-[-12px_0_40px_rgba(0,0,0,.12)]"
      >
        <div className="flex items-start gap-3 border-b border-border-light px-6 pb-3.5 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[18px] font-semibold text-text">{tenEm}</h2>
            <p className="mt-1 text-[13px] text-text-2">
              Hồ sơ học viên — cô thấy mọi thứ trong 1 màn.
            </p>
          </div>
          <button
            type="button"
            onClick={dong}
            aria-label="Đóng"
            className="text-[20px] leading-none text-text-3 hover:text-text"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-[18px]">
          <div className="mb-4 flex items-center gap-3">
            <Avatar ten={tenEm} mau={em.mau ?? 'purple'} co={44} />
            <div className="min-w-0">
              <b className="block font-display text-[15px] font-semibold text-text">{tenEm}</b>
              <small className="text-[13px] text-text-2">
                {em.lop?.ten ?? 'chưa xếp lớp'} · {em.lop?.lich ?? ''} ·{' '}
                {em.coTaiKhoan ? 'đã bật tài khoản' : 'chưa bật tài khoản'}
              </small>
            </div>
          </div>

          {/* Bốn ô, không ba: "đi học" là con số cô hỏi ngay sau band, và nó không nằm
              được ở đâu khác trong ngăn này. */}
          <div className="mb-4 grid grid-cols-4 gap-2.5">
            {[
              [em.bandTb > 0 ? em.bandTb.toFixed(1) : '—', 'Writing hiện tại'],
              [em.mucTieu ? em.mucTieu.toFixed(1) : '—', 'mục tiêu'],
              [
                em.diHoc && em.diHoc.tong > 0 ? `${em.diHoc.coMat}/${em.diHoc.tong}` : '—',
                'buổi đi học',
              ],
              [em.hanHocPhi, 'học phí đến'],
            ].map(([so, nhan]) => (
              <div key={nhan} className="rounded-l bg-field px-3.5 py-3">
                <b className="block font-display text-[19px] font-semibold leading-7 tabular-nums text-text">
                  {so}
                </b>
                <small className="text-[12px] text-text-2">{nhan}</small>
              </div>
            ))}
          </div>

          {/*
            Vắng liên tiếp hiện thành MỘT CÂU, không thành một con số nữa trong lưới ô.
            "Vắng 2 buổi" là trạng thái cần cô làm gì đó; xếp nó cạnh band và học phí là
            hạ nó xuống ngang một số liệu, và cô quét qua không dừng lại.
          */}
          {em.vangLienTiep !== null && em.vangLienTiep >= 2 ? (
            <div className="mb-4 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] leading-[21px] text-ta-text">
              Vắng <b>{em.vangLienTiep} buổi liên tiếp</b> tính từ buổi gần nhất — em đang
              rời lớp, không phải hay có việc. Cô gọi trước khi nhắc bài.
            </div>
          ) : null}

          <h5 className="mb-2 font-display text-[12px] font-semibold text-text-2">Lỗi lặp</h5>
          {(em.loiLap ?? []).length === 0 ? (
            <p className="mb-4 text-[13px] text-text-2">
              {em.loiHayGap && em.loiHayGap !== '—'
                ? em.loiHayGap
                : 'Máy chưa đánh dấu lỗi lặp nào của em.'}
            </p>
          ) : (
            <div className="mb-4">
              {(em.loiLap ?? []).map((l) => (
                <div
                  key={l.ten}
                  className="flex items-start gap-3.5 border-t border-border-light py-3 first:border-t-0 first:pt-0"
                >
                  <i aria-hidden className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${SAC_LOI[l.nang]}`} />
                  <div className="min-w-0">
                    <b className="block font-display font-semibold text-text">{l.ten}</b>
                    <small className="text-[13px] leading-[19px] text-text-2">{l.y}</small>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h5 className="mb-2 font-display text-[12px] font-semibold text-text-2">Bài gần đây</h5>
          {(em.baiGanDay ?? []).length === 0 ? (
            <p className="mb-4 text-[13px] text-text-2">Em chưa nộp bài nào.</p>
          ) : (
            <div className="mb-4">
              {(em.baiGanDay ?? []).map((b) => (
                <div
                  key={b.nhan}
                  className="flex justify-between gap-3 border-t border-border-light py-2 text-[13px] first:border-t-0 first:pt-0"
                >
                  <span className="min-w-0 truncate text-text-2">{b.nhan}</span>
                  <b className="font-display font-semibold tabular-nums text-text">
                    {b.band === null ? 'chờ cô' : b.band.toFixed(1)}
                  </b>
                </div>
              ))}
            </div>
          )}

          <h5 className="mb-2 font-display text-[12px] font-semibold text-text-2">
            Ghi chú của cô
          </h5>
          {em.ghiChu === null ? (
            /*
             * Không phải "chưa có ghi chú" — mà là "vai này không đọc được".
             *
             * Nói thẳng thì trợ giảng biết ranh giới ở đâu và không đi hỏi cô vì sao màn
             * trống. Và dữ liệu thật sự chưa tới đây: `hoSoDayDu` cắt ở lớp đọc.
             */
            <KhoiTrong>
              Ghi chú riêng của cô về học viên — <b>trần cứng của trợ giảng</b>. Cô có muốn cấp
              cũng không cấp được, và nội dung chưa từng được gửi tới màn này.
            </KhoiTrong>
          ) : (
            <>
              <textarea
                aria-label="Ghi chú của cô"
                value={ghiChu}
                onChange={(e) => {
                  datGhiChu(e.target.value)
                  datLuuXong(false)
                }}
                placeholder="Chỉ cô thấy. VD: nhà xa, hay đến muộn 10 phút — không phải lười."
                className="min-h-[88px] w-full resize-y rounded-m border border-border bg-surface px-3 py-2.5 text-[13px] leading-[21px] text-text outline-none focus:border-primary"
              />
              <p className="mt-1.5 text-[12px] leading-[18px] text-text-3">
                Chỉ cô đọc được. Trợ giảng bị trần cứng chặn, em và phụ huynh không có đường
                nào tới đây. Nhật ký chỉ ghi là cô có sửa, không ghi nội dung.
              </p>
            </>
          )}

          {loi ? (
            <div className="mt-3 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-ta-text">
              {loi}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-light bg-surface-2 px-6 py-3.5">
          {luuXong ? (
            <span className="mr-auto text-[13px] text-st-green-deep">Đã lưu.</span>
          ) : null}
          <Nut onClick={dong}>Đóng</Nut>
          {em.ghiChu === null ? null : (
            <Nut
              kieu="chinh"
              onClick={() => {
                const r = luuGhiChuHanhVi(hocVienId, ghiChu)
                datLoi(r.loi ?? null)
                datLuuXong(!r.loi)
              }}
            >
              Lưu ghi chú
            </Nut>
          )}
        </div>
      </aside>
    </>
  )
}
