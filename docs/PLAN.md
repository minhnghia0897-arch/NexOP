# PLAN — dựng website OBLUE

Hành vi chi tiết (vòng đời, `can()`, công thức, bất biến) nằm ở `LOGIC.md` — đọc kèm file này.

Nguồn: `SRS.md` (use case), `ARCHITECTURE.md` (thực thể, sự kiện, quyền), `DECISIONS.md` (vì sao),
`DESIGN.md` + `tokens.css` + 3 bản mẫu HTML, `OPERATIONS.md` (vòng tuần), `permissions.json` (ma trận quyền).
Kế hoạch này **không đổi** quyết định nào trong `DECISIONS.md`. Muốn đổi → thêm mục mới ở đó trước.

---

## 0. Hiện trạng

### Bản khung chạy được (2026-09-08)

`pnpm dev` rồi mở `/tong-quan` là dùng được ngay — không cần Supabase, khoá AI hay tên miền.
Bốn màn: **Tổng quan · Chấm bài · Lớp học · Nhật ký**, cộng công tắc đổi vai ở góc phải.

Dữ liệu giả (`lib/demo/`), nhưng **luật thật**: mọi ghi qua `can()`, ghi `events` trước khi có
hiệu lực, máy chỉ nháp. Đổi sang Supabase là đổi thân hàm trong `lib/demo/kho.ts`.

Đáng thử theo thứ tự này:
1. **Chấm bài** ở vai *Cô* — sửa nhận xét rồi bấm Gửi. Chồng bài ngắn lại một bài.
2. Đổi sang **Trợ giảng** — dải cam hiện lên, nút đổi thành "Gửi nhận xét cho cô duyệt".
   Bấm thử: bản soạn dừng ở hàng chờ của cô, em vẫn chưa thấy gì.
3. Về **Cô** — chồng bài hiện dấu "Phạm Lan đã soạn · chờ cô gửi".
4. **Nhật ký** ở ba vai — cùng một dữ liệu, ba danh sách khác nhau, lọc theo `visibility`
   tính lúc ghi. Vai *Học viên* chỉ thấy dòng gửi cho chính em.
5. **Chấm bài** ở vai *Học viên* — rỗng, và màn hình nói vì sao. Nháp là lớp 3.

Chưa có: đăng nhập thật · wizard tạo đề · học phí · lộ trình · màn học viên đầy đủ.


**Có:**
- 6 tài liệu đặc tả đầy đủ (18 use case có tiêu chí chấp nhận, 20 bảng, 4 điểm AI, ma trận quyền JSON).
- 3 bản mẫu HTML **đã duyệt** — là hợp đồng giao diện, không phải gợi ý:
  - `oblue-platform-demo.html` (1401 dòng) — 11 màn giáo viên/trợ giảng:
    `home · tahome · grade · stu · cls · class · path · bank · fee · feed · cfg`
  - `oblue-student-demo.html` (694 dòng) — 7 màn học viên:
    `today · work · submit · feed · prog · prac · drill`
  - `oblue-auth-demo.html` (793 dòng) — 10 bước đăng nhập:
    `login · otp · teachlogin · stu · ta · multi · lead · map · stuhome · tahome`
- `tokens.css` — nguồn màu/chữ duy nhất, đã sinh từ bản mẫu.

**Chưa có:** toàn bộ code. Không `package.json`, không `app/`, không migration, không test.

**Dọn dẹp — đã làm:**
1. ✅ Chuyển tài liệu về `docs/` và `design/` cho khớp đường dẫn `CLAUDE.md` trỏ tới.
2. ✅ Xóa `CLAUDE (3).md` (trùng byte-với-byte `CLAUDE.md`).
3. ⬜ Kho tên `NexOP`, sản phẩm tên `OBLUE` — thống nhất hoặc ghi rõ vì sao khác.

**Khung xem bản mẫu — đã làm.** `index.html` ở gốc: chuyển qua lại 3 bản mẫu, có chế độ 375px cho màn học viên.
Tĩnh, không phụ thuộc gì, chỉ để trình bày trước khi có code thật. Sẽ bỏ khi chặng 3 dựng xong màn thật.

---

## 1. Cấu trúc thư mục mục tiêu

