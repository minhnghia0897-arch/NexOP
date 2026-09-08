'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { BangTin } from '@/components/ung-dung/bang-tin'
import { DauMan, DongNguoi, Wrap } from '@/components/ung-dung/khung'
import { ChiSo, Khoi, Nhan } from '@/components/ung-dung/phan-tu'
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
        <DauMan ten="Lớp học" />
        <Wrap>
          <p className="text-[13px] text-text-2">Chưa có lớp nào.</p>
        </Wrap>
      </>
    )
  }

  const em = dangXem.hocVienIds
    .map((id) => du.taiKhoan.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  const baiCuaLop = du.baiGiao.filter((b) => b.lopId === dangXem.id)
  const daNop = du.baiNop.filter((b) => baiCuaLop.some((g) => g.id === b.baiGiaoId))

  return (
    <>
      <DauMan
        ten={dangXem.ten}
        phu={`${dangXem.lich} · ${em.length} học viên`}
        song={dangXem.trangThai === 'opening' ? 'chưa khai giảng' : 'đang chạy'}
      />
      <Wrap>
        <div className="grid gap-4 sm:grid-cols-3">
          <ChiSo nhan="Học viên" so={em.length} phu={dangXem.ghiChu ?? dangXem.lich} />
          <ChiSo nhan="Bài đã giao" so={baiCuaLop.length} phu="tính cả bài đã quá hạn" />
          <ChiSo
            nhan="Lượt đã nộp"
            so={daNop.length}
            phu={`còn ${Math.max(0, em.length * baiCuaLop.length - daNop.length)} lượt chưa nộp`}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <BangTin
            lopId={dangXem.id}
            vai={vai}
            baiDang={du.baiDang.filter((b) => b.lopId === dangXem.id)}
            taiKhoan={du.taiKhoan}
          />

          <Khoi ten={vai === 'student' ? 'Lớp của em' : 'Học viên'}>
            {vai === 'student' ? (
              // CLAUDE.md: không màn nào so sánh học viên này với học viên khác cho em xem.
              <p className="text-[13px] leading-[19px] text-text-2">
                Em không xem được danh sách và điểm của bạn cùng lớp. Màn này chỉ có việc của em.
              </p>
            ) : em.length === 0 ? (
              <p className="text-[13px] text-text-3">Lớp chưa có ai — còn đang tuyển.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {em.map((t) => {
                  const nop = du.baiNop.some(
                    (b) => b.hocVienId === t.id && baiCuaLop.some((g) => g.id === b.baiGiaoId),
                  )
                  return (
                    <li key={t.id} className="flex items-center gap-2">
                      <DongNguoi ten={t.ten} mau={t.mau} />
                      <span className="ml-auto">
                        {nop ? (
                          <Nhan mau="green">đã nộp</Nhan>
                        ) : (
                          <Nhan mau="orange">chưa nộp</Nhan>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Khoi>
        </div>
      </Wrap>
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
