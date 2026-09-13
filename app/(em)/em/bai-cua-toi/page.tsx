'use client'

/**
 * `s-work` — hai tab: nhận xét mới, và tất cả bài.
 *
 * Bài đã nộp mà cô chưa chấm hiện "Chờ cô", không hiện band nào cả. Máy đã có nháp band từ
 * lúc em nộp, nhưng đó là lớp 3: `draft` mức `none` với vai học viên, nên màn này không có
 * đường nào đọc tới. Em thấy band khi và chỉ khi cô đã gửi.
 */
import Link from 'next/link'
import { useState } from 'react'

import { DauManEm, WrapEm } from '@/components/em/khung'
import { ChoSua } from '@/components/em/phan-tu'
import { Khoi, KhoiTrong, Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { DaiTab } from '@/components/ung-dung/tab-man'
import { useKho } from '@/lib/demo/dung-kho'
import { EM, baiCuaEm, baiLuyenCuaEm } from '@/lib/demo/em'

function ngay(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function BaiCuaToi() {
  useKho()
  const [tab, datTab] = useState('moi')
  const ds = baiCuaEm(EM)
  const daCham = ds.filter((b) => b.nhanXet !== null)
  const cho = ds.filter((b) => b.daNop && b.nhanXet === null)
  const moi = daCham[0] ?? null

  /*
   * Mũi ↑ của bản mẫu: band bài này cao hơn bài ĐƯỢC CHẤM liền trước.
   *
   * So với bài liền trước trong danh sách thì sai — bài liền trước có thể là bài đang chờ
   * cô (band `null`), và một bài chưa chấm không phải là một mốc để so.
   */
  const len = new Set(
    daCham
      .filter((b, i) => {
        const truoc = daCham[i + 1]
        return truoc !== undefined && b.band! > truoc.band!
      })
      .map((b) => b.baiGiaoId),
  )
  const luyen = baiLuyenCuaEm(EM).filter((b) => !b.ketQua)

  return (
    <>
      <DauManEm
        ten="Bài của tôi"
        phu={`${ds.filter((b) => b.daNop).length} bài đã nộp · ${daCham.length} đã có nhận xét · ${cho.length} đang chờ cô`}
      />
      {/* Dải tab nằm trong cùng cột với đầu màn và nội dung — xem ghi chú ở DauManEm. */}
      <div className="mx-auto max-w-[760px]">
        <DaiTab
          tabs={[
            { id: 'moi', ten: 'Nhận xét mới', dem: moi ? 1 : 0 },
            { id: 'tat-ca', ten: 'Tất cả', dem: ds.length },
          ]}
          dang={tab}
          doi={datTab}
        />
      </div>
      <WrapEm>
        {tab === 'moi' ? (
          moi === null ? (
            <KhoiTrong>
              Chưa có nhận xét nào. Bài em vừa nộp đang chờ cô đọc — cô thường trả trước buổi
              học tới.
            </KhoiTrong>
          ) : (
            <div className="rounded-l border border-border-light bg-surface px-5 py-[18px]">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="h-8 w-8 flex-none rounded-[10px]"
                  style={{ background: 'var(--grad-avatar)' }}
                />
                <div className="min-w-0">
                  <b className="font-display font-semibold text-text">
                    Cô Thảo nhận xét bài {moi.nhan}
                  </b>
                  <small className="block text-[12px] text-text-3">
                    {ngay(moi.nhanXet!.guiLuc)} · band {moi.band?.toFixed(1)}
                  </small>
                </div>
              </div>

              <p className="my-2 border-l-[3px] border-primary pl-3 text-[14px] leading-[22px] text-text">
                {moi.nhanXet!.noiDung}
              </p>

              {moi.co.length > 0 ? (
                <>
                  <h5 className="mb-2 mt-4 font-display text-[12px] font-bold text-text-2">
                    Chỗ cô đánh dấu trong bài
                  </h5>
                  {moi.co.map((l) => (
                    <ChoSua key={l.trich} loi={l} />
                  ))}
                </>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {luyen.length > 0 ? (
                  <Link href="/em/luyen">
                    <Nut kieu="chinh">Làm bài luyện cô giao</Nut>
                  </Link>
                ) : null}
                <Nut disabled>Xem bài gốc</Nut>
              </div>
            </div>
          )
        ) : (
          <Khoi ten="Tất cả bài" phu="Mới nhất trước. Ô trống là bài em chưa nộp.">
            <div className="overflow-x-auto">
              {/* Cột phải rộng cố định: không khoá thì dòng "cô nhắc" dài đẩy nhãn trạng
                  thái ra ngoài và hai cột chồng lên nhau. */}
              <table className="w-full min-w-[540px] table-fixed border-collapse text-[13px]">
                <colgroup>
                  <col className="w-[38%]" />
                  <col className="w-[62px]" />
                  <col />
                  <col className="w-[118px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border-light text-left">
                    {['Bài', 'Band', 'Cô nhắc', 'Trạng thái'].map((h) => (
                      <th
                        key={h}
                        className="py-2 pr-3 font-display text-[12px] font-bold text-text-2 last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ds.map((b) => (
                    <tr key={b.baiGiaoId} className="border-b border-border-light last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-text">{b.nhan}</td>
                      <td className="py-2.5 pr-3 font-display font-semibold tabular-nums text-text">
                        {b.band === null ? (
                          '—'
                        ) : (
                          <>
                            {b.band.toFixed(1)}
                            {len.has(b.baiGiaoId) ? (
                              // `role="img"` + nhãn: mũi tên một mình thì trình đọc màn hình
                              // đọc ra "mũi tên lên" hoặc không đọc gì, cả hai đều không
                              // nói được ý — mà ý ở đây là lời khen duy nhất trong bảng.
                              <span role="img" aria-label="cao hơn bài trước" className="ml-1 text-st-green-deep">
                                ↑
                              </span>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td className="truncate py-2.5 pr-3 text-text-2">
                        {b.co.length > 0 ? (b.co[0]!.themY ?? b.co[0]!.loai) : '—'}
                      </td>
                      <td className="py-2.5">
                        {!b.daNop ? (
                          <Nhan mau="red">Chưa nộp</Nhan>
                        ) : b.nhanXet ? (
                          <Nhan mau="green">Đã nhận xét</Nhan>
                        ) : (
                          <Nhan mau="purple">Chờ cô</Nhan>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Khoi>
        )}
      </WrapEm>
    </>
  )
}
