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

### 2026-09-11 · Bước 1 của vòng vận hành: cô giao bài từ lộ trình
Lý do: mười bảy màn đã đủ, nhưng bản demo vẫn bắt đầu từ lúc bài đã có sẵn. Cô chấm được,
gửi được, mà **không tạo được việc** — nghĩa là vòng vận hành thiếu đúng cái bước đầu tiên,
và "mở lớp thứ 3 không kiệt sức" chưa có gì để xem.
Ô giao bài có ba ô nhập, không hơn: lớp nào · hạn bao giờ · nặng bao nhiêu. Đề đã gắn sẵn
trong buổi nên cô không chọn lại — thêm một ô "chọn đề" ở đó là xoá mất lý do lộ trình tồn tại.
Câu hỏi được **chụp lại** lúc giao (migration 0007), không trỏ sống về đề.
Máy đăng bài giao lên bảng tin bằng `post.auto:assign`. Đây là chỗ ranh giới máy–người dễ bị
hiểu nhầm nên nói rõ: máy ĐƯỢC đăng thẳng (`post` của `system` là mức `auto`), khác hẳn nhận
xét chỗ máy chỉ nháp. Luật không phải "máy không được làm gì", mà là: máy không phát ra phán
xét về một đứa trẻ; thông báo một việc cô vừa quyết thì được.
Công tắc `nhac-nop` đổi **lời** của bài đăng chứ không giấu nó: tắt thì máy vẫn đăng nhưng nói
thẳng "cô đang tắt nhắc tự động, các em tự nhớ hạn". Giấu đi thì cô tưởng em đã được nhắc.
**Chỗ hổng phát hiện khi dựng**, đã ghi vào `LOGIC.md` §8 câu 7: trợ giảng có mức `propose` ở
`assignment` nhưng **không có lối vào nào hợp lệ** — `path` là `none` nên không thấy lộ trình,
`exam` là `read` giới hạn "chỉ đề đã giao" nên không chọn được đề. Khả năng có, đường đi không.
Nên nhánh "trợ giảng đề xuất" bị gỡ khỏi giao diện (dựng ra là dựng mã chết), nhưng giữ trong
kho và có test — vì `permissions.json` nói thế, và chính sách mới là nguồn.
Hai lỗi thật lộ ra khi bấm và khi nhìn ảnh chụp, không lộ khi đọc mã:
`bg-giao-${Date.now()}` cho hai bài giao trong cùng một mili giây **cùng một mã**, rồi bài thứ
hai thành vô hình. Nay mọi mã sinh ra đi qua một hàm có bộ đếm — bỏ luôn cả kiểu mã theo
`length + 1`, vốn cũng trùng ngay khi có thứ bị xoá.
Và giao lại cùng một buổi cho cùng một lớp — việc có thật, cả lớp làm tệ thì cho làm lại — cho
em hai dòng **trùng tên** không phân biệt nổi. Nay đánh số `lần 2` bằng `lanThu` vốn đã có
sẵn trong mô hình từ đầu cho đúng việc này.
Kiểm cả với **bản đã lưu của phiên bản trước**, không chỉ hồ sơ sạch — đúng bài học ngày 9/9.

