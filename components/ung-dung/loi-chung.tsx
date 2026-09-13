'use client'

/**
 * Hai tab còn thiếu của màn Chấm bài — `g2` và `g3` của bản mẫu.
 *
 * **Cả lớp sai chung ở đâu** là bước 6 của vòng vận hành, và bản mẫu nói đúng việc của nó:
 * "Đây là thứ nên dạy lại buổi sau, không phải dạy tiếp bài mới." Nên mỗi dòng có một nút
 * làm được việc — Tạo bài luyện cho đúng những em mắc lỗi đó, không phải cả lớp.
 *
 * **Rubric của cô** là chỗ bản mẫu viết câu đáng nhớ nhất: "Rubric này không mang sang được
 * nơi khác — vì nó là cô." Cả hai tab đều là trần cứng của trợ giảng ở phần rubric.
 */
import { useState } from 'react'

import {
  boGiongChamHanhVi,
  datTrongSoRubricHanhVi,
  taoBaiLuyenHanhVi,
} from '@/lib/demo/hanh-vi'
import type { Rubric } from '@/lib/demo/du-lieu'

import { Khoi, KhoiTrong, Nut } from './phan-tu'

const SAC_NHOM: Record<string, string> = {
  grammar: 'bg-st-red',
  vocab: 'bg-st-orange',
  structure: 'bg-st-indigo',
}

const TEN_NHOM: Record<string, string> = {
  grammar: 'ngữ pháp',
  vocab: 'từ vựng',
  structure: 'bố cục',
}

/** Một dòng có thanh tỉ lệ — `erow` của bản mẫu. */
function Dong({
  ten,
  phu,
  pct,
  sac,
  gia,
  hanhDong,
}: {
  ten: string
  phu?: string
  pct: number
  sac: string
  gia: string
  hanhDong?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3.5 border-t border-border-light py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0 flex-[1.4]">
        <b className="block truncate font-display font-semibold text-text">{ten}</b>
        {phu ? <small className="text-[12px] text-text-3">{phu}</small> : null}
      </div>
      <div className="flex min-w-0 flex-[1.6] items-center gap-2.5">
        <div className="h-1.5 min-w-[40px] flex-1 overflow-hidden rounded-[3px] bg-field">
          <i className={`block h-full ${sac}`} style={{ width: `${Math.max(3, pct)}%` }} />
        </div>
        <b className="flex-none font-display text-[13px] font-semibold tabular-nums text-text">
          {gia}
        </b>
      </div>
      <span className="flex-none">{hanhDong}</span>
    </div>
  )
}

export function LoiChungCuaLop({
  lopId,
  lopTen,
  loi,
  laCo,
}: {
  lopId: string
  lopTen: string
  loi: { ten: string; nhom: string; em: string[]; tongEm: number }[]
  laCo: boolean
}) {
  const [loiBao, datLoiBao] = useState<string | null>(null)
  const [vuaTao, datVuaTao] = useState<{ loi: string; so: number } | null>(null)

  if (loi.length === 0) {
    return (
      <KhoiTrong>
        Chưa có bài nào của {lopTen} được chấm trong chồng này, nên chưa gộp được lỗi chung.
      </KhoiTrong>
    )
  }

  return (
    <Khoi
      ten="Cả lớp sai chung ở đâu"
      phu={`Gộp lỗi của ${loi[0]!.tongEm} bài đã chấm ở ${lopTen}. Đây là thứ nên dạy lại buổi sau, không phải dạy tiếp bài mới.`}
    >
      {loi.slice(0, 8).map((l) => (
        <Dong
          key={l.ten}
          ten={l.ten}
          phu={TEN_NHOM[l.nhom] ?? l.nhom}
          pct={Math.round((l.em.length / l.tongEm) * 100)}
          sac={SAC_NHOM[l.nhom] ?? 'bg-primary'}
          gia={`${l.em.length}/${l.tongEm} em`}
          hanhDong={
            laCo ? (
              <Nut
                onClick={() => {
                  const r = taoBaiLuyenHanhVi(lopId, l.ten)
                  datLoiBao(r.loi ?? null)
                  if (!r.loi) datVuaTao({ loi: l.ten, so: r.so ?? 0 })
                }}
              >
                Tạo bài luyện
              </Nut>
            ) : undefined
          }
        />
      ))}

      {vuaTao ? (
        <div className="mt-3.5 rounded-m border border-st-green-line bg-callout-green px-3.5 py-2.5 text-[13px] leading-[21px] text-text">
          {vuaTao.so > 0 ? (
            <>
              Đã giao bài luyện &ldquo;{vuaTao.loi}&rdquo; cho <b>{vuaTao.so} em</b> — đúng
              những em mắc lỗi đó, không giao cả lớp.
            </>
          ) : (
            <>Những em mắc lỗi &ldquo;{vuaTao.loi}&rdquo; đều đã có bài luyện cho lỗi này.</>
          )}
        </div>
      ) : null}
      {loiBao ? (
        <div className="mt-3.5 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-ta-text">
          {loiBao}
        </div>
      ) : null}

      <p className="mt-3.5 text-[13px] leading-[21px] text-text-2">
        Đếm theo <b>số em</b>, không theo số lần: một em mắc một lỗi bốn lần vẫn là một em.
        Mẫu số là số bài đã chấm — em chưa nộp thì không tính là em làm đúng.
      </p>
    </Khoi>
  )
}

