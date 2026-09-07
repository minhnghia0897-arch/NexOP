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

### 2026-09 · Bài đã giao là ảnh chụp câu hỏi, lan truyền chỉ khi chưa ai nộp
Lý do: `ARCHITECTURE` §2 ban đầu để `assignments.exam_id` là liên kết sống — cô sửa đề lúc lớp
đang làm là đổi câu hỏi dưới chân em. Bản OBLUE đang chạy đông cứng đề khi giao, và đã trả giá
bằng nửa còn lại: cô thêm đoạn văn đọc hiểu, lưu, học viên không thấy — vì đang đọc ảnh chụp cũ.
Cô không nghĩ mình sửa "bản gốc"; cô nghĩ mình sửa "cái đề".
Đánh đổi: câu hỏi lưu hai nơi (ngân hàng và bài giao), tốn chỗ và phải giữ đồng bộ có kiểm soát.
Khác bản cũ: bản cũ lan truyền xuống mọi bài giao khớp đề. Ở đây chỉ lan xuống bài **chưa ai nộp** —
lan xuống bài đã có người nộp là đổi đề sau lưng người đã làm xong, điểm tính trên một bộ câu hỏi
không còn tồn tại. Bài đã có người nộp thì giữ nguyên và báo cô, để cô quyết giao lại thành lần 2.

### 2026-09 · Giới hạn tần suất đếm trong CSDL, không đếm ở trình duyệt
Lý do: không có mật khẩu, nên OTP 6 chữ số là toàn bộ cánh cửa. `otp.ts` khai báo tối đa 5 lần thử
nhưng không chỗ nào ép — hằng số không có răng. Bản đang chạy đếm trong CSDL đúng vì lý do này:
đếm ở trình duyệt thì mở nhiều tab là lách được. Bản cũ vẫn đếm lần đăng nhập trong sessionStorage
và tự nhận đó là chỗ yếu.
Đánh đổi: mỗi lần thử tốn một lượt ghi; chấp nhận, vì đây là cửa vào.

### 2026-09-07 · Tên miền mới phải qua admin duyệt, và chưa duyệt thì chặn ở CSDL
Lý do: `SRS` §2 bỏ vai admin nền tảng **nhìn nội dung bài học** — đúng, và giữ nguyên. Nhưng bỏ
người *duyệt tên miền* thì ai gõ subdomain nào cũng có một trường học chạy thật. Bản OBLUE đang
chạy có `super_admin` duyệt trung tâm mới; giữ lại phần đó, cắt hết phần còn lại.
Vai `admin` vì thế hẹp một cách có cấu trúc, không phải bằng thiện chí: nó không có mức nào trong
`permissions.json` và không nên có — `can()` trả lời "thành viên của tên miền này được làm gì bên
trong nó", còn admin không phải thành viên của tên miền nào. Mọi chính sách đọc nội dung đều đi qua
`memberships` hoặc `owner_account_id`, nên admin đọc rỗng kể cả khi tự cấp quyền admin cho mình.
Chặn ở CSDL chứ không ở giao diện, vì vết sẹo số 3 của bản đang chạy: *"Tài khoản chờ duyệt phải bị
đăng xuất ngay, không chỉ ẩn giao diện."* Ẩn ở giao diện là vẫn còn khoá vào dữ liệu. Hai cửa:
đọc — bốn hàm trợ giúp RLS đòi `tenants.status = 'active'`; ghi — `app.record_event` từ chối ghi cho
tên miền chưa duyệt, mà không ghi được thì theo luật cứng, hành vi không xảy ra.
Đánh đổi: có một hàng chờ phải có người trực. Đổi lại, khoá một tên miền là một câu lệnh, có hiệu
lực tức thì với mọi người đang đăng nhập, và luôn kèm lý do cô đọc được.

### 2026-09-07 · Hoãn lịch dạy và xuất ICS
Lý do: bản mẫu `oblue-platform-demo.html` có mục "Tuần này · lịch dạy + hạn nộp bài" nhưng `SRS`
không có use case nào cho nó. Hạn nộp bài đã nằm trong `assignments.due_at` và hiện được ở bảng tin
lớp — phần còn thiếu chỉ là *lịch buổi dạy*, và đó là thứ cô đang quản bằng Google Calendar mà không
kêu ca. Không bỏ hẳn: xuất ICS là đường một chiều ra ngoài, không kéo theo bảng mới nào.
Đánh đổi: mục "Tuần này" ở bản mẫu chỉ hiện hạn nộp cho tới khi làm phần lịch.

### 2026-09-07 · Giữ `paths` (lộ trình), không thêm `courses` (khoá học)
Lý do: bản cũ tách `courses` khỏi lớp vì trọng tâm của nó là **nội dung**. Trọng tâm bản mới là
**lớp học**, và khách hàng là giáo viên **đã có lớp** — họ không soạn khoá học để bán, họ lên kế
hoạch buổi cho lớp đang chạy. `paths` là kế hoạch buổi; `courses` là nội dung đóng gói. Thêm cả hai
là hai thứ gần giống nhau mà không ai biết nên đặt bài vào đâu.
Đánh đổi: bán khoá học đóng gói (tự học, không có lớp) thì phải dựng thêm — chưa nằm trong `SRS`.

