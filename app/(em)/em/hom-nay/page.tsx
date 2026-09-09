'use client'

/**
 * Màn nhà của em — `s-today`.
 *
 * Câu màn này trả lời: hôm nay em phải làm gì, và em đang ở đâu so với mục tiêu. Không có
 * chỗ nào so em với bạn — không phải vì tế nhị, mà vì `gradebook` mức `none` với vai học
 * viên nên dữ liệu để so cũng không đọc được từ đây.
 */
import Link from 'next/link'

import { DauManEm, WrapEm } from '@/components/em/khung'
import { Chuoi, Viec, Vong } from '@/components/em/phan-tu'
import { Khoi, Nut } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import {
  EM,
  baiCuaEm,
  baiLuyenCuaEm,
  baiPhaiNop,
  baiTuLuanPhaiNop,
  hoSoCuaEm,
  lopCuaEm,
  tuanCuaEm,
} from '@/lib/demo/em'
import { duLieu } from '@/lib/demo/kho'

const MUC_TIEU = 6.5

/**
 * Tên gọi trong tiếng Việt là phần TÊN, không phải chữ cuối cùng.
 *
 * "Nguyễn Minh Anh" gọi là "Minh Anh", không phải "Anh" — cắt chữ cuối là cắt mất nửa cái
 * tên và gọi em bằng một cái tên không phải của em.
 */
function tenGoi(ten?: string): string {
  if (!ten) return 'em'
  const phan = ten.trim().split(/\s+/)
  return phan.length >= 3 ? phan.slice(-2).join(' ') : phan[phan.length - 1]!
}

function hanNoiSao(iso: string): string {
  const con = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (con < 0) return `quá hạn ${-con} ngày`
  if (con === 0) return 'hạn hôm nay'
  if (con === 1) return 'hạn ngày mai'
  return `còn ${con} ngày`
}

export default function HomNay() {
  useKho()
  const du = duLieu()
  const em = du.taiKhoan.find((t) => t.id === EM)
  const ho = hoSoCuaEm(EM)
  const lop = lopCuaEm(EM)
  const phaiNop = baiPhaiNop(EM)
  const nopDuoc = new Set(baiTuLuanPhaiNop(EM).map((g) => g.id))
  const tuan = tuanCuaEm(EM)
  const luyen = baiLuyenCuaEm(EM).filter((b) => !b.ketQua)
  const daCham = baiCuaEm(EM).filter((b) => b.band !== null)

  // Phần trăm chặng: từ band đầu khoá tới mục tiêu. Không có lịch sử thì không vẽ vòng đầy.
  const dau = daCham.length > 0 ? daCham[daCham.length - 1]!.band! : (ho?.bandTb ?? 0)
  const nay = ho?.bandTb ?? dau
  const phanTram = Math.max(0, Math.min(100, Math.round(((nay - dau) / (MUC_TIEU - dau || 1)) * 100)))

  return (
    <>
      <DauManEm
        ten={`Chào ${tenGoi(em?.ten)}`}
        phu={`${lop?.ten ?? ''} · ${lop?.lich ?? ''} · ${
          phaiNop.length > 0 ? `${phaiNop.length} bài cần nộp` : 'không còn bài nào phải nộp'
        }`}
      />
      <WrapEm>
        <div className="flex flex-col items-start gap-5 rounded-l border border-border-light bg-surface px-6 py-[22px] sm:flex-row sm:items-center">
          <Vong so={nay.toFixed(1)} nhan="Writing" phanTram={phanTram} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[18px] font-semibold text-text">
              Mục tiêu {MUC_TIEU.toFixed(1)} — em đã đi {phanTram}% chặng này
            </h2>
            <p className="mt-1 text-[13px] text-text-2">
              {ho?.loiHayGap && ho.loiHayGap !== '—'
                ? `Cô Thảo đánh dấu: ${ho.loiHayGap}. Dứt được lỗi này là band chung lên theo.`
                : 'Cô Thảo chưa đánh dấu lỗi lặp nào. Em giữ nhịp này.'}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-4 text-[13px]">
              <div>
                <b className="block font-display text-[18px] leading-tight text-text">
                  {daCham.length}
                </b>
                <small className="text-[12px] text-text-2">bài đã có nhận xét</small>
              </div>
              <div>
                <b className="block font-display text-[18px] leading-tight text-text">
                  {ho?.diHoc ?? '—'}
                </b>
                <small className="text-[12px] text-text-2">buổi đi học</small>
              </div>
              <div>
                <b className="block font-display text-[18px] leading-tight text-text">
                  {luyen.length}
                </b>
                <small className="text-[12px] text-text-2">bài luyện cô giao</small>
              </div>
            </div>
          </div>
        </div>

        {phaiNop.map((bg) => (
          <Viec
            key={bg.id}
            mau="orange"
            gap
            ten={`${nopDuoc.has(bg.id) ? 'Nộp' : 'Làm'} ${bg.nhan}`}
            phu={`${hanNoiSao(bg.hanNop)} · ${du.de.find((d) => d.id === bg.deId)?.ten ?? ''}`}
            nut={
              nopDuoc.has(bg.id) ? (
                <Link href="/em/nop-bai">
                  <Nut kieu="chinh">Nộp bài</Nut>
                </Link>
              ) : (
                // Trắc nghiệm làm trên lớp ở bản demo. Nút tắt nói đúng sự thật; nút bật
                // dẫn sang đề khác thì em bấm vào mới biết là hỏng.
                <Nut disabled>Làm trên lớp</Nut>
              )
            }
          />
        ))}

        {luyen.map((bl) => (
          <Viec
            key={bl.id}
            mau="blue"
            ten={bl.ten}
            phu={`Cô giao riêng · ${bl.cau.length} câu · ${bl.viLoi}`}
            nut={
              <Link href="/em/luyen">
                <Nut>Làm ngay</Nut>
              </Link>
            }
          />
        ))}

        <Viec
          mau="green"
          ten={`Buổi tới — ${lop?.lich ?? ''}`}
          phu="Mang theo bài đã sửa theo nhận xét của cô"
          nut={<Nut disabled>Xem trước</Nut>}
        />

        <div className="mt-5">
          <Khoi
            ten="Tuần này em học đều không"
            phu="Mỗi ô là một ngày em có nộp bài hoặc luyện từ 5 phút."
          >
            <Chuoi ngay={tuan.ngay} />
            <p className="mt-3 text-[13px] text-text-2">
              {tuan.chuoi > 0
                ? `Chuỗi ${tuan.chuoi} ngày. Hôm nay làm bài 5 phút là giữ chuỗi.`
                : 'Hôm nay làm bài 5 phút là mở chuỗi mới.'}{' '}
              Cô Thảo thấy chuỗi này, và cô không dùng nó để trừ điểm em.
            </p>
          </Khoi>
        </div>
      </WrapEm>
    </>
  )
}
