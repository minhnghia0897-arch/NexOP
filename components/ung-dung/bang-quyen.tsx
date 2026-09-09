'use client'

/**
 * Ma trận quyền — sinh thẳng từ `docs/permissions.json`.
 *
 * Không gõ lại bảng ở đây. Bản mẫu viết tay 12 dòng HTML; gõ tay thì hôm nào cô đổi chính
 * sách, màn này vẫn hứa với người đọc đúng những thứ cũ — và đó là kiểu sai không ai phát
 * hiện ra, vì màn hình trông vẫn đúng.
 */
import { DEFAULTS, HARD_CEILING, ROLES, type Level } from '@/lib/auth/permissions'

const TEN_VAI: Record<string, { ten: string; phu: string }> = {
  owner: { ten: 'Giáo viên', phu: 'chủ lớp' },
  assistant: { ten: 'Trợ giảng', phu: 'được cô thêm' },
  student: { ten: 'Học viên', phu: 'thành viên lớp' },
  parent: { ten: 'Phụ huynh', phu: 'nếu cô bật' },
  system: { ten: 'Máy', phu: 'tự động' },
}

const TEN_MUC: Record<Level, string> = {
  full: 'Toàn quyền',
  own: 'Của mình',
  read: 'Chỉ xem',
  none: 'Không',
  propose: 'Đề xuất',
  auto: 'Tự làm',
}

const SAC_MUC: Record<Level, string> = {
  full: 'bg-st-green-soft text-st-green-deep',
  own: 'bg-st-blue-soft text-primary',
  read: 'bg-field text-text-2',
  none: 'bg-surface text-text-3 ring-1 ring-inset ring-border-light',
  propose: 'bg-st-orange-soft text-st-orange-deep',
  auto: 'bg-st-purple-soft text-st-purple-deep',
}

const TEN_OBJECT: Record<string, { ten: string; phu: string }> = {
  class: { ten: 'Lớp học', phu: 'tạo, sửa lịch, đóng lớp' },
  membership: { ten: 'Thành viên lớp', phu: 'thêm/bỏ học viên, mời trợ giảng' },
  profile: { ten: 'Hồ sơ học viên', phu: 'band, lỗi lặp, ghi chú của cô' },
  exam: { ten: 'Ngân hàng đề', phu: 'tạo, sửa, xoá, xem đáp án' },
  assignment: { ten: 'Bài giao', phu: 'giao đề cho lớp, đặt hạn, trọng số' },
  submission: { ten: 'Bài nộp', phu: 'nộp, xem bài của ai' },
  review: { ten: 'Nhận xét & band', phu: 'viết, gửi cho học viên' },
  draft: { ten: 'Nháp chấm của máy', phu: 'lớp 3 — có hạn, cô quyết' },
  proposal: { ten: 'Đề xuất', phu: 'tin gia hạn, mở lớp, lên lớp' },
  practice_set: { ten: 'Bài luyện', phu: 'sinh từ lỗi lặp, em làm' },
  gradebook: { ten: 'Bảng điểm lớp', phu: 'ma trận cả lớp' },
  attendance: { ten: 'Điểm danh', phu: 'buổi có mặt, vắng' },
  post: { ten: 'Bảng tin lớp', phu: 'đăng, ghim, xoá bài' },
  fee: { ten: 'Học phí', phu: 'gói, hạn, tin gia hạn' },
  rubric: { ten: 'Rubric & giọng chấm', phu: 'trọng số, cách nhận xét, luật của cô' },
  path: { ten: 'Lộ trình', phu: 'giáo án nhiều buổi, dùng lại cho lớp sau' },
  export: { ten: 'Xuất dữ liệu', phu: 'Excel/CSV toàn bộ' },
  events: { ten: 'Nhật ký hành vi', phu: 'ai làm gì, lúc nào' },
}

/** Ghi chú trong permissions.json, nếu có — chỗ chính sách cần một câu mới nói đủ. */
const GHI_CHU: Record<string, Record<string, string>> = {
  profile: {
    student: 'không thấy ghi chú của cô',
    parent: 'tiến bộ + việc, không điểm',
  },
  review: { student: 'chỉ khi cô đã gửi', system: 'nháp · tự chốt trắc nghiệm ≥97%' },
  draft: { student: 'không bao giờ thấy band máy đoán' },
  gradebook: { student: 'chỉ thấy cột của mình' },
  post: { student: 'đăng, không ghim/xoá' },
  attendance: { student: 'xem, không sửa' },
}

export function BangQuyen() {
  return (
    <div className="overflow-x-auto rounded-l border border-border-light bg-surface">
      <table className="w-full min-w-[860px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border-light bg-hover text-left">
            <th className="px-4 py-3 font-display text-[12px] font-bold text-text-2">Đối tượng</th>
            {ROLES.map((r) => (
              <th key={r} className="px-4 py-3 font-display text-[12px] font-bold text-text-2">
                {TEN_VAI[r]?.ten}
                <small className="block font-normal text-text-3">{TEN_VAI[r]?.phu}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(DEFAULTS).map(([type, hang]) => (
            <tr key={type} className="border-b border-border-light last:border-0">
              <td className="px-4 py-3 align-top">
                <b className="font-display font-semibold text-text">
                  {TEN_OBJECT[type]?.ten ?? type}
                </b>
                <small className="block text-[12px] text-text-2">{TEN_OBJECT[type]?.phu}</small>
              </td>
              {ROLES.map((r) => {
                // Trần cứng thắng mọi mức đã cấp — nói đúng cái can() làm ở cửa 5.
                const chan = r === 'assistant' && HARD_CEILING.has(type)
                const muc = hang[r]
                return (
                  <td key={r} className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex rounded-s px-2 py-0.5 font-display text-[11px] font-semibold leading-[18px] ${
                        chan ? 'bg-st-red-soft text-st-red' : SAC_MUC[muc]
                      }`}
                    >
                      {chan ? 'Trần cứng' : TEN_MUC[muc]}
                    </span>
                    {GHI_CHU[type]?.[r] && !chan ? (
                      <small className="mt-1 block text-[11px] leading-4 text-text-3">
                        {GHI_CHU[type]![r]}
                      </small>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