### 2026-09-11 · Ngân hàng đề và trình thuật sĩ số hoá — hai màn bản mẫu có mà bản demo chưa dựng
Lý do: cô chỉ vào hai ảnh bản mẫu và hỏi vì sao bản đang chạy khác cả về thiết kế lẫn chi tiết.
Cô đúng: ô kéo-thả số hoá, tab "Chờ duyệt nhãn", bảng Nguồn·Đọc đúng·Nhãn đề xuất·Trạng thái,
và cả trình thuật sĩ bốn bước — đều có trong `design/_reference/oblue-platform-demo.html` (`s-bank`
và `#wiz`) mà em chưa dựng bao giờ.
Bước 3 của thuật sĩ là bước duy nhất đáng kể, và nó chạy thật: chọn đáp án cho câu còn cảnh báo
thì **cảnh báo tự mất**, đúng `app.save_exam_edit` ở migration 0013. Không tự xoá thì danh sách
"cần xem lại" không bao giờ rỗng, cô thôi đọc nó, và cái cờ mất nghĩa — cảnh báo tự giết chính nó.
Bỏ đáp án thì cảnh báo quay lại, vì cô đổi ý là chuyện thường.
Chỗ cố ý khác bản mẫu: tab một lọc theo **"đề mới số hoá chưa giao"**, không theo "chưa duyệt nhãn".
Lọc theo nhãn thì cô duyệt xong là đề biến mất khỏi danh sách, mà nó vẫn còn một việc nữa —
giao đi. Cột Trạng thái nói mỗi dòng đang cần gì: duyệt nhãn · xem chỗ chữ mờ · giao bài.
Nhãn topbar đổi từ "Máy đã nháp sẵn 7 bài" sang **"Tuần này tiết kiệm 2h41"** như bản mẫu. Khác
nhau ở chỗ ai được lợi: câu đầu khoe máy, câu sau nói với cô thứ cô mua. Con số tính từ chồng bài
thật, nên nó tụt khi chồng bài vơi.
Danh sách lớp về đúng bản mẫu: 4 lớp · 58 học viên (18/16/4/20). Mười tám em lớp 6.5 giữ tên thật,
bài viết thật, hồ sơ thật — đó là lớp mọi màn demo đi qua; bốn mươi em ba lớp còn lại sinh ra chỉ
để panel, học phí và "41/58 đã có tài khoản" đọc đúng.
**Ba lỗi thật, cả ba do test bắt, không phải do đọc mã:**
`duLieuBanDau()` trả về CHÍNH các hằng ở đầu file, không phải bản sao — nên `datLai()` trả lại
đúng những đối tượng đã bị sửa lần trước: cô duyệt một nhãn, đặt lại dữ liệu mẫu, nhãn vẫn duyệt.
Hai bài kiểm quyền xanh giả vì đề đã bị đổi từ bài kiểm trước đó. Nay trả về `structuredClone`.
Bài giao **dùng chung mảng câu hỏi với đề** — nên sửa đáp án trong ngân hàng là sửa luôn đề bài em
đang làm dở, đúng thứ migration 0007 sinh ra để chặn. Nay chụp riêng ở cả dữ liệu mẫu lẫn `giaoBai`.
Và bộ lọc tab một quét cả kho đề cũ (127 dòng thay vì 3), vì đề lưu trữ cũng mang `trangThaiNhan`.
Đề đã vào kho từ lâu thì không còn nằm trong luồng số hoá — nay để trống trường đó.
Một lỗi nữa nằm ở **bài kiểm của em**, không ở mã: `getByRole('button', {name})` mặc định khớp
CHUỖI CON, nên "Duyệt nhãn" khớp luôn tên tab "Chờ duyệt nhãn" và bài kiểm đỏ oan hai vòng.

