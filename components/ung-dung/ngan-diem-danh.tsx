'use client'

/**
 * Ngăn điểm danh — `F['Điểm danh']` của bản mẫu, trượt từ phải.
 *
 * Bản mẫu viết đúng một câu về cách dùng: **"Mặc định có mặt. Chỉ bỏ tích người vắng."**
 * Cả màn này chỉ để phục vụ câu đó. Trong phòng cô gọi tên người thiếu, không gọi tên mười
 * bảy người có mặt — bắt cô tích mười bảy cái để ghi một người vắng là bắt cô làm việc cho
 * máy.
 *
 * Hai chỗ cố tình KHÁC bản mẫu:
 *
 * 1. Bản mẫu bỏ tích trước cho em "vắng buổi trước". Ở đây không: ai có mặt là **sự thật**
 *    (lớp 1), và máy không đoán sự thật hộ cô. Em vắng buổi trước vẫn được nhắc bằng nhãn
 *    bên cạnh tên — cô để mắt, cô quyết.
 * 2. Thêm ô "có phép". Bản mẫu chỉ có vắng/không vắng, nhưng dòng chân của chính bản mẫu
 *    phân biệt "vắng không phép" — nên thông tin đó phải nhập được ở đâu đó, không thì luật
 *    ghi ở dưới không có dữ liệu để chạy.
 */
import { useEffect, useMemo, useState } from 'react'

import { ghiDiemDanhHanhVi } from '@/lib/demo/hanh-vi'
import { buoiKeTiep, duLieu, vangBuoiTruoc, vangLienTiep } from '@/lib/demo/kho'
import type { Lop } from '@/lib/demo/du-lieu'

import { Avatar, Nhan, Nut } from './phan-tu'

/*
 * KHÔNG nhận `vai`. `ghiDiemDanhHanhVi` tự đọc vai đang xem, y như mọi lời gọi khác trong
 * `hanh-vi.ts` — nhận thêm một `vai` ở đây là mở đường cho màn hình truyền một vai khác
 * với vai thật sự đang ghi.
 */
