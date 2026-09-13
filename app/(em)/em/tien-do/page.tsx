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
import { EM, baiCuaEm, baiLuyenCuaEm, hoSoCuaEm, loiCuaEm } from '@/lib/demo/em'

const MUC_TIEU = 6.5

export default function TienDo() {
  useKho()
  const ho = hoSoCuaEm(EM)
  const daCham = baiCuaEm(EM)
    .filter((b) => b.band !== null)
    .reverse()
  const luyen = baiLuyenCuaEm(EM)
  const loi = loiCuaEm(EM)
  const conMac = loi.filter((l) => !l.daDut)

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
  /* Trước đây chỗ này dò chữ trong `hoSo.loiHayGap` ("có chứa chữ 'chủ' không") — đoán nhóm
     lỗi bằng cách đọc một câu tiếng Việt. Giờ mỗi lỗi có `nhom` thật, nên hỏi thẳng. */
  const coLoiNguPhap = conMac.some((l) => l.nhom === 'grammar')
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
            phu={
              conMac.length > 0
                ? `Cô đánh dấu ${conMac.length} lỗi này qua nhiều bài của em. Dứt được chúng là band chung lên theo.`
                : 'Cô không còn đánh dấu lỗi nào lặp trong bài của em.'
            }
          >
            {loi.length === 0 ? (
              <KhoiTrong>
                Chưa có bài nào của em được chấm, nên chưa gộp được lỗi lặp. Lỗi ở đây là chỗ
                cô gạch trong bài — không phải máy đoán.
              </KhoiTrong>
            ) : (
              loi.map((l, k) => {
                /* Bài luyện nối với lỗi bằng khoá `loi`, không bằng cách dò chuỗi trong câu
                   cho em đọc — xem ghi chú ở `BaiLuyen.loi`. */
                const bl = luyen.find((b) => b.loi === l.ten && !b.ketQua)
                return (
                  <div
                    key={l.ten}
                    className="flex flex-wrap items-center gap-3.5 border-t border-border-light py-3 first:border-t-0 first:pt-0"
                  >
                    <i
                      aria-hidden
                      className={`h-2.5 w-2.5 flex-none rounded-full ${
                        l.daDut ? 'bg-st-green' : k === 0 ? 'bg-st-red' : 'bg-st-orange'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <b className="block font-display font-semibold text-text">{l.ten}</b>
                      <small className="text-[13px] text-text-2">
                        {l.daDut
                          ? `Đã sửa xong — ${l.saoLien} bài gần nhất cô không đánh dấu lại`
                          : l.lienTiep >= 2
                            ? `“${l.trich}” — ${l.lienTiep} bài liên tiếp`
                            : `${l.soBai}/${l.tongBai} bài đã chấm`}
                      </small>
                    </div>
                    {l.daDut ? (
                      <Nhan mau="green">Đã dứt</Nhan>
                    ) : bl ? (
                      <Link href="/em/luyen">
                        <Nut>Luyện 5 phút</Nut>
                      </Link>
                    ) : (
                      // Không bịa nút: cô chưa giao bài luyện cho lỗi này thì em bấm vào
                      // cũng ra bài của lỗi khác, và em tưởng mình đang luyện đúng chỗ.
                      <small className="text-[12px] text-text-3">Chưa có bài luyện</small>
                    )}
                  </div>
                )
              })
            )}
          </Khoi>
        </div>

        <div className="mt-5">
          <Khoi ten="Bài luyện em đã làm" phu="Kết quả vào hồ sơ — cô thấy, bạn cùng lớp thì không.">
            {luyen.filter((b) => b.ketQua).length === 0 ? (
              <KhoiTrong>Em chưa làm xong bài luyện nào.</KhoiTrong>
            ) : (
              luyen
                .filter((b) => b.ketQua)
                .map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3.5 border-t border-border-light py-3 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0 flex-1">
                      <b className="block font-display font-semibold text-text">{b.ten}</b>
                      <small className="text-[13px] text-text-2">
                        Em làm đúng {b.ketQua!.dung}/{b.cau.length}
                      </small>
                    </div>
                    <Nhan mau={b.ketQua!.dung >= b.cau.length - 1 ? 'green' : 'orange'}>
                      {b.ketQua!.dung >= b.cau.length - 1 ? 'Đã chắc' : 'Nên làm lại'}
                    </Nhan>
                  </div>
                ))
            )}
          </Khoi>
        </div>

      </WrapEm>
    </>
  )
}
