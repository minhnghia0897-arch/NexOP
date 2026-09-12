'use client'

/**
 * Tin học phí máy nháp — `#f1` của bản mẫu, bước 7 của vòng vận hành.
 *
 * Ba tin, ba chuyện khác nhau, và đó là toàn bộ giá trị của màn này. Bản mẫu ghi thẳng ở
 * dòng phụ: **"viết theo tình trạng từng em, không dùng chung mẫu."**
 *
 * Tin của em **đang buông** cố tình KHÔNG nhắc học phí. Em đang rời lớp thì tin gia hạn là
 * tin chia tay; đòi tiền lúc đó đẩy em đi nhanh hơn, mà em ở lại mới là thứ đáng tiền. Dòng
 * "vì sao gửi bây giờ" nói rõ máy dựa vào đâu — cô đọc một câu là biết có đồng ý hay không.
 *
 * Nút ghi "Gửi 9:00", không ghi "Gửi": `OPERATIONS` bước 7 và `LOGIC` §2 đều giới hạn khung
 * 9:00–21:30. Cô duyệt lúc 23h thì tin vẫn tới em sáng mai — nhắc học phí lúc nửa đêm là tin
 * đòi tiền, không phải tin của cô.
 */
import { useState } from 'react'

import { duyetCaCumHanhVi, duyetTinHocPhiHanhVi, suaTinHocPhiHanhVi } from '@/lib/demo/hanh-vi'
import type { DeXuat, TaiKhoan } from '@/lib/demo/du-lieu'

import { Avatar, KhoiTrong, Nhan, Nut } from './phan-tu'

const SAC_NHAN: Record<DeXuat['loai'], 'green' | 'red' | 'blue'> = {
  tien_bo: 'green',
  dang_buong: 'red',
  vuot_muc_tieu: 'blue',
}

function MotTin({
  tin,
  em,
  han,
}: {
  tin: DeXuat
  em: TaiKhoan
  han: string
}) {
  const [sua, datSua] = useState(false)
  const [nhap, datNhap] = useState(tin.noiDung)
  const [loi, datLoi] = useState<string | null>(null)

  return (
    <article className="mb-3.5 flex gap-3.5 rounded-l border border-border-light bg-surface px-5 py-[18px]">
      <Avatar ten={em.ten} mau={em.mau} co={36} />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <b className="font-display font-semibold text-text">{em.ten}</b>
          <Nhan mau="orange">Hết {han}</Nhan>
          <Nhan mau={SAC_NHAN[tin.loai]}>{tin.nhan}</Nhan>
        </div>

        {sua ? (
          <textarea
            aria-label={`Sửa tin cho ${em.ten}`}
            value={nhap}
            onChange={(e) => datNhap(e.target.value)}
            className="min-h-[120px] w-full resize-y rounded-m border border-border bg-surface px-3 py-2.5 text-[13px] leading-[21px] text-text outline-none focus:border-primary"
          />
        ) : (
          <p className="mb-2 text-[13px] leading-[21px] text-text">{tin.noiDung}</p>
        )}

        {/* "Vì sao gửi bây giờ" — cô cần biết máy dựa vào đâu, không chỉ nó viết gì. */}
        <small className="block text-[12px] leading-[18px] text-text-3">{tin.viSao}</small>

        {loi ? (
          <div className="mt-2 rounded-m border border-st-orange-line bg-callout-orange px-3 py-2 text-[13px] text-ta-text">
            {loi}
          </div>
        ) : null}
      </div>

      <div className="flex flex-none flex-col gap-2">
        {sua ? (
          <>
            <Nut
              kieu="chinh"
              onClick={() => {
                const r = suaTinHocPhiHanhVi(tin.hocVienId, nhap)
                datLoi(r.loi ?? null)
                if (!r.loi) datSua(false)
              }}
            >
              Lưu
            </Nut>
            <Nut
              onClick={() => {
                datNhap(tin.noiDung)
                datSua(false)
              }}
            >
              Bỏ
            </Nut>
          </>
        ) : (
          <>
            <Nut
              kieu="chinh"
              onClick={() => datLoi(duyetTinHocPhiHanhVi(tin.hocVienId).loi ?? null)}
            >
              Gửi 9:00
            </Nut>
            <Nut onClick={() => datSua(true)}>Sửa</Nut>
          </>
        )}
      </div>
    </article>
  )
}

export function TinHocPhi({
  tin,
  taiKhoan,
  han,
}: {
  tin: DeXuat[]
  taiKhoan: TaiKhoan[]
  /** Hạn học phí theo id em — để nhãn "Hết 12/9" nói đúng ngày của chính em đó. */
  han: Record<string, string>
}) {
  const [loi, datLoi] = useState<string | null>(null)
  const [vuaDuyet, datVuaDuyet] = useState<number | null>(null)

  if (tin.length === 0) {
    return (
      <KhoiTrong>
        {vuaDuyet !== null
          ? `Đã xếp lịch gửi cả ${vuaDuyet} tin lúc 9:00. Cô sẽ được báo khi có em trả lời. Chưa ai trả lời sau 3 ngày mới nhắc lần hai.`
          : 'Không có tin học phí nào chờ cô. Máy rà lại mỗi sáng 7:00.'}
      </KhoiTrong>
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3.5 rounded-l border border-border-light bg-surface px-5 py-3.5">
        <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-[3px] bg-field">
          <i className="block h-full bg-primary" style={{ width: '0%' }} />
        </div>
        <span className="text-[13px] text-text-2">
          Đã duyệt 0 / {tin.length} · gửi lúc 9:00 để không rơi vào giờ đi làm
        </span>
        <Nut
          kieu="chinh"
          onClick={() => {
            const r = duyetCaCumHanhVi()
            datLoi(r.loi ?? null)
            datVuaDuyet(r.so ?? null)
          }}
        >
          Duyệt cả {tin.length}
        </Nut>
      </div>

      {loi ? (
        <div className="mb-4 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-ta-text">
          {loi}
        </div>
      ) : null}

      {tin.map((t) => {
        const em = taiKhoan.find((x) => x.id === t.hocVienId)
        if (!em) return null
        return <MotTin key={t.hocVienId} tin={t} em={em} han={han[t.hocVienId] ?? '—'} />
      })}
    </>
  )
}
