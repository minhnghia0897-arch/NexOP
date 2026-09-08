'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { BangTin } from '@/components/ung-dung/bang-tin'
import { DongNguoi } from '@/components/ung-dung/khung'
import { ChiSo, Nhan, TieuDeMan } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { duLieu, vaiHienTai } from '@/lib/demo/kho'

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

  const dangXem = cua.find((l) => l.id === lop) ?? cua[0]

  if (!dangXem) {
    return (
      <>
        <TieuDeMan ten="Lớp học" />
        <p className="text-[13px] text-text-2">Chưa có lớp nào.</p>
      </>
    )
  }

  const em = dangXem.hocVienIds
    .map((id) => du.taiKhoan.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  const baiCuaLop = du.baiGiao.filter((b) => b.lopId === dangXem.id)

  return (
    <>
      <TieuDeMan ten={dangXem.ten} phu={`${dangXem.lich} · ${em.length} học viên`} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <ChiSo so={em.length} nhan="học viên" />
        <ChiSo so={baiCuaLop.length} nhan="bài đã giao" />
        <ChiSo
          so={du.baiNop.filter((b) => baiCuaLop.some((g) => g.id === b.baiGiaoId)).length}
          nhan="bài đã nộp"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <BangTin
          lopId={dangXem.id}
          vai={vai}
          baiDang={du.baiDang.filter((b) => b.lopId === dangXem.id)}
          taiKhoan={du.taiKhoan}
        />

        <section className="rounded-box border border-border-light bg-surface p-5">
          <h2 className="mb-3 font-display text-[15px] font-semibold text-text">
            {vai === 'student' ? 'Lớp của em' : 'Học viên'}
          </h2>
          {vai === 'student' ? (
            // CLAUDE.md: không màn nào so sánh học viên này với học viên khác cho em xem.
            <p className="text-[13px] leading-[19px] text-text-2">
              Em không xem được danh sách và điểm của bạn cùng lớp. Màn này chỉ có việc của em.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {em.map((t) => {
                const daNop = du.baiNop.some(
                  (b) => b.hocVienId === t.id && baiCuaLop.some((g) => g.id === b.baiGiaoId),
                )
                return (
                  <li key={t.id} className="flex items-center gap-2">
                    <DongNguoi ten={t.ten} mau={t.mau} />
                    <span className="ml-auto">
                      {daNop ? <Nhan mau="green">đã nộp</Nhan> : <Nhan mau="orange">chưa nộp</Nhan>}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
/*
 * `useSearchParams` phải nằm trong Suspense thì Next mới dựng sẵn được trang tĩnh: lúc
 * dựng chưa có query nào, nên phần phụ thuộc query phải hoãn tới khi chạy ở trình duyệt.
 */
export default function LopHoc() {
  return (
    <Suspense fallback={null}>
      <LopHocNoi />
    </Suspense>
  )
}
