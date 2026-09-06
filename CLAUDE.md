# OBLUE — nền tảng lớp học cho giáo viên ngoại ngữ

## Đây là gì
Mỗi giáo viên có tên miền riêng (`cothao.oblue.vn`). Trên đó cô mở lớp, thêm học viên,
số hóa đề (OCR), giao bài cho lớp, duyệt nhận xét do máy nháp, theo dõi tiến độ, thu học phí.
Học viên dùng app riêng (tab đáy) trên cùng tên miền. Trợ giảng là vai riêng, quyền do cô cấp.

Khách hàng: giáo viên freelance **đã có lớp** (≥20 học viên), thiếu thời gian — không phải giáo viên mới.
Giá trị bán: "tối chủ nhật" (chấm) và "lớp thứ 3 không kiệt sức" (mở lớp từ lộ trình).

## Ba câu phải nhớ
1. **Lớp học là trung tâm của mọi sự kiện.** Học viên gắn vào lớp. Đề thuộc ngân hàng của cô, chỉ khi *giao* mới gắn vào lớp. Quyền đi theo lớp.
2. **Máy chỉ nháp và đề xuất. Cô mới gửi.** Không có API nào cho máy sinh sự kiện "gửi cho học viên" hoặc "gửi tin học phí".
3. **Dữ liệu 3 lớp:** sự thật (chỉ thêm) → suy luận (AI ghi, tính lại được) → đề xuất (có hạn, cô quyết). AI chạm lớp 2–3, không bao giờ ghi lớp 1.

## Stack (không đổi nếu không hỏi)
Next.js 15 App Router · Supabase (Postgres + Auth + Storage + RLS) · Vercel
Tailwind · Claude API qua `/lib/ai/*` (model name là biến cấu hình, không hard-code)
OTP qua Zalo/SMS · Multi-tenant theo subdomain

## Luật cứng
- Mọi query DB lọc theo `tenant_id`; bảng theo lớp lọc thêm `class_id`. RLS bật cho mọi bảng.
- Mọi API kiểm tra quyền qua **một** hàm `can(actor, action, object)` — không API nào tự kiểm tra riêng.
- Mọi hành vi ghi vào `events` **trước** khi có hiệu lực. Ghi thất bại → hành vi không xảy ra.
- Không gọi LLM ở client. Chỉ qua `/api/ai/*`. Đầu ra LLM luôn là JSON có schema, validate trước khi dùng.
- Học viên chỉ thấy dữ liệu của mình. Không có màn nào so sánh học viên này với học viên khác cho học viên xem.
- Tiếng Việt có dấu toàn bộ UI. Tên biến/bảng tiếng Anh.
- Font: Be Vietnam Pro (tiêu đề, nút, nhãn, số) + Inter (nội dung, bảng). line-height ≥ 1.5.

## Cách chạy
`pnpm dev` · `pnpm test` · `pnpm db:migrate` · `pnpm lint`
Trước khi báo xong: `pnpm test` xanh + `pnpm lint` sạch + không có hex màu ngoài `design/tokens.css`.

## Đọc thêm khi cần
- `docs/SRS.md` — vai trò, use case, tiêu chí chấp nhận, không-làm. **Đọc trước khi làm feature mới.**
- `docs/ARCHITECTURE.md` — thực thể, 3 lớp dữ liệu, sự kiện, quyền, đăng nhập, điểm tích hợp AI. **Đọc trước khi thêm bảng/API.**
- `docs/DECISIONS.md` — vì sao chọn cách này. **Đọc trước khi định đổi cách làm.**
- `design/DESIGN.md` — token, bố cục, thành phần. `design/_reference/*.html` là bản mẫu đã duyệt.
- `docs/OPERATIONS.md` — vòng vận hành tuần, việc máy tự làm / cô quyết / dính tiền.
