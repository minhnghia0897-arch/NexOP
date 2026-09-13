'use client'

/**
 * Thẻ chấm một bài — thành phần `paper` của DESIGN.md, dựng theo đúng bản mẫu.
 *
 * Đây là màn bán được sản phẩm ("tối chủ nhật"), nên nó phải cho thấy đủ ba việc:
 *   • máy đã nháp gì, và tin bao nhiêu phần trăm;
 *   • vì sao bài này cần cô đọc kỹ, thay vì chỉ hiện một con số;
 *   • cô sửa rồi bấm gửi — và chỉ tới lúc bấm gửi thì em mới thấy.
 *
 * Bố cục lấy từ bản mẫu: đầu thẻ (avatar · tên · meta · band · thanh tin cậy), thân hai
 * cột (lỗi cần sửa | rubric + nhận xét), chân thẻ (cảnh báo · Viết lại · Gửi).
 *
 * Mọi thay đổi đi qua `lib/demo/hanh-vi.ts` — một chỗ duy nhất nhận ý định rồi mới chạm
 * vào kho. Đó cũng là chỗ sau này thành server action khi nối Supabase.
 */
import { useState } from 'react'

import type { LoiDanhDau } from '@/lib/demo/du-lieu'
import { deXuatChoCoHanhVi, guiNhanXetHanhVi, suaNhapHanhVi } from '@/lib/demo/hanh-vi'
import type { BaiCanCham } from '@/lib/demo/kho'

import { Avatar, NhanMay, Nut } from './phan-tu'

/** Ba loại lỗi, ba màu vạch — cô sửa chúng theo ba cách khác nhau. */
const VACH: Record<LoiDanhDau['nhom'], string> = {
  grammar: 'var(--st-red)',
  vocab: 'var(--st-orange)',
  structure: 'var(--st-purple)',
}

/**
 * Một đoạn máy gạch chân. LỖI thì gạch ngang, ĐIỂM MẠNH thì không.
 *
 * Trước đây hàm này vẽ mọi mục trong `co` y như nhau, kể cả mục là lời khen — nên câu viết
 * TỐT của em hiện ra bị gạch ngang màu đỏ, dưới tiêu đề "Lỗi cần sửa". Cô đọc màn đó sẽ đi
 * sửa đúng chỗ em đang làm đúng.
 */
function Loi({ loi }: { loi: LoiDanhDau }) {
  const khen = loi.kieu === 'khen'
  return (
    <div
      className="mb-3.5 border-l-[3px] pl-3"
      style={{ borderColor: khen ? 'var(--st-green)' : VACH[loi.nhom] }}
    >
      <div className="text-[13px] leading-5 text-text-2">
        {khen ? (
          <q className="text-text">{loi.trich}</q>
        ) : (
          <s className="decoration-st-red decoration-2">{loi.trich}</s>
        )}
      </div>
      <div className="mt-[3px] text-[13px] leading-5 text-text">
        <b className="font-display font-semibold text-st-green-deep">{loi.sua}</b>
        {' — '}
        {loi.loai}
      </div>
      {loi.themY ? <div className="mt-1 text-[12px] text-text-3">{loi.themY}</div> : null}
    </div>
  )
}

function TieuChi({ ten, diem }: { ten: string; diem: number }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="w-[104px] flex-none text-text-2">{ten}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-[4px] bg-field">
        <i
          className="block h-full bg-primary opacity-85"
          style={{ width: `${(diem / 9) * 100}%` }}
        />
      </div>
      <b className="w-[30px] text-right font-display font-semibold tabular-nums text-text">
        {diem.toFixed(1)}
      </b>
    </div>
  )
}

