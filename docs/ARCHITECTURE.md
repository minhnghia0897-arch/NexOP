# ARCHITECTURE — OBLUE

## 1. Bounded contexts
```
Tenant  (tài khoản, tên miền, thành viên, quyền, đăng nhập)
  ↓
Class   (lớp, lộ trình, thành viên lớp, bảng tin, điểm danh)
  ↓
Content (ngân hàng đề, câu hỏi, đoạn văn, OCR)
  ↓
Work    (bài giao, bài nộp, nháp chấm, nhận xét, band, ma trận điểm)
  ↓
Profile (hồ sơ năng lực học viên, lỗi lặp, xu hướng)          ← xuyên lớp
  ↓
Growth  (học phí, gia hạn, giữ người, lên lớp, luyện thêm, chia sẻ doanh thu)
Events  (nhật ký hành vi)                                      ← cắt ngang tất cả
```
Quy tắc phụ thuộc: chỉ từ trên xuống. `Work` không import `Growth`. `Profile` chỉ đọc `Work`.
Kiểm tra quyền ở middleware/`can()`, không ở component.

## 2. Thực thể (tối thiểu)
```
accounts        id, phone, email, name                       ← toàn cục, 1 người = 1 dòng
tenants         id, subdomain, owner_account_id, status(pending|active|suspended),
                approved_at?, approved_by?, status_reason?   ← không `active` thì đọc rỗng, ghi hỏng
                                                             (approved_by trống = máy tự duyệt)
platform_admins account_id                                   ← chỉ khoá/gỡ khoá tên miền, không thấy nội dung
ai_usage        id, tenant_id, task(digitize|grade|profile|suggest), est_cost_vnd,
                actual_cost_vnd?, allowed, cache_hit, at    ← sổ tiền AI, chỉ quyết toán một lần
digitize_cache  (file_sha256, model, prompt_version) → result jsonb
                                                             ← KHÔNG có tenant_id, cố ý: xem DECISIONS
memberships     id, account_id, tenant_id, class_id?, role(owner|assistant|student|parent),
                permissions jsonb, status(pending|active|left), invite_token?, invited_phone?
classes         id, tenant_id, name, schedule, capacity, path_id, status
paths           id, tenant_id, name, sessions jsonb[{no, content, homework, exam_id?, weight?}]
exams           id, tenant_id, name, skill, level, tags[], duration, grading(auto|draft|manual), ocr_confidence
questions       id, exam_id, no, type, text, options jsonb, answer, explanation, passage_id?, warning?
                          ← exams/passages/questions chỉ ghi qua import_digitized_exam | save_exam_edit
passages        id, exam_id, text, range
assignments     id, tenant_id, class_id, exam_id?, questions jsonb, due_at, grading, weight,
                published_at, attempt_no        ← questions là ẢNH CHỤP lúc giao, xem DECISIONS 2026-09
submissions     id, assignment_id, student_id, content, words, duration_s, submitted_at, late bool
drafts          id, submission_id, band_by_criterion jsonb, errors jsonb, feedback_text,
                confidence, flags[], by(system|assistant), expires_at                 ← lớp 3
reviews         id, submission_id, band, band_by_criterion, feedback_text, sent_at, by_account  ← lớp 1
profiles        id, student_id, skill, band_current, band_target, criteria jsonb,
                recurring_errors jsonb, resolved_errors jsonb, trend, habits jsonb, confidence   ← lớp 2
practice_sets   id, student_id, source_error, items jsonb, result jsonb
fees            id, membership_id, package, amount, due_at, paid_via(platform|manual), paid_at
proposals       id, tenant_id, kind(renewal|retain|promote|invite|practice), target_id,
                payload jsonb, reason, expires_at, decided(by, at, action)                  ← lớp 3
posts           id, class_id, author_id, kind(post|assignment|reminder), body, pinned
attendance      id, class_id, session_no, student_id, present
events          id, tenant_id, class_id?, actor_id, actor_role, action, object_type, object_id,
                payload jsonb, visibility[], at                                          ← lớp 1
teacher_edits   id, tenant_id, draft_id, review_id, diff jsonb                            ← nguyên liệu học giọng cô
rate_limit_events id, key, at                   ← đếm lần thử trong CSDL, không ở trình duyệt
```

## 3. Ba lớp dữ liệu
| Lớp | Bảng | Ai ghi | Sửa? | Nếu mất |
|---|---|---|---|---|
| 1 Sự thật | submissions, reviews, fees, attendance, posts, events, teacher_edits | Người (qua hành động thật) | Chỉ thêm | Mất thật |
| 2 Suy luận | profiles, questions.answer (OCR), errors trong drafts | Máy; cô sửa được | Tính lại được từ lớp 1 | Chạy lại |
| 3 Đề xuất | drafts, proposals, practice_sets (chưa làm) | Máy / trợ giảng | Có `expires_at` | Không sao |

Luật: **AI không ghi lớp 1.** Chuyển từ lớp 3 → lớp 1 chỉ qua hành động của `owner` (hoặc luật cô đã bật, vẫn ghi `by = system:rule:<id>`).