```
app/(public)/dang-ky/                     tạo tenant
app/(tenant)/[subdomain]/(teacher)/       11 màn — rail 104 + panel 260 + canvas 1180
app/(tenant)/[subdomain]/(student)/       7 màn — tab đáy 60, dùng được ở 375px
app/(tenant)/[subdomain]/m/[token]/       nhận lời mời
app/api/ai/{read,draft,profile,propose}/  4 điểm AI — nơi duy nhất gọi LLM
lib/domain/{tenant,class,content,work,profile,growth}/   logic thuần, không import framework
lib/ai/{read,draft,profile,propose}.ts + router.ts + schema.ts
lib/auth/can.ts                           hàm quyền DUY NHẤT
lib/db/                                   nơi DUY NHẤT gọi Supabase
lib/events/                               ghi sự kiện; mọi mutation đi qua đây
components/ui/                            paper · tbl · matrix · drawer · modal · steer · tag · pm · tabanner
design/tokens.css                         nguồn hex duy nhất
design/_reference/*.html                  3 bản mẫu (chuyển từ gốc vào)
docs/*.md                                 SRS · ARCHITECTURE · DECISIONS · OPERATIONS · permissions.json
supabase/migrations/                      theo thứ tự chặng bên dưới
tests/{unit,ai/fixtures,e2e}/
```

Luật phụ thuộc (kiểm bằng lint rule, không bằng niềm tin):
`Tenant → Class → Content → Work → Profile → Growth`, chỉ đi xuống.
`Work` không import `Growth`. `Profile` chỉ đọc `Work`. `Events` cắt ngang.

---

## 2. Ba thứ dựng từ ngày đầu, không hoãn

Cả ba đều rẻ lúc này và cực đắt khi nhét sau.

**a) `events` + `lib/events/write.ts`** — mọi mutation là `insert event → mutate → commit` trong một
transaction. Ghi sự kiện thất bại thì hành vi không xảy ra. `action` theo mẫu `<object>.<verb>`,
`verb ∈ {create, update, draft, propose, send, approve, reject, view, export}`.
`visibility[]` tính **lúc ghi**, không tính lúc đọc.

**b) `lib/auth/can.ts`** — sinh từ `permissions.json`, không viết tay bảng thứ hai.
```ts
can(actor: {accountId, tenantId, role, classIds, permissions},
    action: string,
    object: {type, id, tenantId, classId?, ownerId?}): boolean
```
Mọi API route và server action gọi nó **trước** khi làm gì. Không component nào tự kiểm tra quyền.
Trần cứng phải là code, không phải cấu hình: `assistant` không bao giờ chạm `fee · rubric · teacher_notes · export`;
`review.send` / `message.send` / `fee.message.send` chỉ `owner`.

**c) RLS bật cho mọi bảng ngay từ migration đầu.** RLS mirror `can()` cho `read`; mọi `write` qua server.
Mọi query lọc `tenant_id`; bảng theo lớp lọc thêm `class_id`.

---

## 3. Lộ trình 11 chặng

Thứ tự theo README: Tenant/Auth → Class → Exam/OCR → Assignment/Submission → Draft/Review → Profile → Growth.
Ước lượng theo tuần-người, giả định 1 người làm full-time.

### Chặng 0 — Nền móng · ✅ xong
Next.js 15 App Router + TypeScript strict (`noUncheckedIndexedAccess`) · Tailwind v4 bắc cầu
`@theme inline` sang `design/tokens.css` (tiện ích trỏ `var(--ink)`, không hex trong class) ·
Be Vietnam Pro + Inter qua `next/font` (tự lưu, không phụ thuộc Google lúc chạy) ·
`lib/db/server.ts` là nơi duy nhất gọi Supabase · `pnpm dev|build|lint|typecheck|test|db:migrate` ·
CI chạy `lint → typecheck → test → build`.

`pnpm lint` gọi kèm `scripts/check-tokens.mjs` — quét hex ngoài `design/tokens.css` và fail nếu có.
Test đầu tiên kiểm mọi `var()` trong `globals.css` đều có định nghĩa; gõ sai tên biến thì CSS im lặng
bỏ qua và màu biến mất, bắt bằng test rẻ hơn bắt bằng mắt.

**Còn nợ:** chưa nối Supabase thật (chưa có project) · chưa deploy Vercel với wildcard subdomain.

### Chặng 1 — Xương sống quyền & sự kiện · ✅ phần lớn xong
`migration 0001`: `accounts` · `tenants` · `memberships` · `events`, RLS bật cho cả bốn.
`lib/auth/can.ts` + `permissions.ts` sinh từ `permissions.json` · `lib/events/write.ts` +
`visibility.ts`.

