'use client'

import { useSyncExternalStore } from 'react'

import { dangKyNghe, soPhienBan } from './kho'

/**
 * Nghe kho, để màn hình vẽ lại sau mỗi lần ghi.
 *
 * Trả về SỐ PHIÊN BẢN chứ không trả về dữ liệu: dữ liệu là đối tượng sửa tại chỗ, nên so
 * sánh tham chiếu sẽ luôn thấy "không đổi" và React không vẽ lại. Một con số tăng dần thì
 * so sánh được, và màn hình gọi thẳng `duLieu()` sau đó để lấy bản mới nhất.
 *
 * Máy chủ trả 0 (dựng lần đầu), trình duyệt trả số thật — khớp nhau ở lần vẽ đầu tiên nên
 * không sinh cảnh báo lệch hydrat hoá.
 */
export function useKho(): number {
  return useSyncExternalStore(
    dangKyNghe,
    () => soPhienBan(),
    () => 0,
  )
}
