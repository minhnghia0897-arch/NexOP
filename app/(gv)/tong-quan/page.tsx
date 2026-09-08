'use client'

import Link from 'next/link'

import { DongNguoi } from '@/components/ung-dung/khung'
import { ChiSo, Nhan, TieuDeMan, ViSao } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { baiCanCham, duLieu, vaiHienTai } from '@/lib/demo/kho'

function gioViet(iso: string): string {
  const d = new Date(iso)
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${hai(d.getHours())}:${hai(d.getMinutes())} ${d.getDate()}/${d.getMonth() + 1}`
}

export default function TongQuan() {
  useKho()
  const vai = vaiHienTai()
  const du = duLieu()
  const cho = baiCanCham(vai)
  const soEm = new Set(du.lop.flatMap((l) => l.hocVienIds)).size

  const sapHan = du.baiGiao
    .filter((b) => new Date(b.hanNop).getTime() > Date.now())
    .sort((a, b) => a.hanNop.localeCompare(b.hanNop))

  return (
    <>
      <TieuDeMan
        ten={vai === 'student' ? 'Hôm nay' : 'Tổng quan'}
        phu={
          vai === 'student'
            ? 'Việc của em, và chỉ của em.'
            : `${du.lop.length} lớp đang chạy · ${soEm} học viên`
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ChiSo so={cho.length} nhan="bài chờ cô" phu={cho.length ? 'máy đã nháp xong' : 'hết bài'} />
        <ChiSo
          so={cho.filter((b) => b.ganCo.length > 0).length}
          nhan="bài có cờ"
          phu="tin cậy thấp hoặc lệch band"
        />
        <ChiSo so={du.nhanXet.length} nhan="nhận xét đã gửi" phu="trong phiên này" />
        <ChiSo so={soEm} nhan="học viên" phu={`${du.lop.length} lớp`} />
      </div>

      {cho.length > 0 ? (
        <section className="mb-6 rounded-box border border-border-light bg-surface">
          <header className="flex items-center gap-3 border-b border-border-light px-5 py-3.5">
            <h2 className="font-display text-[15px] font-semibold text-text">Chồng bài chờ cô</h2>
            <Nhan mau="purple">máy đã nháp</Nhan>
            <Link
              href="/cham-bai"
              className="ml-auto font-display text-[13px] font-semibold text-primary"
            >
              Mở màn chấm bài →
            </Link>
          </header>
          <ul>
            {cho.slice(0, 5).map((b) => (
              <li
                key={b.baiNopId}
                className="flex flex-wrap items-center gap-3 border-b border-border-light px-5 py-3 last:border-0"
              >
                <DongNguoi
                  ten={b.hocVien.ten}
                  mau={b.hocVien.mau}
                  phu={`${b.lopTen} · ${b.soTu} từ`}
                />
                <span className="ml-auto flex items-center gap-3">
                  {b.ganCo.length > 0 ? <Nhan mau="orange">cần đọc kỹ</Nhan> : null}
                  {b.muon ? <Nhan mau="red">nộp muộn</Nhan> : null}
                  <b className="font-display text-[15px] font-semibold tabular-nums text-text">
                    {b.bandTb.toFixed(1)}
                  </b>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-box border border-border-light bg-surface p-5">
          <h2 className="mb-3 font-display text-[15px] font-semibold text-text">Sắp tới hạn</h2>
          {sapHan.length === 0 ? (
            <p className="text-[13px] text-text-3">Không có bài nào đang chờ nộp.</p>
          ) : (
            <ul className="space-y-2.5">
              {sapHan.map((b) => (
                <li key={b.id} className="flex items-center gap-3 text-[13px]">
                  <span className="min-w-0">
                    <b className="block truncate font-display font-semibold text-text">
                      {du.de.find((d) => d.id === b.deId)?.ten}
                    </b>
                    <small className="text-text-3">
                      {du.lop.find((l) => l.id === b.lopId)?.ten}
                    </small>
                  </span>
                  <span className="ml-auto whitespace-nowrap text-text-2">{gioViet(b.hanNop)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-box border border-border-light bg-surface p-5">
          <h2 className="mb-3 font-display text-[15px] font-semibold text-text">Máy đang làm gì</h2>
          <div className="space-y-2.5">
            <ViSao>
              Máy chỉ nháp và đề xuất. Không có đường nào cho máy gửi thẳng tới học viên — đổi vai
              sang trợ giảng ở góc phải để thấy cùng một màn đổi thế nào.
            </ViSao>
            <ViSao mau="orange">
              Bài gắn cờ là bài máy không chắc: tin cậy dưới 85%, hoặc lệch hơn 1.0 band so với bài
              trước của em đó. Cô đọc kỹ những bài này trước.
            </ViSao>
          </div>
        </section>
      </div>
    </>
  )
}