### 2026-09-07 (chiều) · Tên miền tự duyệt; admin giữ van khoá, không giữ cổng
Đổi mặc định của mục "admin duyệt" phía trên, sau khi hỏi tiếp "ai trực hàng chờ". Câu trả lời là
chưa có ai. Một hàng chờ không người trực thì không phải cửa an toàn — nó là cô đăng ký xong ngồi
đợi vô hạn rồi bỏ đi, và bỏ đi ở đúng phút cô còn hào hứng nhất.
Đổi đúng một thứ: mặc định. Toàn bộ phần đắt của mục trên giữ nguyên — ba trạng thái, hai cửa chặn,
lệnh khoá kèm lý do có hiệu lực tức thì với mọi người đang đăng nhập. Mất một người gác cổng, còn
lại một cái van đóng được bất cứ lúc nào. Với sản phẩm chưa có người trực, van đáng hơn cổng.
Tự duyệt vẫn là một hành vi nên vẫn vào nhật ký, và vai của nó là `system` — mà `ARCHITECTURE` §4
chỉ cho máy sinh `draft`/`propose`/`auto:*`, nên nó tên là `tenant.auto:approve`. Nhờ vậy phân biệt
được hai loại bút phê không cần thêm cột: admin ký có `approved_by`, máy duyệt thì không.
Đánh đổi thật, không giấu: ai cũng mở được một tên miền. Chống lạm dụng lùi về phát hiện (khoá) chứ
không còn là phòng ngừa (duyệt). Chấp nhận được ở giai đoạn này vì tên miền rỗng không hại ai và
`suspend_tenant` là một câu lệnh. Đông người thì bật lại hàng chờ — chỗ phải sửa là **một dòng**
trong `app.register_tenant`, cửa chặn đã kín sẵn và đã có test cho trạng thái `pending`.

### 2026-09-07 · Hạn mức AI đếm trong CSDL, trần theo số học viên hoạt động
Lý do: `PLAN.md` §5 đặt ngân sách ≤3.000đ/học viên/tháng nhưng không có gì ép — con số trong tài
liệu không chặn được ai, cùng lỗi với `OTP_SO_LAN_THU_TOI_DA`. Vết sẹo số 8 của bản đang chạy:
*"Vượt gói vẫn tiêu tiền API"* — không exception, không cảnh báo, chỉ hoá đơn cuối tháng.
Trần theo **học viên hoạt động** chứ không theo ghế, để khớp với cách tính phí đã chốt: cô nhiều
học viên được tiêu nhiều hơn vì cô cũng trả nhiều hơn. Có **sàn 50.000đ/tháng** vì công thức thuần
tuý phá đúng người mình muốn giữ — cô mới, 3 học viên, được 9.000đ, không đủ số hoá một quyển đề.
Xin phép trước, quyết toán sau: ngân sách tính trên `coalesce(chi phí thật, ước tính)`, nếu không
thì hai chục yêu cầu song song đều thấy ngân sách còn nguyên và cùng đi qua. Khoá tư vấn theo
tenant để "đọc rồi ghi" là một khối. Lần bị chặn vẫn ghi lại (chi phí 0) và vẫn sinh sự kiện cô
đọc được — hết hạn mức mà máy im lặng thì cô tưởng hệ thống hỏng, mất niềm tin chứ không mất tiền.
Đánh đổi: mỗi lần gọi AI tốn thêm hai lượt ghi và một khoá ngắn theo tenant.

### 2026-09-07 · Cache số hoá dùng chung liên tenant, khoá là (băm tệp, model, phiên bản prompt)
Lý do: thị trường luyện thi Việt Nam dạy chung mấy bộ Cambridge/ETS/Oxford, nên tỉ lệ trúng rất
cao và đây là cách rẻ nhất giữ ngân sách ở trên. Bản đang chạy đã làm và đúng.
Ngoại lệ có chủ ý với luật "mọi query lọc theo `tenant_id`": bảng này không có `tenant_id`. Không
phải rò rỉ, vì khoá là băm nội dung tệp — đọc được một dòng đòi hỏi đã cầm sẵn đúng tệp đó, mà có
tệp thì đã có nội dung. Lưu là kết quả bóc, không có tên học viên, điểm hay nhận xét. Không chính
sách RLS nào; chỉ máy chủ đọc.
Model và phiên bản prompt nằm **trong** khoá: thiếu chúng thì nâng cấp model xong vẫn trả bản bóc
cũ, và cô không hiểu vì sao máy "vẫn đọc sai y như hôm qua".
Đánh đổi thật, không giấu: **thời gian phản hồi** để lộ việc đã có người số hoá đúng quyển đó
(trúng cache trả về ngay, trượt mất vài chục giây). Không sửa được ở tầng CSDL. Thấy không chấp
nhận được thì tầng ứng dụng làm trễ giả, hoặc tách cache theo tenant và chịu chi phí.
