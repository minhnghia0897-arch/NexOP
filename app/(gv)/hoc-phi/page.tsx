'use client'

import { useState } from 'react'

import { Avatar, DauMan, Wrap } from '@/components/ung-dung/khung'
import { ChiSo, Khoi, KhoiTrong, Nhan, ViSao } from '@/components/ung-dung/phan-tu'
import { DaiTab } from '@/components/ung-dung/tab-man'
import { TinHocPhi } from '@/components/ung-dung/tin-hoc-phi'
import { useKho } from '@/lib/demo/dung-kho'
import { duLieu, tinHocPhiChoDuyet, vaiHienTai } from '@/lib/demo/kho'

function tien(n: number): string {
  return n.toLocaleString('vi-VN')
}

/**
 * Học phí — trần cứng của trợ giảng (permissions.json `assistant_hard_ceiling`).
 *
 * Trợ giảng KHÔNG thấy màn này dù cô có cấp quyền gì đi nữa: `can()` chặn ở cửa 5, trước
 * cả khi xét tới mức quyền. Đây là một trong bốn thứ trợ giảng không bao giờ chạm tới.
 */
export default function HocPhiMan() {
  useKho()
  const [tab, datTab] = useState('sap-han')
  const vai = vaiHienTai()
  const du = duLieu()

  if (vai !== 'owner') {
    return (
      <>
        <DauMan ten="Học phí" />
        <Wrap>
          <KhoiTrong>
            {vai === 'assistant'
              ? 'Học phí nằm trong trần cứng của trợ giảng — cô cấp quyền gì cũng không mở được. can() chặn ở cửa 5, trước khi xét tới mức quyền.'
              : 'Em chỉ thấy học phí của chính em, không thấy của lớp.'}
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  const quaHan = du.hocPhi.filter((h) => h.trangThai === 'qua_han')
  const sapHan = du.hocPhi.filter((h) => h.trangThai === 'sap_han')
  const tongCho = [...quaHan, ...sapHan].reduce((t, h) => t + h.soTien, 0)

  /*
   * Phễu và thang bước đều SUY từ dữ liệu thật, không cắm số.
   *
   * Bản mẫu ghi "+7 hỏi thử · 71% học thử · 80% đăng ký" — ba con số của 30 ngày qua mà kho
   * không có bảng nào lưu. Chỗ nào kho chưa có thì nói là chưa có, không bịa: hai bước đầu
   * hiện "—" kèm lý do, ba bước sau đếm được thật.
   */
  const tongEm = du.hoSo.length
  const chuaBat = du.hoSo.filter((h) => !h.coTaiKhoan).length
  const daBat = tongEm - chuaBat

  /* "Không gia hạn" = em đang buông (band tụt) VÀ học phí chưa đóng — hai dấu hiệu cùng lúc. */
  const khongGiaHanEm = du.hoSo.filter(
    (h) =>
      h.huong === 'down' &&
      du.hocPhi.some((f) => f.hocVienId === h.id && f.trangThai !== 'da_dong'),
  )
  const khongGiaHan = khongGiaHanEm.length
  const khongGiaHanChuaBat = khongGiaHanEm.filter((h) => !h.coTaiKhoan).length
  const lenLop = du.lop.find((l) => l.trangThai === 'opening')?.hocVienIds.length ?? 0

  const phe: { ten: string; hien: string; so: number; tiLe: number | null; ro?: boolean }[] = [
    { ten: 'hỏi thử', hien: '—', so: 0, tiLe: null },
    { ten: 'học thử', hien: '—', so: 0, tiLe: null },
    { ten: 'đang học', hien: String(tongEm), so: tongEm, tiLe: null },
    {
      ten: 'gia hạn kỳ tới',
      hien: `${tongEm - khongGiaHan}/${tongEm}`,
      so: tongEm - khongGiaHan,
      tiLe: Math.round(((tongEm - khongGiaHan) / tongEm) * 100),
      ro: true,
    },
    { ten: 'lên lớp cao hơn', hien: String(lenLop), so: lenLop, tiLe: null },
  ]

  /* Sáu bước của OPERATIONS. Bước đang ở suy từ dữ liệu: bước 4 là "tài khoản học viên", và
     lớp qua bước đó khi MỌI em đã bật — 41/58 thì vẫn đang ở bước 4. */
  const BUOC = [
    { ten: 'Chấm qua nền tảng', phu: 'Nháp sẵn, cô duyệt' },
    { ten: 'Hồ sơ học viên', phu: `${tongEm} hồ sơ, lỗi theo kỹ năng` },
    { ten: 'Rubric của cô', phu: `Học từ ${du.rubric.daCham} bài` },
    { ten: 'Tài khoản học viên', phu: `${daBat}/${tongEm} — nhắc bài thay cô` },
    { ten: 'Học phí qua nền tảng', phu: 'Nhắc hạn, thu tự động' },
    { ten: 'Lớp thứ 5 từ lộ trình', phu: 'Mở không cần soạn lại' },
  ]
  const buocDangO = chuaBat > 0 ? 4 : du.lop.length >= 5 ? 6 : 5

  const tin = tinHocPhiChoDuyet(vai)
  const hanTheoEm = Object.fromEntries(du.hocPhi.map((h) => [h.hocVienId, h.hanDong]))

  return (
    <>
      <DauMan
        ten="Học phí"
        phu="Nền tảng không thu tiền hộ. Màn này chỉ giúp cô biết nhắc ai, và nhắc thế nào."
        song={`${quaHan.length} quá hạn · ${sapHan.length} sắp tới hạn`}
      />
      <DaiTab
        tabs={[
          { id: 'sap-han', ten: 'Sắp đến hạn', dem: tin.length },
          { id: 'thang-nay', ten: 'Tháng này', dem: du.hocPhi.length },
          { id: 'tang-truong', ten: 'Tăng trưởng' },
        ]}
        dang={tab}
        doi={datTab}
      />
      <Wrap>
        {tab === 'tang-truong' ? (
          <>
            <Khoi
              ten="Đường học viên đi qua lớp cô"
              phu="30 ngày qua. Tìm chỗ rò, không tìm chỗ khen."
            >
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {phe.map((b, i) => (
                  <div
                    key={b.ten}
                    className={`rounded-l border px-4 py-3.5 ${
                      b.ro ? 'border-st-orange-line bg-callout-orange' : 'border-border-light bg-surface'
                    }`}
                  >
                    <div className="font-display text-[12px] font-bold text-text-2">
                      {i === 0 ? `+${b.so}` : b.tiLe !== null ? `${b.tiLe}%` : String(b.so)}
                    </div>
                    <b className="mt-1 block font-display text-[22px] font-semibold leading-7 tabular-nums text-text">
                      {b.hien}
                    </b>
                    <small className="text-[12px] text-text-2">{b.ten}</small>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-[21px] text-text-2">
                Chỗ rò là <b>gia hạn kỳ 2</b>: {khongGiaHan}/{tongEm} em không tiếp tục, và{' '}
                {khongGiaHanChuaBat}/{khongGiaHan} trong số đó chưa có tài khoản riêng — không ai
                nhắc bài, không ai báo tiến độ, đến hạn thì im lặng.
              </p>
            </Khoi>

            <div className="mt-5">
              <Khoi
                ten="Lớp cô đang ở bước nào"
                phu="Mỗi bước bật thêm một việc chạy tự động. Bước 4 là bước đổi nhiều nhất — và là bước không quay lại."
              >
                <ol className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {BUOC.map((b, i) => {
                    const xong = i + 1 < buocDangO
                    const dangO = i + 1 === buocDangO
                    return (
                      <li
                        key={b.ten}
                        className={`rounded-l border px-4 py-3 ${
                          xong
                            ? 'border-st-green-line bg-callout-green'
                            : dangO
                              ? 'border-primary bg-st-blue-soft'
                              : 'border-border-light bg-surface'
                        }`}
                      >
                        <b className="block font-display text-[13px] font-semibold text-text">
                          {i + 1} · {b.ten}
                        </b>
                        <small className="text-[12px] leading-[18px] text-text-2">
                          {b.phu}
                        </small>
                        {dangO ? (
                          <span className="mt-1.5 block">
                            <Nhan mau="blue">Đang ở đây</Nhan>
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                </ol>
              </Khoi>
            </div>
          </>
        ) : tab === 'sap-han' ? (
          <>
            <ViSao mau="orange">
              Máy rà lúc 7:00 và nháp tin theo tình trạng THẬT của từng em — ba em ba chuyện
              khác nhau, không dùng chung mẫu. Em đang buông thì tin không nhắc học phí: mục
              tiêu đổi từ thu tiền sang giữ người. Cô duyệt mới gửi, và gửi lúc 9:00.
            </ViSao>
            <div className="mt-5">
              <TinHocPhi tin={tin} taiKhoan={du.taiKhoan} han={hanTheoEm} />
            </div>
          </>
        ) : (
        <>
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <ChiSo
            nhan="Đang chờ thu"
            so={`${tien(tongCho)}đ`}
            phu={`${quaHan.length + sapHan.length} em`}
            sac={quaHan.length > 0 ? 'warn' : undefined}
          />
          <ChiSo nhan="Quá hạn" so={quaHan.length} phu="nên nhắn riêng, không nhắn nhóm" />
          <ChiSo
            nhan="Đã đóng"
            so={du.hocPhi.filter((h) => h.trangThai === 'da_dong').length}
            phu="chu kỳ tháng 9"
            sac="good"
          />
        </div>

        <ViSao mau="orange">
          Máy chỉ soạn nháp tin nhắc. Không có API nào cho máy gửi tin học phí — `fee.message.send`
          nằm trong danh sách chỉ-cô-được-gửi, và ràng buộc ở CSDL chặn cả khi mã ứng dụng sai.
        </ViSao>

        <div className="mt-5 overflow-x-auto rounded-l border border-border-light bg-surface">
          <div className="grid min-w-[760px] grid-cols-[2fr_1.4fr_1.2fr_110px_130px] gap-4 border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-semibold text-text-2">
            <span>Học viên</span>
            <span>Chu kỳ</span>
            <span>Số tiền</span>
            <span>Hạn</span>
            <span>Trạng thái</span>
          </div>
          {du.hocPhi.map((h) => {
            const t = du.taiKhoan.find((x) => x.id === h.hocVienId)
            if (!t) return null
            return (
              <div
                key={h.hocVienId}
                className={`grid min-w-[760px] grid-cols-[2fr_1.4fr_1.2fr_110px_130px] items-center gap-4 border-b border-border-light px-5 py-3 text-[13px] last:border-0 ${
                  h.trangThai === 'qua_han' ? 'bg-surface-due' : ''
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar ten={t.ten} mau={t.mau} co={26} />
                  <b className="truncate font-display font-semibold text-text">{t.ten}</b>
                </span>
                <span className="text-text-2">{h.chuKy}</span>
                <span className="font-display font-semibold tabular-nums text-text">
                  {tien(h.soTien)}đ
                </span>
                <span className="text-text-2">{h.hanDong}</span>
                <span>
                  {h.trangThai === 'da_dong' ? (
                    <Nhan mau="green">Đã đóng</Nhan>
                  ) : h.trangThai === 'sap_han' ? (
                    <Nhan mau="orange">Sắp tới hạn</Nhan>
                  ) : (
                    <Nhan mau="red">Quá hạn</Nhan>
                  )}
                </span>
              </div>
            )
          })}
        </div>
        </>
        )}
      </Wrap>
    </>
  )
}