### 2026-09-12 · Lớp học thành lưới thẻ, Học viên có ngăn hồ sơ
Lý do: cô gửi ba ảnh và nói bản đang chạy khác xa. Cô đúng ở hai chỗ nữa.
**Lớp học**: bản mẫu tách hai màn — `s-cls` (lưới thẻ, để CHỌN) và `s-class` (năm tab, để LÀM
VIỆC). Em gộp làm một và mất mất màn chọn: cô mở "Lớp học" ra là rơi thẳng vào một lớp, không
nhìn được bốn lớp cạnh nhau — mà đó mới là lúc cô thấy lớp nào đang tụt. Nay `?lop=` quyết định
màn nào; một đường dẫn hai màn, vì bản tĩnh không dựng được route động thiếu `generateStaticParams`.
Số trên thẻ tính từ dữ liệu thật: band trung bình từ hồ sơ các em trong lớp, "quá hạn" đếm bài đã
qua hạn mà còn người chưa nộp, tiến độ buổi từ bài giao đã lấy từ lộ trình. Cắm số thì thẻ đẹp mà
tắt một luật đi con số vẫn y nguyên, và cô sẽ tin nhầm nó.
**Học viên**: ba tab (Tất cả · Cần chú ý · Chưa có tài khoản) và ngăn kéo hồ sơ 520px trượt từ
phải. Ngăn kéo chứ không phải trang mới: cô đang quét danh sách, xem một em rồi quay lại.
Chỗ đáng nói nhất là **ghi chú riêng của cô**. Nó bị cắt ở `hoSoDayDu` — LỚP ĐỌC DỮ LIỆU — chứ
không ở giao diện. Cắt ở giao diện thì nội dung vẫn đi tới trình duyệt của trợ giảng và chỉ là
không vẽ ra; ai mở công cụ nhà phát triển cũng đọc được. `teacher_notes` trong
`assistant_hard_ceiling` nói "không đọc được", không nói "không hiện ra". Nhật ký cũng chỉ ghi
độ dài ghi chú, không ghi nội dung — một payload đầy đủ là một đường rò.
Và ngăn của trợ giảng không để trống: nó nói thẳng "trần cứng của trợ giảng, nội dung chưa từng
được gửi tới màn này". Để trống thì trợ giảng tưởng cô chưa viết gì.
**Bốn chỗ dữ liệu lạc, ảnh chụp lộ ra chứ đọc mã không thấy:**
lớp 5.5 gắn lộ trình tên "IELTS 7.0+" và lớp Writing gắn "Nền tảng B1" — di chứng của lần đổi
danh sách lớp; nay mỗi lớp một lộ trình đúng tên. Lớp sắp mở ghi "2/6 đăng ký" mà `hocVienIds`
rỗng, nên thẻ đếm ra 0 và tự mâu thuẫn với dòng ngay bên cạnh. Thẻ lớp sắp mở đọc thành
"Khai giảng: khai giảng 22/9" vì ghi chú bị nhét vào hai chỗ. Và cột "Mục tiêu" trống với gần hết
học viên — cột trống là cột vô nghĩa, nay suy ra nửa bậc trên band hiện tại.
Chỗ thứ năm là **hình dạng dữ liệu, không phải lỗi**: chia đều ba hướng band thì một phần ba lớp
đang tụt và màn "Cần chú ý" liệt kê 16/58 em. Đó là lớp đang vỡ, không phải lớp của cô Thảo. Số
em cần can thiệp phải đủ ít để cô làm hết trong một buổi tối, nếu không thì danh sách cũng vô dụng.

### 2026-09-12 · Điểm danh, và ba chỗ tài liệu tự nói ngược nhau
Nút "Điểm danh" trên thẻ lớp đang hiện-mà-tắt, nên dựng nó là việc kế tiếp rõ nhất. Dựng xong
thì nó lôi ra ba chỗ tài liệu nói một đằng, mã hoặc CSDL làm một nẻo. Ghi cả ba ở đây vì cái
đáng giá không phải màn điểm danh — là ba chỗ đó.

**Điểm danh là chỗ mức `auto` của trợ giảng có nghĩa thật.** `attendance.assistant` là `auto`:
trợ giảng ghi THẲNG, không đề xuất rồi chờ cô duyệt. Đây là việc phải làm ngay trong phòng —
bắt nó chờ cô duyệt thì đến mai cô duyệt một buổi học đã tan. Bản mẫu ghi đúng thế trong lời
mời trợ giảng. Nút "Điểm danh" vì vậy KHÔNG nằm sau `vai === 'owner'`; màn hỏi `duocDiemDanh()`,
và hàm đó hỏi `can()`. Viết `vai === 'owner' || vai === 'assistant'` thì hôm nào cô hạ quyền
trợ giảng xuống `read`, cái `if` vẫn mở nút và trợ giảng bấm vào mới biết.

**Bỏ `diHoc: '28/30'` khỏi hồ sơ.** Đó là con số tổng kết không có gì đỡ bên dưới: thẻ lớp và
hồ sơ có thể nói hai điều khác nhau mà không chỗ nào phát hiện, vì không có bảng sự thật nào để
đối chiếu. Nay có `diemDanh`, và mọi con số đi học tính lại từ nó. Bỏ field đi thì trình biên
dịch chỉ ra đúng hai chỗ đang đọc nó — đó là cách tìm chỗ dùng, không phải đi grep.
Ba lỗi lộ ra ngay khi in số ra xem, mà đọc mã thì không thấy:
- **Lớp chưa khai giảng hiện "Đi học đều 100%".** Hai em đã đăng ký lớp 7.0+ vẫn đang học lớp
  6.5, và hàm cộng xuyên lớp nên thẻ lớp mới mượn số của lớp cũ. Phải có bản theo lớp riêng
  (`diHocTrongLop`) cho thẻ lớp, và bản xuyên lớp (`diHocCuaEm`) cho hồ sơ theo NGƯỜI.
