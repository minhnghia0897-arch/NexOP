'use client'

import { useState } from 'react'

import { GiaoBai } from '@/components/ung-dung/giao-bai'
import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { ChiSo, Khoi, KhoiTrong, Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { DaiTab } from '@/components/ung-dung/tab-man'
import { useKho } from '@/lib/demo/dung-kho'
import { duLieu, soLieuLoTrinh, vaiHienTai } from '@/lib/demo/kho'

/**
 * Lộ trình — `s-path` của bản mẫu. Kế hoạch buổi, không phải khoá học đóng gói.
 *
 * DECISIONS 2026-09-07: giữ `paths` chứ không thêm `courses`. Khách hàng là giáo viên ĐÃ CÓ
 * LỚP; họ lên kế hoạch buổi cho lớp đang chạy, không soạn khoá học để bán.
 *
 * Bản mẫu tách MỘT lộ trình một tab, và hiện nó theo **chặng** chứ không theo từng buổi. Bản
 * trước em xếp năm lộ trình thành lưới hai cột: năm lộ trình cạnh nhau thì không lộ trình nào
 * đủ chỗ để hiện khung chặng, mà khung chặng mới là thứ trả lời "lộ trình này đi qua đâu" —
 * tức là thứ để mở lớp thứ 5 mà không soạn lại.
 */
const COT = 'grid min-w-[680px] grid-cols-[88px_1.9fr_1.2fr_128px] gap-4'

export default function LoTrinhMan() {
  useKho()
  const [dangGiao, datDangGiao] = useState<string | null>(null)
  const vai = vaiHienTai()
  const du = duLieu()
  const [dang, datDang] = useState(du.loTrinh[0]?.id ?? '')

  if (vai !== 'owner') {
    return (
      <>
        <DauMan ten="Lộ trình" />
        <Wrap>
          <KhoiTrong>
            Lộ trình là tài sản của cô. Trợ giảng và học viên không xem được — `path` là mức
            `none` với mọi vai ngoài cô, và RLS ở migration 0004 cũng theo đúng luật này.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  const lt = du.loTrinh.find((x) => x.id === dang) ?? du.loTrinh[0]
  const so = lt ? soLieuLoTrinh(vai, lt.id) : null

  // Lớp đang chạy mới nhận bài được. Lớp sắp mở chưa có em nào — giao vào đó là giao cho không ai.
  const lopNhanDuoc = du.lop.filter((l) => l.trangThai === 'running' && l.hocVienIds.length > 0)

  return (
    <>
      <DauMan
        ten="Lộ trình"
        phu="Khung buổi học chuẩn của cô — dùng lại cho mọi lớp cùng cấp. Đây là thứ để mở lớp thứ 5 mà không soạn lại."
        song={`${du.loTrinh.length} lộ trình`}
        hanhDong={
          <span className="flex gap-2">
            <Nut disabled>Nhân bản</Nut>
            <Nut disabled kieu="chinh">
              Tạo lộ trình
            </Nut>
          </span>
        }
      />
      <DaiTab
        tabs={du.loTrinh.map((x) => ({
          id: x.id,
          ten: x.ten,
          // Lộ trình chưa lớp nào dùng là NHÁP — bản mẫu gắn nhãn "nháp" đúng chỗ này.
          ...(x.dangDung.length === 0 ? { dem: 0 } : {}),
        }))}
        dang={lt?.id ?? ''}
        doi={datDang}
      />
      <Wrap>
        {!lt || !so ? (
          <KhoiTrong>Chưa có lộ trình nào.</KhoiTrong>
        ) : (
          <>
            <p className="mb-5 text-[13px] leading-[21px] text-text-2">{lt.moTa}</p>

            {/* Bốn ô của bản mẫu — nhưng ô "đạt mục tiêu" chỉ hiện khi CÓ khoá đã kết thúc. */}
            <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ChiSo
                nhan="Đang dùng cho"
                so={so.soLop === 0 ? 'chưa lớp nào' : `${so.soLop} lớp`}
                phu={so.soEm > 0 ? `${so.soEm} học viên` : 'lộ trình nháp'}
              />
              {so.datMucTieu ? (
                <ChiSo
                  nhan="Học viên đạt mục tiêu"
                  so={`${so.datMucTieu.pct}%`}
                  phu={`của ${so.datMucTieu.khoa} khoá đã kết thúc`}
                  sac="good"
                />
              ) : (
                <ChiSo
                  nhan="Học viên đạt mục tiêu"
                  so="—"
                  phu="chưa khoá nào kết thúc theo lộ trình này"
                />
              )}
              {so.changKho ? (
                <ChiSo
                  nhan="Chặng khó nhất"
                  so={`Buổi ${so.changKho.tu}–${so.changKho.den}`}
                  phu={so.changKho.noiDung.split('—')[1]?.trim() ?? so.changKho.noiDung}
                  sac="warn"
                />
              ) : (
                <ChiSo nhan="Chặng khó nhất" so="—" phu="chưa đánh dấu chặng nào" />
              )}
              <ChiSo
                nhan="Đề dùng được"
                so={so.deDungDuoc}
                phu={`khớp cấp ${(lt.cap ?? []).join(', ') || 'chưa đặt'}`}
              />
            </div>

            {/* Bảng chặng — bốn cột đúng bản mẫu. */}
            <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
              <div
                className={`${COT} border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-bold text-text-2`}
              >
                <span>Buổi</span>
                <span>Nội dung</span>
                <span>Bài về nhà</span>
                <span>Kiểm tra</span>
              </div>
              {lt.chang.map((c) => (
                <div
                  key={`${c.tu}-${c.den}`}
                  className={`${COT} items-center border-b border-border-light px-5 py-3 text-[13px] last:border-0 ${
                    c.kho ? 'bg-callout-orange' : ''
                  }`}
                >
                  <b className="font-display font-semibold tabular-nums text-text">
                    {c.tu === c.den ? c.tu : `${c.tu}–${c.den}`}
                  </b>
                  <span className="text-text">{c.noiDung}</span>
                  <span className="text-text-2">{c.baiVeNha ?? '—'}</span>
                  <span>
                    {c.kiemTra ? (
                      <Nhan mau="blue">{c.kiemTra}</Nhan>
                    ) : c.kho ? (
                      <Nhan mau="orange">Chặng khó</Nhan>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/*
              Buổi cụ thể của chặng đang dạy — chỗ cô bấm Giao.
              Bảng chặng ở trên trả lời "lộ trình đi qua đâu"; phần này trả lời "tuần này giao
              gì". Gộp hai thứ vào một bảng thì bảng 48 dòng, và nút Giao chìm trong đó.
            */}
            <div className="mt-5">
              <Khoi
                ten="Buổi đã soạn chi tiết"
                phu="Buổi có đề gắn sẵn thì giao được ngay — cô không chọn lại đề, vì đó là lý do lộ trình tồn tại."
              >
                {lt.buoi.length === 0 ? (
                  <KhoiTrong>
                    Chưa soạn buổi nào chi tiết. Khung chặng ở trên đã đủ để mở lớp; nội dung
                    từng buổi cô điền khi tới chặng đó.
                  </KhoiTrong>
                ) : (
                  lt.buoi.map((b) => {
                    const khoa = `${lt.id}-${b.no}`
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
                              {dangGiao === khoa ? 'Thôi' : 'Giao bài'}
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
                  })
                )}
              </Khoi>
            </div>
          </>
        )}
      </Wrap>
    </>
  )
}
