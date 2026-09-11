'use client'

/**
 * Trình thuật sĩ số hoá đề — `#wiz` của bản mẫu, bốn bước.
 *
 * Thông tin · Tải tệp & số hoá · Câu hỏi · Xem trước & lưu.
 *
 * Bước 3 là bước duy nhất đáng kể, và nó không phải màn trang trí: chọn đáp án cho một câu
 * thì **cảnh báo tự mất**, đúng logic `app.save_exam_edit` ở migration 0013. Không tự xoá
 * thì danh sách "cần xem lại" không bao giờ rỗng, cô thôi đọc nó, và cái cờ mất nghĩa —
 * đó là cách một cảnh báo giết chính nó.
 *
 * Mở ở bước 2 khi cô kéo tệp vào ô ở màn ngân hàng; mở ở bước 3 khi cô bấm vào một đề đang
 * chờ duyệt. Bản mẫu làm y hệt, và lý do là: cô vào từ đâu thì bắt đầu từ đúng chỗ đó.
 */
import { useEffect, useRef, useState } from 'react'

import type { CauHoi, De } from '@/lib/demo/du-lieu'
import { datDapAnHanhVi, luuDeSoHoaHanhVi } from '@/lib/demo/hanh-vi'

import { Nhan, Nut } from './phan-tu'

const BUOC = ['Thông tin', 'Tải tệp & số hóa', 'Câu hỏi', 'Xem trước & lưu'] as const

const KY_NANG: { id: De['kyNang']; ten: string }[] = [
  { id: 'listening', ten: 'Nghe' },
  { id: 'reading', ten: 'Đọc' },
  { id: 'speaking', ten: 'Nói' },
  { id: 'writing', ten: 'Viết' },
  { id: 'grammar', ten: 'Ngữ pháp / Từ vựng' },
]

const CACH_CHAM: { id: De['cachCham']; ten: string }[] = [
  { id: 'auto', ten: 'Tự động — trắc nghiệm / điền từ' },
  { id: 'draft', ten: 'Nháp theo rubric → cô duyệt' },
  { id: 'manual', ten: 'Cô chấm tay' },
]

/** Dòng nhật ký máy đọc, hiện dần từng dòng — để cô thấy máy đang làm gì, không phải một vòng xoay. */
function dongDoc(de: De): { chu: string; dam: string }[] {
  const soCau = de.cauHoi.length
  const thieu = de.cauHoi.filter((c) => c.loai !== 'essay' && !c.dapAn).length
  const trang = de.nguon?.soTrang ?? 1
  return [
    { chu: `Đọc chữ ${trang} trang…`, dam: `xong · ${Math.round((de.tinCayOcr ?? 0.9) * 100)}% tin cậy` },
    {
      chu: `Tách ${de.doanVan?.length ?? 0} đoạn văn và ${soCau} câu hỏi…`,
      dam: 'xong',
    },
    {
      chu: 'Nhận dạng loại câu:',
      dam: `${de.cauHoi.filter((c) => c.loai === 'mcq').length} trắc nghiệm · ${de.cauHoi.filter((c) => c.loai === 'fill').length} điền từ · ${de.cauHoi.filter((c) => c.loai === 'essay').length} tự luận`,
    },
    {
      chu: 'Tìm đáp án trong tệp…',
      dam:
        thieu === 0
          ? `tìm thấy đủ ${soCau}/${soCau}`
          : `tìm thấy ${soCau - thieu}/${soCau} — ${thieu} câu chưa có đáp án, sẽ gắn cảnh báo`,
    },
    ...(de.choMo ?? []).map((c) => ({ chu: c, dam: 'đã khoanh để cô xem' })),
  ]
}

function O({
  nhan,
  children,
}: {
  nhan: string
  children: React.ReactNode
}) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1 block font-display text-[12px] font-semibold text-text-2">{nhan}</span>
      {children}
    </label>
  )
}

const O_NHAP =
  'w-full rounded-m border border-border bg-surface px-3 py-2.5 text-[14px] text-text outline-none focus:border-primary'