Ba luật ép ở tầng DB chứ không chỉ ở mã: máy chỉ `draft`/`propose`/`auto:*`, "gửi" chỉ do `owner`,
nhật ký chỉ được thêm (trigger chặn update/delete). Hành vi bị cấm không có hiệu lực kể cả khi
mã ứng dụng sai.

`app.record_event()` là câu lệnh đầu tiên của mọi hàm mutation về sau — Supabase JS không mở được
transaction nhiều câu lệnh, nên chỗ duy nhất giữ được "ghi sự kiện trước" là bên trong Postgres.

**Đã kiểm bằng chạy thật:** 39 test, trong đó 17 test chạy trên Postgres 16 thật (RLS, ràng buộc,
tính nguyên tử của mutation). CI có service Postgres nên nhóm này chạy cả trên runner.
Đã đột biến từng cửa chặn của `can()` để chắc test biết đỏ.

**Còn nợ:** middleware giải subdomain → `tenant_id` (làm cùng chặng 2, nơi có phiên đăng nhập thật).

### Chặng 2 — Tenant & đăng nhập · 🔨 phần logic xong, còn giao diện · UC-18, UC-02

**Đã có (migration 0002 + `lib/domain/tenant/`):** chuẩn hoá SĐT (gồm quy đổi đầu số 11 chữ số
trước 2018) · dán danh sách từ Excel/Zalo · vòng đời lời mời đủ 5 nhánh · đăng ký học thử ·
xác định tư cách từ `memberships` · sinh và băm mã OTP. 82 test, 31 chạy trên Postgres thật.

**Đã thêm:** middleware giải subdomain (chặn cả `cothao.oblue.vn.ke-gian.com` lẫn header giả) ·
màn `/dang-nhap`, `/hoc-thu`, `/m/<token>` · `app.peek_invite` cho trang công khai đọc lời mời mà
không cần khoá service.

**Đã thêm (migration 0008–0010, chốt 2026-09-07):** vòng đời tên miền `pending → active →
suspended` · `app.register_tenant` **tự duyệt khi đăng ký**, admin giữ van khoá chứ không giữ cổng ·
tên miền không `active` bị chặn ở CSDL cả đọc lẫn ghi, không phải ẩn ở giao diện · admin thấy danh
sách tên miền nhưng không thấy lớp, đề, bài đăng hay nhật ký (`SRS` §2 vẫn đúng). 26 test.

**Chưa có:** màn nhập OTP và màn chọn tư cách · màn khoá/gỡ khoá cho admin · các server action xử
lý form (cần Supabase thật) · nhà cung cấp OTP (đang sau interface `GuiOtp`; `taoKenhGui()` ném lỗi
ở production để không âm thầm không gửi).

Mô tả gốc:
Một ô SĐT, **không chọn vai** — vai tra từ `memberships`. Owner vào bằng email.
Link mời `/m/<token>`: 1 lần, 7 ngày, hiện tên cô + tên lớp + vai **trước khi** nhập gì.
SĐT lệch `invited_phone` → từ chối + sinh event cho owner. SĐT không có membership → không tạo account,
chỉ form học thử → `proposals(kind=invite)`. 2 tư cách cùng tenant → hỏi một lần, nhớ `last_role`.
Nhập học viên hàng loạt: dán từ Excel/Zalo.
**Xong khi:** 10 bước của `oblue-auth-demo.html` chạy thật; e2e phủ 3 nhánh từ chối.
**Chặn ngoài:** cần chốt nhà cung cấp OTP (Zalo ZNS / SMS) — xem §7.

### Chặng 3 — Lớp học · 🔨 nền dữ liệu xong, còn giao diện · UC-10, UC-15, UC-14

**Đã có (migration 0004):** `paths` · `classes` · `posts` · `attendance`, RLS theo lớp cho cả bốn.
Khoá ngoại `memberships.class_id` hoãn từ 0001 nay đã gắn, kèm ràng buộc lớp và tư cách phải
cùng tên miền — thiếu nó thì "quyền đi theo lớp" mất nghĩa.

**Đã kiểm bằng chạy thật:** em lớp A không đọc được gì của lớp B qua bất kỳ bảng nào; em nghỉ
là mất quyền ngay; lộ trình chỉ cô thấy; điểm danh em chỉ thấy dòng của mình. Đã thử nới một
chính sách RLS để chắc test biết đỏ.

