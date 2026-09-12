'use client'

/**
 * Học viên — `s-stu` của bản mẫu.
 *
 * Hồ sơ theo NGƯỜI, xuyên lớp. Đây là thứ bản OBLUE cũ không có: sổ điểm của nó gắn vào
 * lớp, nên em học hai lớp là hai bản ghi rời nhau. Ở đây một em một dòng, dù em học mấy lớp.
 *
 * Ba tab, và thứ tự có lý: **Tất cả** để tra, **Cần chú ý** để làm, **Chưa có tài khoản** để
 * sửa cái gốc — 4/4 em không gia hạn kỳ trước đều là em chưa bật tài khoản.
 *
 * Bấm tên mở ngăn hồ sơ bên phải. Ngăn kéo chứ không phải trang mới: cô đang quét danh sách,
 * xem một em rồi quay lại; mở trang mới là mất chỗ đang đứng.
 */
import { useState } from 'react'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { NganHoSo } from '@/components/ung-dung/ngan-ho-so'
import { Avatar, Khoi, KhoiTrong, Nhan, Nut, ThanhTienDo } from '@/components/ung-dung/phan-tu'
import { DaiTab } from '@/components/ung-dung/tab-man'
import { useKho } from '@/lib/demo/dung-kho'
import type { HoSoHocVien } from '@/lib/demo/du-lieu'
import { duLieu, vangLienTiep, vaiHienTai } from '@/lib/demo/kho'

const COT = 'grid min-w-[900px] grid-cols-[1.9fr_1.2fr_84px_84px_112px_1.3fr_124px] gap-4'

/**
 * Trạng thái của em — một câu, và câu đó phải nói được CÔ NÊN LÀM GÌ.
 *
 * "Band 5.5" không phải trạng thái; "đang buông" mới là. Suy từ ba thứ: hướng band, có tài
 * khoản chưa, và đã đạt mục tiêu chưa.
 */
function trangThai(h: HoSoHocVien): { chu: string; mau: 'green' | 'blue' | 'orange' | 'red' } {
  /*
   * Vắng liên tiếp xét TRƯỚC band, và đó là thứ tự có lý.
   *
   * Bản mẫu: "Vắng 2 buổi liên tiếp → tự vào Cần chú ý". Em vắng hai buổi cuối thì band
   * của em là số cũ — nó nói về những bài em còn đang học, không nói về việc em đang rời
   * lớp. Xếp band lên trước thì một em 7.1 vắng hai buổi đọc thành "Vượt mục tiêu".
   *
   * Liên tiếp chứ không phải tổng: vắng tám buổi rải cả khoá là em hay có việc, và cô xử
   * lý chuyện đó khác.
   */
  const lienTiep = vangLienTiep(h.id)
  if (lienTiep >= 2) {
    return { chu: `Vắng ${lienTiep} buổi`, mau: h.coTaiKhoan ? 'orange' : 'red' }
  }
  if (h.bandTb === 0) return { chu: 'Chưa có bài', mau: 'blue' }
  if (h.huong === 'down' && !h.coTaiKhoan) return { chu: 'Đang buông', mau: 'red' }
  if (h.huong === 'down') return { chu: 'Cần chú ý', mau: 'orange' }
  if (h.mucTieu && h.bandTb >= h.mucTieu) return { chu: 'Vượt mục tiêu', mau: 'green' }
  if (h.huong === 'up') return { chu: 'Đúng lộ trình', mau: 'blue' }
  return { chu: 'Đang chững', mau: 'orange' }
}

