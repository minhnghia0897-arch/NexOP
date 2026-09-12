'use client'

/**
 * Vận hành & cấu hình — `s-cfg` của bản mẫu, năm tab.
 *
 * Màn này không quản lý gì cả; nó TRẢ LỜI. Cô mua sản phẩm này vì "tối chủ nhật", nên câu
 * cô hỏi sau tuần đầu là: máy vừa tự làm gì sau lưng tôi, và tôi tắt được cái nào.
 *
 * Nhật ký ở đây là nhật ký SỐNG — mọi nút bấm ở màn khác rơi xuống thành một dòng tại đây.
 */
import { useState } from 'react'

import { DauMan, Wrap } from '@/components/ung-dung/khung'
import { BangQuyen } from '@/components/ung-dung/bang-quyen'
import { Khoi, KhoiTrong, Nhan, Nut } from '@/components/ung-dung/phan-tu'
import { DaiTab } from '@/components/ung-dung/tab-man'
import { useKho } from '@/lib/demo/dung-kho'
import { datLuatHanhVi } from '@/lib/demo/hanh-vi'
import { duLieu, nhatKy, vaiHienTai } from '@/lib/demo/kho'

/*
 * Tám bước của docs/OPERATIONS.md. `ai` quyết màu: xanh lá máy tự chạy, xanh dương cô
 * quyết, cam là dính tới tiền — và dính tiền thì luôn qua tay cô, không có ngoại lệ.
 */
const VONG = [
  { no: '1 · Đầu tuần', ai: 'co', ten: 'Giao bài từ lộ trình',
    y: 'Buổi trong lộ trình đã có đề gắn sẵn. Cô bấm "Giao", cả lớp nhận cùng lúc trên bảng tin.',
    nhan: 'Cô · 1 phút' },
  { no: '2 · Sau giao', ai: 'may', ten: 'Đăng bảng tin và đặt lịch nhắc',
    y: 'Nhắc trước hạn 24h và 2h, chỉ với em đã bật tài khoản. Em chưa có tài khoản thì cô vẫn nhắc tay.',
    nhan: 'Tự chạy' },
  { no: '3 · Khi em nộp', ai: 'may', ten: 'Nháp chấm theo rubric của cô',
    y: 'Đối chiếu 3 bài trước của chính em đó và rubric cô. Lệch hơn 1.0 band hoặc tin cậy dưới 85% thì gắn cờ.',
    nhan: 'Tự chạy · vài phút' },
  { no: '4 · Tối', ai: 'co', ten: 'Cô duyệt, sửa, gửi',
    y: 'Trắc nghiệm chốt cả lớp một lần; tự luận đọc từng bài. Mỗi lần cô sửa nháp, nháp sau giống cô hơn.',
    nhan: 'Cô · ~25 phút / 14 bài' },
  { no: '5 · Sau khi gửi', ai: 'may', ten: 'Lỗi lặp thành bài luyện 5 phút',
    y: 'Lỗi xuất hiện từ 2 bài liên tiếp thì sinh bài luyện gắn kèm nhận xét. Kết quả về hồ sơ của em.',
    nhan: 'Tự chạy' },
  { no: '6 · Trước buổi', ai: 'co', ten: 'Cả lớp sai chung ở đâu',
    y: 'Gộp lỗi của cả chồng bài thành 3–4 điểm dạy lại. Cô mở 5 phút trước giờ dạy.',
    nhan: 'Cô đọc' },
  { no: '7 · Mỗi sáng', ai: 'tien', ten: 'Rà học phí và em đang buông',
    y: 'Sắp hết hạn thì nháp tin theo tình trạng từng em. Em đang buông thì nháp tin giữ người, không phải tin đòi tiền. Cô duyệt mới gửi.',
    nhan: 'Tiền · cô quyết' },
  { no: '8 · Cuối chặng', ai: 'tien', ten: 'Lên lớp hoặc mở lớp mới',
    y: 'Hai bài liên tiếp đạt mục tiêu thì đề xuất lên lớp. Đủ người thì mở lớp mới từ lộ trình, không soạn lại.',
    nhan: 'Tiền · cô quyết' },
] as const

const NEN_BUOC = {
  may: 'border-st-green-line bg-callout-green',
  co: 'border-primary-selected-hover bg-st-blue-soft',
  tien: 'border-st-orange-line bg-callout-orange',
} as const

