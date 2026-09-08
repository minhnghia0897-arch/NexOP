import { duLieu } from '@/lib/demo/kho'
import type { VaiDemo } from '@/lib/demo/du-lieu'

import { BangTinKhung } from './bang-tin'

/** Đọc ở máy chủ, gõ ở trình duyệt — kho không bao giờ lọt xuống client. */
export function BangTin({ lopId, vai }: { lopId: string; vai: VaiDemo }) {
  const du = duLieu()
  return (
    <BangTinKhung
      lopId={lopId}
      vai={vai}
      baiDang={du.baiDang.filter((b) => b.lopId === lopId)}
      taiKhoan={du.taiKhoan}
    />
  )
}