**Chưa có:** trang lớp 5 tab, quyền trợ giảng theo lớp × theo việc, dải cam vai trợ giảng.

Mô tả gốc:
`classes` · `memberships(class_id)` · `posts` · `attendance`.
Trang lớp 5 tab (Bảng tin mặc định · Bài tập · Học viên · Điểm · Chấm bài) — **mọi tab xử lý trong phạm vi lớp**,
không màn nào điều hướng ra ngoài. Panel 260 = danh sách lớp = bộ lọc chung cho mọi màn.
Trợ giảng: quyền theo lớp × theo việc (Không/Chỉ xem/Đề xuất/Tự làm), dải cam `tabanner`, đổi quyền có
hiệu lực ngay không cần đăng nhập lại.
**Xong khi:** rời lớp → không đọc được dữ liệu lớp đó ở bất kỳ đường nào (test rò rỉ chéo lớp);
"Đề xuất" của trợ giảng chỉ sinh `draft`, không bao giờ `send`.

### Chặng 4 — Ngân hàng đề + OCR · 🔨 nền dữ liệu xong · UC-03, UC-04 · **AI điểm 1**

**Đã có (migration 0006):** `exams` · `passages` · `questions`, RLS cho cả ba.
Đề gắn vào tenant chứ không gắn vào lớp — xoá lớp thì đề còn (DECISIONS 2026-09).

Ba ràng buộc đáng chú ý, đều chặn kiểu hỏng **không kêu**:
- Câu chấm máy được mà thiếu đáp án **phải** mang cảnh báo. Không có luật này, một câu
  OCR đọc hụt lặng lẽ thành câu không ai chấm — máy bỏ qua vì không có đáp án, cô bỏ
  qua vì không thấy cảnh báo, em làm xong không bao giờ nhận điểm câu đó.
- Đoạn văn phải phủ số câu và cùng đề — gán nhầm thì em đọc một đoạn không liên quan.
- `ocr_confidence` trong 0–1. Ghi 94 thay vì 0.94 thì ngưỡng tự chốt ≥0.97 của UC-07
  đúng cho mọi đề, kể cả đề đọc hỏng.

Học viên **không** đọc ngân hàng đề: em thấy đề qua bài giao. Mở ra là lộ cả đề chưa giao.

**Đã có (migration 0011–0012):** hạn mức AI đếm trong CSDL — trần theo số học viên hoạt động
(3.000đ/em/tháng, sàn 50.000đ), xin phép trước khi gọi và quyết toán sau, lần bị chặn vẫn ghi
lại và sinh sự kiện cô đọc được · cache số hoá dùng chung liên tenant, khoá `(băm tệp, model,
phiên bản prompt)`. 30 test. Hai thứ này phải có **trước** khi nối AI thật, không phải sau —
vượt ngân sách chỉ lộ ra ở hoá đơn cuối tháng.

**Đã có (migration 0013):** một **cửa ghi duy nhất** vào ngân hàng đề —
`app.import_digitized_exam` (UC-03) và `app.save_exam_edit` (UC-04). Mỗi cửa ghi sự kiện trước
rồi mới sửa, và `save_exam_edit` **gọi lan truyền bên trong** nên vế hai của luật ảnh chụp
(0007) không còn là việc phải nhớ. Cảnh báo OCR tự tắt khi cô điền đáp án. 22 test.

Chỗ này trước đó hở thật: 0006 có bảng, 0007 có hàm lan truyền, mà **không hàm nào sửa được
câu hỏi** — nên đường duy nhất là ghi thẳng bằng khoá service, không sự kiện, không lan truyền.

**Chưa có:** OCR thật (AI điểm 1, cần khoá Anthropic) · `lib/ai/*` gọi `claim_ai_call` /
`settle_ai_call` rồi đưa kết quả qua `import_digitized_exam` · wizard tạo đề 4 bước ·
màn ngân hàng đề · Storage cho PDF/DOCX/ảnh.

