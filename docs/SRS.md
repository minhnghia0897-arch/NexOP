# SRS — OBLUE

## 1. Mục tiêu
Giáo viên ngoại ngữ freelance vận hành 3–6 lớp (15–60 học viên) với ≤ 1 giờ việc lặp mỗi tuần,
trong khi học viên nhận nhận xét theo đúng cách cô chấm và bài luyện đúng lỗ hổng của mình.

## 2. Vai trò (roles)
| Vai | Là ai | Vào bằng | Giao diện |
|---|---|---|---|
| `owner` | Giáo viên chủ tên miền | Email + OTP tại `oblue.vn` hoặc tên miền riêng | Rail đầy đủ |
| `assistant` | Trợ giảng cô mời, quyền theo lớp | Link mời → SĐT + OTP | Rail rút gọn + dải cam |
| `student` | Học viên, thành viên của ≥1 lớp | Link mời → SĐT + OTP | App tab đáy, 5 mục |
| `parent` | Phụ huynh, gắn với 1 học viên, cô bật | SĐT + OTP | Chỉ xem tiến bộ + việc + học phí |
| `system` | Máy (OCR, nháp, nhắc, tính toán) | — | Không có UI, chỉ sinh sự kiện `draft`/`propose`/`auto` |

Không có vai "admin nền tảng" nhìn nội dung bài; vận hành nền tảng chỉ thấy sự kiện hệ thống.

Có đúng một việc admin nền tảng làm: **khoá tên miền vi phạm** (và gỡ khoá). Tên miền mới **tự
duyệt** khi đăng ký — cô không phải chờ ai. Tầm nhìn của vai đó là danh sách `subdomain · chủ ·
trạng thái`, không hơn — không lớp, không đề, không bài nộp, không nhật ký lớp học.
Chốt 2026-09-07; xem `DECISIONS.md` và `LOGIC.md` §1.0.

## 3. Thực thể chính
Giáo viên → **Lớp** (gắn lộ trình) → Thành viên lớp (học viên/trợ giảng) · **Bài giao** (= Đề + Lớp + hạn + cách chấm) → **Bài nộp** (1/học viên) → Nhận xét + band.
Ngân hàng đề và Lộ trình thuộc giáo viên, không thuộc lớp. Hồ sơ năng lực thuộc học viên, xuyên lớp.

## 4. Use case & tiêu chí chấp nhận

### UC-01 Mở lớp từ lộ trình
Cô chọn lộ trình → lịch → sĩ số → mời học viên. **Chấp nhận:** lớp có đủ N buổi với đề đã gắn theo lộ trình; không phải soạn lại; ≤ 3 bước; ≤ 2 phút.

### UC-02 Thêm học viên / mời
Cô nhập tên + SĐT (tay hoặc dán từ Excel/Zalo). Mời sinh link `/m/<token>` 1 lần, 7 ngày, gắn SĐT. **Chấp nhận:** mở link thấy tên cô + tên lớp trước khi nhập gì; SĐT khác SĐT cô lưu → từ chối + cô nhận thông báo; SĐT đã có tài khoản ở tên miền khác → gắn, không tạo mới.

### UC-03 Số hóa đề (OCR)
Tải PDF/DOCX/ảnh ≤ 50MB → máy đọc, tách câu, nhận đáp án, đề xuất nhãn → cô duyệt. **Chấp nhận:** đề in máy 12 trang ≤ 60 giây; hiển thị % tin cậy và khoanh chỗ chữ mờ; câu không tìm thấy đáp án gắn cảnh báo và mặc định chấm tay; nguồn đáp án (trang) hiển thị được.

### UC-04 Soạn/sửa câu hỏi
Loại: trắc nghiệm, điền từ, T/F/NG, tự luận. Chèn ảnh/MP3/đoạn văn; đoạn văn dùng chung cho dải câu. Bấm lại đáp án đúng → bỏ chọn → chấm tay. **Chấp nhận:** một đề có thể trộn loại; lưu nháp tự động.

### UC-05 Giao bài cho lớp
Chọn đề (ngân hàng hoặc buổi trong lộ trình) → chọn lớp (1 hoặc nhiều → mỗi lớp 1 bài giao riêng) → hạn, cách chấm, trọng số, nhắc. **Chấp nhận:** chỉ thành viên lớp thấy đề; một đề không giao trùng cho cùng lớp (giao lại = "lần 2" có nhãn); đăng lên bảng tin lớp; nhắc trước hạn 24h/2h cho học viên có tài khoản.

### UC-06 Học viên nộp bài
Editor có đếm từ, đếm đoạn, đồng hồ, lưu mỗi 10 giây, checklist theo lỗi riêng của em. **Chấp nhận:** cho nộp dưới yêu cầu từ nhưng ghi rõ; sau nộp hiện "chuyện gì tiếp theo" 4 bước; học viên **không** thấy band nháp của máy.

### UC-07 Nháp chấm (máy)
Sau nộp ≤ 3 phút: band từng tiêu chí + lỗi đánh dấu + nhận xét theo giọng cô, dùng rubric cô + 3 bài trước + các cặp (nháp→cô sửa) của cô. **Chấp nhận:** kèm % tin cậy; gắn cờ nếu lệch > 1.0 so với bài trước hoặc tin cậy < 85%; trắc nghiệm tin cậy ≥ 97% tự chốt (nếu cô bật).