const LUAT_HE_THONG = [
  'Luật 1 · Lớp là ranh giới. Sự kiện luôn mang mã lớp. Em rời lớp là mất quyền thấy mọi thứ của lớp từ lúc đó, nhưng hồ sơ cá nhân vẫn đi theo em.',
  'Luật 2 · Máy không có hành vi "gửi". Máy chỉ nháp và đề xuất. Sự kiện gửi tới người thật chỉ do cô phát ra, nên nhật ký luôn truy được ai chịu trách nhiệm.',
  'Luật 3 · Ghi trước, làm sau. Sự kiện ghi xong mới cho hành vi chạy. Ghi thất bại thì hành vi không xảy ra. Điểm số chạm tới một đứa trẻ — phải truy ngược được.',
  'Luật 4 · Ai thấy nhật ký nào. Cô thấy toàn bộ của lớp mình. Em thấy dòng về chính em. Trợ giảng thấy việc mình làm. Nền tảng chỉ thấy sự kiện hệ thống, không đọc nội dung bài.',
]

/*
 * `ten` là bắt buộc, không phải tuỳ chọn.
 *
 * Trước đây `aria-label` chỉ ghi "đang bật" / "đang tắt", nên người dùng bàn phím hoặc trình
 * đọc màn hình đi qua năm công tắc và nghe đúng một câu năm lần — không biết công tắc nào là
 * "Nhắc nộp bài" và công tắc nào là "Gửi nhận xét tự luận không cần cô duyệt". Cái thứ hai
 * là thứ cô chủ ý để TẮT; bật nhầm nó thì máy gửi nhận xét mà cô chưa đọc.
 *
 * `aria-checked` đã nói bật hay tắt rồi, nên nhãn để dành cho việc nói nó là công tắc GÌ.
 */
