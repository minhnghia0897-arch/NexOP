'use client'

/**
 * Màn nhà của trợ giảng — `s-tahome` của bản mẫu.
 *
 * Câu mà màn này phải trả lời không phải "Lan là ai", mà "Lan làm được gì, và việc Lan làm
 * đi tới đâu". Nên ba khối: việc đang chờ · cô đã sửa gì của Lan · Lan không thấy gì.
 *
 * Khối thứ ba sinh thẳng từ `docs/permissions.json`, không gõ tay: gõ tay thì hôm nào cô đổi
 * chính sách, màn này vẫn hứa với Lan đúng những thứ cũ.
 */
import type { Route } from 'next'
import Link from 'next/link'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { ChiSo, Khoi, KhoiTrong, Nhan } from '@/components/ung-dung/phan-tu'
import { DEFAULTS, HARD_CEILING } from '@/lib/auth/permissions'
import { useKho } from '@/lib/demo/dung-kho'
import { baiCanCham, duLieu, vaiHienTai } from '@/lib/demo/kho'

const LOP_CUA_LAN = 'lop-65'

/** Tên tiếng Việt của thực thể trong permissions.json — chỉ để hiện, không để tra cứu. */
const TEN_THUC_THE: Record<string, string> = {
  fee: 'Học phí và tin gia hạn',
  rubric: 'Rubric và trọng số chấm của cô',
  export: 'Xuất dữ liệu lớp',
  // `teacher_notes` là trần cứng ở MỨC TRƯỜNG, không phải một thực thể trong bảng quyền —
  // nên nó không có dòng nào trong permissions.json, và thiếu tên ở đây thì hiện ra chữ máy.
  teacher_notes: 'Ghi chú riêng của cô về học viên',
  path: 'Lộ trình khoá học',
  proposal: 'Đề xuất máy gửi cho cô',
  membership: 'Thêm/bỏ học viên khỏi lớp',
  gradebook: 'Bảng điểm cả lớp',
  exam: 'Ngân hàng đề (chỉ xem đề đã giao)',
}

function Viec({
  so,
  mau,
  ten,
  phu,
  den,
  nhanDen,
}: {
  so: string
  mau: 'blue' | 'orange' | 'green'
  ten: string
  phu: string
  den?: Route
  nhanDen: string
}) {
  const nen = {
    blue: 'linear-gradient(135deg,var(--av-blue-a),var(--av-blue-b))',
    orange: 'linear-gradient(135deg,var(--av-orange-a),var(--av-orange-b))',
    green: 'linear-gradient(135deg,var(--av-green-a),var(--av-green-b))',
  }[mau]

  return (
    <div className="flex items-center gap-3.5 border-t border-border-light py-3.5 first:border-t-0 first:pt-0">
      <span
        aria-hidden
        className="grid h-9 w-9 flex-none place-items-center rounded-[11px] font-display text-[12px] font-bold text-surface"
        style={{ background: nen }}
      >
        {so}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block font-display font-semibold text-text">{ten}</b>
        <small className="text-[13px] leading-[19px] text-text-2">{phu}</small>
      </div>
      {den ? (
        <Link
          href={den}
          className="whitespace-nowrap font-display text-[13px] font-semibold text-primary"
        >
          {nhanDen}
        </Link>
      ) : (
        <span className="whitespace-nowrap font-display text-[13px] font-semibold text-text-3">
          {nhanDen}
        </span>
      )}
    </div>
  )
}

