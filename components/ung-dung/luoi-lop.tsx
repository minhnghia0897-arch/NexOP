'use client'

/**
 * Lưới thẻ lớp — `s-cls` của bản mẫu.
 *
 * Mỗi lớp một thẻ, và thẻ trả lời đúng bốn câu cô hỏi khi liếc qua: lớp đi tới đâu · bao
 * nhiêu em · band đang lên hay xuống · còn mấy bài chờ chấm. Không có cột nào là trang trí.
 *
 * Thanh tiến độ là **buổi đã dạy / tổng số buổi của lộ trình**, không phải phần trăm bịa.
 * Lớp không gắn lộ trình thì không có thanh — thà thiếu còn hơn vẽ một thanh không dựa vào gì.
 */
import Link from 'next/link'

import type { Lop } from '@/lib/demo/du-lieu'

import { Nhan, Nut } from './phan-tu'

const CHAM_LOP: Record<Lop['mau'], string> = {
  blue: 'bg-st-blue',
  purple: 'bg-st-purple',
  orange: 'bg-st-orange',
  green: 'bg-st-green',
  indigo: 'bg-st-indigo',
}

export interface TheLop {
  lop: Lop
  soEm: number
  bandTb: number | null
  doiBand: number | null
  cho: number
  quaHan: number
  buoiDaDay: number | null
  soBuoi: number | null
  tenLoTrinh: string | null
  buoiToi: string
  diHocDeu: number | null
}

function Dong({ nhan, gia }: { nhan: string; gia: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-border-light py-[5px] text-[13px] text-text-2">
      <span>{nhan}</span>
      <b className="text-right font-display font-semibold tabular-nums text-text">{gia}</b>
    </div>
  )
}

export function LuoiLop({
  the,
  moDiemDanh,
}: {
  the: TheLop[]
  /** Không truyền = vai này không điểm danh được, nút hiện-mà-tắt. Quyền do `can()` quyết,
      không do thẻ này đoán. */
  moDiemDanh?: (lopId: string) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {the.map((t) => {
        const sapMo = t.lop.trangThai === 'opening'
        const pct =
          t.buoiDaDay !== null && t.soBuoi ? Math.round((t.buoiDaDay / t.soBuoi) * 100) : null

        return (
          <div
            key={t.lop.id}
            className={`rounded-l border bg-surface px-[22px] py-5 transition-shadow hover:shadow-[var(--sh-s)] ${
              sapMo ? 'border-dashed border-border' : 'border-border-light'
            }`}
          >
            {/* Đầu thẻ bấm được — đó là đường vào trang lớp. Bản mẫu cũng để cả cụm này. */}
            <Link
              href={{ pathname: '/lop-hoc', query: { lop: t.lop.id } }}
              className="mb-3 flex items-center gap-2.5"
            >
              <i aria-hidden className={`h-[22px] w-2.5 flex-none rounded-[3px] ${CHAM_LOP[t.lop.mau]}`} />
              <b className="min-w-0 flex-1 font-display text-[15px] font-semibold text-text">
                {t.lop.ten}
              </b>
              {sapMo ? (
                <Nhan mau="blue">Sắp mở</Nhan>
              ) : t.quaHan > 0 ? (
                <Nhan mau="orange">Quá hạn {t.quaHan} bài</Nhan>
              ) : (
                <Nhan mau="green">Đang chạy</Nhan>
              )}
            </Link>

            {pct !== null ? (
              <>
                <div className="mb-1 h-1.5 overflow-hidden rounded-[3px] bg-field">
                  <i
                    className={`block h-full ${sapMo ? 'bg-st-indigo' : 'bg-primary'}`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <small className="text-[13px] text-text-2">
                  Buổi {t.buoiDaDay}/{t.soBuoi}
                  {t.tenLoTrinh ? ` · lộ trình ${t.tenLoTrinh}` : ''}
                </small>
              </>
            ) : (
              <small className="text-[13px] text-text-2">
                {sapMo ? t.lop.ghiChu : 'Chưa gắn lộ trình'}
              </small>
            )}

            <div className="mt-2.5">
              {sapMo ? (
                <>
                  <Dong nhan="Từ lộ trình" gia={t.tenLoTrinh ?? '—'} />
                  <Dong nhan="Đã đăng ký" gia={`${t.soEm} em`} />
                  <Dong nhan="Khai giảng" gia={t.buoiToi} />
                </>
              ) : (
                <>
                  <Dong nhan="Học viên" gia={String(t.soEm)} />
                  <Dong
                    nhan="Band trung bình"
                    gia={
                      t.bandTb === null
                        ? '—'
                        : `${t.bandTb.toFixed(1)}${
                            t.doiBand === null || t.doiBand === 0
                              ? ''
                              : ` (${t.doiBand > 0 ? '+' : '−'}${Math.abs(t.doiBand).toFixed(1)})`
                          }`
                    }
                  />
                  <Dong nhan="Bài chờ chấm" gia={String(t.cho)} />
                  {t.diHocDeu !== null ? (
                    <Dong nhan="Đi học đều" gia={`${t.diHocDeu}%`} />
                  ) : null}
                  <Dong nhan="Buổi tới" gia={t.buoiToi} />
                </>
              )}
            </div>

            <div className="mt-3.5 flex gap-2">
              <Link
                href={{ pathname: '/lop-hoc', query: { lop: t.lop.id } }}
                className="flex-1"
              >
                <Nut>
                  <span className="w-full text-center">{sapMo ? 'Xem lớp' : 'Bảng tin'}</span>
                </Nut>
              </Link>
              {/* Lớp sắp mở chưa có buổi nào để điểm danh — nút đổi thành "Mời lên lớp",
                  và cái đó thì chưa dựng, nên vẫn hiện-mà-tắt. */}
              <span className="flex-1">
                <Nut
                  disabled={sapMo || !moDiemDanh}
                  onClick={moDiemDanh ? () => moDiemDanh(t.lop.id) : undefined}
                >
                  <span className="w-full text-center">
                    {sapMo ? 'Mời lên lớp' : 'Điểm danh'}
                  </span>
                </Nut>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
