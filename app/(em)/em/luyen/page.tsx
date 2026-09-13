'use client'

/**
 * `s-drill` — bài luyện 5 câu, chấm ngay từng câu.
 *
 * Điểm của màn này không phải điểm số, mà là câu GIẢI THÍCH hiện ngay sau khi em chọn.
 * Em sai ở đâu thì đọc ngay ở đó, còn nhớ mình vừa nghĩ gì; để tới cuối bài mới nói thì
 * em chỉ nhớ con số.
 *
 * Câu 4 của bộ này cố tình ngược. Bài luyện dạy một phản xạ máy móc thì em áp sai chỗ khác,
 * và lỗi mới đó khó sửa hơn lỗi cũ.
 */
import Link from 'next/link'
import { useRef, useState } from 'react'

import { DauManEm, WrapEm } from '@/components/em/khung'
import { DongHo, dongHoDoc } from '@/components/em/phan-tu'
import { KhoiTrong, Nut } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { EM, baiLuyenCuaEm } from '@/lib/demo/em'
import { lamBaiLuyenHanhVi } from '@/lib/demo/hanh-vi'

const CHU = ['A', 'B', 'C', 'D']

export default function Luyen() {
  useKho()
  const [i, datI] = useState(0)
  const [chon, datChon] = useState<number | null>(null)
  const [dung, datDung] = useState(0)
  const [ketQua, datKetQua] = useState<number[]>([])
  const [xong, datXong] = useState(false)
  const giay = useRef(0)
  const [giayXong, datGiayXong] = useState(0)

  const bl = baiLuyenCuaEm(EM)[0]

  if (!bl) {
    return (
      <>
        <DauManEm ten="Bài luyện" quayVe={{ href: '/em/hom-nay', ten: 'Hôm nay' }} />
        <WrapEm>
          <KhoiTrong>Cô chưa giao bài luyện nào cho em.</KhoiTrong>
        </WrapEm>
      </>
    )
  }

  const cau = bl.cau[i]

  function traLoi(k: number) {
    if (chon !== null || !cau) return
    datChon(k)
    const d = k === cau.dung
    if (d) datDung((x) => x + 1)
    datKetQua((x) => [...x, d ? 1 : 0])
  }

  function tiep() {
    if (i + 1 >= bl!.cau.length) {
      // Ghi kết quả về hồ sơ — đi qua can(), nên bài của bạn khác thì hàm này ném lỗi.
      lamBaiLuyenHanhVi(EM, bl!.id, dung)
      // Chốt thời gian ở đây: đồng hồ chạy tiếp sau khi xong thì con số dưới kết quả lớn dần
      // trong lúc em đang đọc nó.
      datGiayXong(giay.current)
      datXong(true)
      return
    }
    datI(i + 1)
    datChon(null)
  }

  function lamLai() {
    datGiayXong(0)
    datI(0)
    datChon(null)
    datDung(0)
    datKetQua([])
    datXong(false)
  }

  return (
    <>
      <DauManEm
        ten={bl.ten}
        quayVe={{ href: '/em/hom-nay', ten: 'Hôm nay' }}
        phu={`Cô Thảo giao riêng · ${bl.viLoi} · chấm ngay từng câu`}
        // Đồng hồ tháo đi khi xong: để lại thì nó vẫn đếm trong lúc em đọc kết quả, và con
        // số trên đầu màn nói khác con số dưới kết quả.
        phai={xong ? undefined : <DongHo doiGiay={(g) => (giay.current = g)} />}
      />
      <WrapEm>
        <div className="flex gap-1.5">
          {bl.cau.map((_, k) => (
            <i
              key={k}
              className={`h-[5px] flex-1 rounded-[3px] ${
                ketQua[k] === 1
                  ? 'bg-st-green'
                  : ketQua[k] === 0
                    ? 'bg-st-red'
                    : k === i && !xong
                      ? 'bg-primary'
                      : 'bg-field'
              }`}
            />
          ))}
        </div>

        {xong ? (
          <div className="mt-3.5 rounded-l border border-border-light bg-surface px-6 py-9 text-center">
            <div className="font-display text-[44px] font-bold leading-none text-primary">
              {dung}/{bl.cau.length}
            </div>
            <p className="mt-2 text-text-2">
              {giayXong > 0 ? `${dongHoDoc(giayXong)} · ` : ''}
              {dung >= bl.cau.length - 1
                ? 'Cô sẽ thấy em đã dứt được lỗi này'
                : 'Làm lại một lần nữa là chắc'}
            </p>
            <div className="mx-auto mt-[18px] max-w-[460px] rounded-l border border-border-light px-[18px] py-4 text-left text-[14px] leading-[22px]">
              <b className="mb-1 block font-display font-semibold text-text">
                Đã ghi vào hồ sơ của em
              </b>
              <span className="text-text-2">
                “{bl.viLoi}”: đúng {dung}/{bl.cau.length}.{' '}
                {dung >= bl.cau.length - 1
                  ? 'Bài tới nếu em không tái phạm, cô Thảo sẽ đánh dấu là đã dứt.'
                  : 'Cô Thảo thấy câu nào em sai và có thể nhắc trong buổi tới.'}{' '}
                Chỉ cô và em thấy dòng này — bạn cùng lớp thì không.
              </span>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/em/nop-bai">
                <Nut kieu="chinh">Viết bài Task 2 luôn</Nut>
              </Link>
              <Nut onClick={lamLai}>Làm lại</Nut>
            </div>
          </div>
        ) : cau ? (
          <div className="mt-3.5 rounded-l border border-border-light bg-surface px-6 py-[22px]">
            <div className="mb-2 font-display text-[12px] font-semibold text-text-3">
              Câu {i + 1} / {bl.cau.length}
            </div>
            <p className="mb-4 text-[17px] leading-[27px] text-text">
              {cau.cau.split('___')[0]}
              <u className="border-b-2 border-dashed border-st-red pb-px no-underline">
                {' '.repeat(6)}
              </u>
              {cau.cau.split('___')[1]}
            </p>
            <div className="grid gap-2">
              {cau.luaChon.map((o, k) => {
                const daChon = chon !== null
                const dungCau = k === cau.dung
                const sac = !daChon
                  ? 'border-border bg-surface hover:border-text-3'
                  : dungCau
                    ? 'border-st-green bg-st-green-soft'
                    : k === chon
                      ? 'border-st-red bg-st-red-soft'
                      : 'border-border bg-surface opacity-60'
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={daChon}
                    onClick={() => traLoi(k)}
                    className={`flex items-center gap-3 rounded-m border px-3.5 py-3 text-left text-[15px] transition-colors disabled:cursor-default ${sac}`}
                  >
                    <i
                      aria-hidden
                      className={`grid h-6 w-6 flex-none place-items-center rounded-full border font-display text-[12px] font-semibold not-italic ${
                        daChon && dungCau
                          ? 'border-st-green bg-st-green text-surface'
                          : daChon && k === chon
                            ? 'border-st-red bg-st-red text-surface'
                            : 'border-border text-text-2'
                      }`}
                    >
                      {CHU[k]}
                    </i>
                    {o}
                  </button>
                )
              })}
            </div>

            {chon !== null ? (
              <div
                className={`mt-3.5 rounded-m px-3.5 py-3 text-[14px] leading-[22px] ${
                  chon === cau.dung ? 'bg-st-green-soft' : 'bg-st-orange-soft'
                }`}
              >
                <b className="font-display font-semibold">
                  {chon === cau.dung ? 'Đúng.' : 'Chưa đúng.'}
                </b>{' '}
                {chon === cau.dung ? cau.giaiThichDung : cau.giaiThichSai}
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3">
              <small className="text-[12px] text-text-3">
                Chọn một đáp án — giải thích hiện ngay
              </small>
              {chon !== null ? (
                <Nut kieu="chinh" onClick={tiep}>
                  {i + 1 >= bl.cau.length ? 'Xem kết quả' : 'Câu tiếp'}
                </Nut>
              ) : null}
            </div>
          </div>
        ) : null}
      </WrapEm>
    </>
  )
}