- **"Buổi đã dạy" đếm theo bài giao thì ba trong bốn lớp lệch.** Lớp Speaking đã dạy 12 buổi
  nhưng chỉ giao bài từ buổi 6, nên thẻ đọc "Buổi 6/20" — lớp trông như đang chậm một nửa.
  Bài về nhà nói về bài về nhà; buổi đã dạy thì điểm danh mới biết.
- **Lớp sắp mở hiện "Buổi 1/36"** vì `Math.min` của lộ trình làm tròn 0 lên 1, và thanh tiến độ
  đè mất dòng "2/6 đăng ký · khai giảng 22/9" cần nằm đó.
Còn một lỗi trong chính dữ liệu mẫu: `VANG_65[id] ?? vangSinhRa(i, het)` làm bảy em lớp 6.5 đi
học đủ — em không có dòng nào trong bảng đặt tay — rơi xuống hàm sinh và nhận vắng bịa. Trọng
Nghĩa (7.1, đi đều) bỗng "vắng 2 buổi liên tiếp": dữ liệu mẫu tự kể một câu chuyện không ai
viết. Chọn nguồn theo LỚP, không theo em.

**Chỗ thứ nhất tài liệu nói ngược: LOGIC §2 nói máy rà điểm danh, ma trận không cho.** Dòng
cron 07:00 ghi "rà `fees` + `profiles` + `attendance` → `proposal.create`". Cả hai nửa đều
không qua được `can()`: `attendance.system` là `none` nên máy không đọc nổi bảng điểm danh, và
`proposal.system` là `propose` — mức `propose` không bao gồm động từ `create`, nên một sự kiện
tên `proposal.create` do máy sinh bị chặn ở cửa 6. Hệ quả thấy được: luật "vắng không phép + có
tài khoản → nhắc nhẹ sau 21:00" của bản mẫu **chưa chạy**. Không tự nới ma trận — ghi thành
LOGIC §8 câu 8 để cô chốt, và ngăn điểm danh nói thẳng ra là luật đó chưa bật. Im lặng thì cô
tin là nó đang chạy, mà đó là kiểu hỏng tệ nhất.

**Chỗ thứ hai: ARCHITECTURE §3 xếp `attendance` vào "chỉ thêm", nhưng bảng thật không cho
thêm.** Migration 0004 đặt `unique (class_id, session_no, student_id)`, nên điểm danh lại một
buổi không thể là thêm dòng. Bản demo em viết lúc đầu THÊM dòng và chạy êm — nó sẽ đổ đúng hôm
nối Supabase, kiểu hỏng đắt nhất vì lúc đó mọi màn đã dựng xong trên một giả định sai. Chốt:
giữ ràng buộc, sửa tại chỗ, vì ràng buộc ấy đang chặn một lỗi thật — điểm danh hai lần một buổi
thì mọi con số "đi học đều" đếm buổi đó hai lần. Lịch sử "cô đã đổi ý" thì `events` giữ, và giữ
chắc hơn: `events` có trigger chặn cả UPDATE lẫn DELETE (0001), còn `attendance` không có gì
ép. Ghi thành §8 câu 9.

**Chỗ thứ ba: bản mẫu ghi một luật mà bảng không có cột để chạy nó.** "Vắng KHÔNG PHÉP" — mà
`attendance` ở 0004 chỉ có `present boolean`, nên vắng có phép và vắng trốn học vào cùng một
cột. Migration **0014** thêm `excused` và `recorded_by`, một ràng buộc chặn "có mặt mà có
phép", một trigger chặn ghi thiếu người ghi (`attendance.system = none` — máy không ghi bảng
này), và `app.record_attendance` làm cửa duy nhất: nhận danh sách VẮNG, sĩ số lấy từ
`memberships`. Bắt ứng dụng gửi lên 18 dòng có mặt là mở đường cho nó gửi thiếu một dòng.

