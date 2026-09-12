'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { LuoiLop } from '@/components/ung-dung/luoi-lop'
import { KhoiTrong, Nut } from '@/components/ung-dung/phan-tu'
import { TrangLop } from '@/components/ung-dung/trang-lop'
import { useKho } from '@/lib/demo/dung-kho'
import { baiCanCham, duLieu, soLieuLop, vaiHienTai } from '@/lib/demo/kho'

function LopHocNoi() {
  useKho()
  const lop = useSearchParams()?.get('lop') ?? null
  const vai = vaiHienTai()
  const du = duLieu()

  // Vai nào thấy lớp nào: cô thấy hết, trợ giảng thấy lớp được giao, em thấy lớp mình học.
  const cua =
    vai === 'owner'
      ? du.lop
      : vai === 'assistant'
        ? du.lop.filter((l) => l.id === 'lop-65')
        : du.lop.filter((l) => l.hocVienIds.includes(du.vai.student))

  /*
   * Không có `?lop=` thì đây là màn LỚP HỌC — lưới thẻ, như `s-cls` của bản mẫu.
   * Có `?lop=` thì là TRANG LỚP — năm tab, như `s-class`.
   *
   * Bản mẫu tách hai màn, và tách đúng: một màn để chọn, một màn để làm việc. Trước đây em
   * gộp làm một và mất mất màn chọn — cô mở "Lớp học" ra là rơi thẳng vào một lớp, không
   * nhìn được bốn lớp cạnh nhau, mà đó mới là lúc cô thấy lớp nào đang tụt.
   *
   * Một đường dẫn hai màn thay vì hai đường dẫn, vì bản tĩnh không dựng được route động mà
   * không có `generateStaticParams` — và query thì `useSearchParams` đã dùng sẵn ở panel.
   */
  if (!lop) {
    const the = soLieuLop(vai)
    const dangChayN = the.filter((t) => t.lop.trangThai === 'running').length
    const sapMoN = the.filter((t) => t.lop.trangThai === 'opening').length

    return (
      <>
        <DauMan
          ten="Lớp học"
          phu={`${dangChayN} lớp đang chạy · ${sapMoN} lớp sắp mở · mở lớp mới không cần soạn lại`}
          hanhDong={
            vai === 'owner' ? (
              <Link href="/lo-trinh">
                <Nut kieu="chinh">Mở lớp mới từ lộ trình</Nut>
              </Link>
            ) : undefined
          }
        />
        <Wrap>
          {the.length === 0 ? (
            <KhoiTrong>Chưa có lớp nào.</KhoiTrong>
          ) : (
            <LuoiLop the={the} />
          )}
        </Wrap>
      </>
    )
  }

  const dangXem = cua.find((l) => l.id === lop) ?? cua[0]

  if (!dangXem) {
    return (
      <>
        <DauMan ten="Lớp học" />
        <Wrap>
          <KhoiTrong>
            Không tìm thấy lớp này, hoặc lớp nằm ngoài phạm vi của vai đang xem.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  const cho = baiCanCham(vai).filter((b) => b.lopId === dangXem.id).length
  const baiCuaLop = du.baiGiao.filter((b) => b.lopId === dangXem.id)

  return (
    <>
      <div className="px-8 pt-5">
        <nav className="mb-0.5 flex items-center gap-2 text-[13px] text-text-2">
          <Link href="/lop-hoc" className="font-display font-semibold hover:text-primary">
            ‹ Lớp học
          </Link>
          <span>/</span>
          <span>{dangXem.ten}</span>
        </nav>
      </div>

      <DauMan
        ten={dangXem.ten}
        phu={[
          `${dangXem.hocVienIds.length} học viên`,
          dangXem.lich,
          `${baiCuaLop.length} bài đã giao`,
          cho > 0 ? `${cho} bài chờ chấm` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        hanhDong={
          vai === 'owner' ? (
            <span className="flex items-center gap-3">
              <Nut>Thêm học viên</Nut>
              <Nut kieu="chinh">Giao bài</Nut>
            </span>
          ) : undefined
        }
      />

      <TrangLop lop={dangXem} />
    </>
  )
}

/* Xem ghi chú Suspense ở màn Chấm bài. */
export default function LopHoc() {
  return (
    <Suspense fallback={null}>
      <LopHocNoi />
    </Suspense>
  )
}
