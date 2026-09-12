'use client'

/**
 * Bảng chốt điểm trắc nghiệm — `#q2` của bản mẫu.
 *
 * Bước 4 của vòng vận hành có hai nửa rất khác nhau: **"Trắc nghiệm chốt cả lớp; tự luận đọc
 * từng bài."** Nửa tự luận là `TheCham` — một thẻ một bài, cô đọc. Nửa này thì ngược lại:
 * mười tám bài trên một bảng, cô đọc đúng hai dòng màu cam rồi bấm một nút.
 *
 * Năm cột đúng bản mẫu: Học viên · Điểm · Tin cậy · Sai ở đâu · Trạng thái. Cột "Sai ở đâu"
 * đọc "Câu 3, 11, 16 — bị động" chứ không đọc số câu trơn: số câu không dạy cô điều gì.
 *
 * Nút chốt nói đúng con số nó sẽ làm — "Chốt 17 & mở 1", như bản mẫu ghi "Chốt 8 & mở 2".
 * "Chốt tất cả" là nói dối, vì bài cam không được chốt.
 */
import { useState } from 'react'

import {
  chotMotBaiHanhVi,
  chotTracNghiemHanhVi,
  dienDapAnThieuHanhVi,
} from '@/lib/demo/hanh-vi'
import type { BaiGiao } from '@/lib/demo/du-lieu'
import type { DongTracNghiem } from '@/lib/demo/kho'

import { Avatar, KhoiTrong, Nhan, Nut } from './phan-tu'

const COT = 'grid min-w-[820px] grid-cols-[1.8fr_84px_84px_1.7fr_124px] gap-3.5'

const NHAN_TT: Record<DongTracNghiem['trangThai'], { chu: string; mau: 'green' | 'orange' | 'blue' }> = {
  san_sang: { chu: 'Sẵn sàng', mau: 'green' },
  xem_lai_cau: { chu: 'Xem lại 1 câu', mau: 'orange' },
  can_chu_y: { chu: 'Cần chú ý', mau: 'orange' },
  da_chot: { chu: 'Đã chốt', mau: 'blue' },
}

/**
 * Ô điền đáp án còn thiếu.
 *
 * Đây là nút gỡ một nút thắt thật: đề có một câu máy không tìm ra đáp án, nên CẢ LỚP chờ.
 * Cô điền một ô, máy chấm lại cả lô, mười bảy bài chuyển sang "Sẵn sàng". Không có chỗ này
 * thì cô phải chấm tay mười tám lần cho đúng một câu.
 *
 * Điền vào BÀI GIAO, không vào ngân hàng đề: `propagate_exam_edit` (0007) cố tình bỏ qua
 * bài giao đã có người nộp, và bỏ qua là đúng — cho phần ĐỀ BÀI. Đáp án thì em chưa bao giờ
 * thấy, nên điền được mà không đổi gì em đã đọc.
 */
