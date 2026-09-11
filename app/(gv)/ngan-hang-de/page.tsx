'use client'

/**
 * Ngân hàng đề — `s-bank` của bản mẫu.
 *
 * Câu màn này bán: "10 năm đề giấy của cô giờ tìm được trong 2 giây". Nên thứ đứng đầu
 * không phải danh sách hơn trăm đề, mà là **chồng việc**: đề vừa số hoá, mỗi đề còn thiếu
 * đúng một thứ — duyệt nhãn, xem chỗ chữ mờ, hoặc giao đi. Danh sách đầy đủ nằm ở tab hai.
 *
 * Đề thuộc về CÔ, không thuộc lớp (DECISIONS 2026-09). Lớp đóng thì đề còn. Cầu nối giữa đề
 * và lớp là bài giao, và bài giao giữ ảnh chụp câu hỏi lúc giao (migration 0007) — nên sửa
 * đề ở đây không đổi bài em đang làm dở.
 */
import Link from 'next/link'
import { useState } from 'react'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { Khoi, KhoiTrong, Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { DaiTab } from '@/components/ung-dung/tab-man'
import { ThuatSiDe } from '@/components/ung-dung/thuat-si-de'
import { useKho } from '@/lib/demo/dung-kho'
import type { De } from '@/lib/demo/du-lieu'
import { duyetNhanDeHanhVi } from '@/lib/demo/hanh-vi'
import { duLieu, vaiHienTai } from '@/lib/demo/kho'

const TEN_KY_NANG: Record<De['kyNang'], string> = {
  reading: 'Đọc',
  writing: 'Viết',
  listening: 'Nghe',
  speaking: 'Nói',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
}

/** Đề trống dùng khi cô bấm "Chụp / tải ảnh đề" — chưa có gì, thuật sĩ bắt đầu từ bước 1. */
const DE_TRONG: De = {
  id: 'de-moi',
  ten: '',
  kyNang: 'reading',
  trinhDo: 'IELTS 6.5',
  cachCham: 'auto',
  tinCayOcr: 0.94,
  nguon: { loai: 'anh', soTrang: 8 },
  thoiGianPhut: 60,
  chuDe: [],
  cauHoi: [],
}

function nguonNoiSao(d: De): string {
  if (!d.nguon || d.nguon.loai === 'tay') return 'Cô soạn tay'
  const ten = d.nguon.loai === 'pdf' ? 'PDF' : 'Ảnh chụp'
  return d.nguon.soTrang ? `${ten} · ${d.nguon.soTrang} trang` : ten
}

export default function NganHangDe() {
  useKho()
  const [tab, datTab] = useState('cho-duyet')
  const [moThuatSi, datMoThuatSi] = useState<{ de: De; buoc: 1 | 2 | 3 | 4 } | null>(null)
  const vai = vaiHienTai()
  const du = duLieu()

  if (vai === 'student') {
    return (
      <>
        <DauMan ten="Ngân hàng đề" />
        <Wrap>
          <KhoiTrong>
            Em thấy đề qua bài giao, không qua ngân hàng đề. Mở ngân hàng cho em là mở cả những
            đề cô chưa giao cho ai.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  const laCo = vai === 'owner'
  /*
   * Chồng việc của tab một: đề vừa số hoá mà CHƯA GIAO cho lớp nào.
   *
   * Không lọc theo "chưa duyệt nhãn": đề đã duyệt nhãn rồi vẫn còn một việc nữa — giao nó
   * đi. Lọc nó ra khỏi danh sách thì cô duyệt xong là đề biến mất, và việc cuối cùng không
   * ai nhắc. Cột Trạng thái nói rõ mỗi dòng đang cần gì: duyệt nhãn · xem chỗ chữ mờ · giao.
   *
   * Giao rồi thì đề rời chồng — đó là lúc nó thật sự xong.
   */
  const choDuyet = du.de.filter(
    (d) => d.trangThaiNhan && !du.baiGiao.some((b) => b.deId === d.id),
  )

  /* Đếm theo kỹ năng cho thanh ở tab hai. Cột dài nhất làm mốc 100%, không phải tổng —
     lấy tổng làm mốc thì mọi cột đều ngắn và biểu đồ không đọc được. */
  const theoKyNang = (Object.keys(TEN_KY_NANG) as De['kyNang'][])
    .map((k) => ({ k, so: du.de.filter((d) => d.kyNang === k).length }))
    .filter((x) => x.so > 0)
    .sort((a, b) => b.so - a.so)
  const nhieuNhat = theoKyNang[0]?.so ?? 1

  return (
    <>
      <DauMan
        ten="Ngân hàng đề"
        phu={`${du.de.length} đề đã số hóa · gắn nhãn cấp, kỹ năng, chủ đề · đề giấy của cô giờ tìm được trong 2 giây`}
        hanhDong={
          laCo ? (
            <span className="flex gap-2">
              <Nut onClick={() => datMoThuatSi({ de: DE_TRONG, buoc: 1 })}>Tạo đề mới</Nut>
              <Nut kieu="chinh" onClick={() => datMoThuatSi({ de: DE_TRONG, buoc: 2 })}>
                Chụp / tải ảnh đề
              </Nut>
            </span>
          ) : undefined
        }
      />
      <DaiTab
        tabs={[
          { id: 'cho-duyet', ten: 'Chờ duyệt nhãn', dem: choDuyet.length },
          { id: 'tat-ca', ten: 'Tất cả', dem: du.de.length },
        ]}
        dang={tab}
        doi={datTab}
      />
      <Wrap>
        {tab === 'cho-duyet' ? (
          <>
            {laCo ? (
              <button
                type="button"
                onClick={() => datMoThuatSi({ de: DE_TRONG, buoc: 2 })}
                className="mb-5 w-full rounded-l border-2 border-dashed border-border bg-surface px-6 py-7 text-center text-[13px] text-text-2 transition-colors hover:border-text-3"
              >
                <b className="mb-1 block font-display text-[15px] font-semibold text-text">
                  Kéo ảnh hoặc PDF đề vào đây
                </b>
                Ảnh chụp điện thoại là đủ. Đọc xong sẽ đề xuất nhãn — cô chỉ duyệt.
              </button>
            ) : null}

            {choDuyet.length === 0 ? (
              <KhoiTrong>
                Không còn đề nào chờ duyệt nhãn. Tải một đề mới lên là nó hiện ở đây.
              </KhoiTrong>
            ) : (
              <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
                <div className="grid min-w-[820px] grid-cols-[2.2fr_120px_100px_1.4fr_120px] gap-4 border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-bold text-text-2">
                  <span>Đề</span>
                  <span>Nguồn</span>
                  <span>Đọc đúng</span>
                  <span>Nhãn đề xuất</span>
                  <span>Trạng thái</span>
                </div>
                {choDuyet.map((d) => {
                  const thap = (d.tinCayOcr ?? 1) < 0.9
                  return (
                    <div
                      key={d.id}
                      className="grid min-w-[820px] grid-cols-[2.2fr_120px_100px_1.4fr_120px] items-center gap-4 border-b border-border-light px-5 py-3.5 text-[13px] last:border-0 hover:bg-hover"
                    >
                      <button
                        type="button"
                        onClick={() => datMoThuatSi({ de: d, buoc: 3 })}
                        className="flex min-w-0 items-center gap-2.5 text-left"
                      >
                        <i
                          aria-hidden
                          className="h-7 w-7 flex-none rounded-[9px]"
                          style={{
                            background:
                              d.nguon?.loai === 'pdf'
                                ? 'linear-gradient(135deg,var(--av-blue-a),var(--av-blue-b))'
                                : 'linear-gradient(135deg,var(--av-orange-a),var(--av-orange-b))',
                          }}
                        />
                        <b className="truncate font-display font-semibold text-text">{d.ten}</b>
                      </button>
                      <span className="text-text-2">{nguonNoiSao(d)}</span>
                      <span
                        className={`font-display font-semibold tabular-nums ${
                          thap ? 'text-st-orange-deep' : 'text-text-2'
                        }`}
                      >
                        {d.tinCayOcr ? `${Math.round(d.tinCayOcr * 100)}%` : '—'}
                      </span>
                      <span className="truncate text-text-2">
                        {(d.nhanDeXuat ?? []).join(' · ') || '—'}
                      </span>
                      <span>
                        {d.trangThaiNhan === 'chu_mo' ? (
                          <Nhan mau="orange">{d.choMo?.length ?? 0} chỗ chữ mờ</Nhan>
                        ) : d.trangThaiNhan === 'da_duyet' ? (
                          // Nhãn xong rồi thì việc còn lại là GIAO. Lộ trình là đường duy
                          // nhất đề gắn vào lớp, nên nút dẫn thẳng sang đó.
                          <Link
                            href="/lo-trinh"
                            className="inline-flex items-center rounded-s bg-primary-selected px-2 py-0.5 font-display text-[11px] font-semibold leading-[18px] text-primary hover:bg-primary-selected-hover"
                          >
                            Giao bài
                          </Link>
                        ) : laCo ? (
                          <Nut onClick={() => duyetNhanDeHanhVi(d.id)}>Duyệt nhãn</Nut>
                        ) : (
                          <Nhan mau="purple">Chờ duyệt</Nhan>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="mt-3 text-[13px] text-text-2">
              Bấm tên đề để mở lại bước duyệt câu hỏi. Chọn đáp án cho câu còn cảnh báo thì cảnh
              báo tự mất — cô không phải đi tắt nó bằng tay.
            </p>
          </>
        ) : (
          <>
            <Khoi
              ten="Theo kỹ năng"
              phu="Đề đã gắn nhãn thì tìm được bằng nhãn. Đó là cả lý do số hoá — không phải để có tệp, mà để tìm ra."
            >
              {theoKyNang.map(({ k, so }) => (
                <div key={k} className="mb-3 flex items-center gap-4 last:mb-0">
                  <span className="w-[130px] flex-none text-[13px] text-text-2">
                    {TEN_KY_NANG[k]}
                  </span>
                  <div className="relative h-8 flex-1 overflow-hidden rounded-m bg-field">
                    <i
                      className="block h-full rounded-m bg-primary opacity-80"
                      style={{ width: `${Math.max(12, (so / nhieuNhat) * 100)}%` }}
                    />
                    <b className="absolute left-3 top-0 font-display text-[12px] font-semibold leading-8 text-surface">
                      {so} đề
                    </b>
                  </div>
                </div>
              ))}
            </Khoi>

            <div className="mt-5 overflow-x-auto rounded-l border border-border-light bg-surface">
              <div className="grid min-w-[820px] grid-cols-[2.4fr_100px_110px_1.6fr_90px] gap-4 border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-bold text-text-2">
                <span>Đề</span>
                <span>Kỹ năng</span>
                <span>Cấp độ</span>
                <span>Nhãn</span>
                <span>Đã giao</span>
              </div>
              {du.de.slice(0, 40).map((d) => (
                <div
                  key={d.id}
                  className="grid min-w-[820px] grid-cols-[2.4fr_100px_110px_1.6fr_90px] items-center gap-4 border-b border-border-light px-5 py-3 text-[13px] last:border-0"
                >
                  <b className="truncate font-display font-semibold text-text">{d.ten}</b>
                  <span className="text-text-2">{TEN_KY_NANG[d.kyNang]}</span>
                  <span className="text-text-2">{d.trinhDo ?? '—'}</span>
                  <span className="truncate text-text-2">
                    {(d.nhanDeXuat ?? d.chuDe ?? []).join(' · ') || '—'}
                  </span>
                  <span className="tabular-nums text-text-2">
                    {du.baiGiao.filter((b) => b.deId === d.id).length}
                  </span>
                </div>
              ))}
            </div>
            {du.de.length > 40 ? (
              <p className="mt-3 text-[13px] text-text-2">
                Hiện 40 đề đầu trong {du.de.length}. Ô tìm kiếm ở thanh trên là đường đi tới phần
                còn lại — chưa nối ở bản demo.
              </p>
            ) : null}
          </>
        )}
      </Wrap>

      {moThuatSi ? (
        <ThuatSiDe
          de={moThuatSi.de}
          buocDau={moThuatSi.buoc}
          dong={() => datMoThuatSi(null)}
        />
      ) : null}
    </>
  )
}
