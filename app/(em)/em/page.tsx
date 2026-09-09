'use client'

/** /em mở thẳng vào Hôm nay — không có màn "chọn mục" nào ở giữa. */
import { redirect } from 'next/navigation'

export default function EmGoc() {
  redirect('/em/hom-nay')
}