function ODapAnThieu({
  bg,
  cauNo,
  soBaiCho,
}: {
  bg: BaiGiao
  cauNo: number
  soBaiCho: number
}) {
  const cau = bg.cauHoi.find((c) => c.no === cauNo)
  const [chon, datChon] = useState('')
  const [loi, datLoi] = useState<string | null>(null)
  if (!cau) return null

  return (
    <div className="mb-4 rounded-l border border-st-orange-line bg-callout-orange px-5 py-4">
      <b className="block font-display text-[14px] font-semibold text-ta-text">
        Câu {cauNo} chưa có đáp án — {soBaiCho} bài đang chờ vì đúng một ô này
      </b>
      <p className="mt-1 text-[13px] leading-[21px] text-ta-text">
        {cau.canhBao ?? 'Máy đọc được đề nhưng không tìm ra đáp án.'} Cô chọn đáp án đúng, máy
        chấm lại cả lớp ngay. Đề bài em đã đọc không đổi — em không nhìn đáp án.
      </p>
      <p className="mt-2.5 text-[13px] font-semibold text-ta-text">{cau.de}</p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {(cau.luaChon ?? []).map((lc) => (
          <button
            key={lc}
            type="button"
            onClick={() => {
              datChon(lc)
              datLoi(null)
            }}
            className={`rounded-s border px-3 py-1.5 text-left text-[13px] transition-colors ${
              chon === lc
                ? 'border-primary bg-primary text-surface'
                : 'border-border bg-surface text-text hover:border-text-3'
            }`}
          >
            {lc}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <Nut
          kieu="chinh"
          disabled={!chon}
          onClick={() => {
            const r = dienDapAnThieuHanhVi(bg.id, cauNo, chon)
            datLoi(r.loi ?? null)
          }}
        >
          Lưu đáp án &amp; chấm lại {soBaiCho} bài
        </Nut>
        {loi ? <span className="text-[13px] text-st-red">{loi}</span> : null}
      </div>
    </div>
  )
}

export function BangTracNghiem({
  bg,
  soLieu,
  laCo,
}: {
  bg: BaiGiao
  soLieu: { dong: DongTracNghiem[]; tinCayTb: number | null; chotDuoc: number; cho: number }
  /** Chỉ cô gửi được — `review.send` nằm trong `send_actions_owner_only`. */
  laCo: boolean
}) {
  const [loi, datLoi] = useState<string | null>(null)
  const [vuaChot, datVuaChot] = useState<number | null>(null)

  const { dong, tinCayTb, chotDuoc, cho } = soLieu
  const daChot = dong.filter((d) => d.trangThai === 'da_chot').length
  const cauThieu = [...new Set(dong.flatMap((d) => d.cauCanCo))].sort((a, b) => a - b)

  if (dong.length === 0) {
    return <KhoiTrong>Chưa em nào nộp bài trắc nghiệm này.</KhoiTrong>
  }

  return (
    <>
      {/* Thanh tiến độ nói bằng VIỆC, không bằng phần trăm trừu tượng. */}
      <div className="mb-4 flex flex-wrap items-center gap-3.5 rounded-l border border-border-light bg-surface px-5 py-3.5">
        <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-[3px] bg-field">
          <i
            className="block h-full bg-primary"
            style={{ width: `${Math.round((daChot / dong.length) * 100)}%` }}
          />
        </div>
        <span className="text-[13px] text-text-2">
          {daChot}/{dong.length} bài đã chốt · máy chấm xong cả {dong.length}
          {tinCayTb !== null ? ` · tin cậy trung bình ${Math.round(tinCayTb * 100)}%` : ''}
        </span>
        {laCo && chotDuoc > 0 ? (
          <Nut
            kieu="chinh"
            onClick={() => {
              const r = chotTracNghiemHanhVi(bg.id)
              datLoi(r.loi ?? null)
              datVuaChot(r.so ?? null)
            }}
          >
            {cho > 0 ? `Chốt ${chotDuoc} & mở ${cho}` : `Chốt điểm cả lớp (${chotDuoc})`}
          </Nut>
        ) : null}
      </div>

      {vuaChot !== null ? (
        <div className="mb-4 rounded-l border border-st-green-line bg-callout-green px-5 py-3.5 text-[13px] leading-[21px] text-text">
          Đã gửi điểm cho <b>{vuaChot} em</b>. {cho > 0 ? `Còn ${cho} bài cô xem tay.` : ''} Từ
          giờ em mở app là thấy điểm của chính em — không thấy điểm của bạn.
        </div>
      ) : null}
      {loi ? (
        <div className="mb-4 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-ta-text">
          {loi}
        </div>
      ) : null}

      {cauThieu.length > 0 && laCo ? (
        <ODapAnThieu bg={bg} cauNo={cauThieu[0]!} soBaiCho={cho} />
      ) : null}

      <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
        <div
          className={`${COT} border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-bold text-text-2`}
        >
          <span>Học viên</span>
          <span>Điểm</span>
          <span>Tin cậy</span>
          <span>Sai ở đâu</span>
          <span>Trạng thái</span>
        </div>

        {dong.map((d) => {
          const tt = NHAN_TT[d.trangThai]
          // Điểm thấp tô đỏ — `.sc.low` của bản mẫu. Đây là dòng cô phải dừng lại ở đó.
          const thap = d.tong > 0 && d.dung / d.tong < 0.7
          return (
            <div
              key={d.baiNopId}
              className={`${COT} items-center border-b border-border-light px-5 py-3 text-[13px] last:border-0 hover:bg-hover`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar ten={d.hocVien.ten} mau={d.hocVien.mau} co={28} />
                <b className="truncate font-display font-semibold text-text">
                  {d.hocVien.ten}
                </b>
              </span>
              <span
                className={`font-display text-[15px] font-semibold tabular-nums ${
                  thap ? 'text-st-red' : 'text-text'
                }`}
              >
                {d.dung}/{d.tong}
              </span>
              <span className="tabular-nums text-text-2">{Math.round(d.tinCay * 100)}%</span>
              <span className="truncate text-text-2">{d.saiODau}</span>
              <span className="flex items-center gap-2">
                <Nhan mau={tt.mau}>{tt.chu}</Nhan>
                {/* Bài cam: cô xem rồi chốt riêng từng bài. Không gộp vào lô. */}
                {laCo && (d.trangThai === 'can_chu_y' || d.trangThai === 'xem_lai_cau') &&
                d.cauCanCo.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const r = chotMotBaiHanhVi(d.baiNopId)
                      datLoi(r.loi ?? null)
                    }}
                    className="font-display text-[12px] font-semibold text-primary hover:underline"
                  >
                    Chốt
                  </button>
                ) : null}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[13px] leading-[21px] text-text-2">
        {cho === 0
          ? 'Không dòng nào cần cô xem tay.'
          : `Chỉ cần xem ${cho} dòng màu cam. Phần còn lại máy chấm chắc chắn — cô bấm một lần.`}
      </p>
    </>
  )
}
