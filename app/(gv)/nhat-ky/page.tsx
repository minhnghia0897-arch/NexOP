'use client'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { KhoiTrong, Nhan } from '@/components/ung-dung/phan-tu'
import { useKho } from '@/lib/demo/dung-kho'
import { duLieu, nhatKy, vaiHienTai } from '@/lib/demo/kho'

const MAU_VAI = {
  owner: 'green',
  assistant: 'orange',
  student: 'blue',
  system: 'purple',
  parent: 'blue',
} as const

const TEN_VAI = {
  owner: 'cô',
  assistant: 'trợ giảng',
  student: 'học viên',
  parent: 'phụ huynh',
  system: 'máy',
} as const

function gio(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Nhật ký sự kiện — UC-17, và là thứ bản OBLUE cũ không có.
 *
 * Để ở đây vì nó là cách duy nhất nhìn thấy xương sống: mỗi lần bấm nút ở màn khác đều rơi
 * xuống thành một dòng tại đây, kèm ai làm và ai được nhìn thấy. Lọc theo `visibility` đúng
 * như bản thật, nên đổi vai sang học viên là danh sách ngắn lại ngay.
 */
export default function NhatKyMan() {
  useKho()
  const vai = vaiHienTai()
  const du = duLieu()
  const toi = du.vai[vai]
  const ds = nhatKy().filter((e) => e.visibility.includes(toi))

  return (
    <>
      <DauMan
        ten="Nhật ký"
        phu="Mọi hành vi ghi vào đây TRƯỚC khi có hiệu lực. Danh sách lọc theo người được nhìn thấy, tính lúc ghi."
        song={`${ds.length} dòng ${vai === 'student' ? 'em' : 'cô'} thấy được`}
      />
      <Wrap>
        {ds.length === 0 ? (
          <KhoiTrong>
            Chưa có dòng nào {vai === 'student' ? 'em' : 'cô'} được nhìn thấy. Thử bấm gửi một nhận
            xét ở màn Chấm bài, hoặc đăng một bài lên bảng tin lớp.
          </KhoiTrong>
        ) : (
          <ol className="overflow-hidden rounded-l border border-border-light bg-surface">
            {ds.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-3 border-b border-border-light px-5 py-3.5 last:border-0"
              >
                <span className="w-[46px] flex-none font-display text-[12px] tabular-nums text-text-3">
                  {gio(e.luc)}
                </span>
                <code className="font-display text-[13px] font-semibold text-text">{e.action}</code>
                <Nhan mau={MAU_VAI[e.actorRole]}>{TEN_VAI[e.actorRole]}</Nhan>
                <span className="min-w-0 truncate text-[12px] text-text-3">
                  {e.actorId
                    ? du.taiKhoan.find((t) => t.id === e.actorId)?.ten
                    : 'không có tài khoản — máy không phải người'}
                </span>
                <span className="ml-auto whitespace-nowrap text-[12px] text-text-3">
                  {e.visibility.length} người nhìn thấy
                </span>
              </li>
            ))}
          </ol>
        )}
      </Wrap>
    </>
  )
}