export function ThuatSiDe({
  de,
  buocDau,
  dong,
}: {
  de: De
  buocDau: 1 | 2 | 3 | 4
  dong: () => void
}) {
  const [buoc, datBuoc] = useState<number>(buocDau)
  const [ten, datTen] = useState(de.ten)
  const [kyNang, datKyNang] = useState<De['kyNang']>(de.kyNang)
  const [trinhDo, datTrinhDo] = useState(de.trinhDo ?? 'IELTS 6.5')
  const [phut, datPhut] = useState(de.thoiGianPhut ?? 60)
  const [chuDe, datChuDe] = useState((de.chuDe ?? []).join(', '))
  const [cachCham, datCachCham] = useState<De['cachCham']>(de.cachCham)
  const [dangDoc, datDangDoc] = useState(buocDau > 2)
  const [soDong, datSoDong] = useState(buocDau > 2 ? 99 : 0)
  const [loi, datLoi] = useState<string | null>(null)
  const than = useRef<HTMLDivElement>(null)

  const dong_ = dongDoc(de)

  // Máy đọc: mỗi 600ms thêm một dòng. Thanh chạy theo số dòng đã xong, không theo đồng hồ —
  // thanh chạy theo đồng hồ là thanh nói dối.
  useEffect(() => {
    if (!dangDoc || soDong >= dong_.length) return
    const t = setTimeout(() => datSoDong((n) => n + 1), 600)
    return () => clearTimeout(t)
  }, [dangDoc, soDong, dong_.length])

  useEffect(() => {
    than.current?.scrollTo(0, 0)
  }, [buoc])

  const xongDoc = soDong >= dong_.length
  const canhBao = de.cauHoi.filter((c) => c.canhBao)
  const tuDong = de.cauHoi.filter((c) => c.loai !== 'essay' && c.dapAn).length

  function tiep() {
    if (buoc === 2 && !xongDoc) {
      datLoi('Tải tệp lên và đợi máy đọc xong đã.')
      return
    }
    datLoi(null)
    if (buoc < 4) {
      datBuoc(buoc + 1)
      return
    }
    const r = luuDeSoHoaHanhVi({
      ten,
      kyNang,
      trinhDo,
      cachCham,
      tinCayOcr: de.tinCayOcr,
      nguon: de.nguon,
      nhanDeXuat: de.nhanDeXuat,
      trangThaiNhan: 'da_duyet',
      thoiGianPhut: phut,
      chuDe: chuDe
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      doanVan: de.doanVan,
      cauHoi: de.cauHoi,
    })
    if (r.loi) datLoi(r.loi)
    else dong()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Số hoá đề"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) dong()
      }}
    >
      <div className="flex max-h-[calc(100vh-48px)] w-[1040px] max-w-full flex-col rounded-l bg-surface shadow-[0_24px_80px_rgba(0,0,0,.2)]">
        <div className="flex items-center gap-3 border-b border-border-light px-6 py-[18px]">
          <h2 className="flex-1 font-display text-[18px] font-semibold text-text">
            {buocDau >= 3 ? `Chỉnh sửa đề — ${de.ten}` : 'Tạo đề mới'}
          </h2>
          <button
            type="button"
            onClick={dong}
            aria-label="Đóng"
            className="text-[22px] leading-none text-text-3 hover:text-text"
          >
            ×
          </button>
        </div>

        {/* Dải bước: bước đã qua tô xanh lá, bước đang mở tô xanh dương. */}
        <div className="flex items-center gap-2.5 border-b border-border-light px-6 py-3.5 text-[13px]">
          {BUOC.map((b, i) => (
            <div key={b} className="flex flex-1 items-center gap-2.5 last:flex-none">
              <span
                className={`flex flex-none items-center gap-2 font-display font-semibold ${
                  i + 1 === buoc ? 'text-text' : 'text-text-2'
                }`}
              >
                <i
                  className={`grid h-[26px] w-[26px] place-items-center rounded-full text-[12px] not-italic ${
                    i + 1 < buoc
                      ? 'bg-st-green text-surface'
                      : i + 1 === buoc
                        ? 'bg-primary text-surface'
                        : 'bg-field text-text-2'
                  }`}
                >
                  {i + 1 < buoc ? '✓' : i + 1}
                </i>
                <span className="hidden sm:inline">{b}</span>
              </span>
              {i < BUOC.length - 1 ? (
                <i
                  className={`h-px flex-1 ${i + 1 < buoc ? 'bg-st-green' : 'bg-border-light'}`}
                />
              ) : null}
            </div>
          ))}
        </div>

        <div ref={than} className="flex-1 overflow-auto px-6 py-5">
          {loi ? (
            <div className="mb-3 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-ta-text">
              {loi}
            </div>
          ) : null}

          {buoc === 1 ? (
            <>
              <O nhan="Tên đề">
                <input className={O_NHAP} value={ten} onChange={(e) => datTen(e.target.value)} />
              </O>
              <O nhan="Kỹ năng">
                <span className="flex flex-wrap gap-2">
                  {KY_NANG.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => datKyNang(k.id)}
                      aria-pressed={kyNang === k.id}
                      className={`rounded-m border px-4 py-2.5 font-display text-[13px] font-semibold transition-colors ${
                        kyNang === k.id
                          ? 'border-primary-selected-hover bg-primary-selected text-primary'
                          : 'border-border bg-surface text-text-2 hover:border-text-3'
                      }`}
                    >
                      {k.ten}
                    </button>
                  ))}
                </span>
              </O>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <O nhan="Cấp độ">
                  <select
                    className={O_NHAP}
                    value={trinhDo}
                    onChange={(e) => datTrinhDo(e.target.value)}
                  >
                    {['IELTS 5.5', 'IELTS 6.5', 'IELTS 7.0+'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </O>
                <O nhan="Thời gian làm bài (phút)">
                  <input
                    type="number"
                    className={O_NHAP}
                    value={phut}
                    onChange={(e) => datPhut(Number(e.target.value))}
                  />
                </O>
                <O nhan="Chủ đề (nhãn)">
                  <input
                    className={O_NHAP}
                    value={chuDe}
                    onChange={(e) => datChuDe(e.target.value)}
                  />
                </O>
                <O nhan="Cách chấm mặc định">
                  <select
                    className={O_NHAP}
                    value={cachCham}
                    onChange={(e) => datCachCham(e.target.value as De['cachCham'])}
                  >
                    {CACH_CHAM.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ten}
                      </option>
                    ))}
                  </select>
                </O>
              </div>
              <p className="mt-1 text-[13px] text-text-2">
                Nhãn giúp đề tự gắn vào đúng buổi trong lộ trình. Sửa sau được.
              </p>
            </>
          ) : null}

          {buoc === 2 ? (
            <>
              <button
                type="button"
                onClick={() => datDangDoc(true)}
                disabled={dangDoc}
                className="w-full rounded-l border-2 border-dashed border-border bg-surface-2 px-6 py-11 text-center transition-opacity disabled:opacity-50"
              >
                <span className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-[16px] border border-border-light bg-surface text-primary">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
                  </svg>
                </span>
                <b className="mb-1 block font-display text-[16px] font-semibold text-text">
                  Tải lên tài liệu đề
                </b>
                <p className="text-[13px] text-text-2">
                  Kéo thả hoặc bấm chọn — PDF, DOCX, PNG, JPG · ảnh chụp điện thoại là đủ
                </p>
              </button>

              {dangDoc ? (
                <div className="mt-4">
                  <div className="mb-2.5 flex items-center gap-3 rounded-m border border-border-light px-3.5 py-3">
                    <i
                      aria-hidden
                      className="h-9 w-9 flex-none rounded-[10px]"
                      style={{
                        background:
                          'linear-gradient(135deg,var(--av-orange-a),var(--av-orange-b))',
                      }}
                    />
                    <div className="min-w-0">
                      <b className="block font-display font-semibold text-text">
                        {de.ten.replace(/[^\w]+/g, '_')}.
                        {de.nguon?.loai === 'pdf' ? 'pdf' : 'jpg'}
                      </b>
                      <small className="text-[12px] text-text-2">
                        {de.nguon?.soTrang ? `${de.nguon.soTrang} trang · ` : ''}máy đang đọc
                      </small>
                    </div>
                    <div className="ml-auto h-1.5 w-40 overflow-hidden rounded-[3px] bg-field">
                      <i
                        className="block h-full bg-primary transition-[width] duration-300"
                        style={{ width: `${Math.min(100, (soDong / dong_.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[13px] leading-[22px] text-text-2">
                    {dong_.slice(0, soDong).map((d) => (
                      <div key={d.chu}>
                        {d.chu} <b className="font-display text-text">{d.dam}</b>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {buoc === 3 ? (
            <>
              {canhBao.length > 0 ? (
                <div className="mb-3 flex items-center gap-2.5 rounded-m bg-st-orange-soft px-3.5 py-2.5 text-[13px] text-ta-text">
                  <b className="font-display font-semibold">
                    {canhBao.length} cảnh báo
                  </b>
                  — câu {canhBao.map((c) => c.no).join(' và câu ')} chưa có đáp án. Đề vẫn lưu
                  được; câu đó chấm tay cho tới khi cô điền đáp án.
                </div>
              ) : (
                <div className="mb-3 rounded-m bg-st-green-soft px-3.5 py-2.5 text-[13px] text-st-green-deep">
                  <b className="font-display font-semibold">Không còn cảnh báo nào.</b> Mọi câu
                  đều có đáp án — đề này chấm tự động được.
                </div>
              )}

              {(de.doanVan ?? []).map((dv) => (
                <div
                  key={dv.ten}
                  className="mb-2.5 rounded-m border border-st-blue-line bg-st-blue-soft px-3 py-2.5 text-[13px] leading-5 text-text"
                >
                  <b className="mb-0.5 block font-display font-semibold text-primary">{dv.ten}</b>
                  {dv.noiDung.slice(0, 180)}…
                </div>
              ))}

              <div className="flex flex-col gap-3">
                {de.cauHoi.map((c) => (
                  <TheCau key={c.no} deId={de.id} cau={c} />
                ))}
              </div>

              <p className="mt-3 text-[12px] text-text-3">
                Hiện {de.cauHoi.length} câu máy đọc được. Bản đầy đủ cho thêm câu, thêm đoạn văn,
                chèn ảnh và MP3.
              </p>
            </>
          ) : null}

          {buoc === 4 ? (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-l border border-border-light px-[18px] py-4">
                <h4 className="mb-2.5 font-display text-[14px] font-semibold text-text">
                  Tóm tắt đề
                </h4>
                {[
                  ['Tên', ten],
                  ['Kỹ năng · cấp', `${KY_NANG.find((k) => k.id === kyNang)?.ten} · ${trinhDo}`],
                  [
                    'Câu hỏi',
                    `${de.cauHoi.length}${de.doanVan?.length ? ` · ${de.doanVan.length} đoạn văn` : ''}`,
                  ],
                  [
                    'Chấm',
                    `${tuDong} tự động · ${de.cauHoi.length - tuDong} chấm tay`,
                  ],
                  ['Thời gian', `${phut} phút`],
                  [
                    'Tin cậy máy đọc',
                    de.tinCayOcr
                      ? `${Math.round(de.tinCayOcr * 100)}%${de.choMo?.length ? ` · ${de.choMo.length} chỗ mờ` : ''}`
                      : 'cô soạn tay',
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-3 border-t border-border-light py-2 text-[13px] first:border-t-0 first:pt-0"
                  >
                    <span className="text-text-2">{k}</span>
                    <b className="text-right font-display font-semibold text-text">{v}</b>
                  </div>
                ))}

                <h4 className="mb-2.5 mt-4 font-display text-[14px] font-semibold text-text">
                  {de.cauHoi.length} câu
                </h4>
                <div className="flex flex-wrap gap-2">
                  {de.cauHoi.map((c) => (
                    <i
                      key={c.no}
                      className={`grid h-[30px] w-[30px] place-items-center rounded-[8px] font-display text-[12px] font-semibold not-italic ${
                        c.loai === 'essay'
                          ? 'bg-st-purple-soft text-st-purple-deep'
                          : c.dapAn
                            ? 'bg-st-green-soft text-st-green-deep'
                            : 'bg-st-orange-soft text-st-orange-deep'
                      }`}
                    >
                      {c.no}
                    </i>
                  ))}
                </div>
                <p className="mt-2.5 text-[12px] text-text-3">
                  Xanh: có đáp án · Cam: chưa có đáp án (chấm tay) · Tím: tự luận
                </p>
              </div>

              <div className="rounded-l border border-border-light px-[18px] py-4">
                <h4 className="mb-2.5 font-display text-[14px] font-semibold text-text">
                  Sau khi lưu
                </h4>
                <p className="text-[13px] leading-5 text-text-2">
                  Đề vào <b className="text-text">ngân hàng của cô</b>, chưa gắn vào lớp nào.
                </p>
                <p className="mt-3 text-[13px] leading-5 text-text-2">
                  Muốn giao ngay thì mở <b className="text-text">Lộ trình</b> và bấm Giao ở buổi
                  tương ứng — đó là đường duy nhất đề gắn vào lớp, và nó chụp lại câu hỏi tại
                  thời điểm giao.
                </p>
                <p className="mt-3 text-[12px] leading-[18px] text-text-3">
                  Đề thuộc ngân hàng của cô, không thuộc lớp nào. Chỉ khi giao mới gắn vào lớp.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-border-light bg-surface-2 px-6 py-3.5">
          <span className={buoc === 1 ? 'invisible' : ''}>
            <Nut onClick={() => datBuoc(Math.max(1, buoc - 1))}>‹ Quay lại</Nut>
          </span>
          <span className="flex-1" />
          <Nut onClick={dong}>Hủy</Nut>
          <Nut kieu="chinh" onClick={tiep}>
            {buoc === 4 ? 'Lưu đề' : 'Tiếp tục ›'}
          </Nut>
        </div>
      </div>
    </div>
  )
}

/**
 * Một câu trong bước duyệt.
 *
 * Bấm chọn đáp án → cảnh báo mất. Bấm lại chính đáp án đó → bỏ chọn, cảnh báo quay lại và
 * câu chuyển sang chấm tay. Hai chiều, vì cô đổi ý là chuyện thường và một nút chỉ đi một
 * chiều thì cô phải xoá cả đề làm lại.
 */
function TheCau({ deId, cau }: { deId: string; cau: CauHoi }) {
  const [loi, datLoi] = useState<string | null>(null)
  const coCanhBao = Boolean(cau.canhBao)

  function chon(x: string) {
    const r = datDapAnHanhVi(deId, cau.no, cau.dapAn === x ? null : x)
    datLoi(r.loi ?? null)
  }

  return (
    <div
      className={`rounded-l border bg-surface ${coCanhBao ? 'border-st-red-line' : 'border-border-light'}`}
    >
      <div className="flex items-center gap-2.5 border-b border-border-light px-4 py-3">
        <span className="font-display font-bold text-primary">Câu {cau.no}</span>
        <Nhan mau="blue">
          {cau.loai === 'mcq'
            ? 'Trắc nghiệm'
            : cau.loai === 'fill'
              ? 'Điền từ'
              : cau.loai === 'tfng'
                ? 'Đúng / Sai / Không có'
                : 'Tự luận'}
        </Nhan>
        {coCanhBao ? <Nhan mau="orange">1 cảnh báo</Nhan> : null}
        <span className="flex-1" />
        {cau.trangNguon ? (
          <span className="text-[12px] text-text-3">trang {cau.trangNguon}</span>
        ) : null}
        {/* Sắp xếp câu — có trong bố cục bản mẫu, chưa nối ở bản demo nên để tắt. */}
        {['Thêm câu sau', 'Lên', 'Xuống', 'Xoá'].map((t, i) => (
          <button
            key={t}
            type="button"
            disabled
            title={t}
            aria-label={t}
            className="grid h-7 w-7 place-items-center rounded-[6px] text-text-3 disabled:opacity-45"
          >
            {['+', '↑', '↓', '🗑'][i]}
          </button>
        ))}
      </div>

      <div className="px-4 py-3.5">
        {loi ? (
          <div className="mb-2.5 rounded-s bg-st-orange-soft px-3 py-2 text-[12px] text-ta-text">
            {loi}
          </div>
        ) : null}
        {coCanhBao ? (
          <div className="mb-2.5 rounded-m bg-st-orange-soft px-3.5 py-2.5 text-[13px] text-ta-text">
            <b className="font-display font-semibold">Cảnh báo</b> {cau.canhBao}
          </div>
        ) : null}

        <div className="mb-2.5 rounded-m bg-field px-3 py-2.5 text-[14px] leading-[22px] text-text">
          {cau.no}. {cau.de}
        </div>

        {/* Hàng chèn của bản mẫu. Hiện-mà-tắt: có trong sản phẩm, chưa có trong bản demo. */}
        <div className="mb-3 flex flex-wrap gap-2">
          {['Chèn ảnh', 'Chèn MP3', 'Chèn đoạn văn', 'Dùng đoạn văn có sẵn'].map((t) => (
            <button
              key={t}
              type="button"
              disabled
              className="rounded-m border border-dashed border-border px-3 py-1.5 text-[12px] text-text-2 disabled:opacity-60"
            >
              {t}
            </button>
          ))}
        </div>

        {cau.luaChon && cau.luaChon.length > 0 ? (
          <>
            <p className="mb-2 text-[12px] text-text-3">
              Bấm chọn đáp án đúng. Bấm lại để bỏ chọn → câu này chuyển sang chấm tay.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {cau.luaChon.map((o, k) => {
                const on = cau.dapAn === o
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => chon(o)}
                    aria-pressed={on}
                    className={`flex items-center gap-2.5 rounded-m border px-3 py-2.5 text-left text-[14px] transition-colors ${
                      on
                        ? 'border-st-green-line bg-st-green-soft'
                        : 'border-border-light hover:border-text-3'
                    }`}
                  >
                    <i
                      aria-hidden
                      className={`h-[18px] w-[18px] flex-none rounded-full border-2 ${
                        on
                          ? 'border-st-green bg-st-green shadow-[inset_0_0_0_3px_var(--surface)]'
                          : 'border-border'
                      }`}
                    />
                    <b className="font-display text-[12px] text-text-2">{'ABCD'[k]}</b>
                    <span className="flex-1">{o}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : cau.loai === 'essay' ? (
          <p className="text-[12px] text-text-3">
            Câu tự luận — không có đáp án đúng/sai. Máy nháp theo rubric của cô, cô duyệt.
          </p>
        ) : (
          <>
            <p className="mb-2 text-[12px] text-text-3">Đáp án máy đọc được:</p>
            <div className="rounded-m bg-st-green-soft px-3 py-2.5 text-[14px] text-st-green-deep">
              {cau.dapAn ?? '—'}
            </div>
          </>
        )}

        {/*
         * Giải thích đáp án — thứ em đọc SAU KHI nộp.
         *
         * Để trống thì em chỉ biết mình sai, không biết sai vì sao; mà "biết sai vì sao" mới
         * là cái làm em không lặp lại lỗi. Nên ô này luôn hiện, kể cả khi chưa có gì.
         */}
        <div className="mt-2.5">
          <label className="mb-1 block font-display text-[12px] font-semibold text-st-yellow-deep">
            Giải thích đáp án — hiện cho em sau khi nộp
          </label>
          <div className="rounded-m border border-st-yellow-line bg-st-yellow-soft px-3 py-2.5 text-[13px] leading-5 text-text-2">
            {cau.loai === 'essay'
              ? 'Câu tự luận không có giải thích đáp án — nhận xét của cô thay chỗ này.'
              : 'Chưa có — bản đầy đủ cho máy gợi ý từ đoạn văn, cô sửa lại.'}
          </div>
        </div>
      </div>
    </div>
  )
}
