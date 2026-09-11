'use client'

import { useState } from 'react'

import { GiaoBai } from '@/components/ung-dung/giao-bai'
import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { Khoi, KhoiTrong, Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { duLieu, vaiHienTai } from '@/lib/demo/kho'

/**
 * Lộ trình — kế hoạch buổi, không phải khoá học đóng gói.
 *
 * DECISIONS 2026-09-07: giữ `paths` chứ không thêm `courses`. Khách hàng là giáo viên ĐÃ
 * CÓ LỚP; họ lên kế hoạch buổi cho lớp đang chạy, không soạn khoá học để bán.
 */
export default function LoTrinhMan() {
  useKho()
  // Buổi đang mở ô giao bài. Một buổi một lúc: mở nhiều ô cùng lúc thì cô không biết mình
  // vừa bấm Giao cho cái nào.
  const [dangGiao, datDangGiao] = useState<string | null>(null)
  const vai = vaiHienTai()
  const du = duLieu()

  if (vai !== 'owner') {
    return (
      <>
        <DauMan ten="Lộ trình" />
        <Wrap>
          <KhoiTrong>
            Lộ trình là tài sản của cô. Trợ giảng và học viên không xem được — RLS ở migration
            0004 cũng theo đúng luật này.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  // Lớp đang chạy mới nhận bài được. Lớp sắp mở chưa có em nào, giao vào đó là giao cho không ai.
  const lopNhanDuoc = du.lop.filter((l) => l.trangThai === 'running' && l.hocVienIds.length > 0)

  return (
    <>
      <DauMan
        ten="Lộ trình"
        phu="Kế hoạch buổi cho lớp đang chạy. Mở lớp mới từ lộ trình thì đề theo về, không nhân bản."
        song={`${du.loTrinh.length} lộ trình`}
      />
      <Wrap>
        <div className="grid gap-5 lg:grid-cols-2">
          {du.loTrinh.map((lt) => (
            <Khoi key={lt.id} ten={lt.ten} phu={lt.moTa}>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-text-2">
                <Nhan mau="blue">{lt.soBuoi} buổi</Nhan>
                {lt.dangDung.map((id) => (
                  <Nhan key={id} mau="green">
                    {du.lop.find((l) => l.id === id)?.ten ?? id}
                  </Nhan>
                ))}
              </div>
              {lt.buoi.map((b) => {
                const khoa = `${lt.id}-${b.no}`
                // Chỉ buổi CÓ ĐỀ GẮN SẴN mới giao được. Buổi chỉ có nội dung dạy thì không
                // có gì để em nộp — nút ở đó sẽ là nút bấm vào rồi báo lỗi.
                const giaoDuoc = Boolean(b.deId) && lopNhanDuoc.length > 0
                return (
                  <div
                    key={b.no}
                    className="border-t border-border-light py-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-px w-[62px] flex-none font-display text-[12px] font-semibold text-text-3">
                        Buổi {b.no}
                      </span>
                      <div className="min-w-0 flex-1">
                        <b className="block font-display text-[13px] font-semibold text-text">
                          {b.noiDung}
                        </b>
                        {b.baiVeNha ? (
                          <small className="text-[12px] text-text-2">
                            Bài về nhà: {b.baiVeNha}
                            {b.trongSo ? ` · trọng số ${b.trongSo}%` : ''}
                          </small>
                        ) : (
                          <small className="text-[12px] text-text-3">
                            Buổi dạy, không có bài về nhà
                          </small>
                        )}
                      </div>
                      {giaoDuoc ? (
                        <Nut onClick={() => datDangGiao(dangGiao === khoa ? null : khoa)}>
                          {dangGiao === khoa ? 'Thôi' : 'Giao'}
                        </Nut>
                      ) : null}
                    </div>
                    {dangGiao === khoa ? (
                      <GiaoBai
                        loTrinhId={lt.id}
                        buoi={b}
                        lop={lopNhanDuoc}
                        uuTien={lt.dangDung}
                        dong={() => datDangGiao(null)}
                      />
                    ) : null}
                  </div>
                )
              })}
            </Khoi>
          ))}
        </div>
      </Wrap>
    </>
  )
}