Mô tả gốc:
`exams · questions · passages` · Storage cho PDF/DOCX/ảnh ≤50MB · `lib/ai/read.ts` (model nhỏ, rẻ).
Ra: cấu trúc câu + đáp án + % tin cậy + **vị trí trang**. Câu không tìm thấy đáp án → cảnh báo, mặc định chấm tay.
Wizard tạo đề 4 bước là `modal` — chỗ duy nhất được dùng modal.
4 loại câu: trắc nghiệm, điền từ, T/F/NG, tự luận; trộn được trong một đề; đoạn văn dùng chung cho dải câu.
**Xong khi:** đề in máy 12 trang ≤ 60 giây; khoanh được chỗ chữ mờ; bấm lại đáp án → bỏ chọn → chuyển chấm tay.

### Chặng 5 — Giao bài & nộp bài · ~1.5 tuần · UC-05, UC-06
`assignments · submissions`. Giao nhiều lớp → mỗi lớp một `assignment` riêng. Chặn giao trùng
(giao lại = `attempt_no` có nhãn "lần 2"). Tự đăng bảng tin + đặt nhắc 24h/2h (chỉ học viên có tài khoản, 9:00–21:30).
Editor học viên: đếm từ, đếm đoạn, đồng hồ, lưu mỗi 10 giây, checklist theo lỗi riêng của em.
Nộp dưới yêu cầu từ vẫn cho, nhưng ghi rõ. Sau nộp: màn "chuyện gì tiếp theo" 4 bước.
**Xong khi:** ngoài thành viên lớp không ai thấy đề; học viên **không** thấy band nháp; chạy được ở 375px.

### Chặng 6 — Nháp chấm & cô duyệt · ~2.5 tuần · UC-07, UC-08 · **AI điểm 2** ← lõi sản phẩm
`drafts` (lớp 3) · `reviews` (lớp 1) · `teacher_edits`.
Vào: bài + rubric cô + 3 bài trước + 20–50 cặp `teacher_edits` gần nhất (prompt caching).
Ra: band/tiêu chí, lỗi đánh dấu, nhận xét giọng cô, tin cậy, flags.
Gắn cờ khi lệch > 1.0 so với bài trước hoặc tin cậy < 85%. Trắc nghiệm ≥97% tự chốt nếu cô bật —
vẫn ghi `by = system:rule:<id>`. "Duyệt tất cả" **chỉ** áp cho bài không gắn cờ.
Mọi chỉnh sửa của cô lưu thành cặp học cho lần sau.
**Xong khi:** nháp ≤ 3 phút sau nộp; học viên chỉ thấy khi cô bấm gửi; thẻ `paper` khớp bản mẫu.

> **Cổng pilot.** Hết chặng 6, một cô thật làm được trọn "tối chủ nhật": giao bài → em nộp → máy nháp → cô sửa → gửi.
> Đây là điểm dừng để đi thử với 1–3 giáo viên trước khi dựng tiếp. Chặng 7–10 chỉ đáng làm nếu chặng 6 được dùng thật.

### Chặng 7 — Hồ sơ năng lực · ~1.5 tuần · UC-09, UC-11 · **AI điểm 3**
`profiles` (xuyên lớp) · `practice_sets`. Band hiện tại = trung bình có trọng số 4 bài gần nhất (mới nặng hơn, mock ×2),
và luôn là band **cô chốt**, không phải drafts. Lỗi lặp ≥2 bài liên tiếp; ≥3 → tự sinh bài luyện 5 phút;
dứt khi 2 bài liên tiếp không tái phạm. Tin cậy hồ sơ: thấp <3 bài cô duyệt, đủ ≥6 — thấp thì **không** đề xuất lên lớp.
"Tiến độ" (học viên), "Cần chú ý", "Cả lớp sai chung" đều là góc nhìn của cùng bảng này.
**Xong khi:** bài luyện giải thích nhắc đúng câu em viết sai; ô ma trận Điểm cập nhật ngay sau khi duyệt trong lớp;
không màn nào cho học viên thấy học viên khác.

### Chặng 8 — Lộ trình & mở lớp · ~1 tuần · UC-01
`paths` với `sessions jsonb[{no, content, homework, exam_id?, weight?}]`.
Mở lớp: chọn lộ trình → lịch → sĩ số → mời — ≤3 bước, ≤2 phút, đề theo về sẵn, không soạn lại.
**Xong khi:** lớp mới có đủ N buổi với đề đã gắn; đóng lớp cũ thì đề vẫn còn trong ngân hàng.

