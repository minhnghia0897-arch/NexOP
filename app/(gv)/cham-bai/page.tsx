'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { BangTracNghiem } from '@/components/ung-dung/bang-tra-nghiem'
import { DaiTab } from '@/components/ung-dung/tab-man'
import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { LoiChungCuaLop, RubricCuaCo } from '@/components/ung-dung/loi-chung'
import { KhoiTrong, Pill, ThanhTienDo } from '@/components/ung-dung/phan-tu'
import { TheCham } from '@/components/ung-dung/the-cham'
import { VuaGui } from '@/components/ung-dung/vua-gui'
import { useKho } from '@/lib/demo/dung-kho'
import {
  baiCanCham,
  baiTracNghiemCanChot,
  duLieu,
  loiChungCuaLop,
  soLieuTracNghiem,
  vaiHienTai,
} from '@/lib/demo/kho'

function ChamBaiNoi() {
  useKho()
  const lop = useSearchParams()?.get('lop') ?? null
  const vai = vaiHienTai()
  const du = duLieu()
  const [chiCanDoc, datChiCanDoc] = useState(false)
  const [dang, datDang] = useState<'tu-luan' | 'trac-nghiem'>('tu-luan')
  /*
   * Ba tab của bản mẫu (`g1`/`g2`/`g3`), không phải hai.
   *
   * "Cả lớp sai chung ở đâu" là BƯỚC 6 của vòng vận hành — cô đọc nó 5 phút trước giờ dạy —
   * nên nó không phải một khối phụ nhét dưới chồng bài chờ. Nhét xuống dưới thì cô phải cuộn
   * qua mười tám bài mới thấy, và bước 6 mất chỗ đứng.
   */
  const [tab, datTab] = useState('cho-duyet')

  const tatCa = baiCanCham(vai)
  const trongLop = lop ? tatCa.filter((b) => b.lopId === lop) : tatCa
  const canDoc = trongLop.filter((b) => b.ganCo.length > 0)
  const ds = chiCanDoc ? canDoc : trongLop

  /*
   * Hai nửa của bước 4, và bản mẫu tách chúng thành hai đường: "Tự luận · cần mắt cô" và
   * "Trắc nghiệm · đã chấm xong". Gộp một danh sách thì mười tám bài trắc nghiệm đè mất bốn
   * bài tự luận — mà bốn bài kia mới là chỗ cô phải đọc.
   */
  const tnCanChot = baiTracNghiemCanChot(vai).filter((x) => !lop || x.lopId === lop)
  const soTn = tnCanChot.reduce((t, x) => t + x.chuaChot, 0)

  /* Lỗi chung tính theo MỘT lớp: gộp lỗi bốn lớp vào một bảng thì "3/7 em" là ba em của lớp
     nào? Mặc định lớp 6.5 — lớp mọi màn demo đi qua — hoặc lớp đang lọc. */
  const lopLoi = lop ?? 'lop-65'
  const loiChung = loiChungCuaLop(vai, lopLoi)
  const tenLopLoi = du.lop.find((l) => l.id === lopLoi)?.ten ?? ''

  // Đã gửi bao nhiêu trong phiên này — thanh tiến độ nói bằng việc thật, không phải %.
  const daGui = du.nhanXet.length
  const tong = daGui + trongLop.length

  if (vai === 'student') {
    return (
      <>
        <DauMan
          ten="Chấm bài"
          phu="Em không thấy màn này — nháp chấm là việc của cô và trợ giảng."
        />
        <Wrap>
          <KhoiTrong>
            Band nháp của máy là việc nội bộ giữa cô và trợ giảng. Em chỉ nhận nhận xét sau khi cô
            đã đọc và bấm gửi.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  return (
    <>
      <DauMan
        ten="Chấm bài"
        phu="Nhận xét nháp viết theo cách cô chấm — cô duyệt, sửa, hoặc viết lại. Không gửi gì khi cô chưa bấm."
        song={`${trongLop.length} tự luận cần mắt cô · ${soTn} trắc nghiệm đã chấm xong`}
      />
      <DaiTab
        tabs={[
          { id: 'cho-duyet', ten: 'Chờ duyệt', dem: trongLop.length + soTn },
          { id: 'sai-chung', ten: 'Cả lớp sai chung ở đâu', dem: loiChung.length },
          ...(vai === 'owner' ? [{ id: 'rubric', ten: 'Rubric của cô' }] : []),
        ]}
        dang={tab}
        doi={datTab}
      />
      <Wrap>
        {tab === 'sai-chung' ? (
          <LoiChungCuaLop
            lopId={lopLoi}
            lopTen={tenLopLoi}
            loi={loiChung}
            laCo={vai === 'owner'}
          />
        ) : tab === 'rubric' ? (
          <RubricCuaCo rubric={du.rubric} laCo={vai === 'owner'} />
        ) : (
        <>
        <VuaGui />

        <div className="mb-5 flex flex-wrap gap-2.5">
          <Pill on={dang === 'tu-luan' && !chiCanDoc} dem={trongLop.length} onClick={() => { datDang('tu-luan'); datChiCanDoc(false) }}>
            Tự luận · cần mắt cô
          </Pill>
          <Pill on={dang === 'tu-luan' && chiCanDoc} dem={canDoc.length} onClick={() => { datDang('tu-luan'); datChiCanDoc(true) }}>
            Bài gắn cờ
          </Pill>
          {soTn > 0 ? (
            <Pill on={dang === 'trac-nghiem'} dem={soTn} onClick={() => datDang('trac-nghiem')}>
              Trắc nghiệm · máy chấm xong
            </Pill>
          ) : null}
          {lop ? (
            <span className="flex h-10 items-center text-[13px] text-text-2">
              đang lọc theo <b className="ml-1 text-text">{du.lop.find((l) => l.id === lop)?.ten}</b>
            </span>
          ) : null}
        </div>

        {dang === 'trac-nghiem' ? (
          tnCanChot.map((x) => {
            const so = soLieuTracNghiem(vai, x.baiGiaoId)
            const bg = du.baiGiao.find((g) => g.id === x.baiGiaoId)
            if (!so || !bg) return null
            return (
              <div key={x.baiGiaoId} className="mb-7">
                <h3 className="mb-1 font-display text-[15px] font-semibold text-text">
                  {bg.nhan ?? 'Bài trắc nghiệm'} · {x.lopTen}
                </h3>
                <p className="mb-3.5 text-[13px] text-text-2">
                  Trọng số {bg.trongSo ?? 0}% · {bg.cauHoi.length} câu · chấm tự động
                </p>
                <BangTracNghiem bg={bg} soLieu={so} laCo={vai === 'owner'} />
              </div>
            )
          })
        ) : (
          <>
            {tong > 0 ? <ThanhTienDo xong={daGui} tong={tong} /> : null}

            {ds.length === 0 ? (
              <KhoiTrong>
                {chiCanDoc
                  ? 'Không bài nào bị gắn cờ. Cô duyệt lướt phần còn lại là xong.'
                  : soTn > 0
                    ? 'Chấm xong bài tự luận. Trắc nghiệm chỉ cần chốt điểm cả lớp — xem thẻ bên trên.'
                    : 'Không còn bài nào chờ. Cô nghỉ tay.'}
              </KhoiTrong>
            ) : (
              ds.map((b) => (
                <TheCham key={b.baiNopId} bai={b} laTroGiang={vai === 'assistant'} />
              ))
            )}
          </>
        )}
        </>
        )}
      </Wrap>
    </>
  )
}

/*
 * `useSearchParams` phải nằm trong Suspense thì Next mới dựng sẵn được trang tĩnh: lúc dựng
 * chưa có query nào, nên phần phụ thuộc query phải hoãn tới khi chạy ở trình duyệt.
 */
export default function ChamBai() {
  return (
    <Suspense fallback={null}>
      <ChamBaiNoi />
    </Suspense>
  )
}
