'use client'

import type { Route } from 'next'
import Link from 'next/link'

import { DauMan, Ico, NutLien, Wrap } from '@/components/ung-dung/khung'
import { ChiSo, Khoi, Nhan, Nut, ViSao } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { baiCanCham, dangChay as baiDangChay, duLieu, vaiHienTai } from '@/lib/demo/kho'

function ngayViet(iso: string): string {
  const d = new Date(iso)
  const thu = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
  return `${thu} ${d.getDate()}/${d.getMonth() + 1}`
}

function gio(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Một việc trong "Việc hôm nay" — số bên trái, việc ở giữa, đường đi bên phải. */
function Viec({
  so,
  mau,
  ten,
  phu,
  den,
  nhanDen,
}: {
  so: number
  mau: string
  ten: string
  phu: string
  // Kiểu `Route` chứ không phải `string`: chỗ này từng để lọt một link tới màn đã xoá, vì
  // component ép kiểu `as never` lúc truyền cho <Link>. Ép kiểu ở đâu thì mù ở đó.
  den: Route
  nhanDen: string
}) {
  return (
    <div className="flex items-center gap-3.5 border-t border-border-light py-3.5 first:border-t-0 first:pt-0">
      <span
        aria-hidden
        className="grid h-9 w-9 flex-none place-items-center rounded-[11px] font-display text-[12px] font-bold text-surface"
        style={{ background: mau }}
      >
        {so}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block font-display font-semibold text-text">{ten}</b>
        <small className="text-[13px] leading-[19px] text-text-2">{phu}</small>
      </div>
      <Link
        href={den}
        className="whitespace-nowrap font-display text-[13px] font-semibold text-primary"
      >
        {nhanDen}
      </Link>
    </div>
  )
}

export default function TongQuan() {
  useKho()
  const vai = vaiHienTai()
  const du = duLieu()
  const cho = baiCanCham(vai)

  /*
   * Việc máy đã tự chạy — ĐẾM từ dữ liệu, không cắm số.
   *
   * Ba dòng, ba việc máy thật sự làm trong bản này: nhắc em có tài khoản, nháp chấm, và đăng
   * bài giao lên bảng tin. Mỗi dòng có đường đi tới chỗ kiểm chứng được.
   */
  const coTaiKhoan = du.hoSo.filter((h) => h.coTaiKhoan).length
  const chuaBatTk = du.hoSo.length - coTaiKhoan
  const mayDang = du.baiDang.filter((b) => b.loai === 'system').length
  const deDaSoHoa = du.de.filter((d) => d.nguon && d.nguon.loai !== 'tay').length
  const canXemLai = du.de.filter((d) => d.cauHoi.some((c) => c.canhBao)).length

  const tuChay: { ten: string; phu: string; cham: string; den: Route | null; nut: string }[] = [
    {
      ten: `Nhắc lịch và hạn nộp cho ${coTaiKhoan} học viên có tài khoản`,
      phu:
        chuaBatTk > 0
          ? `${chuaBatTk} em còn lại cô vẫn đang nhắc tay qua Zalo`
          : 'Cả lớp đã bật tài khoản — máy nhắc hết',
      cham: 'bg-st-green',
      den: chuaBatTk > 0 ? '/hoc-vien' : null,
      nut: `Mời ${chuaBatTk} em bật tài khoản`,
    },
    {
      ten: `Nhận xét nháp cho ${cho.length} bài đang chờ`,
      phu: `Viết theo cách cô đã chấm ${du.rubric.daCham} bài trước`,
      cham: 'bg-st-purple',
      den: cho.length > 0 ? '/cham-bai' : null,
      nut: 'Duyệt',
    },
    {
      ten: `Số hoá ${deDaSoHoa} đề từ ảnh và PDF`,
      phu:
        canXemLai > 0
          ? `${canXemLai} đề còn chỗ chữ mờ chờ cô xem`
          : 'Không đề nào còn chỗ chữ mờ',
      cham: canXemLai > 0 ? 'bg-st-orange' : 'bg-st-green',
      den: '/ngan-hang-de',
      nut: 'Xem đề',
    },
    {
      ten: `Đăng ${mayDang} bài giao lên bảng tin lớp`,
      phu: 'Máy đăng thẳng — đây là chỗ máy ĐƯỢC làm, vì nó không phán xét em nào',
      cham: 'bg-st-green',
      den: mayDang > 0 ? '/bang-tin' : null,
      nut: 'Xem bảng tin',
    },
  ]
  const ganCo = cho.filter((b) => b.ganCo.length > 0)
  const soEm = new Set(du.lop.flatMap((l) => l.hocVienIds)).size
  const dangChay = du.lop.filter((l) => l.trangThai === 'running')

  const bandTb =
    cho.length === 0 ? null : cho.reduce((t, b) => t + b.bandTb, 0) / cho.length

  const sapHan = du.baiGiao
    .filter((b) => baiDangChay(b) && new Date(b.hanNop).getTime() > Date.now())
    .sort((a, b) => a.hanNop.localeCompare(b.hanNop))

  // Bài ĐÃ XONG không còn "chưa nộp" — nó đã chấm xong từ tuần trước. Và đề xuất chưa
  // duyệt thì chưa giao cho ai, nên cũng không có ai thiếu nó.
  const chuaNop = du.baiGiao.flatMap((bg) => {
    const lop = du.lop.find((l) => l.id === bg.lopId)
    if (!lop || bg.daXong || !baiDangChay(bg)) return []
    return lop.hocVienIds.filter(
      (id) => !du.baiNop.some((b) => b.baiGiaoId === bg.id && b.hocVienId === id),
    )
  }).length

  if (vai === 'student') {
    const cuaEm = du.nhanXet.filter((n) =>
      du.baiNop.some((b) => b.id === n.baiNopId && b.hocVienId === du.vai.student),
    )
    return (
      <>
        <DauMan ten="Hôm nay" phu="Việc của em, và chỉ của em." />
        <Wrap>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <ChiSo nhan="Nhận xét cô đã gửi" so={cuaEm.length} phu="mở ra đọc kỹ phần cô sửa" />
            <ChiSo nhan="Bài đang chờ em nộp" so={sapHan.length} phu="còn hạn" />
          </div>
          <Khoi ten="Nhận xét của cô" phu="Chỉ hiện sau khi cô đã đọc và bấm gửi.">
            {cuaEm.length === 0 ? (
              <p className="text-[13px] text-text-3">
                Chưa có nhận xét nào. Cô đang chấm — em chờ chút.
              </p>
            ) : (
              cuaEm.map((n) => (
                <div key={n.id} className="border-t border-border-light py-3.5 first:border-t-0 first:pt-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <b className="font-display text-[18px] font-semibold tabular-nums text-text">
                      {n.band.toFixed(1)}
                    </b>
                    <Nhan mau="green">cô đã gửi</Nhan>
                  </div>
                  <p className="text-[13px] leading-[21px] text-text-2">{n.noiDung}</p>
                </div>
              ))
            )}
          </Khoi>
        </Wrap>
      </>
    )
  }

  return (
    <>
      <DauMan
        ten={vai === 'assistant' ? 'Việc của trợ giảng' : 'Chào cô Thảo'}
        phu={`${cho.length} bài chờ chấm · ${chuaNop} lượt chưa nộp · ${sapHan.length} bài đang mở`}
        song={`${dangChay.length} lớp đang chạy`}
        hanhDong={
          cho.length > 0 ? (
            <NutLien href="/cham-bai">
              <Ico s d="M4 20l4-1 10-10-3-3L5 16zM13 7l3 3" />
              Chấm bài ngay
            </NutLien>
          ) : undefined
        }
      />

      <Wrap>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ChiSo
            nhan="Học viên đang học"
            so={soEm}
            phu={`${dangChay.length} lớp đang chạy`}
          />
          <ChiSo
            nhan="Bài chờ chấm"
            so={cho.length}
            phu={cho.length ? 'nhận xét nháp đã sẵn' : 'hết bài — cô nghỉ tay'}
          />
          <ChiSo
            nhan="Band Writing trung bình"
            so={bandTb === null ? '—' : bandTb.toFixed(1)}
            phu="theo nháp của máy, chưa phải điểm cô chốt"
            sac={bandTb !== null && bandTb >= 6 ? 'good' : undefined}
          />
          <ChiSo
            nhan="Bài cần mắt cô"
            so={ganCo.length}
            phu="tin cậy thấp hoặc lệch band"
            sac={ganCo.length > 0 ? 'warn' : undefined}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Khoi
            ten="Việc hôm nay"
            phu="Xếp theo thứ tự nên làm. Phần lặp đã có nháp — cô chỉ duyệt."
          >
            {cho.length > 0 ? (
              <Viec
                so={cho.length}
                mau="var(--grad-avatar)"
                ten={`Duyệt ${cho.length} nhận xét nháp`}
                phu={
                  ganCo.length > 0
                    ? `${ganCo.length} bài cần mắt cô · ${cho.length - ganCo.length} bài máy tự tin`
                    : 'máy tự tin cả chồng — cô đọc lướt rồi gửi'
                }
                den="/cham-bai"
                nhanDen="Bắt đầu"
              />
            ) : null}
            {chuaNop > 0 ? (
              <Viec
                so={chuaNop}
                mau="linear-gradient(135deg,var(--av-orange-a),var(--av-orange-b))"
                ten={`${chuaNop} lượt chưa nộp bài`}
                phu="nhắc trên bảng tin lớp trước khi tới hạn"
                den="/lop-hoc"
                nhanDen="Mở lớp"
              />
            ) : null}
            {du.nhanXet.length > 0 ? (
              <Viec
                so={du.nhanXet.length}
                mau="linear-gradient(135deg,var(--av-green-a),var(--av-green-b))"
                ten={`${du.nhanXet.length} nhận xét đã tới tay em`}
                phu="mỗi lần gửi ghi một dòng nhật ký: ai gửi, lúc nào, ai nhìn thấy"
                den="/cau-hinh"
                nhanDen="Mở nhật ký"
              />
            ) : null}
            {cho.length === 0 && chuaNop === 0 && du.nhanXet.length === 0 ? (
              <p className="text-[13px] text-text-3">Không có việc nào đang chờ.</p>
            ) : null}
          </Khoi>

          <Khoi ten="Tuần này" phu="Hạn nộp bài. Lịch dạy để sau — cô chốt hoãn phần lịch.">
            {sapHan.length === 0 ? (
              <p className="text-[13px] text-text-3">Không có bài nào đang chờ nộp.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {sapHan.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-m border-l-[3px] bg-surface-2 px-3 py-2.5"
                    style={{ borderColor: 'var(--st-purple)' }}
                  >
                    <b className="block font-display text-[13px] font-semibold text-text">
                      {ngayViet(b.hanNop)} · {gio(b.hanNop)}
                    </b>
                    <small className="block text-[12px] leading-[18px] text-text-2">
                      {b.nhan ?? du.de.find((d) => d.id === b.deId)?.ten} —{' '}
                      {du.lop.find((l) => l.id === b.lopId)?.ten}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </Khoi>
        </div>

        {/*
          "Việc đã tự chạy tuần này" — khối thứ ba của `s-home`, và bản mẫu nói đúng mục đích:
          "Không cần cô làm — chỉ để cô biết."

          Mỗi dòng ĐẾM từ dữ liệu thật, không cắm số. Đây là khối trả lời câu cô hỏi sau tuần
          đầu — "máy vừa tự làm gì sau lưng tôi" — nên một con số bịa ở đây là bịa đúng chỗ cô
          dùng để quyết có tin nền tảng nữa hay không.
        */}
        <div className="mt-5">
          <Khoi ten="Việc đã tự chạy tuần này" phu="Không cần cô làm — chỉ để cô biết.">
            {tuChay.map((v) => (
              <div
                key={v.ten}
                className="flex flex-wrap items-center gap-3.5 border-t border-border-light py-3 first:border-t-0 first:pt-0"
              >
                <i aria-hidden className={`h-2.5 w-2.5 flex-none rounded-full ${v.cham}`} />
                <div className="min-w-0 flex-1">
                  <b className="block font-display font-semibold text-text">{v.ten}</b>
                  <small className="text-[13px] leading-[19px] text-text-2">{v.phu}</small>
                </div>
                {v.den ? (
                  <Link href={v.den}>
                    <Nut>{v.nut}</Nut>
                  </Link>
                ) : null}
              </div>
            ))}
          </Khoi>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ViSao>
            Máy chỉ nháp và đề xuất. Không có đường nào cho máy gửi thẳng tới học viên — đổi vai
            sang trợ giảng ở góc phải để thấy cùng một màn đổi thế nào.
          </ViSao>
          <ViSao mau="orange">
            Bài gắn cờ là bài máy không chắc: tin cậy dưới 85%, hoặc lệch hơn 1.0 band so với bài
            trước của em đó. Cô đọc kỹ những bài này trước.
          </ViSao>
        </div>
      </Wrap>
    </>
  )
}