### Chặng 9 — Học phí & giữ người · ~2 tuần · UC-12, UC-13 · **AI điểm 4** · 🟠 dính tiền
`fees · proposals`. Cron 7:00 rà: sắp hết hạn → nháp tin theo tình trạng (tiến bộ / đang buông / vượt mục tiêu).
**Đang buông → tin giữ người, không phải tin thu tiền.** Gửi 9:00–21:30, chưa trả lời sau 3 ngày mới nhắc lần 2.
Lên lớp: 2 bài liên tiếp ≥ band mục tiêu → đề xuất; gộp với tin gia hạn nếu trùng thời điểm;
học phí còn lại chuyển sang, không thu lại. Lớp mới ≥ N người mới mở (cô đặt N).
**Xong khi:** không tin nào rời hệ thống khi cô chưa duyệt — kiểm bằng test, không bằng review code.
Ở đây **không có công tắc "tự gửi"**; đó là luật, không phải mặc định.

### Chặng 10 — Nhật ký, trợ giảng đủ, xuất dữ liệu · ~1 tuần · UC-17, UC-14
Màn nhật ký lọc theo người/loại/tiền: cô thấy toàn bộ lớp mình, học viên thấy về chính mình,
trợ giảng thấy việc mình làm. Xuất toàn bộ dữ liệu ra Excel/CSV bất cứ lúc nào — "học viên thuộc về cô"
là luật nền tảng, phải bấm được, không phải gửi yêu cầu hỗ trợ.

### Sau MVP — UC-16 Luyện thêm (M1)
Gói theo lỗi / gói tháng / mock chấm tay; chia doanh thu 30% / 80%; học viên **thấy rõ** phần chia cho cô.
Chỉ mở khi chặng 7 đã cho hồ sơ năng lực sạch.

---

## 4. Chuyển bản mẫu HTML → React

Bản mẫu là hợp đồng: khi `DESIGN.md` mâu thuẫn bản mẫu, **bản mẫu thắng**.

Cách làm: bóc `:root` giữ nguyên trong `design/tokens.css`, rồi chuyển từng `section.screen` thành route.
Component dùng lại, dựng ở chặng 3 trước khi có màn nào phức tạp:

| Component | Dùng ở | Ghi chú |
|---|---|---|
| `paper` | chấm bài | header (band ▲▼, thanh tin cậy) · body 2 cột · footer (cảnh báo, Viết lại, Gửi) |
| `tbl` / `matrix` | học viên, điểm | cột tên **dính** khi cuộn ngang; ô có trạng thái chưa nộp / nộp muộn |
| `drawer` | mọi tác vụ | 520px, tối đa 3 `step`, **một** nút xác nhận — không mở màn mới cho tác vụ đơn |
| `modal` | wizard tạo đề | chỗ duy nhất |
| `steer` | đăng bài, chỉnh cách máy làm | viền gradient cyan→tím, **không dùng chỗ khác** |
| `tag` · `pm` · `tabanner` | khắp nơi | `pm` = mức quyền; `tabanner` = dải cam vai trợ giảng |

Kiểm tự động trong CI: `grep` hex ngoài `tokens.css` → fail. Kiểm gradient trên work surface (trừ `steer`) → fail.

**Copy:** ngôi "cô–em" toàn bộ; máy không tự xưng "AI"; mỗi việc máy làm có một dòng "vì sao" hoặc "chuyện gì tiếp theo";
nút nói đúng việc ("Giao cho 18 em", "Gửi 9:00"); ở vai trợ giảng nút gửi thành "Gửi nhận xét cho cô duyệt".
Dữ liệu mẫu phải thật: tên Việt, band hợp lý, lỗi cụ thể — không "abc", "Test1", "0%".

---

## 5. Bốn điểm AI — không có điểm thứ năm

Mọi call qua `lib/ai/<task>.ts`, interface `run(task, input) → JSON đã validate schema`.
`model` đọc từ config theo task, **không hard-code**. Không gọi LLM ở client, chỉ qua `/api/ai/*`.

| # | Task | Chặng | Ghi vào | Lớp dữ liệu |
|---|---|---|---|---|
| 1 | Đọc (OCR) | 4 | `questions` | 2 — tính lại được |
| 2 | Nháp chấm | 6 | `drafts` | 3 — có `expires_at` |
| 3 | Cập nhật hồ sơ | 7 | `profiles` | 2 |
| 4 | Đề xuất | 9 | `proposals`, `practice_sets` | 3 |

