import { duLieu } from '@/lib/demo/kho'

/**
 * Ai vừa nhận nhận xét trong phiên này.
 *
 * Đọc từ kho chứ không giữ trong trình duyệt: gửi xong là thẻ biến mất khỏi danh sách,
 * nên state cục bộ mất theo. Chồng bài ngắn lại đã là phản hồi, nhưng cô còn cần biết bài
 * đó ĐI ĐÂU — "biến mất" và "đã tới tay em" trông giống nhau nếu không nói ra.
 */
export function VuaGui() {
  const du = duLieu()
  if (du.nhanXet.length === 0) return null

  const ten = du.nhanXet
    .map((n) => {
      const bn = du.baiNop.find((b) => b.id === n.baiNopId)
      return du.taiKhoan.find((t) => t.id === bn?.hocVienId)?.ten
    })
    .filter(Boolean)

  return (
    <div className="mb-4 rounded-m border border-st-green-line bg-callout-green px-3.5 py-2.5 text-[13px] leading-[19px] text-text-2">
      Đã gửi nhận xét cho <b className="font-display font-semibold text-text">{ten.join(', ')}</b>.
      Em mở app là thấy — trước lúc cô bấm gửi thì không.
    </div>
  )
}