export function TheCham({ bai, laTroGiang }: { bai: BaiCanCham; laTroGiang: boolean }) {
  const [nhanXet, datNhanXet] = useState(bai.nhanXet)
  const [loi, datLoi] = useState<string | null>(null)

  /* Tách LỖI khỏi KHEN ngay ở đây, để hai tiêu đề dưới kia nói đúng thứ nó chứa. */
  const loiThat = bai.co.filter((c) => c.kieu !== 'khen')
  const khen = bai.co.filter((c) => c.kieu === 'khen')

  const daSua = nhanXet !== bai.nhanXet
  const tinCay = Math.round(bai.tinCay * 100)
  const thap = tinCay < 85
  const tenNgan = bai.hocVien.ten.split(' ').slice(-2).join(' ')

  function gui() {
    datLoi(null)

    // Hai vai, hai việc khác nhau — không phải cùng một nút rồi để cửa chặn từ chối.
    if (laTroGiang) {
      const r = deXuatChoCoHanhVi(bai.baiNopId, nhanXet)
      return datLoi(r.loi ?? null)
    }

    if (daSua) {
      const r = suaNhapHanhVi(bai.baiNopId, nhanXet)
      if (r.loi) return datLoi(r.loi)
    }

    /*
     * Gửi xong thì KHÔNG đặt trạng thái "đã gửi" ở đây.
     *
     * Gửi là xoá nháp, nên danh sách vẽ lại thiếu đúng thẻ này và thành phần bị tháo — mọi
     * state cục bộ mất theo. Lời xác nhận vì thế đọc từ dữ liệu thật ở trang (dải "vừa
     * gửi"). Bản đầu em viết ở đây, và nó là mã chết: chạy thử trên trình duyệt mới lộ.
     */
    const r = guiNhanXetHanhVi(bai.baiNopId)
    if (r.loi) datLoi(r.loi)
  }

  return (
    <article
      className={`mb-3.5 overflow-hidden rounded-l border bg-surface transition-shadow hover:shadow-[var(--sh-s)] ${
        bai.ganCo.length > 0 ? 'border-st-red-line' : 'border-border-light'
      }`}
    >
      <header className="flex flex-wrap items-center gap-3.5 border-b border-border-light px-5 py-4">
        <Avatar ten={bai.hocVien.ten} mau={bai.hocVien.mau} />
        <div className="min-w-0">
          <b className="block font-display font-semibold text-text">{bai.hocVien.ten}</b>
          <small className="block text-[13px] text-text-2">{bai.meta}</small>
        </div>

        {bai.troGiangSoan ? (
          <span className="rounded-s bg-st-orange-soft px-2 py-0.5 font-display text-[11px] font-semibold leading-[18px] text-st-orange-deep">
            {bai.troGiangSoan} đã soạn · chờ cô gửi
          </span>
        ) : null}

        <span className="flex-1" />

        <div className="flex items-center gap-2.5">
          <span className="font-display text-[26px] font-semibold leading-8 tabular-nums text-text">
            {bai.bandTb.toFixed(1)}
          </span>
          <span className="text-[13px] text-text-3">/ 9</span>
        </div>

        <div className="w-[150px]">
          <div className="mb-1 flex justify-between text-[11px] text-text-2">
            <span>Tin cậy</span>
            <b className={`font-display font-semibold ${thap ? 'text-st-orange-deep' : ''}`}>
              {tinCay}%
            </b>
          </div>
          <div className="h-[5px] overflow-hidden rounded-[3px] bg-field">
            <i
              className={`block h-full ${thap ? 'bg-st-orange' : 'bg-st-green'}`}
              style={{ width: `${tinCay}%` }}
            />
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-5 py-[18px] lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          <h5 className="mb-2.5 font-display text-[12px] font-bold text-text-2">
            Lỗi cần sửa
          </h5>
          {loiThat.length > 0 ? (
            loiThat.map((c) => <Loi key={c.trich} loi={c} />)
          ) : (
            <p className="text-[13px] text-text-3">
              Máy không tìm thấy lỗi nào đáng gạch — bài này sạch.
            </p>
          )}

          {/* Điểm mạnh có tiêu đề RIÊNG. Bản mẫu ghi "Khen một điểm cụ thể trước, rồi mới
              sửa" trong giọng chấm của cô — nên chỗ khen phải đọc ra là khen. */}
          {khen.length > 0 ? (
            <>
              <h5 className="mb-2.5 mt-4 font-display text-[12px] font-bold text-st-green-deep">
                Điểm mạnh — giữ cách viết này
              </h5>
              {khen.map((c) => (
                <Loi key={c.trich} loi={c} />
              ))}
            </>
          ) : null}

          <details className="mt-4">
            <summary className="cursor-pointer text-[13px] text-text-2 hover:text-text">
              Đọc bài của em ({bai.soTu} từ)
            </summary>
            <div className="mt-2 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-m border border-border-light bg-surface-2 px-3.5 py-3 text-[13px] leading-[21px] text-text-2">
              {bai.noiDung}
            </div>
          </details>
        </div>

        <div className="min-w-0">
          <h5 className="mb-2.5 font-display text-[12px] font-bold text-text-2">
            Theo rubric
          </h5>
          <div className="mb-4 flex flex-col gap-[9px]">
            <TieuChi ten="Task Response" diem={bai.band.tr} />
            <TieuChi ten="Coherence" diem={bai.band.cc} />
            <TieuChi ten="Lexical" diem={bai.band.lr} />
            <TieuChi ten="Grammar" diem={bai.band.gra} />
          </div>

          <h5 className="mb-2.5 flex flex-wrap items-center gap-[7px] font-display text-[12px] font-bold text-text-2">
            Nhận xét gửi {tenNgan}
            <NhanMay>theo giọng cô</NhanMay>
          </h5>
          <div className="rounded-m border border-border bg-surface-3">
            <textarea
              aria-label={`Nhận xét gửi ${tenNgan}`}
              value={nhanXet}
              onChange={(e) => datNhanXet(e.target.value)}
              rows={7}
              className="w-full resize-y bg-transparent px-3.5 py-3 text-[13px] leading-[21px] text-text outline-none"
            />
            <div className="flex justify-between gap-3 px-3.5 pb-2.5 text-[12px] text-text-3">
              <span>
                {daSua
                  ? 'Cô đã sửa — lần sau nháp sẽ giống cách cô sửa'
                  : 'Sửa trực tiếp — lần sau nháp sẽ giống cách cô sửa'}
              </span>
              <span className="whitespace-nowrap">{nhanXet.length} ký tự</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-3 px-5 pb-[18px]">
        {bai.ganCo.length > 0 ? (
          <span className="flex items-center gap-[7px] font-display text-[13px] text-st-orange-deep">
            <span aria-hidden>⚠</span>
            {bai.ganCo.join(' · ')}
          </span>
        ) : null}

        {loi ? (
          <p className="w-full rounded-m bg-st-red-soft px-3 py-2 text-[13px] text-st-red">{loi}</p>
        ) : null}

        <span className="flex-1" />
        <Nut onClick={() => datNhanXet('')}>Viết lại</Nut>
        <Nut kieu="chinh" onClick={gui}>
          {laTroGiang ? 'Gửi cho cô duyệt' : 'Gửi nhận xét'}
        </Nut>
      </footer>
    </article>
  )
}
