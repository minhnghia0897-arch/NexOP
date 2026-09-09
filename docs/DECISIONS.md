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

### 2026-09-08 · Ngân hàng đề chỉ có một cửa ghi; lan truyền nằm trong hàm sửa
Lý do: soát lại chặng 4 thì thấy 0006 dựng bảng và ràng buộc, 0007 dựng `propagate_exam_edit`,
nhưng **không hàm nào sửa được câu hỏi** — nên đường duy nhất còn lại là ứng dụng ghi thẳng bằng
khoá service. Ghi thẳng thì không sự kiện nào được ghi (toàn kho không có một action `exam.*`), và
lan truyền thành việc phải NHỚ gọi. Quên là đúng lại vết sẹo số 1: cô thêm đoạn văn, lưu, học viên
mở ra không thấy, không ai báo gì.
Chữa bằng cách bịt đường chứ không dặn dò: `app.import_digitized_exam` (UC-03) và
`app.save_exam_edit` (UC-04) là hai cửa duy nhất, mỗi cửa ghi sự kiện trước rồi mới sửa, và
`save_exam_edit` gọi lan truyền **bên trong** nên không quên được. Trigger trên `exams`/`passages`/
`questions` chặn mọi ghi ngoài hai cửa đó.
Nói rõ giới hạn của trigger: nó **không** phải hàng rào an ninh — khoá service tắt được nó. Việc của
nó là chặn TAI NẠN, bằng một lỗi chỉ thẳng sang hàm đúng, thay vì im lặng rồi hỏng ở lớp học.
Kèm theo: cô điền đáp án cho câu OCR đọc hụt thì cảnh báo **tự tắt**. Ràng buộc cũ cho phép một câu
mang cả đáp án lẫn cảnh báo, nên danh sách "cần xem lại" sẽ không bao giờ rỗng — mà một danh sách
không bao giờ rỗng thì cô thôi nhìn, và lần sau máy cảnh báo thật cũng chìm theo.
Đánh đổi: fixture trong test phải mở cửa tường minh (`set_config('app.exam_write','on')`), và mỗi
lần sửa đề tốn thêm một lượt quét bài giao. Đổi lại, không có đường nào sửa đề mà không để lại dấu.

### 2026-09-08 · Khung demo chạy dữ liệu giả, nhưng đi qua luật thật
Lý do: cô cần thấy tính năng trước khi có Supabase, OTP và tên miền. Cách nhanh là để màn hình đọc
thẳng mảng dữ liệu mẫu và bấm nút thì đổi state — dựng nhanh, demo đẹp, và sai. Sai vì lúc nối CSDL
mới phát hiện quyền, sự kiện và ranh giới máy–người chưa từng chạy lần nào, nên không phải "thay
chỗ lưu" mà là viết lại.
Nên `lib/demo/kho.ts` giả ở CHỖ LƯU, thật ở CHỖ LUẬT: mọi ghi qua đúng `can()` (cùng
`docs/permissions.json`), ghi `events` trước khi có hiệu lực, máy chỉ `draft`/`propose`/`auto:*`.
Đổi sang Supabase là đổi thân hàm trong một file; server action và màn hình không đụng tới.
Ba chỗ `can()` bắt bẻ ngay khi nối vào, và cả ba đều là bài học chứ không phải phiền toái:
(1) actor của máy phải khai lớp nó đang xử lý — cửa 3 của `can()` là lưới bắt job chạy nhầm lớp,
nới nó cho tiện là bỏ lưới; (2) sửa nháp là `propose` chứ không phải `update`, vì mức `propose` cô
cấp cho trợ giảng chỉ mở {view, draft, propose} — và sửa nháp đúng là việc của trợ giảng; (3) lọc
chồng bài phải hỏi `review.propose`, không phải `submission.view`, vì em xem được bài nộp của chính
em nên lọc theo bài nộp là để em nhìn thấy band nháp của máy.
Đánh đổi: dữ liệu nằm trong bộ nhớ tiến trình nên khởi động lại là về mẫu, và nền chạy nhiều tiến
trình thì mỗi tiến trình một bản. Chấp nhận được cho demo, và là lý do file này không dùng ở bản thật.

