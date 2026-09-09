'use client'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { KhoiTrong, Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import type { De } from '@/lib/demo/du-lieu'
import { duLieu, vaiHienTai } from '@/lib/demo/kho'

const TEN_KY_NANG: Record<De['kyNang'], string> = {
  reading: 'Đọc',
  writing: 'Viết',
  listening: 'Nghe',
  speaking: 'Nói',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
}

const TEN_CHAM: Record<De['cachCham'], string> = {
  auto: 'Máy chấm',
  draft: 'Máy nháp, cô duyệt',
  manual: 'Cô chấm tay',
}

/**
 * Ngân hàng đề — đề thuộc về cô, không thuộc lớp (DECISIONS 2026-09).
 *
 * Lớp đóng thì đề còn. Cầu nối giữa đề và lớp là bài giao, và bài giao giữ ẢNH CHỤP câu
 * hỏi lúc giao (migration 0007) — nên sửa đề ở đây không đổi bài em đang làm dở.
 */
export default function NganHangDe() {
  useKho()
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

  const canXemLai = du.de.filter(
    (d) => d.tinCayOcr !== undefined && d.tinCayOcr < 0.85,
  ).length

  return (
    <>
      <DauMan
        ten="Ngân hàng đề"
        phu="Đề thuộc về cô, không thuộc lớp. Lớp đóng thì đề vẫn còn."
        song={`${du.de.length} đề${canXemLai ? ` · ${canXemLai} đề cần xem lại` : ''}`}
        hanhDong={vai === 'owner' ? <Nut kieu="chinh">Số hoá đề mới</Nut> : undefined}
      />
      <Wrap>
        <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
          <div className="grid min-w-[820px] grid-cols-[2.4fr_100px_90px_1.4fr_130px_90px] gap-4 border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-semibold text-text-2">
            <span>Đề</span>
            <span>Kỹ năng</span>
            <span>Trình độ</span>
            <span>Cách chấm</span>
            <span>Máy đọc</span>
            <span>Số câu</span>
          </div>
          {du.de.map((d) => {
            const daGiao = du.baiGiao.filter((b) => b.deId === d.id).length
            const thap = d.tinCayOcr !== undefined && d.tinCayOcr < 0.85
            return (
              <div
                key={d.id}
                className="grid min-w-[820px] grid-cols-[2.4fr_100px_90px_1.4fr_130px_90px] items-center gap-4 border-b border-border-light px-5 py-3.5 text-[13px] last:border-0"
              >
                <div className="min-w-0">
                  <b className="block truncate font-display font-semibold text-text">{d.ten}</b>
                  <small className="text-[12px] text-text-2">
                    {daGiao > 0 ? `đã giao ${daGiao} lần` : 'chưa giao lần nào'}
                  </small>
                </div>
                <span className="text-text-2">{TEN_KY_NANG[d.kyNang]}</span>
                <span className="text-text-2">{d.trinhDo ?? '—'}</span>
                <span>
                  {d.cachCham === 'auto' ? (
                    <Nhan mau="green">{TEN_CHAM.auto}</Nhan>
                  ) : d.cachCham === 'draft' ? (
                    <Nhan mau="purple">{TEN_CHAM.draft}</Nhan>
                  ) : (
                    <Nhan mau="blue">{TEN_CHAM.manual}</Nhan>
                  )}
                </span>
                <span>
                  {d.tinCayOcr === undefined ? (
                    <span className="text-text-3">cô soạn tay</span>
                  ) : (
                    <span
                      className={`font-display font-semibold tabular-nums ${
                        thap ? 'text-st-orange-deep' : 'text-text-2'
                      }`}
                    >
                      {Math.round(d.tinCayOcr * 100)}%{thap ? ' · xem lại' : ''}
                    </span>
                  )}
                </span>
                <span className="text-text-2">{d.cauHoi.length}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[13px] text-text-2">
          Sửa đề ở đây lan truyền xuống bài giao <b className="text-text">chưa ai nộp</b>. Bài đã
          có người nộp giữ nguyên ảnh chụp — và cô được báo lớp nào không nhận thay đổi.
        </p>
      </Wrap>
    </>
  )
}
