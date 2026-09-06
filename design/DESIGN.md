# DESIGN — OBLUE

Bản mẫu đã duyệt: `design/_reference/oblue-platform-demo.html` (giáo viên + trợ giảng),
`oblue-student-demo.html` (học viên), `oblue-auth-demo.html` (đăng nhập). Khi mâu thuẫn với file này, **bản mẫu thắng**.
`design/tokens.css` sinh từ `:root` của bản mẫu — không viết hex ngoài file đó.

## Chữ
- `Be Vietnam Pro` 500/600/700: h1–h5, nút, tab, pill, nhãn, tag, số hiển thị (KPI, band, điểm) — bật `tabular-nums`.
- `Inter` 400/500/600: thân bài, bảng, textarea, dòng phụ.
- Body 14/21. Dòng phụ 13/19. Không weight <400 dưới 13px. line-height ≥1.5 cho tiếng Việt.

## Màu (từ tokens)
Nền trắng; canvas có 2 radial lavender rất nhạt. Text `#323338`, phụ `#676879`, mờ `#9699a6`.
Primary `#0073ea`. Trạng thái: green `#00c875` (xong/tự chạy), orange `#fdab3d` (cần chú ý), red `#e2445c` (quá hạn/tụt), purple `#a25ddc` (máy nháp/AI), blue `#579bfc` (đề xuất/xem lại).
Màu chỉ mang nghĩa trạng thái — KPI là số trần, không tô nền màu.

## Bố cục
Topbar 56 · rail 104 (icon + nhãn) · panel 260 (danh sách lớp = bộ lọc chung) · canvas (max 1180).
Học viên: không panel; <768px rail thành tab đáy 60px.
Trang lớp: breadcrumb + 5 tab (Bảng tin mặc định · Bài tập · Học viên · Điểm · Chấm bài) — mọi tab trong phạm vi lớp.

## Thành phần
- `paper` — thẻ bài chấm: header (avatar, tên, meta, band có ▲▼, thanh tin cậy) · body 2 cột (lỗi gạch/sửa | rubric + nhận xét) · footer (cảnh báo, Viết lại, Gửi).
- `tbl` — bảng nhẹ, header xám; `matrix` — ma trận điểm, cột tên dính, ô có trạng thái (chưa nộp/nộp muộn).
- `drawer` — ngăn kéo phải 520px, tối đa 3 `step`, một nút xác nhận. Dùng cho mọi tác vụ; không mở màn mới.
- `modal` — chỉ cho wizard tạo đề 4 bước.
- `steer` — ô nhập viền gradient cyan→tím: chỉ cho "đăng bài" và "chỉnh cách máy làm". Không dùng ở chỗ khác.
- `tag` — nhãn nền nhạt chữ đậm; `pm` — mức quyền (full/own/read/none/propose/auto).
- `tabanner` — dải cam khi đang ở vai trợ giảng.

## Copy
- Mọi màn nói với cô/em bằng ngôi "cô–em"; máy không tự xưng "AI".
- Mỗi việc máy làm có một dòng "vì sao" hoặc "chuyện gì tiếp theo".
- Nút nói đúng việc: "Gửi nhận xét", "Giao cho 18 em", "Gửi 9:00". Ở vai trợ giảng, nút gửi thành "Gửi nhận xét cho cô duyệt".
- Dữ liệu mẫu phải thật: tên Việt, band hợp lý, lỗi cụ thể. Không "abc", "Test1", "0%".

## Anti-pattern
Gradient trên work surface (trừ `steer`) · badge nhỏ trong ô trắng thay cho trạng thái · emoji làm định danh dữ liệu · Poppins/Figtree · số KPI tô nền màu · màn mới cho tác vụ đơn.