### 2026-09-08 · Trợ giảng ĐỀ XUẤT, không phải "gửi rồi bị chặn"
Lý do: bản đầu để nút của trợ giảng gọi thẳng hàm gửi, `can()` chặn, màn hình hiện dòng lỗi. Cửa
chặn đúng nhưng thiết kế sai: nhãn nút nói "Gửi nhận xét cho cô duyệt" mà hành vi lại là một lần
gửi chắc chắn hỏng. Đặt nút vào chỗ chắc chắn hỏng là dạy người dùng rằng hệ thống hay lỗi.
Nay trợ giảng có đường riêng `deXuatChoCo` ghi `review.propose`; bản soạn vẫn là lớp 3, em chưa thấy
gì, và chồng bài của cô hiện dấu "Phạm Lan đã soạn · chờ cô gửi". Cửa chặn vẫn còn nguyên và vẫn có
test — chỉ là không còn nằm trên đường đi bình thường của ai cả.
Kèm theo: lời từ chối dịch sang tiếng của cô. `Không đủ quyền cho "review.send"` đúng nhưng vô nghĩa
với người dùng; tên hành vi ở lại trong nhật ký cho người sửa lỗi, màn hình nói tiếng người.

### 2026-09-08 (chiều) · Bản demo xuất tĩnh cho GitHub Pages; kho chạy ở trình duyệt
Lý do: bản khung ban đầu là ứng dụng có máy chủ (server action, middleware, cookie), nên chỉ ai tự
dựng môi trường mới mở được. Thử đưa lên Vercel thì token nối sẵn **không có quyền tạo project**
(403, hai lần, hai tên khác nhau). Cô chốt: chuyển sang HTML tĩnh cho Pages.
Đổi: `lib/demo/kho.ts` bỏ `server-only`, chạy thẳng ở trình duyệt, giữ trạng thái trong bộ nhớ tab
và `localStorage`. Server action thành `lib/demo/hanh-vi.ts` — cùng tên hàm, cùng kiểu trả về
`{ loi?: string }`, chỉ khác thân hàm, để sau này nối Supabase thì đổi ngược lại không đụng màn hình.
**Cái giữ được:** toàn bộ luật. `can()`, `events`, ba lớp dữ liệu, và cả bộ test — không dòng nào
đổi. **Cái mất:** hình dạng đường ghi. Bản thật gửi ý định lên máy chủ rồi máy chủ mới kiểm quyền;
ở đây trình duyệt tự kiểm. Với dữ liệu mẫu thì không có gì để mất, nhưng nó nghĩa là lúc nối
Supabase phải dựng lại đường ghi cho từng màn, không phải đổi một file như dự tính ban đầu.
Xuất bằng `scripts/dung-ban-tinh.mjs` chép sang thư mục tạm rồi mới dựng, vì `output: 'export'`
không nhận middleware và không nhận trang gọi `headers()` — mà cả hai đều PHẢI giữ ở bản thật.
Bản tĩnh vì thế chỉ có bốn màn demo; đăng nhập và lời mời không có trong đó.
Đánh đổi khác: `demo/` là mã sinh ra nhưng phải commit để Pages phục vụ được, nên eslint và
check-tokens bỏ qua thư mục đó — soi nó là soi đầu ra của Next, không phải soi mã mình viết.

### 2026-09-08 (tối) · Dựng lại giao diện theo đúng bản mẫu, không theo trí nhớ
Lý do: cô mở bản chạy được rồi hỏi "sao giao diện không được như ban đầu". So hai ảnh chụp thì rõ —
bản em dựng là một bản PHÁC: thiếu thanh tìm kiếm, rail 4 mục thay vì 9, panel không có nút mở lớp,
không chấm màu, không nhóm Đang chạy/Sắp mở, không thẻ tiến độ; KPI không có dòng phụ; màn chấm bài
không có pill lọc, không thanh rubric, không vạch màu theo loại lỗi, không đếm ký tự, không "Viết
lại". `DESIGN.md` nói thẳng: **bản mẫu thắng**. Em đã đọc dòng đó và vẫn dựng theo trí nhớ.
Cách sửa: lấy kích thước và khoảng cách từ CSS của bản mẫu (`.rail`, `.panel .cls`, `.kpi`, `.paper`,
`.fix`, `.crit`) chứ không ước lượng bằng mắt, rồi so lại bằng ảnh chụp hai bên.
Hai chỗ chỉ lộ khi so ảnh: tiêu đề khối trong thẻ chấm **không viết hoa** (em tự thêm `uppercase`),
và chồng bài mẫu có 3–4 lỗi mỗi bài trong khi dữ liệu của em chỉ có 1 — bố cục hai cột trông rỗng
một nửa. Lỗi thứ hai là lỗi DỮ LIỆU đội lốt lỗi giao diện, và chỉ thấy được khi nhìn cạnh bản mẫu.
Chỗ cố ý khác bản mẫu, ghi ra để không ai tưởng là sót: bản mẫu đổi vai bằng cách bấm avatar, bản
demo để nút ba nấc vì người xem không đoán được avatar bấm được. Nút "Mở lớp mới từ lộ trình" và ô
tìm kiếm để trạng thái tắt — có trong bố cục nhưng chưa nối, và giả vờ bấm được thì tệ hơn là để tắt.
Đánh đổi: dữ liệu mẫu phải giàu hơn thì bố cục mới đúng. Đó không phải trang trí — bố cục hai cột
của bản mẫu được thiết kế cho một bài IELTS thật, và dữ liệu nghèo làm hỏng chính bố cục đó.