export default function HocVien() {
  useKho()
  const [tab, datTab] = useState('tat-ca')
  const [moHoSo, datMoHoSo] = useState<string | null>(null)
  const vai = vaiHienTai()
  const du = duLieu()

  if (vai === 'student') {
    return (
      <>
        <DauMan ten="Học viên" phu="Em không xem được hồ sơ của bạn cùng lớp." />
        <Wrap>
          <KhoiTrong>
            CLAUDE.md, luật cứng: không màn nào so sánh học viên này với học viên khác cho em
            xem.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  const trongTam =
    vai === 'assistant'
      ? du.hoSo.filter((h) => du.lop.find((l) => l.id === 'lop-65')?.hocVienIds.includes(h.id))
      : du.hoSo

  const ten = (id: string) => du.taiKhoan.find((t) => t.id === id)?.ten ?? id
  const mau = (id: string) => du.taiKhoan.find((t) => t.id === id)?.mau ?? 'off'
  const lopCua = (id: string) => du.lop.find((l) => l.hocVienIds.includes(id))?.ten ?? '—'

  /* "Cần chú ý" gồm CẢ hai đường vào: band đang tụt, và vắng 2 buổi liên tiếp. Chỉ lọc
     theo band thì em vắng hai buổi cuối mà điểm còn cao không xuất hiện ở đâu — và đó
     đúng là em cô cần gọi sớm nhất. */
  const canChuY = trongTam.filter((h) => h.huong === 'down' || vangLienTiep(h.id) >= 2)
  const chuaBat = trongTam.filter((h) => !h.coTaiKhoan)
  const sapHetPhi = du.hocPhi.filter(
    (f) => f.trangThai !== 'da_dong' && trongTam.some((h) => h.id === f.hocVienId),
  ).length

  const ds =
    tab === 'can-chu-y' ? canChuY : tab === 'chua-bat' ? chuaBat : trongTam

  return (
    <>
      <DauMan
        ten="Học viên"
        phu={`${trongTam.length} đang học · ${trongTam.length - chuaBat.length} có tài khoản riêng · ${sapHetPhi} sắp hết học phí · ${canChuY.length} cần chú ý`}
        hanhDong={
          vai === 'owner' ? (
            <span className="flex gap-2">
              <Nut disabled>Nhập từ Excel / Zalo</Nut>
              <Nut disabled kieu="chinh">
                Thêm học viên
              </Nut>
            </span>
          ) : undefined
        }
      />
      <DaiTab
        tabs={[
          { id: 'tat-ca', ten: 'Tất cả', dem: trongTam.length },
          { id: 'can-chu-y', ten: 'Cần chú ý', dem: canChuY.length },
          { id: 'chua-bat', ten: 'Chưa có tài khoản', dem: chuaBat.length },
        ]}
        dang={tab}
        doi={datTab}
      />
      <Wrap>
        {tab === 'can-chu-y' ? (
          <Khoi
            ten="Học viên cần để mắt"
            phu="Xếp theo mức cần can thiệp, không xếp theo điểm. Em điểm thấp mà đang đi lên thì không nằm ở đây."
          >
            {canChuY.length === 0 ? (
              <KhoiTrong>Không em nào đang tụt. Tuần này cô nhẹ.</KhoiTrong>
            ) : (
              canChuY.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3.5 border-t border-border-light py-3.5 first:border-t-0 first:pt-0"
                >
                  <i
                    aria-hidden
                    className={`h-2.5 w-2.5 flex-none rounded-full ${
                      h.coTaiKhoan && vangLienTiep(h.id) < 2 ? 'bg-st-orange' : 'bg-st-red'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <b className="block font-display font-semibold text-text">
                      {ten(h.id)} · {lopCua(h.id)}
                    </b>
                    <small className="text-[13px] leading-[19px] text-text-2">
                      {vangLienTiep(h.id) >= 2
                        ? `Vắng ${vangLienTiep(h.id)} buổi liên tiếp. `
                        : h.loiHayGap !== '—'
                          ? `${h.loiHayGap}. `
                          : ''}
                      {h.coTaiKhoan
                        ? 'Có tài khoản nên máy nhắc được.'
                        : 'Chưa có tài khoản nên không ai nhắc.'}{' '}
                      Học phí đến {h.hanHocPhi}.
                    </small>
                  </div>
                  <Nut onClick={() => datMoHoSo(h.id)}>Mở hồ sơ</Nut>
                </div>
              ))
            )}
          </Khoi>
        ) : tab === 'chua-bat' ? (
          <>
            <ThanhTienDo xong={trongTam.length - chuaBat.length} tong={trongTam.length} />
            <Khoi
              ten="Vì sao nên bật"
              phu="Em chưa có tài khoản thì máy không nhắc được bài, không báo được tiến độ — đến hạn học phí thì im lặng."
            >
              {chuaBat.length === 0 ? (
                <KhoiTrong>Cả lớp đã bật tài khoản.</KhoiTrong>
              ) : (
                chuaBat.slice(0, 8).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3.5 border-t border-border-light py-3 first:border-t-0 first:pt-0"
                  >
                    <i aria-hidden className="h-2.5 w-2.5 flex-none rounded-full bg-st-orange" />
                    <div className="min-w-0 flex-1">
                      <b className="block font-display font-semibold text-text">{ten(h.id)}</b>
                      <small className="text-[13px] text-text-2">
                        {lopCua(h.id)} · {h.loiHayGap !== '—' ? h.loiHayGap : 'chưa có lỗi lặp'}
                      </small>
                    </div>
                    <Nhan mau={h.huong === 'down' ? 'orange' : 'blue'}>
                      {h.huong === 'down' ? 'Ưu tiên' : 'Bình thường'}
                    </Nhan>
                  </div>
                ))
              )}
              {chuaBat.length > 8 ? (
                <p className="mt-3 text-[13px] text-text-2">
                  Còn {chuaBat.length - 8} em nữa. Lời mời gửi qua Zalo của cô, đăng nhập bằng số
                  điện thoại.
                </p>
              ) : null}
            </Khoi>
          </>
        ) : (
          <>
            <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
              <div
                className={`${COT} border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-bold text-text-2`}
              >
                <span>Học viên</span>
                <span>Lớp</span>
                <span>Band</span>
                <span>Mục tiêu</span>
                <span>Tài khoản</span>
                <span>Lỗi hay gặp</span>
                <span>Trạng thái</span>
              </div>
              {ds.slice(0, 20).map((h) => {
                const tt = trangThai(h)
                return (
                  <div
                    key={h.id}
                    className={`${COT} items-center border-b border-border-light px-5 py-3 text-[13px] last:border-0 hover:bg-hover`}
                  >
                    <button
                      type="button"
                      onClick={() => datMoHoSo(h.id)}
                      className="flex min-w-0 items-center gap-2.5 text-left"
                    >
                      <Avatar ten={ten(h.id)} mau={mau(h.id)} co={28} />
                      <b className="truncate font-display font-semibold text-text">{ten(h.id)}</b>
                    </button>
                    <span className="truncate text-text-2">{lopCua(h.id)}</span>
                    <span
                      className={`font-display font-semibold tabular-nums ${
                        h.huong === 'up'
                          ? 'text-st-green-deep'
                          : h.huong === 'down'
                            ? 'text-st-red'
                            : 'text-text'
                      }`}
                    >
                      {h.bandTb > 0 ? h.bandTb.toFixed(1) : '—'}
                      {h.huong === 'up' ? ' ↑' : h.huong === 'down' ? ' ↓' : ''}
                    </span>
                    <span className="tabular-nums text-text-2">
                      {h.mucTieu ? h.mucTieu.toFixed(1) : '—'}
                    </span>
                    <span>
                      {h.coTaiKhoan ? (
                        <Nhan mau="green">Đã bật</Nhan>
                      ) : (
                        <Nhan mau="orange">Chưa mời</Nhan>
                      )}
                    </span>
                    <span className="truncate text-text-2">{h.loiHayGap}</span>
                    <span>
                      <Nhan mau={tt.mau}>{tt.chu}</Nhan>
                    </span>
                  </div>
                )
              })}
            </div>
            {ds.length > 20 ? (
              <p className="mt-3 text-[13px] text-text-2">
                Còn {ds.length - 20} học viên. Bấm vào tên để xem hồ sơ: band theo kỹ năng, lỗi
                lặp, bài đã nộp, học phí.
              </p>
            ) : (
              <p className="mt-3 text-[13px] text-text-2">
                Bấm vào tên để xem hồ sơ: band theo kỹ năng, lỗi lặp, bài đã nộp, học phí.
              </p>
            )}
          </>
        )}
      </Wrap>

      {moHoSo ? (
        <NganHoSo hocVienId={moHoSo} vai={vai} dong={() => datMoHoSo(null)} />
      ) : null}
    </>
  )
}
