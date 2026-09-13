'use client'

/**
 * "Cùng một bài nộp — mỗi vai thấy gì" — khối `#k5` của bản mẫu.
 *
 * Bản mẫu nói đúng việc của nó: **"Đây là cách kiểm tra quyền nhanh nhất: không đọc ma trận,
 * nhìn thẳng đối tượng."**
 *
 * Nên nó phải HỎI `can()` cho từng trường, không phải mang một danh sách "vai này ẩn trường
 * kia". Bản mẫu cắm sẵn danh sách ẩn (`RV = {ta:{hide:[...]}, s:{hide:[...]}}`) — với một bản
 * vẽ thì đủ, nhưng ở bản chạy thật thì một danh sách cắm sẵn là bản sao THỨ HAI của chính
 * sách: hôm nào ma trận đổi, khối "kiểm tra quyền" vẫn vẽ theo bản cũ và nói ngược với sự
 * thật. Cái khối đáng tin nhất trên màn thành cái khối sai.
 */
import { useState } from 'react'

import { can, type Actor } from '@/lib/auth/can'
import type { VaiDemo } from '@/lib/demo/du-lieu'

import { Khoi, Nhan, Pill } from './phan-tu'

/** Một trường của bài nộp, kèm câu hỏi quyền đúng cho nó. */
interface Truong {
  nhan: string
  gia: string
  object: string
  /** `true` = trường này nói VỀ em, nên mức `own` mở nó cho chính em. */
  cuaEm?: boolean
}

const TRUONG: Truong[] = [
  { nhan: 'Bài viết', gia: '268 từ · nộp 22:41', object: 'submission', cuaEm: true },
  { nhan: 'Nháp chấm của máy', gia: '5.5 · tin cậy 91% · 4 lỗi đánh dấu', object: 'draft' },
  { nhan: 'Band cô chốt', gia: 'chưa chốt', object: 'review', cuaEm: true },
  { nhan: 'Nhận xét gửi học viên', gia: 'chưa gửi', object: 'review', cuaEm: true },
  { nhan: 'Lịch sử lỗi 3 bài trước', gia: 'am believing ×3 · chủ–vị ×2', object: 'profile', cuaEm: true },
  { nhan: 'Ghi chú riêng của cô', gia: '"Bố mẹ muốn thi tháng 12 — hơi vội"', object: 'teacher_notes', cuaEm: true },
  { nhan: 'So với lớp', gia: 'TB lớp 6.0 · em xếp 12/18', object: 'gradebook' },
  { nhan: 'Học phí', gia: 'đến 30/9 · qua nền tảng', object: 'fee', cuaEm: true },
]

const VAI: { id: string; ten: string; vai: VaiDemo | 'parent'; laChu: boolean }[] = [
  { id: 't', ten: 'Cô Thảo', vai: 'owner', laChu: false },
  { id: 'ta', ten: 'Trợ giảng', vai: 'assistant', laChu: false },
  { id: 's', ten: 'Minh Anh (chủ bài)', vai: 'student', laChu: true },
  { id: 's2', ten: 'Thu Hà (bạn cùng lớp)', vai: 'student', laChu: false },
  { id: 'p', ten: 'Phụ huynh Minh Anh', vai: 'parent', laChu: true },
]

const CHU_BAI = 'hv-01'
const LOP = 'lop-65'

export function MotBaiNop({ tenantId }: { tenantId: string }) {
  const [dang, datDang] = useState('t')
  const v = VAI.find((x) => x.id === dang) ?? VAI[0]!

  const actor: Actor = {
    // Bạn cùng lớp và chủ bài cùng vai `student`; khác nhau ở chỗ ai là chủ.
    accountId: v.laChu ? CHU_BAI : `khac-${v.id}`,
    tenantId,
    role: v.vai,
    classIds: [LOP],
  }

  const thay = TRUONG.map((t) => ({
    ...t,
    duoc: can(actor, `${t.object}.view`, {
      type: t.object,
      tenantId,
      classId: LOP,
      // Trường nói VỀ em thì chủ là em; trường về cả lớp thì không có chủ nào.
      ...(t.cuaEm ? { ownerId: CHU_BAI } : {}),
    }),
  }))

  const soThay = thay.filter((t) => t.duoc).length

  return (
    <Khoi
      ten="Cùng một bài nộp — mỗi vai thấy gì"
      phu="Bấm vai để đổi góc nhìn. Đây là cách kiểm tra quyền nhanh nhất: không đọc ma trận, nhìn thẳng đối tượng. Mỗi dòng dưới đây là một câu hỏi can() thật, không phải danh sách cắm sẵn."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {VAI.map((x) => (
          <Pill key={x.id} on={dang === x.id} onClick={() => datDang(x.id)}>
            {x.ten}
          </Pill>
        ))}
      </div>

      <div className="rounded-l border border-border-light bg-surface-2 px-4 py-3">
        <h4 className="mb-2.5 font-display text-[13px] font-semibold text-text">
          Bài nộp · Task 2 — Education · Nguyễn Minh Anh · lớp IELTS 6.5
        </h4>

        {thay.map((t) => (
          <div
            key={t.nhan}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-light py-2 text-[13px] first:border-t-0 first:pt-0"
          >
            <span className="min-w-[168px] flex-none text-text-2">{t.nhan}</span>
            {t.duoc ? (
              <b className="min-w-0 flex-1 font-display font-semibold text-text">{t.gia}</b>
            ) : (
              <span className="min-w-0 flex-1 text-text-3">không thấy trường này</span>
            )}
            <code className="flex-none rounded-s bg-field px-1.5 py-0.5 text-[11px] text-text-3">
              {t.object}.view
            </code>
          </div>
        ))}
      </div>

      <p className="mt-3.5 text-[13px] leading-[21px] text-text-2">
        {v.ten} thấy <b>{soThay}/{TRUONG.length}</b> trường.{' '}
        {dang === 's2' ? (
          <>
            Bạn cùng lớp không thấy gì của bài này — chỉ thấy bài đăng chung trên bảng tin.
          </>
        ) : dang === 'ta' ? (
          <>
            Ghi chú riêng của cô là <b>trần cứng</b>: cô cấp quyền gì cũng không mở được, vì
            `can()` chặn ở cửa 5 trước khi xét tới mức quyền.
          </>
        ) : dang === 'p' ? (
          <>
            Phụ huynh thấy tiến bộ và học phí — không thấy nhận xét có band.{' '}
            <b>Chỗ này cố ý khác bản mẫu:</b> bản mẫu cho phụ huynh đọc &ldquo;Nhận xét gửi học
            viên&rdquo;, nhưng `review.parent` là `none` và `OPERATIONS` ghi &ldquo;gửi tiến bộ
            và việc cụ thể, không gửi điểm&rdquo; — nhận xét thì mang band. Hai nguồn thắng
            một, và đây là dữ liệu của một đứa trẻ nên chọn bên kín hơn.
          </>
        ) : dang === 's' ? (
          <>
            Em thấy bài của chính em và nhận xét cô đã gửi — không thấy nháp của máy, không
            thấy mình xếp thứ mấy trong lớp.
          </>
        ) : (
          <>Cô thấy tất cả — trong lớp của cô.</>
        )}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Nhan mau="green">Thấy: {soThay}</Nhan>
        <Nhan mau="orange">Không thấy: {TRUONG.length - soThay}</Nhan>
      </div>
    </Khoi>
  )
}