**Hai chỗ cố tình khác bản mẫu.** Bản mẫu bỏ tích sẵn cho em "vắng buổi trước"; ở đây không —
ai có mặt là sự thật lớp 1, và máy không đoán sự thật hộ cô. Em đó vẫn được nhắc bằng nhãn cạnh
tên. Và ô "có phép" chỉ hiện sau khi đã bỏ tích: hiện sẵn mười tám ô là mười tám câu hỏi cô
không cần trả lời.

**Bài kiểm bắt được hai chỗ hai bản không khớp nhau.** `app.record_attendance` đặt
`visibility = array[v_actor]`, nên buổi trợ giảng điểm danh thành buổi CÔ KHÔNG ĐỌC ĐƯỢC trong
nhật ký của chính mình — `events_read_visible` là `auth.uid() = any (visibility)`, không có
ngoại lệ cho chủ tên miền. Và hàm cắm sẵn `actor_role = 'owner'`, nên mọi buổi trợ giảng ghi
đọc thành cô ghi: nhật ký nói sai đúng chỗ cô cần nó nói đúng, khi em khiếu nại một buổi vắng.
Cả hai chỉ lộ ra vì bài kiểm chạy trên Postgres thật, không chạy trên bản demo.

### 2026-09-12 · Chốt điểm trắc nghiệm cả lớp, và chỗ thứ tư tài liệu nói ngược
Bước 4 của vòng vận hành có hai nửa rất khác nhau — bản mẫu ghi đúng một câu: **"Trắc nghiệm
chốt cả lớp; tự luận đọc từng bài."** Nửa tự luận đã có (`TheCham`). Nửa này thì ngược lại: 18
bài trên một bảng, cô đọc hai dòng cam rồi bấm một nút. Nên màn Chấm bài giờ có hai đường, y
như `#q1`/`#q2` của bản mẫu; gộp một danh sách thì 18 bài trắc nghiệm đè mất 4 bài tự luận, mà
4 bài kia mới là chỗ cô phải đọc.

**Chỗ thứ tư tài liệu nói ngược, và chỗ này nâng mức quyền KHÔNG phải cách sửa.** `LOGIC` §4.4
nói máy tự chốt trắc nghiệm khi tin cậy ≥97%; chính dòng `review` trong `permissions.json` cũng
ghi chú thế. Nhưng mức của nó là `propose`, và `propose` không cho động từ `auto:*` nào. Em thử
nâng lên `auto` để xem hậu quả thật, không đoán: nó mở luôn `review.auto:essay_autoclose` —
máy gửi được nhận xét TỰ LUẬN mà cô chưa đọc, đúng thứ công tắc `gui-tu-luan` (mặc định tắt)
sinh ra để chặn. Một dòng `review` không phân biệt được hai quyền đó. Ba trong bốn nguồn nói cô
mới là người chốt (bản mẫu vẽ nút "Chốt 8 & mở 2", `OPERATIONS` bước 4 ghi 🔵 Cô, ma trận cho
`review.send` là owner-only), nên dựng theo hướng đó và ghi §8 câu 10 để cô chốt.

**Chỗ thứ năm, và nó chặn cả bước 4:** đề có một câu máy không tìm ra đáp án, nên cả 18 bài
đều "chờ cô". Cô điền đáp án vào ngân hàng đề KHÔNG giải quyết được — `propagate_exam_edit`
(0007) bỏ qua mọi bài giao đã có người nộp. Bỏ qua là đúng cho phần đề bài, nhưng điền một
đáp án còn thiếu khác về bản chất: sửa `de`/`luaChon` là đổi thứ em **đã đọc**; điền `dapAn`
đang rỗng là đổi thứ em **chưa bao giờ thấy** — em không nhìn đáp án, nó chỉ để chấm. Không có
cửa này thì cô chấm tay 18 lần cho đúng một câu. Nên mở đúng một cửa hẹp: chỉ khi đáp án đang
rỗng, không ghi đè đáp án đã có, chỉ chạm `dapAn`/`canhBao`, và chấm lại cả lô ngay trong cùng
hành động của cô — để không có trạng thái nửa vời "đáp án đã có mà điểm vẫn cũ".

