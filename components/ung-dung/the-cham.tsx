'use client'

/**
 * Thẻ chấm một bài — thành phần `paper` của DESIGN.md.
 *
 * Đây là màn bán được sản phẩm: "tối chủ nhật". Nên nó phải cho thấy đúng ba việc:
 *   • máy đã nháp gì, và tin bao nhiêu phần trăm;
 *   • vì sao bài này cần cô đọc kỹ (cờ), thay vì chỉ hiện một con số;
 *   • cô sửa rồi bấm gửi — và chỉ tới lúc bấm gửi thì em mới thấy.
 *
 * Là thành phần client vì cô gõ vào ô nhận xét. Nhưng mọi thay đổi vẫn đi qua server
 * action: trình duyệt gửi ý định, máy chủ kiểm quyền và ghi sự kiện.
 */
import { useState, useTransition } from 'react'

import { deXuatChoCoAction, guiNhanXetAction, suaNhapAction } from '@/app/(gv)/actions'
import type { BaiCanCham } from '@/lib/demo/kho'

import { Avatar, Nhan, Nut, ThanhTinCay, ViSao } from './phan-tu'

function Band({ nhan, so }: { nhan: string; so: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-[15px] font-semibold tabular-nums text-text">{so.toFixed(1)}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-text-3">{nhan}</div>
    </div>
  )
}

export function TheCham({ bai, laTroGiang }: { bai: BaiCanCham; laTroGiang: boolean }) {
  const [nhanXet, datNhanXet] = useState(bai.nhanXet)
  const [loi, datLoi] = useState<string | null>(null)
  const [dangChay, batDau] = useTransition()

  const daSua = nhanXet !== bai.nhanXet

  function gui() {
    datLoi(null)
    batDau(async () => {
      // Hai vai, hai việc khác nhau — không phải cùng một nút rồi để cửa chặn từ chối.
      if (laTroGiang) {
        const r = await deXuatChoCoAction(bai.baiNopId, nhanXet)
        return datLoi(r.loi ?? null)
      }

      if (daSua) {
        const r = await suaNhapAction(bai.baiNopId, nhanXet)
        if (r.loi) return datLoi(r.loi)
      }
      /*
       * Gửi xong thì KHÔNG đặt trạng thái "đã gửi" ở đây.
       *
       * Gửi là xoá nháp, nên server dựng lại danh sách thiếu đúng thẻ này và thành phần bị
       * tháo — mọi state cục bộ mất theo. Lời xác nhận vì thế đọc từ dữ liệu thật ở trang
       * (dải "vừa gửi"), chứ không giữ trong đầu trình duyệt. Bản đầu em viết ở đây, và nó
       * là mã chết: chạy thử trên trình duyệt mới lộ, đọc mã thì không.
       */
      const r = await guiNhanXetAction(bai.baiNopId)
      if (r.loi) datLoi(r.loi)
    })
  }

  return (
    <article className="overflow-hidden rounded-box border border-border-light bg-surface">
      {/* header */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border-light px-5 py-3.5">
        <Avatar ten={bai.hocVien.ten} mau={bai.hocVien.mau} />
        <div className="min-w-0">
          <b className="block font-display text-[14px] font-semibold text-text">{bai.hocVien.ten}</b>
          <small className="block text-[12px] text-text-3">
            {bai.lopTen} · {bai.soTu} từ
            {bai.muon ? ' · nộp muộn' : ''}
          </small>
        </div>

        {bai.troGiangSoan ? (
          <Nhan mau="orange">{bai.troGiangSoan} đã soạn · chờ cô gửi</Nhan>
        ) : null}

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-3.5">
            <Band nhan="TR" so={bai.band.tr} />
            <Band nhan="CC" so={bai.band.cc} />
            <Band nhan="LR" so={bai.band.lr} />
            <Band nhan="GRA" so={bai.band.gra} />
          </div>
          <div className="border-l border-border-light pl-4 text-center">
            <div className="font-display text-[22px] font-bold tabular-nums leading-none text-text">
              {bai.bandTb.toFixed(1)}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-text-3">band</div>
          </div>
        </div>
      </header>

      {/* body 2 cột */}
      <div className="grid gap-5 px-5 py-4 lg:grid-cols-[1fr_1fr]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-display text-[13px] font-semibold text-text">Bài của em</span>
            <Nhan mau="purple">máy đã nháp</Nhan>
            <ThanhTinCay ti={bai.tinCay} />
          </div>
          <div className="max-h-[240px] overflow-y-auto whitespace-pre-wrap rounded-m border border-border-light bg-surface-2 px-3.5 py-3 text-[13px] leading-[21px] text-text-2">
            {bai.noiDung}
          </div>

          {bai.co.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {bai.co.map((c) => (
                <li key={c.trich} className="flex flex-wrap items-center gap-2 text-[13px]">
                  <s className="text-st-red">{c.trich}</s>
                  <span aria-hidden className="text-text-3">→</span>
                  <b className="font-display font-semibold text-st-green-deep">{c.sua}</b>
                  <Nhan mau="yellow">{c.loai}</Nhan>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-text-3">Máy không tìm thấy lỗi nào đáng gạch.</p>
          )}
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`nx-${bai.baiNopId}`}
            className="mb-2 block font-display text-[13px] font-semibold text-text"
          >
            Nhận xét gửi em
          </label>
          <textarea
            id={`nx-${bai.baiNopId}`}
            value={nhanXet}
            onChange={(e) => datNhanXet(e.target.value)}
            rows={9}
            className="w-full resize-y rounded-m border border-border bg-surface px-3.5 py-3 text-[13px] leading-[21px] text-text outline-none focus:border-primary"
          />
          <p className="mt-1.5 text-[12px] text-text-3">
            {daSua
              ? 'Cô đã sửa — bản này thay bản máy nháp, và giúp máy học giọng cô.'
              : 'Máy nháp theo rubric của cô và ba bài gần nhất của em này.'}
          </p>
        </div>
      </div>

      {/* footer */}
      <footer className="flex flex-wrap items-center gap-3 border-t border-border-light bg-surface-2 px-5 py-3">
        {bai.ganCo.length > 0 ? (
          <div className="min-w-0 flex-1">
            <ViSao mau="orange">
              {bai.ganCo.map((c) => (
                <span key={c} className="mr-3 inline-block">
                  {c}
                </span>
              ))}
            </ViSao>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <ViSao>Máy tự tin ở bài này. Cô đọc lướt rồi gửi cũng được.</ViSao>
          </div>
        )}

        {loi ? (
          <p className="w-full rounded-m bg-st-red-soft px-3 py-2 text-[13px] text-st-red">{loi}</p>
        ) : null}

        <Nut kieu="chinh" onClick={gui} disabled={dangChay}>
          {dangChay ? 'Đang gửi…' : laTroGiang ? 'Gửi nhận xét cho cô duyệt' : 'Gửi nhận xét'}
        </Nut>
      </footer>
    </article>
  )
}
