# SO SÁNH — bản đang chạy và bản đang dựng

Nguồn: `OBLUE_LUONG_NGHIEP_VU.md` (mô tả bản đang chạy, dựng từ mã thật — 28 bảng, 14+ RPC)
đối chiếu với `SRS.md` · `ARCHITECTURE.md` · `LOGIC.md` · `OPERATIONS.md` (bản đang dựng).

Tài liệu bản cũ có giá trị đặc biệt: §12 của nó là **15 vết sẹo**, mỗi dòng là một lỗi đã
xảy ra thật trên bản chạy chính thức. Đặc tả thì ai viết cũng được; vết sẹo thì phải trả giá.

---

## 1. Hai bản khác nhau ở trọng tâm, không phải ở tính năng

Liệt kê tính năng sẽ ra hai danh sách na ná nhau. Khác biệt thật nằm ở chỗ **cái gì là
trung tâm**, vì nó quyết định mọi thứ còn lại.

| | Bản cũ | Bản mới |
|---|---|---|
| Trung tâm | **Nội dung** — khoá học và ngân hàng đề | **Lớp học** — người, và việc xảy ra với người |
| Điểm bán | Số hoá đề bằng AI (đỡ gõ tay) | Nháp chấm theo giọng cô (đỡ "tối chủ nhật") |
| AI làm gì | Bóc đề → cô soát → vào ngân hàng | Bốn điểm, không điểm nào ghi vào sự thật |
| Đo tiến bộ | Sổ điểm theo lớp | **Hồ sơ năng lực xuyên lớp** |
| Nhật ký | `admin_audit_logs` — chỉ thao tác quản trị | `events` — mọi hành vi, mọi vai |
| Quyền | RLS + kiểm rải rác ở client | `can()` một hàm, RLS là lớp hai |
| Tiền | Gói + hạn mức + đơn nâng gói duyệt tay | Theo học viên hoạt động (chưa dựng) |

Bản cũ là **công cụ soạn và giao đề** có thêm quản lý lớp.
Bản mới là **trợ lý vận hành lớp** có thêm ngân hàng đề.

Cả hai đều hợp lý. Nhưng chúng dẫn tới hai kiến trúc khác nhau, nên không ghép cơ học được.

---

## 2. Giống nhau — và giống một cách có ý nghĩa

Hai bản, hai người thiết kế, cùng đi tới mấy kết luận này. Trùng nhau kiểu đó thường
nghĩa là chúng đúng:

- **Đa tenant theo subdomain**, host dành riêng bị loại, slug có định dạng chặt.
- **RLS bật trên mọi bảng**, không tin vào việc lọc ở tầng ứng dụng.
- **Không có đáp án thì chấm tay, tuyệt đối không đoán.**
- **Kết quả AI luôn qua tay cô** trước khi thành sự thật.
- **Thông báo nằm trong CSDL**, không phải trạng thái trình duyệt.
- **Nền tảng không thu tiền hộ.**
- **Chấm bài đặt trong phạm vi lớp**, để trợ giảng không chấm được học viên lớp khác.

Bản mới đã có đủ bảy điều này.

---

## 3. Bốn thứ bản cũ đã trả giá mà bản mới đang thiếu

Đây là phần đáng tiền nhất của tài liệu bản cũ.

### 3.1 🔴 Bài đã giao phải là **ảnh chụp**, không phải liên kết sống

`ARCHITECTURE.md` §2 hiện ghi:

```
assignments  id, class_id, exam_id, due_at, grading, weight, published_at, attempt_no
```

`exam_id` là **liên kết sống**. Cô sửa đề trong ngân hàng lúc lớp đang làm bài → câu hỏi
đổi dưới chân em. Bản cũ cố ý đông cứng chính vì chuyện đó.

Nhưng bản cũ cũng học được nửa còn lại bằng một lỗi thật: cô thêm đoạn văn đọc hiểu, lưu,
**học viên mở ra không thấy đoạn văn đâu** — vì đang đọc ảnh chụp cũ. Cô không nghĩ mình
đang sửa "bản gốc"; cô nghĩ mình đang sửa "cái đề".

Nên luật đúng có **hai vế**, thiếu vế nào cũng hỏng:
1. Giao bài thì chép câu hỏi thành bản riêng của bài giao.
2. Sửa đề trong ngân hàng thì **lan truyền** xuống các bài giao — nhưng chỉ những bài
   chưa ai nộp, và chỉ khi bộ câu hỏi thật sự đổi.