### 2026-09-09 · Dựng đủ chín màn của bản mẫu, mục chưa có thì hiện chứ không giấu
Lý do: cô chỉ vào link bản mẫu và nói "về bản như thế này". Không phải chỉ Trang lớp — là toàn bộ.
Bản trước có bốn màn, bản mẫu có chín; rail bốn mục thì bố cục lệch hẳn khỏi bản gốc.
Dựng thêm: Trang lớp (5 tab: bảng tin · bài tập · học viên · điểm · chấm bài), Học viên, Lộ trình,
Ngân hàng đề, Học phí, Bảng tin. Rail đủ chín mục, có gạch chia ba nhóm như bản mẫu.
Quyết định nhỏ nhưng quan trọng: **thứ chưa nối thì hiện ở trạng thái tắt, không giấu**. Ô tìm
kiếm, nút "Mở lớp mới từ lộ trình", các chip gợi ý trong ô đăng bài — tất cả có trong bố cục, nhìn
thấy được, bấm không được. Giấu đi thì bố cục lệch khỏi bản mẫu; cho bấm vào màn trống thì dạy người
dùng rằng sản phẩm hay lỗi. Hiện-mà-tắt nói đúng sự thật: chỗ này có trong sản phẩm, chưa có trong bản demo.
Mỗi màn mới vẫn đi qua `can()` thật, nên ba vai thấy ba thứ khác nhau và điều đó kiểm được: trợ giảng
bị chặn ở Học phí bởi **trần cứng** (cửa 5 của `can()`, trước cả khi xét mức quyền cô cấp), học viên
bị chặn ở Lộ trình và ở danh sách bạn cùng lớp.
Kèm theo: dữ liệu mẫu phải giàu thêm — lịch sử bốn bài đã chấm, hồ sơ mười tám em, lộ trình, học phí.
Bảng điểm một cột thì "band tăng hay tụt" vô nghĩa, mà đó mới là thứ cô mở bảng điểm để tìm.

### 2026-09-09 · Áp năm dòng quyền còn thiếu thay vì để chúng chặn tiếp
Lý do: `can()` mặc định đóng. Object không có trong `permissions.json` thì **mọi vai** bị từ chối —
kể cả máy làm đúng việc `OPERATIONS.md` giao. Năm thực thể `proposal · draft · practice_set ·
attendance · path` nằm ngoài file, nên bước 3, 5, 7, 8 của vòng vận hành đứng im mà không chỗ nào báo.
Trước đây em ghi rõ là không tự quyết: thêm một dòng vào file đó là đặt ra chính sách quyền.
Nay áp dụng vì bài luyện của học viên (`practice_set`) là màn của bản mẫu, không dựng được nếu thiếu,
và vì bảng ở `LOGIC.md` §8.1 không phải em nghĩ ra: nó suy từ `ARCHITECTURE` §3 và `OPERATIONS.md`.
**Cô là người chốt cuối** — đổi ý thì sửa `docs/permissions.json`, cả hệ thống đọc từ đúng file đó.
Hai chỗ chỉ lộ ra khi áp thật:
`attendance` phải vào `own_is_subject_not_author`, nếu không mức `own` cho em tự sửa buổi vắng của mình
— em **là chủ đề** của điểm danh chứ không phải người ghi ra nó.
Và `baiCanCham` bỏ được chỗ lách: trước hỏi `review.propose` để chặn em thấy chồng bài chấm, nay hỏi
`draft.view`. Cùng kết quả, khác lý do — và lý do mới là lý do thật, nên nó không vỡ khi chính sách đổi.

