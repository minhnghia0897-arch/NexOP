'use client'

/**
 * `s-prog` — em ở đâu so với mục tiêu, và cái gì đang kéo em lại.
 *
 * Ba khối, và thứ tự có lý: band theo thời gian (em có đang đi lên không) → theo tiêu chí
 * (đi lên nhờ đâu, tụt ở đâu) → lỗi đang kéo lại (làm gì bây giờ). Màn dừng ở "em 6.0" thì
 * em đọc xong không biết phải làm gì, và đó là màn vô dụng nhất trong một app học.
 */
import Link from 'next/link'

import { DauManEm, WrapEm } from '@/components/em/khung'
import { Cot, Tieu } from '@/components/em/phan-tu'
import { Khoi, KhoiTrong, Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { EM, baiCuaEm, baiLuyenCuaEm, hoSoCuaEm } from '@/lib/demo/em'

const MUC_TIEU = 6.5

export default function TienDo() {
  useKho()
  const ho = hoSoCuaEm(EM)
  const daCham = baiCuaEm(EM)
    .filter((b) => b.band !== null)
    .reverse()
  const luyen = baiLuyenCuaEm(EM)

  if (!ho) {
    return (
      <>
        <DauManEm ten="Tiến độ" />
        <WrapEm>
          <KhoiTrong>Chưa có hồ sơ năng lực nào của em.</KhoiTrong>
        </WrapEm>
      </>
    )
  }

  /*
   * Bốn tiêu chí IELTS. Bản demo chưa lưu điểm từng tiêu chí trong nhận xét đã gửi, nên
   * suy từ band chung và lỗi lặp: lỗi ngữ pháp lặp thì Grammar dưới band chung. Suy chứ
   * không bịa — và nói rõ ở đây là suy, để đừng ai đọc thành số cô chấm.
   */
  const chung = ho.bandTb
  const coLoiNguPhap = ho.loiHayGap.toLowerCase().includes('chủ') || ho.loiHayGap.includes('×')
  const tieuChi = [
    { ten: 'Task Response', diem: chung, len: ho.huong === 'up' },
    { ten: 'Coherence', diem: chung + 0.5, len: ho.huong === 'up' },
    { ten: 'Lexical', diem: chung, len: false },
    { ten: 'Grammar', diem: coLoiNguPhap ? chung - 1 : chung, len: false },
  ]

  return (
    <>
      <DauManEm
        ten="Tiến độ"
        phu={`Em ở đâu so với mục tiêu ${MUC_TIEU.toFixed(1)} — và cái gì đang kéo em lại`}
      />
      <WrapEm>
        <Khoi ten="Band Writing qua các bài" phu="Mỗi cột là một bài cô đã chấm và gửi.">
          {daCham.length === 0 ? (
            <KhoiTrong>Chưa có bài nào được chấm.</KhoiTrong>
          ) : (
            <Cot ds={daCham.map((b) => ({ nhan: b.nhan.split('—')[0]!.trim(), band: b.band! }))} />
          )}
        </Khoi>

        <div className="mt-5">
          <Khoi
            ten="Theo tiêu chí"
            phu="Vạch xanh là mức mục tiêu. Cột nào xa vạch nhất là cột cần luyện. Đây là ước lượng từ band chung và lỗi lặp, không phải điểm cô chấm từng tiêu chí."
          >
            {tieuChi.map((t) => (
              <Tieu key={t.ten} ten={t.ten} diem={t.diem} muc={MUC_TIEU} len={t.len} />
            ))}
          </Khoi>
        </div>

        <div className="mt-5">
          <Khoi
            ten="Lỗi đang kéo em lại"
            phu="Cô đánh dấu lỗi này lặp qua nhiều bài. Dứt được nó là band chung lên theo."
          >
            {ho.loiHayGap === '—' ? (
              <KhoiTrong>Cô chưa đánh dấu lỗi lặp nào của em.</KhoiTrong>
            ) : (
              <div className="flex items-center gap-3.5 py-3">
                <i aria-hidden className="h-2.5 w-2.5 flex-none rounded-full bg-st-red" />
                <div className="min-w-0 flex-1">
                  <b className="block font-display font-semibold text-text">{ho.loiHayGap}</b>
                  <small className="text-[13px] text-text-2">
                    Cô đánh dấu trong nhiều bài liên tiếp
                  </small>
                </div>
                {luyen.filter((b) => !b.ketQua).length > 0 ? (
                  <Link href="/em/luyen">
                    <Nut>Luyện 5 phút</Nut>
                  </Link>
                ) : null}
              </div>
            )}

            {luyen
              .filter((b) => b.ketQua)
              .map((b) => (
                <div key={b.id} className="flex items-center gap-3.5 border-t border-border-light py-3">
                  <i aria-hidden className="h-2.5 w-2.5 flex-none rounded-full bg-st-green" />
                  <div className="min-w-0 flex-1">
                    <b className="block font-display font-semibold text-text">{b.ten}</b>
                    <small className="text-[13px] text-text-2">
                      Em làm đúng {b.ketQua!.dung}/{b.cau.length} — kết quả đã vào hồ sơ, cô thấy
                    </small>
                  </div>
                  <Nhan mau={b.ketQua!.dung >= b.cau.length - 1 ? 'green' : 'orange'}>
                    {b.ketQua!.dung >= b.cau.length - 1 ? 'Đã chắc' : 'Nên làm lại'}
                  </Nhan>
                </div>
              ))}
          </Khoi>
        </div>
      </WrapEm>
    </>
  )
}
