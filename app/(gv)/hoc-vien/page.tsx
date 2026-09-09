'use client'

import { useState } from 'react'

import { Avatar, DauMan, Wrap } from '@/components/ung-dung/khung'
import { KhoiTrong, Nhan, Pill } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { duLieu, vaiHienTai } from '@/lib/demo/kho'

/**
 * Học viên — hồ sơ theo NGƯỜI, xuyên lớp.
 *
 * Đây là thứ bản OBLUE cũ không có: sổ điểm của nó gắn vào lớp, nên em học hai lớp là hai
 * bản ghi rời nhau. Ở đây một em một dòng, dù em học mấy lớp.
 */
export default function HocVien() {
  useKho()
  const [loc, datLoc] = useState<'tat-ca' | 'tut' | 'chua-bat'>('tat-ca')
  const vai = vaiHienTai()
  const du = duLieu()

  if (vai === 'student') {
    return (
      <>
        <DauMan ten="Học viên" phu="Em không xem được hồ sơ của bạn cùng lớp." />
        <Wrap>
          <KhoiTrong>
            CLAUDE.md, luật cứng: không màn nào so sánh học viên này với học viên khác cho em xem.
          </KhoiTrong>
        </Wrap>
      </>
    )
  }

  const thuocLop = (id: string) =>
    du.lop.filter((l) => l.hocVienIds.includes(id)).map((l) => l.ten)

  const trongTam =
    vai === 'assistant'
      ? du.hoSo.filter((h) => du.lop.find((l) => l.id === 'lop-65')?.hocVienIds.includes(h.id))
      : du.hoSo

  const ds = trongTam.filter((h) =>
    loc === 'tut' ? h.huong === 'down' : loc === 'chua-bat' ? !h.coTaiKhoan : true,
  )

  const tut = trongTam.filter((h) => h.huong === 'down').length
  const chuaBat = trongTam.filter((h) => !h.coTaiKhoan).length

  return (
    <>
      <DauMan
        ten="Học viên"
        phu="Hồ sơ đi theo người, không theo lớp. Em học hai lớp vẫn là một hồ sơ."
        song={`${trongTam.length} em`}
      />
      <Wrap>
        <div className="mb-5 flex flex-wrap gap-2.5">
          <Pill on={loc === 'tat-ca'} dem={trongTam.length} onClick={() => datLoc('tat-ca')}>
            Tất cả
          </Pill>
          <Pill on={loc === 'tut'} dem={tut} onClick={() => datLoc('tut')}>
            Band đang tụt
          </Pill>
          <Pill on={loc === 'chua-bat'} dem={chuaBat} onClick={() => datLoc('chua-bat')}>
            Chưa bật tài khoản
          </Pill>
        </div>

        {ds.length === 0 ? (
          <KhoiTrong>Không có em nào ở nhóm này.</KhoiTrong>
        ) : (
          <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
            <div className="grid min-w-[880px] grid-cols-[2fr_80px_1.6fr_90px_1.4fr_110px] gap-4 border-b border-border-light bg-surface-2 px-5 py-2.5 font-display text-[12px] font-semibold text-text-2">
              <span>Học viên</span>
              <span>Band</span>
              <span>Lớp đang học</span>
              <span>Đi học</span>
              <span>Lỗi hay gặp</span>
              <span>Tài khoản</span>
            </div>
            {ds.map((h) => {
              const t = du.taiKhoan.find((x) => x.id === h.id)
              if (!t) return null
              return (
                <div
                  key={h.id}
                  className="grid min-w-[880px] grid-cols-[2fr_80px_1.6fr_90px_1.4fr_110px] items-center gap-4 border-b border-border-light px-5 py-3 text-[13px] last:border-0"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar ten={t.ten} mau={t.mau} co={26} />
                    <b className="truncate font-display font-semibold text-text">{t.ten}</b>
                  </span>
                  <span
                    className={`font-display text-[15px] font-semibold tabular-nums ${
                      h.huong === 'up'
                        ? 'text-st-green-deep'
                        : h.huong === 'down'
                          ? 'text-st-red'
                          : 'text-text'
                    }`}
                  >
                    {h.bandTb.toFixed(1)}
                    {h.huong !== 'flat' ? (
                      <small className="ml-1 text-[11px] font-normal">
                        {h.huong === 'up' ? '↑' : '↓'}
                      </small>
                    ) : null}
                  </span>
                  <span className="truncate text-text-2">{thuocLop(h.id).join(', ') || '—'}</span>
                  <span className="text-text-2">{h.diHoc}</span>
                  <span className="truncate text-text-2">{h.loiHayGap}</span>
                  <span>
                    {h.coTaiKhoan ? (
                      <Nhan mau="green">Đã bật</Nhan>
                    ) : (
                      <Nhan mau="orange">Chưa</Nhan>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Wrap>
    </>
  )
}