Vế 2 của bản cũ lan truyền xuống *mọi* bài giao khớp `exam_id`. Đó vẫn còn hở: lan xuống
một bài đã có người nộp là đổi đề sau lưng người đã làm xong. Bản mới nên chặt hơn.

### 3.2 🔴 Giới hạn tần suất phải đếm trong CSDL

`lib/domain/tenant/otp.ts` khai báo `OTP_SO_LAN_THU_TOI_DA = 5` — nhưng **không chỗ nào ép**.
Hằng số không có răng.

Bản cũ có `check_rate_limit` đếm trong CSDL, và ghi rõ lý do: *"đếm trong CSDL nên không
lách được bằng nhiều tab"*. Bản cũ còn đếm lần đăng nhập trong `sessionStorage` — và tự
nhận đó là chỗ yếu.

Với bản mới chuyện này nặng hơn bản cũ, vì **không có mật khẩu**. OTP 6 chữ số là toàn bộ
cánh cửa. Một triệu khả năng nghe nhiều, nhưng thử không giới hạn thì vào trong vài giờ.

### 3.3 🟠 Hạn mức phải nằm trên bản ghi tenant

Bản mới chưa có khái niệm hạn mức nào. `PLAN.md` đặt ngân sách "≤3.000đ/học viên/tháng"
nhưng không có gì ép.

Bản cũ đặt hạn mức **ngay trên bản ghi trung tâm** (`max_digitize_count`, `used_digitize_count`…)
và kiểm **ở server, trước khi gọi AI**. Vết sẹo số 8: *"Vượt gói vẫn tiêu tiền API"*.

### 3.4 🟠 Cache số hoá dùng chung giữa các tenant

Bản cũ băm nội dung tệp làm khoá, cache **dùng chung liên trung tâm**: hai cô số hoá cùng
một quyển Cambridge chỉ tốn một lần gọi AI. Nhật ký dùng thì vẫn tách theo từng trung tâm
để tính tiền.

Đây là cách rẻ nhất để giữ ngân sách AI, và bản mới chưa có. Với thị trường luyện thi
Việt Nam — nơi ai cũng dùng chung mấy bộ Cambridge, ETS, 千锤百炼 — tỉ lệ trúng cache sẽ rất cao.

> Lưu ý riêng tư: cache dùng chung là chia sẻ **kết quả bóc từ một tệp giống hệt nhau**,
> không phải chia sẻ dữ liệu của cô. Nhưng nó vẫn để lộ một chuyện: cô A biết được cô B
> đã từng số hoá đúng quyển đó (qua thời gian phản hồi). Nếu thấy điều đó không chấp nhận
> được thì tách cache theo tenant và chịu chi phí.

---

## 4. Bốn thứ bản mới có mà bản cũ không có

Đây là lý do viết lại thay vì vá.

### 4.1 `events` — nhật ký cho mọi vai, không riêng quản trị

Bản cũ chỉ ghi `admin_audit_logs`. Việc cô làm với điểm số của một đứa trẻ **không được
ghi lại ở đâu cả**. Bản mới ghi mọi hành vi, ghi *trước* khi có hiệu lực, và tính sẵn ai
được nhìn thấy.

Đây không phải tính năng thêm — nó là điều kiện để có UC-17, và là cách duy nhất truy
ngược được khi cô hỏi "sao em này bị 5.0".

### 4.2 `can()` — một hàm cho toàn bộ quyền

Bản cũ kiểm quyền rải rác: RLS ở CSDL, `current_user_is_teacher()` ở vài chỗ, kiểm vai
trò ở layout phía client. Tài liệu bản cũ tự cảnh báo: *"Bản hiện tại gọi Supabase trực
tiếp từ trình duyệt, nên RLS là hàng rào an ninh duy nhất."*

Bản mới có một hàm sinh từ `permissions.json`, và mọi ghi đi qua server.

### 4.3 Ba lớp dữ liệu — AI không bao giờ ghi vào sự thật

Bản cũ không có khái niệm này. Kết quả AI đi qua tay cô rồi vào thẳng `exam_bank` — tốt,
nhưng đó là quy ước, không phải ràng buộc. Bản mới ép ở tầng CSDL: máy chỉ sinh được
`draft`/`propose`/`auto:*`.