**Điểm không nằm trong bài nộp.** Bài nộp chỉ mang đáp án em chọn; điểm là thứ `chamTracNghiem`
suy ra, và suy lại được. Đó là lý do điền một đáp án làm điểm cả lớp đổi theo trong cùng một
nhịp. Hàm chấm là hàm THUẦN và nằm ở `du-lieu.ts` vì cả hai chỗ cần nó — dữ liệu mẫu dựng nháp
sẵn, và `mayChamTracNghiem` chấm lại. Hai bản cài đặt thì lệch nhau ở chỗ tệ nhất: bảng nói một
điểm, bấm "chấm lại" ra điểm khác.

**Ba lần phải sửa dữ liệu mẫu, cả ba vì IN SỐ RA XEM:**
`(i + no) % max(3, 12 - i)` cho Minh Anh 19/19 (trái với chính ghi chú vừa viết) và tám em cuối
chỉ có ba mẫu câu sai lặp lại ba lần. Đổi sang nhịp lớn hơn thì SÁU em được 19/19 — vì với nhịp
lớn, chẳng bội số nào của nó rơi vào khoảng 1–20. **Chia lấy dư cho ra "trúng hoặc không", nó
không cho ra một TỈ LỆ.** Muốn điều khiển tỉ lệ thì đếm trước rồi chọn sau: số câu sai suy từ
band của chính em (band 7.2 → 1 câu, band 4.2 → 6 câu), rồi chọn câu nào bằng `(i*7 + j*3) % 19`
— 19 nguyên tố nên không trùng. Kết quả: 18/18 mẫu khác nhau, 65–95%, không ai tuyệt đối, và em
yếu ở bài viết cũng yếu ở ngữ pháp. Buộc vào band quan trọng hơn vẻ ngoài: hai bộ dữ liệu kể hai
câu chuyện rời nhau về cùng một đứa trẻ thì cô thôi tin số trên màn.
Lỗi thứ ba chỉ lộ ra SAU khi điền đáp án: em coi lựa chọn A là "đúng" cho câu chưa có đáp án,
nên khi cô điền đáp án thật là lựa chọn B, những em bị đánh dấu "làm đúng" hoá ra chọn sai và
ngược lại — đảo ngược hoàn toàn. Không có đáp án thì không có khái niệm đúng-sai để suy.

`de-g1` cũng là một chỗ tên nói một đằng nội dung một nẻo: tên "Trắc nghiệm ngữ pháp 3 · 40 câu"
mà mang đúng 5 câu đọc hiểu về trà, dùng chung mảng với đề Reading — và nó chưa bao giờ được
giao nên không ai phát hiện. Nay có 20 câu ngữ pháp thật, mỗi câu mang `chuDeCau` để cột "Sai ở
đâu" đọc "Câu 3, 11, 16 — bị động" thay vì đọc số câu trơn. Số câu không dạy cô điều gì.

**Bài kiểm lại bắt được hai chỗ, và một chỗ là lỗi trợ năng thật.** Đột biến "gộp cả lô vào một
`visibility`" thoạt trông không bị bắt — nhưng hoá ra bản vá chưa hề áp: mốc thay thế xuất hiện
HAI lần (cả `guiNhanXet` lẫn `chotMotBaiTracNghiem`) nên `str.replace` im lặng không khớp. Đổi
sang mốc duy nhất thì đỏ đúng. Và khi viết bài kiểm trình duyệt, em không nhắm được công tắc nào
cả: `aria-label` của cả năm công tắc đều là "đang bật" / "đang tắt". Đó không chỉ bất tiện cho
bài kiểm — trình đọc màn hình đọc năm lần một câu giống nhau, nên người dùng bàn phím không biết
đâu là "Gửi nhận xét tự luận không cần cô duyệt", cái công tắc cô chủ ý để tắt. Nhãn giờ mang
tên luật; `aria-checked` đã nói bật/tắt rồi.
Một lỗi nữa nằm ở chính bài kiểm: `getByText('Đã chốt')` khớp chuỗi con không phân biệt hoa
thường, nên nó khớp luôn dòng tiến độ "17/18 bài đã chốt" và đếm ra 18. Cùng họ với lỗi
`getByRole({name})` ngày 11/9 — lần thứ hai, nên ghi lại để lần sau nhớ dùng `exact: true`.