### UC-08 Cô duyệt / sửa / gửi
Thẻ bài: band có nút chỉnh, thanh tin cậy, lỗi gạch/sửa, rubric, nhận xét sửa tại chỗ, "Viết lại". **Chấp nhận:** học viên chỉ thấy khi cô bấm gửi; mọi chỉnh sửa của cô được lưu thành cặp học cho lần sau; "Duyệt tất cả" chỉ áp cho bài không gắn cờ.

### UC-09 Hậu kỳ (máy)
Sau gửi: cập nhật hồ sơ năng lực, ma trận điểm, lỗi lặp; lỗi ≥ 2 bài liên tiếp → sinh bài luyện 5 phút gắn nhận xét; thông báo học viên. **Chấp nhận:** bài luyện có giải thích nhắc đúng câu em viết sai; kết quả về hồ sơ.

### UC-10 Trang lớp
Tab: Bảng tin (mặc định) · Bài tập · Học viên · Điểm · Chấm bài. **Chấp nhận:** mọi tab xử lý trong phạm vi lớp, không điều hướng ra màn tổng; Chấm bài trong lớp duyệt xong thì ô ma trận Điểm cập nhật ngay; cột tên dính khi cuộn ngang.

### UC-11 Hồ sơ năng lực học viên
Band theo kỹ năng (trung bình có trọng số 4 bài gần nhất, mock nặng hơn), theo tiêu chí, lỗi lặp (đếm), đã dứt, xu hướng, thói quen nộp, độ tin cậy, ghi chú riêng của cô. **Chấp nhận:** một hồ sơ/học viên xuyên lớp; "Tiến độ" (học viên), "Cần chú ý", "Cả lớp sai chung" đều là góc nhìn của bảng này.

### UC-12 Học phí & giữ người
Mỗi sáng máy rà: sắp hết hạn → nháp tin theo tình trạng (tiến bộ / đang buông / vượt mục tiêu); đang buông → tin giữ người, **không** tin thu tiền. **Chấp nhận:** không tin nào gửi khi cô chưa duyệt; gửi trong khung 9:00–21:30; chưa trả lời sau 3 ngày mới nhắc lần 2.

### UC-13 Lên lớp / mở lớp mới
2 bài liên tiếp ≥ band mục tiêu → đề xuất lên lớp; gộp với tin gia hạn nếu trùng thời điểm; học phí còn lại chuyển sang, không thu lại. **Chấp nhận:** lớp mới ≥ N người mới mở (cô đặt N).

### UC-14 Trợ giảng
Cô mời + đặt quyền theo lớp và theo việc (Không / Chỉ xem / Đề xuất / Tự làm). **Chấp nhận:** trần cứng không cấp được: học phí, rubric, ghi chú riêng, xuất dữ liệu; đổi quyền có hiệu lực ngay không cần đăng nhập lại; "Đề xuất" của trợ giảng sinh sự kiện `draft`, không bao giờ `send`.

### UC-15 Bảng tin lớp
Cô đăng/ghim/xóa; học viên đăng/trả lời, không ghim/xóa; bài giao và nhắc hạn tự đăng. **Chấp nhận:** học viên chưa nộp thấy nhãn đỏ "Em chưa nộp" trên bài giao.

### UC-16 Luyện thêm (M1)
Gói theo lỗi (miễn phí, đi kèm học phí), gói luyện tháng, mock chấm tay. Doanh thu chia cho cô (30% / 80%). **Chấp nhận:** học viên thấy rõ tiền chia cho cô; cô thấy kết quả luyện thêm trong hồ sơ.

### UC-17 Nhật ký hành vi
Mọi hành vi = sự kiện: ai · làm gì · trên gì · lớp · lúc nào · ai thấy. **Chấp nhận:** cô thấy toàn bộ lớp mình; học viên thấy về chính mình; trợ giảng thấy việc mình làm; lọc theo người/loại/tiền.

### UC-18 Đăng nhập
Một ô SĐT, không chọn vai; vai tra từ `memberships`. SĐT có 2 tư cách cùng tên miền → hỏi 1 lần, nhớ. SĐT không ở lớp nào → không tạo tài khoản, chỉ "Đăng ký học thử" → chờ cô duyệt. **Chấp nhận:** chủ lớp đăng nhập bằng email; học viên bằng SĐT.

## 5. Yêu cầu phi chức năng
- Nháp chấm ≤ 3 phút; OCR 12 trang ≤ 60 s; màn lớp mở ≤ 1 s với 40 học viên × 30 bài.
- Chi phí AI ≤ 3.000đ/học viên/tháng: router theo bước (Haiku/Sonnet cho OCR, trắc nghiệm; Sonnet/Opus cho tự luận), prompt caching cho rubric + cặp học.
- Học viên trên điện thoại: mọi màn học viên dùng được ở 375px.
- Xuất toàn bộ dữ liệu của cô ra Excel/CSV bất cứ lúc nào (học viên thuộc về cô).

## 6. Không làm (v1)
- Không app mobile native; web responsive là đủ.
- Không chấm Speaking/phát âm (để "Thầy Sơn" sau).
- Không bảng xếp hạng học viên cho học viên xem.
- Không marketing chéo từ nền tảng tới học viên của cô.
- Không tự gửi bất kỳ tin nào dính tới học phí.
- Không "bản sao giáo viên" bán khóa (M3) trước khi có ≥ 200 giáo viên với hồ sơ năng lực sạch.