### 4.4 Hồ sơ năng lực xuyên lớp

Bản cũ có sổ điểm theo lớp. Bản mới có hồ sơ theo **người**, xuyên lớp, và đó là nguyên
liệu cho mọi đề xuất ở bước 5–8 của vòng vận hành. Bản cũ không có gì tương đương.

---

## 5. Phương án tối ưu — không chọn một trong hai

Câu hỏi "bản nào tốt hơn" đặt sai. Hai bản mạnh ở hai chỗ khác nhau:

- **Xương sống bản mới tốt hơn.** `events`, `can()`, ba lớp dữ liệu, hồ sơ năng lực —
  bốn thứ này không vá vào bản cũ được, phải có từ đầu. Bản mới đã có cả bốn.
- **Vết sẹo bản cũ đáng giá hơn mọi đặc tả.** 15 dòng ở §12 là 15 lần hỏng thật.

**Phương án: giữ nguyên kiến trúc bản mới, nhập bốn vết sẹo ở §3 vào trước khi dựng
chặng 5.** Không phải chép tính năng — chép *bài học*.

Lý do phải làm ngay, không để sau: cả bốn đều là chỗ **hỏng mà không báo lỗi**. Bài giao
đổi dưới chân học viên không ném exception. OTP bị dò không ai biết. Vượt ngân sách AI chỉ
lộ ra ở hoá đơn cuối tháng. Đúng loại lỗi mà cả hai tài liệu đều nói là đắt nhất.

### Thứ tự làm, xếp theo rủi ro

| # | Việc | Vì sao gấp | Trạng thái |
|---|---|---|---|
| 1 | Bài giao là ảnh chụp + lan truyền có điều kiện | Chặng 5 dựng ngay bây giờ; làm sai thì phải gỡ cả bảng | ✅ làm trong PR này |
| 2 | Giới hạn tần suất đếm trong CSDL | Không mật khẩu, OTP là cánh cửa duy nhất, và đang không khoá | ✅ làm trong PR này |
| 3 | Hạn mức trên tenant, kiểm trước khi gọi AI | Cần trước khi nối AI thật (chặng 4 phần OCR) | ⬜ chặng 4 |
| 4 | Cache số hoá dùng chung theo băm tệp | Cần trước khi nối AI thật | ⬜ chặng 4 |

### Ba chỗ bản cũ có mà bản mới cố ý bỏ — xác nhận lại

Không phải thiếu sót, nhưng nên biết mình đang bỏ gì:

| Bản cũ có | Bản mới | Nhận xét |
|---|---|---|
| `super_admin` duyệt trung tâm mới | `SRS` §2: "Không có vai admin nền tảng nhìn nội dung bài" | Nhìn **nội dung** thì đúng là không nên. Nhưng **ai duyệt tên miền mới**? `app/(public)/dang-ky` hiện chưa nói. Cần chốt. |
| Lịch + xuất ICS | Không có trong `SRS` | Bản mẫu `oblue-platform-demo.html` có mục "Tuần này · lịch dạy + hạn nộp". Cần chốt là bỏ hay hoãn. |
| Khoá học tách khỏi lớp (`courses`) | `paths` (lộ trình) | Gần tương đương. `paths` thiên về *kế hoạch buổi*, `courses` thiên về *nội dung học*. Với khách hàng là giáo viên đã có lớp, `paths` hợp hơn. |

---

## 6. Một chỗ bản cũ làm chưa tới, bản mới nên làm khác

Vết sẹo số 1 của bản cũ nói: lan truyền sửa đề xuống **mọi** `class_assignments` khớp `exam_id`.

Chưa đủ chặt. Bài đã có người nộp mà bị lan truyền là **đổi đề sau lưng người đã làm xong** —
điểm của em tính trên một bộ câu hỏi không còn tồn tại. Bản cũ tránh được lỗi "không thấy
đoạn văn" nhưng mở ra lỗi này.

Bản mới chỉ lan truyền xuống bài giao **chưa ai nộp**. Bài đã có người nộp thì giữ nguyên
ảnh chụp, và báo cho cô biết có bao nhiêu bài không nhận được sửa đổi — để cô quyết định
giao lại thành "lần 2" (`attempt_no`) nếu cần.