## 4. Sự kiện (events)
Mọi hành vi = 1 sự kiện, ghi **trước** khi có hiệu lực (transaction: insert event → mutate → commit).
```
action đặt tên theo mẫu  <object>.<verb>   verb ∈ {create, update, draft, propose, send, approve, reject, view, export}
```
- `system` chỉ được `draft`, `propose`, `auto:*` (nhắc, chốt trắc nghiệm ≥97%, cập nhật profile).
- `assistant` ở mức "Đề xuất" chỉ được `draft`; không bao giờ `send`.
- `send` (nhận xét tới học viên, tin học phí) chỉ do `owner`.
- `visibility` tính lúc ghi: owner luôn; student nếu object thuộc về em; assistant nếu là actor.
Sự kiện sinh việc tiếp theo qua hàng đợi (Supabase queue/cron), không gọi trực tiếp.

## 5. Quyền
Một hàm duy nhất, mọi API route/server action gọi trước khi làm gì:
```ts
can(actor: {accountId, tenantId, role, classIds, permissions}, action: string, object: {type, id, tenantId, classId?, ownerId?}): boolean
```
Mức: `none | read | own | propose | full | auto`. Ma trận mặc định: `docs/permissions.json` (xuất từ demo).
Trần cứng vai `assistant` (không cấp được): fees, rubric, teacher notes, export.
Trần cứng vai `student`: chỉ `own`; không thấy drafts, teacher notes, ma trận lớp.
RLS ở DB mirror lại `can()` cho `read`; `write` luôn qua server.

## 6. Đăng nhập & tư cách
- 1 SĐT = 1 `account` toàn cục. Vai = `memberships` theo tenant (và class).
- Không có chọn vai khi đăng nhập. Nhập SĐT → tra memberships của tenant hiện tại → nếu 1 → vào thẳng; nếu >1 → hỏi 1 lần, lưu `last_role`.
- Lời mời = `membership(status=pending, invite_token, invited_phone)`. Link `/m/<token>`: 1 lần, 7 ngày. Mở link: hiện tenant + lớp + vai trước; nhập SĐT; khớp `invited_phone` → OTP → `active`; không khớp → từ chối + event cho owner.
- Owner đăng nhập bằng email (OTP email/Zalo); student/assistant bằng SĐT. Không mật khẩu.
- SĐT không có membership ở tenant → không tạo account; chỉ form "học thử" → `proposals(kind=invite)` chờ owner.
- Cùng account ở 2 tenant: mỗi tên miền một góc nhìn; "Lớp khác của em" chuyển tên miền.

## 7. Điểm tích hợp AI — đúng 4
| # | Điểm | Vào | Ra | Model | Ghi vào |
|---|---|---|---|---|---|
| 1 | Đọc | PDF/ảnh/bài viết | cấu trúc + tin cậy + vị trí | nhỏ, rẻ | questions (lớp 2) |
| 2 | Nháp chấm | bài + rubric cô + 3 bài trước + `teacher_edits` gần nhất (20–50 cặp, cache) | band/tiêu chí, lỗi, nhận xét giọng cô, tin cậy, flags | vừa/lớn | drafts (lớp 3) |
| 3 | Cập nhật hồ sơ | reviews đã chốt | band có trọng số, lỗi lặp (gom loại), xu hướng | chủ yếu số học; model nhỏ để gom lỗi | profiles (lớp 2) |
| 4 | Đề xuất | profiles + fees + attendance | bài luyện, cảnh báo, lên lớp, tin gia hạn/giữ người + lý do | vừa | proposals, practice_sets (lớp 3) |
Không có điểm 5. Mọi call qua `/lib/ai/<task>.ts` với interface `run(task, input) → schema-validated JSON`; `model` đọc từ config theo task.

### Phán đoán trình độ (điểm 3) — quy tắc
- band hiện tại = trung bình có trọng số 4 bài gần nhất (mới nặng hơn; mock ×2).
- lỗi lặp: ≥2 bài liên tiếp; ≥3 → tự sinh bài luyện; dứt khi 2 bài liên tiếp không tái phạm.
- tin cậy hồ sơ: thấp <3 bài cô duyệt; đủ ≥6. Tin cậy thấp → không đề xuất lên lớp.
- band trong hồ sơ luôn là band **cô chốt** (reviews), không phải drafts.

### Bộ test cố định (hợp đồng với model)
`tests/ai/fixtures/`: ≥50 bài (lớp 1) có band cô đã chốt + nhận xét cô. Đổi model → chạy điểm 2 → khớp band ±0.5 ≥80% và nhận xét không vi phạm luật giọng cô → mới đổi config.

## 8. Thư mục
```
app/(tenant)/[subdomain]/(teacher)/...   rail đầy đủ
app/(tenant)/[subdomain]/(student)/...   tab đáy
app/(tenant)/[subdomain]/m/[token]       nhận lời mời
app/(public)/dang-ky                     tạo tenant
lib/domain/<context>/                    logic thuần, không phụ thuộc framework
lib/ai/                                  4 task + router + schema
lib/auth/can.ts                          hàm quyền duy nhất
lib/db/                                  nơi duy nhất gọi Supabase
design/tokens.css                        nguồn màu/chữ duy nhất
```
