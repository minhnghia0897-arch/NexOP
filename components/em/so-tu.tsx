'use client'

/**
 * Sổ từ của em — thẻ ôn làm từ chính chỗ cô gạch trong bài của em.
 *
 * Bản mẫu: `design/_reference/oblue-student-v2.html`, màn `s-vocab`.
 *
 * Khác một danh sách 100 từ ở đúng một chỗ, và chỗ đó là cả lý do màn này tồn tại: mặt sau
 * của thẻ là **chữ cô đã viết cho chính bài của em**. Không có dòng nào máy tự nghĩ ra —
 * `y` chỉ hiện khi cô có viết thêm, còn số bài lặp thì SUY từ dấu của cô, không cắm sẵn.
 */
import { useState } from 'react'

import { Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { danhDauTheHanhVi } from '@/lib/demo/hanh-vi'
import type { TheSoTu } from '@/lib/demo/em'

function ngay(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function SoTu({ the, emId }: { the: TheSoTu[]; emId: string }) {
  const [i, datI] = useState(0)
  const [lo, datLo] = useState(false)
  const [soNho, datSoNho] = useState(0)
  const [xong, datXong] = useState<{ nho: number; tong: number } | null>(null)

  if (the.length === 0) {
    return (
      <div className="rounded-l border border-border-light bg-surface px-5 py-6 text-[13px] leading-[20px] text-text-2">
        Chưa có thẻ nào. Thẻ ở đây làm từ chỗ cô gạch trong bài em đã nộp — cô chấm bài đầu
        tiên xong là sổ từ có thẻ.
      </div>
    )
  }

  if (xong) {
    return (
      <div className="rounded-l border border-border-light bg-surface px-5 py-7 text-center">
        <b className="block font-display text-[40px] font-bold leading-none text-primary">
          {xong.nho}/{xong.tong}
        </b>
        <p className="mt-2 text-[13px] leading-[20px] text-text-2">
          Thẻ em đánh “chưa nhớ” sẽ quay lại lần ôn sau. Thẻ đã nhớ mà cô gạch lại cùng lỗi ở
          bài mới cũng quay lại — em không phải tự nhớ mình đã hứa gì.
        </p>
        <div className="mt-4">
          <Nut
            onClick={() => {
              datI(0)
              datLo(false)
              datSoNho(0)
              datXong(null)
            }}
          >
            Ôn lại từ đầu
          </Nut>
        </div>
      </div>
    )
  }

  const t = the[i]!

  function danhDau(nho: boolean): void {
    danhDauTheHanhVi(emId, t.khoa, nho)
    const conLai = i + 1
    if (conLai >= the.length) {
      // Đếm lại từ đầu bộ, kể cả thẻ vừa đánh — con số tổng kết phải khớp số thẻ đã ôn.
      datXong({ nho: nho ? soNho + 1 : soNho, tong: the.length })
      return
    }
    if (nho) datSoNho(soNho + 1)
    datI(conLai)
    datLo(false)
  }

  return (
    <div className="rounded-l border border-border-light bg-surface px-5 py-[18px]">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-text-3">
        <Nhan mau="blue">{t.loai}</Nhan>
        <span>
          {t.tuBai} · {ngay(t.ngay)}
        </span>
        <span className="ml-auto font-display font-semibold text-text-2">
          thẻ {i + 1}/{the.length}
        </span>
      </div>

      {/* Mặt trước: nguyên văn em viết, gạch đi. */}
      <p className="text-[17px] leading-[26px] text-text">
        <s className="text-st-red">{t.trich}</s>
      </p>

      {lo ? (
        <>
          <p className="mt-2.5 border-l-[3px] border-st-green pl-3 text-[17px] font-semibold leading-[26px] text-st-green-deep">
            {t.sua}
          </p>
          {/* Lời cô viết thêm — chỉ hiện khi CÓ. Máy không viết hộ cô câu này. */}
          {t.y ? <p className="mt-2 text-[13px] leading-[20px] text-text-2">{t.y}</p> : null}
        </>
      ) : null}

      {t.taiPham ? (
        <div className="mt-3.5 rounded-m border border-st-yellow-line bg-callout-orange px-3.5 py-2.5 text-[13px] leading-[20px] text-st-yellow-deep">
          <b className="font-display font-semibold">Thẻ này quay lại.</b> Em đánh “đã nhớ” ngày{' '}
          {ngay(t.daNhoLuc!)}, nhưng cô gạch lại đúng lỗi <b>{t.loai}</b> ở bài{' '}
          <b>{t.taiPham.bai}</b> ngày {ngay(t.taiPham.ngay)}.
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {lo ? (
          <>
            <Nut onClick={() => danhDau(false)}>Chưa nhớ</Nut>
            <Nut kieu="chinh" onClick={() => danhDau(true)}>
              Đã nhớ
            </Nut>
          </>
        ) : (
          <Nut kieu="chinh" onClick={() => datLo(true)}>
            Xem cô sửa thế nào
          </Nut>
        )}
      </div>
    </div>
  )
}
