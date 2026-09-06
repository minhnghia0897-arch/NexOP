# OPERATIONS — vòng vận hành tuần của một lớp

Ba màu = ba loại việc. Cùng màu với UI (Cấu hình → Vòng vận hành tuần).
- 🟢 Máy tự chạy, ghi nhật ký, có công tắc tắt
- 🔵 Cô quyết
- 🟠 Dính tới tiền — luôn qua tay cô, không có công tắc

| # | Khi | Việc | Ai | Sự kiện sinh ra | Đầu vào | Đầu ra |
|---|---|---|---|---|---|---|
| 1 | Đầu tuần | Giao bài từ lộ trình | 🔵 Cô (1 phút) | `assignment.create` | buổi trong lộ trình (đề gắn sẵn) | bài giao cho lớp |
| 2 | Sau giao | Đăng bảng tin + đặt lịch nhắc 24h/2h | 🟢 Máy | `post.auto`, `reminder.auto` | bài giao | học viên có tài khoản được nhắc; chưa có → cô nhắc tay |
| 3 | Học viên nộp | Nháp chấm theo rubric cô + 3 bài trước + cặp cô sửa | 🟢 Máy (≤3 phút) | `draft.create` | submission | draft có band/tiêu chí, lỗi, nhận xét, tin cậy, cờ |
| 4 | Tối | Duyệt / sửa / gửi. Trắc nghiệm chốt cả lớp; tự luận từng bài | 🔵 Cô (~25 phút/14 bài) | `review.send`, `teacher_edit.create` | drafts | review (lớp 1); cặp học cho lần sau |
| 5 | Sau gửi | Cập nhật hồ sơ, ma trận điểm; lỗi lặp ≥2 → bài luyện; thông báo em | 🟢 Máy | `profile.auto`, `practice.propose` | reviews | profiles, practice_sets |
| 6 | Trước buổi | Đọc "Cả lớp sai chung ở đâu" | 🔵 Cô (5 phút) | `view` | profiles của lớp | 3–4 điểm dạy lại |
| 7 | Mỗi sáng 7:00 | Rà học phí & học viên rời: nháp tin theo tình trạng; đang buông → tin giữ người | 🟠 Máy nháp, cô gửi | `proposal.create` → `message.send` | fees, profiles, attendance | tin gửi 9:00 sau khi cô duyệt |
| 8 | Cuối chặng | Đủ điều kiện → đề xuất lên lớp; đủ N → mở lớp mới từ lộ trình | 🟠 Máy đề xuất, cô quyết | `proposal.create` → `class.create` | profiles, capacity | lớp mới, học phí chuyển |

Thời gian cô bỏ ra với 4 lớp/58 học viên: ≈ 40 phút/tuần (trước: ≈ 7 giờ).

## Công tắc mặc định (Cấu hình → Luật của cô)
| Việc | Mặc định | Ghi chú |
|---|---|---|
| Nhắc nộp bài, nhắc lịch | Bật | chỉ học viên có tài khoản · 9:00–21:30 |
| Chốt trắc nghiệm tin cậy ≥97% | Bật | câu chữ mờ vẫn hỏi cô |
| Sinh bài luyện khi lỗi lặp ≥2 | Bật | gắn kèm nhận xét cô đã duyệt |
| Gửi nhận xét tự luận không cần duyệt | Tắt | khuyến nghị giữ tắt |
| Nhắn phụ huynh | Tắt | bật theo từng học viên; gửi tiến bộ + việc, không gửi điểm |

## Không bao giờ (không có công tắc)
- Gửi tin dính tới học phí khi cô chưa duyệt
- So sánh học viên này với học viên khác cho học viên xem
- Đọc Zalo cá nhân của cô
- Marketing chéo tới học viên của cô; chặn xuất dữ liệu

## Lộ trình 6 bước của một lớp (thanh "Thiết lập lớp học")
1 Chấm qua nền tảng → 2 Hồ sơ học viên → 3 Rubric của cô → **4 Tài khoản học viên** → 5 Học phí qua nền tảng → 6 Lớp thứ 5 từ lộ trình.
Bước 4 là điểm không quay lại; KPI onboarding = % lớp qua bước 4 trong 90 ngày.