export function RubricCuaCo({ rubric, laCo }: { rubric: Rubric; laCo: boolean }) {
  const [sua, datSua] = useState<string | null>(null)
  const [nhap, datNhap] = useState('')
  const [loi, datLoi] = useState<string | null>(null)

  const tong = rubric.tieuChi.reduce((t, x) => t + x.trongSo, 0)

  if (!laCo) {
    return (
      <KhoiTrong>
        Rubric nằm trong <b>trần cứng của trợ giảng</b> — cô cấp quyền gì cũng không mở được.
        `can()` chặn ở cửa 5, trước khi xét tới mức quyền.
      </KhoiTrong>
    )
  }

  return (
    <>
      <Khoi
        ten="Rubric của cô"
        phu={`Học từ ${rubric.daCham} bài cô đã chấm. Cô sửa nháp càng nhiều, nháp càng giống cô. Rubric này không mang sang được nơi khác — vì nó là cô.`}
      >
        {rubric.tieuChi.map((t) => (
          <Dong
            key={t.ma}
            ten={t.ten}
            pct={t.trongSo}
            sac="bg-primary"
            gia={`${t.trongSo}%`}
            hanhDong={
              sua === t.ma ? (
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={nhap}
                    onChange={(e) => datNhap(e.target.value)}
                    aria-label={`Trọng số ${t.ten}`}
                    className="w-[68px] rounded-s border border-border bg-surface px-2 py-1 text-[13px] text-text outline-none focus:border-primary"
                  />
                  <Nut
                    kieu="chinh"
                    onClick={() => {
                      const r = datTrongSoRubricHanhVi(t.ma, Number(nhap))
                      datLoi(r.loi ?? null)
                      if (!r.loi) datSua(null)
                    }}
                  >
                    Lưu
                  </Nut>
                </span>
              ) : (
                <Nut
                  onClick={() => {
                    datSua(t.ma)
                    datNhap(String(t.trongSo))
                    datLoi(null)
                  }}
                >
                  Sửa
                </Nut>
              )
            }
          />
        ))}

        {/*
          Tổng khác 100% thì NÓI, không tự chỉnh hộ cô.
          Tự chia lại ba tiêu chí kia để bù là đổi cách chấm ở chỗ cô không nhìn.
        */}
        {tong !== 100 ? (
          <div className="mt-3.5 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] leading-[21px] text-ta-text">
            Tổng đang là <b>{tong}%</b>, chưa bằng 100%. Cô chỉnh nốt các tiêu chí còn lại —
            máy không tự chia lại hộ cô, vì đó là đổi cách chấm ở chỗ cô không nhìn.
          </div>
        ) : null}
        {loi ? (
          <div className="mt-3.5 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-ta-text">
            {loi}
          </div>
        ) : null}

        <p className="mt-3.5 text-[13px] leading-[21px] text-text-2">
          Thay đổi áp dụng cho nháp chấm <b>từ bài tiếp theo</b>. {rubric.daCham} bài đã chấm
          không đổi — band của em không được đổi sau lưng em.
        </p>
      </Khoi>

      <div className="mt-5">
        <Khoi
          ten="Cách cô hay nhận xét"
          phu={`Rút ra từ ${rubric.daCham} bài — cô xoá dòng nào không đúng, nháp sau không dùng cách đó nữa.`}
        >
          {rubric.giongCham.length === 0 ? (
            <KhoiTrong>
              Cô đã xoá hết. Nháp sau chỉ theo trọng số rubric, không theo giọng nào.
            </KhoiTrong>
          ) : (
            <div className="flex flex-wrap gap-2">
              {rubric.giongCham.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface-2 py-1.5 pl-3.5 pr-2 text-[13px] text-text"
                >
                  {g}
                  <button
                    type="button"
                    aria-label={`Bỏ: ${g}`}
                    onClick={() => datLoi(boGiongChamHanhVi(g).loi ?? null)}
                    className="text-[15px] leading-none text-text-3 hover:text-st-red"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </Khoi>
      </div>
    </>
  )
}