function CongTac({
  ten,
  bat,
  khoa,
  doi,
}: {
  ten: string
  bat: boolean
  khoa?: boolean
  doi: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={bat}
      aria-label={ten}
      disabled={khoa}
      onClick={doi}
      className={`relative h-6 w-11 flex-none rounded-pill transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
        bat ? 'bg-primary' : 'bg-border'
      }`}
    >
      <i
        aria-hidden
        className={`absolute top-0.5 block h-5 w-5 rounded-full bg-surface transition-[left] ${
          bat ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function gio(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const MAU_VAI = {
  owner: 'green', assistant: 'orange', student: 'blue', system: 'purple', parent: 'blue',
} as const
const TEN_VAI = {
  owner: 'cô', assistant: 'trợ giảng', student: 'học viên', parent: 'phụ huynh', system: 'máy',
} as const

export default function CauHinh() {
  useKho()
  const [tab, datTab] = useState('vong')
  const [loi, datLoi] = useState<string | null>(null)
  const vai = vaiHienTai()
  const du = duLieu()

  const toi = du.vai[vai]
  const dong = nhatKy().filter((e) => e.visibility.includes(toi))

  const TABS = [
    { id: 'vong', ten: 'Vòng vận hành tuần' },
    { id: 'quyen', ten: 'Quyền' },
    { id: 'nhat-ky', ten: 'Nhật ký hành vi', dem: dong.length },
    { id: 'luat', ten: 'Luật của cô' },
    { id: 'tien', ten: 'Học phí & chia sẻ' },
  ]

  return (
    <>
      <DauMan
        ten="Vận hành & cấu hình"
        phu="Một tuần của lớp chạy qua 8 bước. Xanh lá là máy tự chạy, xanh dương là cô quyết, cam là dính tới tiền."
      />
      <DaiTab tabs={TABS} dang={tab} doi={datTab} />
      <Wrap>
        {tab === 'vong' ? (
          <>
            <ol className="grid gap-3 md:grid-cols-2">
              {VONG.map((b) => (
                <li key={b.no} className={`rounded-l border p-5 ${NEN_BUOC[b.ai]}`}>
                  <div className="font-display text-[12px] font-bold text-text-2">{b.no}</div>
                  <b className="mt-1 block font-display text-[15px] font-semibold text-text">
                    {b.ten}
                  </b>
                  <p className="mb-3 mt-1.5 text-[13px] leading-[20px] text-text-2">{b.y}</p>
                  <Nhan mau={b.ai === 'may' ? 'green' : b.ai === 'co' ? 'blue' : 'orange'}>
                    {b.nhan}
                  </Nhan>
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <Khoi
                ten="Tổng thời gian cô bỏ ra mỗi tuần"
                phu="Với 4 lớp, 58 học viên, một chồng bài viết và một bài trắc nghiệm."
              >
                {[
                  ['Giao bài và đọc lỗi chung của lớp', '≈ 10 phút', false],
                  ['Duyệt chấm', '≈ 25 phút', false],
                  ['Duyệt tin học phí và tin giữ người', '≈ 5 phút', false],
                  ['Trước khi có nền tảng — chấm tay, nhắc tay, đối soát tay', '≈ 7 giờ', true],
                ].map(([ten, so, do_]) => (
                  <div
                    key={ten as string}
                    className="flex items-center justify-between border-t border-border-light py-2.5 text-[13px] first:border-t-0 first:pt-0"
                  >
                    <span className="text-text-2">{ten as string}</span>
                    <b
                      className={`font-display font-semibold tabular-nums ${
                        do_ ? 'text-st-red' : 'text-text'
                      }`}
                    >
                      {so as string}
                    </b>
                  </div>
                ))}
              </Khoi>
            </div>
          </>
        ) : null}

        {tab === 'quyen' ? (
          <>
            <Khoi
              ten="Ai được làm gì"
              phu="Ba nguyên tắc: quyền đi theo lớp (ra khỏi lớp là hết quyền) · em chỉ thấy của mình · máy chỉ đề xuất, trừ việc cô đã bật cho tự làm. Bảng này sinh thẳng từ chính sách đang chạy, không phải ảnh chụp."
            >
              <BangQuyen />
            </Khoi>
            <div className="mt-5">
              <Khoi
                ten="Trợ giảng của cô"
                phu="Quyền cấp theo từng lớp và từng việc. Trợ giảng chỉ thấy lớp được thêm vào."
              >
                {du.taiKhoan
                  .filter((t) => t.id === du.vai.assistant)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center gap-3 border-t border-border-light py-3.5 first:border-t-0 first:pt-0"
                    >
                      <div className="min-w-0 flex-1">
                        <b className="block font-display font-semibold text-text">{t.ten}</b>
                        <small className="text-[13px] text-text-2">
                          {du.lop.find((l) => l.id === 'lop-65')?.ten} · nháp nhận xét, bảng tin,
                          điểm danh
                        </small>
                      </div>
                      <Nhan mau="green">Đang hoạt động</Nhan>
                    </div>
                  ))}
                <div className="flex flex-wrap items-center gap-3 border-t border-border-light py-3.5">
                  <div className="min-w-0 flex-1">
                    <b className="block font-display font-semibold text-text">Mời trợ giảng</b>
                    <small className="text-[13px] text-text-2">
                      Gửi link qua Zalo · đăng nhập bằng số điện thoại · quyền mặc định: chỉ xem
                    </small>
                  </div>
                  <Nut disabled>Mời</Nut>
                </div>
              </Khoi>
            </div>
          </>
        ) : null}

        {tab === 'nhat-ky' ? (
          <>
            <Khoi
              ten="Một hành vi đi qua hệ thống như thế nào"
              phu="Mọi hành vi là một sự kiện: ai · làm gì · trên gì · thuộc lớp nào · lúc nào. Sự kiện sinh ra việc tiếp theo; không ai gọi thẳng ai."
            >
              <div className="grid gap-2.5">
                {LUAT_HE_THONG.map((l) => (
                  <p
                    key={l}
                    className="rounded-m border border-border-light bg-hover px-3.5 py-2.5 text-[13px] leading-[20px] text-text-2"
                  >
                    <b className="font-display font-semibold text-text">{l.split('.')[0]}.</b>
                    {l.slice(l.indexOf('.') + 1)}
                  </p>
                ))}
              </div>
            </Khoi>
            <div className="mt-5">
              <Khoi
                ten={`Nhật ký · ${dong.length} dòng ${vai === 'student' ? 'em' : vai === 'assistant' ? 'trợ giảng' : 'cô'} thấy được`}
                phu="Lọc theo người được nhìn thấy, tính đúng lúc ghi. Đổi vai ở góc trên là danh sách ngắn lại ngay — đó là cửa chặn thật, không phải bộ lọc trang trí."
              >
                {dong.length === 0 ? (
                  <KhoiTrong>
                    Chưa có dòng nào. Thử gửi một nhận xét ở màn Chấm bài, hoặc bật/tắt một luật
                    ở tab bên cạnh.
                  </KhoiTrong>
                ) : (
                  <ol>
                    {dong.map((e) => (
                      <li
                        key={e.id}
                        className="flex flex-wrap items-center gap-3 border-t border-border-light py-3 first:border-t-0 first:pt-0"
                      >
                        <span className="w-[46px] flex-none font-display text-[12px] tabular-nums text-text-3">
                          {gio(e.luc)}
                        </span>
                        <code className="font-display text-[13px] font-semibold text-text">
                          {e.action}
                        </code>
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
              </Khoi>
            </div>
          </>
        ) : null}

        {tab === 'luat' ? (
          <>
            {loi ? (
              <div className="mb-4 rounded-m border border-st-orange-line bg-callout-orange px-3.5 py-2.5 text-[13px] text-text-2">
                {loi}
              </div>
            ) : null}
            <Khoi
              ten="Máy được làm gì mà không hỏi"
              phu="Tắt là máy dừng, việc đó về tay cô. Mỗi lần bật/tắt ghi một dòng nhật ký — xem tab bên cạnh."
            >
              {du.luat
                .filter((l) => !l.khoa)
                .map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-4 border-t border-border-light py-3.5 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0 flex-1">
                      <b className="block font-display font-semibold text-text">{l.ten}</b>
                      <small className="text-[13px] leading-[19px] text-text-2">{l.phu}</small>
                    </div>
                    <CongTac
                      ten={l.ten}
                      bat={l.bat}
                      doi={() => datLoi(datLuatHanhVi(l.id, !l.bat).loi ?? null)}
                    />
                  </div>
                ))}
            </Khoi>
            <div className="mt-5">
              <Khoi
                ten="Không bao giờ"
                phu="Không có công tắc — đây là luật của nền tảng, không phải lựa chọn của cô."
              >
                {du.luat
                  .filter((l) => l.khoa)
                  .map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-4 border-t border-border-light py-3.5 first:border-t-0 first:pt-0"
                    >
                      <div className="min-w-0 flex-1">
                        <b className="block font-display font-semibold text-text">{l.ten}</b>
                        <small className="text-[13px] leading-[19px] text-text-2">{l.phu}</small>
                      </div>
                      <CongTac ten={l.ten} bat={l.bat} khoa doi={() => undefined} />
                    </div>
                  ))}
              </Khoi>
            </div>
          </>
        ) : null}

        {tab === 'tien' ? (
          <>
            <Khoi ten="Cách thu học phí" phu="Hai đường, cô chọn theo từng em.">
              {[
                ['Thu qua nền tảng', 'Em có tài khoản trả trong app · nhắc hạn tự động · đối soát sẵn', 'green',
                  du.hoSo.filter((h) => h.coTaiKhoan).length],
                ['Chuyển khoản tay', 'Cô tự đối soát, ghi tay vào hồ sơ', 'orange',
                  du.hoSo.filter((h) => !h.coTaiKhoan).length],
              ].map(([ten, phu, mau, so]) => (
                <div
                  key={ten as string}
                  className="flex items-center gap-4 border-t border-border-light py-3.5 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <b className="block font-display font-semibold text-text">{ten as string}</b>
                    <small className="text-[13px] leading-[19px] text-text-2">{phu as string}</small>
                  </div>
                  <Nhan mau={mau as 'green' | 'orange'}>{so as number} học viên</Nhan>
                </div>
              ))}
            </Khoi>
            <div className="mt-5">
              <Khoi
                ten="Học viên thuộc về cô"
                phu="Không phải một khẩu hiệu — nó là ràng buộc trong permissions.json, và cô kiểm được ở tab Quyền."
              >
                <div className="flex flex-wrap gap-2">
                  <Nhan mau="green">Xuất toàn bộ dữ liệu bất cứ lúc nào</Nhan>
                  <Nhan mau="green">Không marketing chéo tới học viên của cô</Nhan>
                  <Nhan mau="green">Nền tảng không đọc nội dung bài</Nhan>
                </div>
              </Khoi>
            </div>
          </>
        ) : null}
      </Wrap>
    </>
  )
}