### 2026-09-09 · App học viên tách khung riêng, và ba màn còn thiếu của bản mẫu
Lý do: bản mẫu có ba thứ bản demo chưa dựng — **Cấu hình** (5 tab), **Việc của tôi** (màn nhà của
trợ giảng), và **app học viên 7 màn** với tab đáy 60px. Cô chỉ vào link bản mẫu và nói "toàn bộ
các trang", nên thiếu ba chỗ này là chưa xong.
App của em ở `app/(em)`, khung riêng, **không đọc `vaiHienTai()`**. Cô mở app của em để xem thử thì
vẫn thấy đúng những gì em thấy: mọi câu đọc đi qua `can()` với actor học viên thật. Để nó co theo vai
đang xem thì app này thành cửa hậu — cô mở ra, thấy đủ, rồi tưởng em cũng thấy đủ như vậy.
Hai màn sinh thẳng từ `docs/permissions.json` chứ không gõ tay: ma trận quyền ở tab Quyền, và khối
"Lan không thấy gì". Bản mẫu viết tay 12 dòng HTML. Gõ tay thì hôm nào cô đổi chính sách, màn hình
vẫn hứa với người đọc đúng những thứ cũ — kiểu sai không ai phát hiện ra, vì màn trông vẫn đúng.
Rail co theo vai: "Việc của tôi" chỉ hiện với trợ giảng, đúng như bản mẫu (`body.ta .rail button`).
"Nhật ký" thôi làm mục riêng, thành một tab của Cấu hình — bản mẫu xếp thế, và nhật ký đọc cùng lúc
với luật của cô thì mới trả lời được câu "máy vừa tự làm gì sau lưng tôi".
Bốn chỗ chỉ lộ ra khi bấm thật, không lộ khi đọc mã:
`post` mức `own` với vai học viên nói về quyền VIẾT. Hỏi `post.view` từng bài thì em bị chặn ở bài
của cô và bảng tin lớp rỗng trơn. Phạm vi ĐỌC của bảng tin là phạm vi lớp → hỏi `class.view`.
Màn xác nhận nộp bài phải xét TRƯỚC cửa "hết bài": nộp xong thì không còn bài nào, nên xét cửa kia
trước là em nộp xong nhìn thấy "em đã nộp hết bài", còn màn xác nhận thành mã chết.
Năm câu bài luyện ban đầu đáp án đều ở vị trí B — bấm B năm lần là 5/5 mà không đọc câu nào.
Và `den="/nhat-ky"` trỏ tới màn đã xoá vẫn dựng được, vì component ép kiểu `as never` khi truyền cho
`<Link>`. Ép kiểu ở đâu thì mù ở đó — nay `den` khai kiểu `Route`, trình biên dịch bắt được.
Chỗ cố ý khác bản mẫu, ghi ra để không ai tưởng là sót: bản mẫu để tiêu đề màn sát mép trái còn nội
dung căn giữa ở 760 — trên màn 1440 tiêu đề trôi hẳn khỏi cột nội dung, trông như chỗ hỏng; app của
em cho tiêu đề vào cùng cột. Và bản mẫu cho Tổng quan với Việc của tôi **cùng một icon bốn ô**; rail
được quét bằng icon chứ không đọc chữ, nên Việc của tôi đổi sang icon danh sách-có-tích.

### 2026-09-09 · Bản lưu của phiên bản cũ làm trắng trang, và vì sao bài kiểm không thấy
Lý do: cô mở bản trực tuyến và thấy "Application error: a client-side exception has occurred".
Bản demo vừa thêm `luat` và `baiLuyen` vào dữ liệu, nhưng khoá `localStorage` vẫn là
`oblue-demo-v1` — nên trình duyệt của cô nạp lại bản đã lưu **của phiên bản trước**, thiếu hai
mảng đó, rồi `du.baiLuyen.filter` ném lỗi và cả trang trắng.
Chỗ đáng ghi không phải cái lỗi, mà là vì sao 43 lượt kiểm trong trình duyệt không thấy nó:
lần nào em cũng mở bằng **hồ sơ sạch**. Chỗ hỏng chỉ tồn tại với người ĐÃ dùng bản trước —
nghĩa là chỉ tồn tại với đúng người quan trọng nhất, và không tồn tại với người đi kiểm.
Sửa hai lớp, không một:
1. Đổi khoá sang `-v2` — sửa được lần này.
2. So khoá của bản lưu với bản mẫu; thiếu cái nào thì bỏ cả bản lưu và về dữ liệu mẫu —
   bắt được cả lần sau, khi em quên làm việc (1). Lỗi này có chính vì em đã quên.
Bỏ bản lưu là mất vài thao tác người xem vừa bấm. Đổi lại là không có trang trắng, và trang
trắng thì người dùng không biết là do đâu, cũng không biết bấm gì để thoát.
Test nằm ở `tests/unit/kho-demo.test.ts`, dựng đúng tình huống bằng localStorage giả — chỗ
duy nhất dựng lại được "người đã dùng bản cũ". Đã kiểm đột biến cả hai lớp: tắt cửa kiểm hình
dạng thì đỏ, đổi khoá về `-v1` cũng đỏ.
