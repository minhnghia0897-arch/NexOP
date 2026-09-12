'use client'

import { useState } from 'react'

import { Avatar, DauMan, Wrap } from '@/components/ung-dung/khung'
import { ChiSo, KhoiTrong, Nhan, ViSao } from '@/components/ung-dung/phan-tu'
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
        ]}
        dang={tab}
        doi={datTab}
      />
      <Wrap>
        {tab === 'sap-han' ? (
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
