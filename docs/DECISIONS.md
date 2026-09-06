# DECISIONS — vì sao chọn cách này

Mỗi mục 5 dòng. Muốn đổi thì thêm mục mới ghi lý do đổi, không xóa mục cũ.

### 2026-09 · Lớp học là đơn vị trung tâm (kiểu Google Classroom)
Lý do: giáo viên nghĩ theo lớp; quyền, bài giao, bảng tin, điểm đều tự nhiên theo lớp; chặn rò dữ liệu giữa lớp.
Đánh đổi: học viên học 2 lớp có 2 thành viên; cần hồ sơ năng lực xuyên lớp riêng.
Không đổi trừ khi: chuyển sang mô hình 1-kèm-1 hoàn toàn.

### 2026-09 · Hồ sơ năng lực xuyên lớp, tách khỏi lớp
Lý do: đây là tài sản không mang đi được và là nguyên liệu cho đề xuất; Classroom không có → khác biệt.
Đánh đổi: thêm một bảng và một job tính lại.

### 2026-09 · Đề thuộc ngân hàng của cô, không thuộc lớp
Lý do: lớp đóng thì đề còn; mở lớp mới từ lộ trình là đề theo về; không nhân bản đề.
Đánh đổi: phải có bảng `assignments` trung gian; giao trùng phải chặn.

### 2026-09 · Máy chỉ nháp/đề xuất; "gửi" chỉ do cô
Lý do: điểm số và tiền ảnh hưởng tới người thật; trách nhiệm phải truy được về một người; giáo viên tin hệ thống hơn khi luôn là người bấm.
Đánh đổi: cô phải bấm nhiều; giảm bằng "Duyệt tất cả" cho bài không gắn cờ và công tắc "Tự làm" theo việc.

### 2026-09 · Học viên không thấy band nháp của máy
Lý do: nếu máy nói 5.5 rồi cô sửa 5.0, học viên tin máy hơn tin cô → rubric cá nhân mất giá.
Đánh đổi: học viên chờ cô lâu hơn vài giờ; bù bằng màn "chuyện gì tiếp theo" + bài luyện trong lúc chờ.

### 2026-09 · Rubric cá nhân = ngữ cảnh (cặp nháp→cô sửa), không phải model riêng
Lý do: rẻ, đổi model không mất; 20–50 cặp gần nhất + prompt caching là đủ để nháp giống cô.
Đánh đổi: giọng cô chỉ "giống", không "là"; chấp nhận ở v1.

### 2026-09 · Dữ liệu 3 lớp; AI không ghi lớp 1
Lý do: AI sai thì tính lại được; đổi model không đụng sự thật; audit đơn giản.
Đánh đổi: có dữ liệu trùng (drafts vs reviews); chấp nhận.

### 2026-09 · Sự kiện ghi trước khi hiệu lực
Lý do: điểm ảnh hưởng tới một đứa trẻ — phải truy ngược được; queue chạy từ sự kiện nên không cần gọi chéo.
Đánh đổi: mỗi mutation tốn thêm một insert; chấp nhận.

### 2026-09 · Một hàm `can()` cho toàn bộ quyền
Lý do: mọi màn/tab/API dùng cùng ma trận; sửa một chỗ; test được bằng bảng.
Đánh đổi: hàm phải rất nhanh (cache memberships trong session).

### 2026-09 · Không chọn vai khi đăng nhập; vai đến từ lời mời
Lý do: tránh nhầm học viên/trợ giảng/giáo viên trên cùng tên miền; chặn người lạ tự thêm mình vào lớp.
Đánh đổi: giáo viên phải nhập SĐT học viên trước; bù bằng nhập từ Excel/Zalo.

### 2026-09 · Chủ lớp đăng nhập bằng email, học viên bằng SĐT
Lý do: hai cửa khác nhau để không ai gõ nhầm; SĐT gắn Zalo là kênh học viên VN dùng thật.

### 2026-09 · Tính phí theo học viên hoạt động, không theo ghế giáo viên
Lý do: tự lọc giáo viên đã có lớp; doanh thu tỉ lệ với giá trị; mở đường mô hình M1 (thu theo học viên) và luyện thêm chia sẻ doanh thu.
Đánh đổi: giáo viên nhỏ dùng miễn phí mãi — chấp nhận, chi phí gần 0.

### 2026-09 · "Học viên thuộc về cô" là luật nền tảng
Lý do: nỗi sợ lớn nhất của giáo viên là mất học viên vào tay nền tảng; viết thành luật + cho xuất dữ liệu bất cứ lúc nào thì họ mới dám đầu tư sâu (tầng 2–4).
Đánh đổi: nền tảng không marketing chéo; doanh thu học viên chỉ đi qua cô.

### 2026-09 · Be Vietnam Pro + Inter; token từ monday work-surface
Lý do: dấu tiếng Việt đúng; Inter sắc ở 12–14px và số thẳng cột; ngôn ngữ thị giác monday đã duyệt tháng 8.
Đánh đổi: bỏ Figtree/Poppins (Poppins không có bộ tiếng Việt).