export default function ViecCuaToi() {
  useKho()
  const vai = vaiHienTai()
  const du = duLieu()

  if (vai !== 'assistant') {
    return (
      <>
        <DauMan
          ten="Việc của tôi"
          phu="Màn nhà của trợ giảng. Cô đã có Tổng quan — hai màn cho cùng một người là hai chỗ để quên việc."
        />
        <Wrap>
          <KhoiTrong>
            Đổi vai sang <b>Trợ giảng</b> ở góc trên bên phải để xem màn này. Rail cũng co
            theo vai, nên ở vai cô mục này không đứng đó.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  const lan = du.taiKhoan.find((t) => t.id === du.vai.assistant)
  const lop = du.lop.find((l) => l.id === LOP_CUA_LAN)
  const canNhap = baiCanCham(vai)
  const daChuyenCho = du.nhapCham.filter((n) => n.choCoDuyet?.boiId === du.vai.assistant).length

  // Nháp của Lan mà cô đã chốt — đọc từ chuỗi nháp, không phải từ một danh sách viết sẵn.
  const coDaChot = du.nhanXet.filter((n) => n.nhapBoi === du.vai.assistant)
  const coGiuNguyen = coDaChot.filter((n) => !n.suaTuNhap).length

  const hoiChuaTraLoi = du.baiDang.filter(
    (b) => b.lopId === LOP_CUA_LAN && b.loai === 'post' && b.noiDung.includes('?'),
  )

  /*
   * Ranh giới của trợ giảng, sinh từ chính sách đang chạy.
   * Trần cứng đứng riêng: nó không phải mức quyền, mà là cửa chặn trước cả mức quyền —
   * cô có muốn cấp cũng không cấp được.
   */
  const tranCung = [...HARD_CEILING]
  const khongThay = Object.entries(DEFAULTS)
    .filter(([type, hang]) => hang.assistant === 'none' && !HARD_CEILING.has(type))
    .map(([type]) => type)

  return (
    <>
      <DauMan
        ten={`Chào ${lan?.ten ?? 'trợ giảng'}`}
        phu={`Trợ giảng lớp ${lop?.ten ?? ''} · cô Thảo giao: nháp nhận xét tự luận, trả lời bảng tin, điểm danh`}
        song="Cô Thảo nhìn thấy mọi việc ở đây"
      />
      <Wrap>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ChiSo
            nhan="Bài cần nháp nhận xét"
            so={canNhap.length}
            phu="máy đã nháp · Lan đọc & sửa · cô duyệt"
          />
          <ChiSo
            nhan="Đã chuyển cô duyệt"
            so={daChuyenCho}
            phu={daChuyenCho === 0 ? 'chưa chuyển bài nào trong phiên này' : 'đang chờ cô đọc'}
            sac={daChuyenCho > 0 ? 'good' : undefined}
          />
          <ChiSo
            nhan="Cô giữ nguyên nháp của Lan"
            so={coDaChot.length === 0 ? '—' : `${coGiuNguyen}/${coDaChot.length}`}
            phu="tỉ lệ này lên nghĩa là Lan nháp ngày càng giống cô"
          />
          <ChiSo
            nhan="Câu hỏi chưa trả lời"
            so={hoiChuaTraLoi.length}
            phu={hoiChuaTraLoi.length > 0 ? 'trên bảng tin lớp' : 'bảng tin đang sạch'}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Khoi
            ten="Việc hôm nay"
            phu="Việc Lan làm không tới học viên cho tới khi cô duyệt. Đó không phải hạn chế — đó là lý do Lan làm được nhiều việc mà không sợ sai."
          >
            {canNhap.length > 0 ? (
              <Viec
                so={String(canNhap.length)}
                mau="orange"
                ten={`Nháp nhận xét ${canNhap.length} bài`}
                phu='Máy đã nháp · Lan đọc, sửa cho sát bài · bấm "Chuyển cô duyệt"'
                den="/cham-bai"
                nhanDen="Bắt đầu"
              />
            ) : null}
            {hoiChuaTraLoi.map((b) => {
              const ai = du.taiKhoan.find((t) => t.id === b.tacGiaId)
              return (
                <Viec
                  key={b.id}
                  so="1"
                  mau="blue"
                  ten={`Trả lời ${ai?.ten ?? 'học viên'} trên bảng tin`}
                  phu={`“${b.noiDung.slice(0, 64)}…” — Lan trả lời được, cô không cần duyệt`}
                  den="/bang-tin"
                  nhanDen="Trả lời"
                />
              )
            })}
            <Viec
              so="✓"
              mau="green"
              ten={`Điểm danh buổi tới — ${lop?.lich ?? ''}`}
              phu="Lan được làm · tự có hiệu lực, không chờ cô"
              nhanDen="Mở khi tới giờ"
            />
          </Khoi>

          <Khoi
            ten="Cô Thảo đã sửa gì của Lan"
            phu="Để Lan nháp giống cô hơn — máy cũng học từ đúng những dòng này."
          >
            {coDaChot.length === 0 ? (
              <KhoiTrong>Chưa có bài nào của Lan được cô chốt.</KhoiTrong>
            ) : (
              coDaChot.map((n) => {
                const bn = du.baiNop.find((b) => b.id === n.baiNopId)
                const em = du.taiKhoan.find((t) => t.id === bn?.hocVienId)
                const bg = du.baiGiao.find((g) => g.id === bn?.baiGiaoId)
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3.5 border-t border-border-light py-3.5 first:border-t-0 first:pt-0"
                  >
                    <i
                      aria-hidden
                      className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${
                        n.suaTuNhap ? 'bg-st-orange' : 'bg-st-green'
                      }`}
                    />
                    <div className="min-w-0">
                      <b className="block font-display font-semibold text-text">
                        {em?.ten} · {bg?.nhan}
                      </b>
                      <small className="text-[13px] leading-[19px] text-text-2">
                        Lan: {n.bandNhap?.toFixed(1)} → cô: {n.band.toFixed(1)} ·{' '}
                        {n.suaTuNhap ? 'cô sửa lại' : 'cô giữ nguyên'} — “{n.noiDung}”
                      </small>
                    </div>
                  </div>
                )
              })
            )}
          </Khoi>
        </div>

        <div className="mt-5">
          <Khoi
            ten="Lan không thấy gì"
            phu="Để Lan biết đâu là ranh giới, không phải để hạn chế. Danh sách này đọc thẳng từ chính sách quyền đang chạy."
          >
            <div className="mb-2 text-[12px] font-semibold text-text-2">
              Trần cứng — cô có muốn cấp cũng không cấp được
            </div>
            <div className="flex flex-wrap gap-2">
              {tranCung.map((t) => (
                <Nhan key={t} mau="red">
                  {TEN_THUC_THE[t] ?? t}
                </Nhan>
              ))}
            </div>
            <div className="mb-2 mt-5 text-[12px] font-semibold text-text-2">
              Cô chưa cấp — cấp được, nhưng mặc định là không
            </div>
            <div className="flex flex-wrap gap-2">
              {khongThay.map((t) => (
                <span
                  key={t}
                  className="rounded-pill bg-field px-3 py-[5px] text-[12px] text-text-2"
                >
                  {TEN_THUC_THE[t] ?? t}
                </span>
              ))}
            </div>
          </Khoi>
        </div>
      </Wrap>
    </>
  )
}