**AI không bao giờ ghi lớp 1** (`submissions · reviews · fees · attendance · posts · events · teacher_edits`).
Chuyển lớp 3 → lớp 1 chỉ qua hành động của `owner`.

**Bộ test cố định (hợp đồng với model):** `tests/ai/fixtures/` ≥50 bài thật có band cô đã chốt + nhận xét cô.
Đổi model → chạy điểm 2 → khớp band ±0.5 ≥80% **và** nhận xét không vi phạm luật giọng cô → mới được đổi config.
Bộ này phải gom **trong lúc pilot chặng 6**; không có nó thì không được đổi model. Đây là việc cần bắt đầu sớm nhất.

**Ngân sách:** ≤ 3.000đ/học viên/tháng. Router theo bước (model nhỏ cho OCR + trắc nghiệm; model lớn cho tự luận),
prompt caching cho rubric + cặp học. Đo chi phí mỗi task ngay từ chặng 4, không đợi đến lúc vượt.

---

## 6. Test & định nghĩa "xong"

- **Quyền** — bảng test sinh thẳng từ `permissions.json`, chạy hết ma trận. Thêm object mới mà quên cập nhật JSON → đỏ.
- **Sự kiện** — mỗi mutation có test: chặn insert `events` → mutation phải rollback.
- **Cách ly** — cross-tenant và cross-class: thử đọc bằng account không thuộc lớp, phải 404 ở cả API lẫn RLS.
- **AI** — fixtures §5; schema validation là test, không phải try/catch.
- **e2e (Playwright)** — mỗi UC một kịch bản, khẳng định đúng câu "Chấp nhận" trong `SRS.md`.
- **Hiệu năng** — nháp ≤3 phút · OCR 12 trang ≤60s · màn lớp ≤1s với 40 học viên × 30 bài (seed dữ liệu thật để đo).
- **Mobile** — mọi màn học viên chụp ở 375px trong CI.

**Trước khi báo xong bất kỳ chặng nào:** `pnpm test` xanh · `pnpm lint` sạch · không hex ngoài `design/tokens.css`.

---

## 7. Cần chốt trước khi bắt đầu

| # | Câu hỏi | Chặn chặng |
|---|---|---|
| 1 | Nhà cung cấp OTP: Zalo ZNS hay SMS brandname? (ảnh hưởng thời gian duyệt template, có thể 1–2 tuần) | 2 |
| 2 | Đã có Supabase project và tên miền `oblue.vn` với wildcard DNS chưa? | 0 |
| 3 | `paid_via = platform` đi qua cổng nào (VNPay/Momo/chuyển khoản đối soát)? | 9 |
| 4 | Có giáo viên pilot chưa? Cần 1–3 cô nhận bài thật ngay sau chặng 6 và cho mượn ≥50 bài đã chấm làm fixtures. | 6 |
| 5 | Kho tên `NexOP`, sản phẩm tên `OBLUE` — đổi tên kho hay giữ? | 0 |
| ~~6~~ | ~~Ai trực hàng chờ duyệt tên miền?~~ Chốt 2026-09-07: **tự duyệt**, admin chỉ giữ van khoá. Hết việc vận hành. | — |

---

## 8. Rủi ro

- **Fixtures AI đến muộn.** Không có 50 bài cô đã chấm thì chặng 6 không kiểm được và không bao giờ đổi được model.
  → Xin bài từ tuần 1, song song mọi chặng khác.
- **Ngân sách AI vượt 3.000đ.** → Đo từ chặng 4, mỗi task một dòng chi phí trong log, không đợi hoá đơn.
- **Nháp không đủ giống giọng cô** → cô không tin, không dùng, không sinh `teacher_edits`, nháp càng không giống.
  Đây là vòng xoáy duy nhất có thể giết sản phẩm. → Cổng pilot sau chặng 6 tồn tại chính vì việc này.
- **Quyền/rò rỉ nhét sau.** → Đã đặt ở chặng 1, không thương lượng.
- **OTP duyệt template lâu.** → Chốt nhà cung cấp trong tuần 0, không đợi tới chặng 2.

---

## 9. Tổng

Chặng 0–6 ≈ **11–12 tuần** tới bản một cô thật dùng được cho "tối chủ nhật".
Chặng 7–10 ≈ **5–6 tuần** nữa tới đủ vòng vận hành tuần trong `OPERATIONS.md`.
UC-16 sau đó.