export function NganDiemDanh({ lop, dong }: { lop: Lop; dong: () => void }) {
  const du = duLieu()
  const buoiNo = buoiKeTiep(lop.id)

  // Em vắng buổi trước — chỉ để nhắc, không để bỏ tích hộ cô.
  const truoc = useMemo(() => new Set(vangBuoiTruoc(lop.id)), [lop.id])

  /** Chỉ giữ NGƯỜI VẮNG. Ai không có tên ở đây là có mặt — đúng như dòng phụ nói. */
  const [vang, datVang] = useState<Map<string, boolean>>(new Map())
  const [loi, datLoi] = useState<string | null>(null)
  /*
   * Lưu lại con số ĐÃ LƯU, không đọc lại từ ô tích.
   *
   * Lưu xong thì `buoiKeTiep` nhảy sang buổi sau và các ô tích được xoá về mặc định —
   * nên "Đã lưu · {soCoMat}/{em.length}" đọc theo ô tích sẽ luôn ra "18/18 có mặt" kể cả
   * khi cô vừa ghi 1 em vắng. Câu xác nhận phải nói về việc đã xảy ra.
   */
  const [xong, datXong] = useState<{ buoi: number; coMat: number; tong: number } | null>(null)

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [dong])

  const em = lop.hocVienIds.map((id) => ({
    id,
    ten: du.taiKhoan.find((t) => t.id === id)?.ten ?? id,
    mau: du.taiKhoan.find((t) => t.id === id)?.mau ?? 'off',
    lienTiep: vangLienTiep(id),
  }))

  const soVang = vang.size
  const soCoMat = em.length - soVang

  function datEm(id: string, coVang: boolean) {
    const m = new Map(vang)
    if (coVang) m.set(id, true)
    else m.delete(id)
    datVang(m)
    datXong(null)
  }

  function datPhep(id: string, phep: boolean) {
    const m = new Map(vang)
    m.set(id, phep)
    datVang(m)
    datXong(null)
  }

  return (
    <>
      <div aria-hidden onClick={dong} className="fixed inset-0 z-40 bg-ink/25" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Điểm danh ${lop.ten}`}
        className="fixed inset-y-0 right-0 z-50 flex w-[520px] max-w-full flex-col bg-surface shadow-[-12px_0_40px_rgba(0,0,0,.12)]"
      >
        <div className="flex items-start gap-3 border-b border-border-light px-6 pb-3.5 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[18px] font-semibold text-text">
              Điểm danh — {lop.ten} · buổi {buoiNo}
            </h2>
            <p className="mt-1 text-[13px] text-text-2">
              Mặc định có mặt. Chỉ bỏ tích người vắng.
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
          {em.map((e) => {
            const coVang = vang.has(e.id)
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 border-t border-border-light py-2.5 first:border-t-0 first:pt-0"
              >
                <input
                  type="checkbox"
                  checked={!coVang}
                  onChange={(ev) => datEm(e.id, !ev.target.checked)}
                  aria-label={`${e.ten} có mặt`}
                  className="h-4 w-4 flex-none accent-[var(--c-primary)]"
                />
                <Avatar ten={e.ten} mau={e.mau} co={28} />
                <div className="min-w-0 flex-1">
                  <b
                    className={`block truncate font-display font-semibold ${
                      coVang ? 'text-text-3 line-through' : 'text-text'
                    }`}
                  >
                    {e.ten}
                  </b>
                  {truoc.has(e.id) ? (
                    <small className="text-[12px] text-text-2">
                      vắng buổi trước
                      {e.lienTiep >= 2 ? ` · đã vắng ${e.lienTiep} buổi liên tiếp` : ''}
                    </small>
                  ) : null}
                </div>
                {coVang ? (
                  /* Ô "có phép" chỉ hiện khi đã bỏ tích. Hiện sẵn mười tám ô cho mười tám
                     em là mười tám câu hỏi cô không cần trả lời. */
                  <label className="flex flex-none items-center gap-1.5 text-[12px] text-text-2">
                    <input
                      type="checkbox"
                      checked={vang.get(e.id) === true}
                      onChange={(ev) => datPhep(e.id, ev.target.checked)}
                      className="h-3.5 w-3.5 accent-[var(--c-primary)]"
                    />
                    có phép
                  </label>
                ) : truoc.has(e.id) ? (
                  <Nhan mau="orange">Để mắt</Nhan>
                ) : null}
              </div>
            )
          })}

          <p className="mt-3.5 text-[13px] leading-[21px] text-text-2">
            Vắng 2 buổi liên tiếp → tự vào &ldquo;Cần chú ý&rdquo;.
          </p>
          {/*
            Luật thứ hai của bản mẫu — "vắng không phép và có tài khoản → nhắc nhẹ sau
            21:00" — CHƯA chạy được, và nói thẳng ra thì đúng hơn là im lặng.

            Máy không đọc được bảng điểm danh: `attendance.system` là `none`, nên `can()`
            chặn cả động từ `view` của vai máy. Đây không phải chỗ quên cài — đây là chỗ
            `docs/LOGIC.md` §2 (cron 07:00 rà `attendance`) và §8.1 nói hai điều khác nhau,
            ghi ở §8 câu 8. Cô chốt thì mở được, và mở bằng cách sửa permissions.json.
          */}
          <p className="mt-1 text-[13px] leading-[21px] text-text-3">
            Nhắc nhẹ em vắng không phép sau 21:00 — <b>chưa bật</b>: máy chưa được đọc bảng
            điểm danh. Xem LOGIC §8 câu 8.
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-border-light bg-surface-2 px-6 py-3.5">
          <span className="mr-auto text-[13px] text-text-2">
            {xong ? (
              <b className="font-display font-semibold text-st-green-deep">
                Đã lưu buổi {xong.buoi} · {xong.coMat}/{xong.tong} có mặt
              </b>
            ) : (
              <>
                {soCoMat}/{em.length} có mặt
                {soVang > 0 ? ` · ${soVang} vắng` : ''}
              </>
            )}
          </span>
          <Nut onClick={dong}>Đóng</Nut>
          <Nut
            kieu="chinh"
            onClick={() => {
              const r = ghiDiemDanhHanhVi({
                lopId: lop.id,
                buoiNo,
                vang: [...vang].map(([hocVienId, phep]) => ({ hocVienId, phep })),
              })
              datLoi(r.loi ?? null)
              datXong(r.loi ? null : { buoi: buoiNo, coMat: soCoMat, tong: em.length })
              if (!r.loi) datVang(new Map())
            }}
          >
            Lưu điểm danh
          </Nut>
        </div>

        {loi ? (
          <div className="border-t border-st-orange-line bg-callout-orange px-6 py-3 text-[13px] text-ta-text">
            {loi}
          </div>
        ) : null}
      </aside>
    </>
  )
}
