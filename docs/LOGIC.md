# LOGIC — hành vi hệ thống OBLUE

`SRS.md` nói **cái gì**. `ARCHITECTURE.md` nói **cấu trúc**. `PLAN.md` nói **thứ tự làm**.
File này nói **chuyện gì xảy ra khi nào**: vòng đời, ai được chuyển trạng thái, công thức tính,
cái gì phải luôn đúng. Đọc sau ba file kia.

Khi mâu thuẫn: `SRS.md` thắng về phạm vi · `ARCHITECTURE.md` thắng về cấu trúc · file này thắng về hành vi.
Mọi trạng thái dưới đây là **suy ra được** từ cột trong bảng, không thêm cột `status` nếu không ghi rõ.

---

## 1. Vòng đời

### 1.0 tenant — tên miền
```
(cô đăng ký) → pending ──máy tự duyệt──→ active ──admin khoá (kèm lý do)──→ suspended
                   ↑                       ↑                                    │
            (không còn đường               └──────────admin duyệt lại───────────┘
             nào đi vào đây)
```
| Chuyển | Ai | Sự kiện | Ghi chú |
|---|---|---|---|
| → `pending` | owner | `tenant.create` | `app.register_tenant`; trạng thái này chỉ tồn tại trong một khoảnh khắc của hàm |
| `pending` → `active` | system | `tenant.auto:approve` | tự duyệt; `approved_at` có, `approved_by` **để trống** — không ai ký |
| `pending` → `active` | admin | `tenant.approve` | duyệt tay; ghi cả `approved_by`. Từ 0010 chủ yếu dùng để **gỡ khoá** |
| `active` → `suspended` | admin | `tenant.suspend` | **bắt buộc** có lý do, cô đọc được |
| `suspended` → `active` | admin | `tenant.approve` | duyệt lại một tên miền đang chạy trả `false`, không ghi sự kiện thừa |

Vai của lần tự duyệt là `system`, mà `ARCHITECTURE` §4 chỉ cho máy sinh `draft`/`propose`/`auto:*` —
nên nó tên `tenant.auto:approve`, không phải `tenant.approve`. Ràng buộc ở 0001 tự ép: đặt tên sai
thì migration không chạy nổi. Và nhờ vậy nhật ký phân biệt được hai loại bút phê mà không thêm cột.

`pending` **vẫn là trạng thái hợp lệ và vẫn bị chặn đủ**, chỉ là không còn đường nào đi vào đó khi
đăng ký. Bật lại hàng chờ là sửa một dòng trong `app.register_tenant`; cửa đã kín sẵn, có test.

`status <> 'active'` chặn ở **hai cửa, cả hai trong CSDL**:

- **đọc** — `is_active_member` · `is_tenant_owner` · `is_class_member` · `owns_class` · `may_read_exam`
  đều đòi tên miền đang hoạt động. Mọi chính sách RLS đi qua năm hàm này, nên không có chính sách nào
  phải nhớ tự kiểm tra.
- **ghi** — `app.record_event` từ chối ghi cho tên miền không `active`, trừ đúng ba hành vi về chính
  vòng đời tên miền. Không ghi được sự kiện thì theo luật cứng của `CLAUDE.md`, hành vi không xảy ra.
  Đặt cửa ở đây chứ không ở từng hàm mutation, vì hàm viết sau sẽ có cái quên.

Chừa đúng một khe: cô luôn đọc được **dòng `tenants` của chính mình**, bất kể trạng thái. Chặn cả
chỗ đó thì cô đăng ký xong nhìn vào trống trơn, không biết mình đang chờ duyệt hay đã bị từ chối.

Vai `admin` không có mức nào trong `permissions.json` và không nên có: `can()` trả lời "thành viên
của tên miền này được làm gì bên trong nó", còn admin không phải thành viên của tên miền nào.

### 1.1 membership — lời mời
```
(cô nhập SĐT) → pending ──SĐT khớp + OTP──→ active ──cô gỡ / em nghỉ──→ left
                   │
                   └──quá 7 ngày / mở lại lần 2──→ expired
```
| Chuyển | Ai | Sự kiện | Ghi chú |
|---|---|---|---|
| → `pending` | owner | `membership.create` | sinh `invite_token`, gắn `invited_phone` |
| `pending` → `active` | account | `membership.approve` | chỉ khi SĐT nhập **khớp** `invited_phone` |
| `pending` → `expired` | system | `membership.auto:expire` | quét mỗi đêm; token 1 lần, 7 ngày |
| `active` → `left` | owner | `membership.update` | dữ liệu cũ **không** xóa (lớp 1) |

SĐT lệch → **không** đổi trạng thái, chỉ `membership.reject` + hiện trong nhật ký của cô.
SĐT đã có `account` ở tên miền khác → gắn account đó, **không** tạo dòng `accounts` mới.

### 1.1b exam — đề trong ngân hàng
```
(số hoá / soạn tay) ──app.import_digitized_exam──→ đề trong ngân hàng
                                                        │
                              app.save_exam_edit ───────┤ ghi exam.update
                                                        ├─ sửa câu hỏi
                                                        └─ lan truyền xuống bài giao chưa ai nộp
```
| Chuyển | Ai | Sự kiện | Ghi chú |
|---|---|---|---|
| → đề mới | owner | `exam.create` | cả đề hoặc không gì cả; đề rỗng bị từ chối |
| sửa đề | owner | `exam.update` | trả về `(updated, skipped)` của lan truyền, để cô biết lớp nào không nhận được |

Vai là `owner` chứ không phải `system`, kể cả khi đề đến từ OCR: máy chỉ bóc và đề xuất, cô soát
rồi mới bấm lưu. Kết quả OCR chưa qua tay cô còn ở lớp 3, chưa được vào ngân hàng.

Ba bảng này nằm sau một **cửa ghi** (trigger, 0013). Ghi thẳng bị chặn kèm lời chỉ đường sang hàm
đúng. Cửa đó chặn tai nạn, không phải chặn kẻ gian — khoá service tắt được nó.

### 1.2 assignment — bài giao
```
draft → published ──quá hạn──→ published(muộn) → closed
```
| Chuyển | Ai | Sự kiện | Kéo theo |
|---|---|---|---|
| → `draft` | owner/assistant(propose) | `assignment.create` / `.draft` | trợ giảng chỉ tới đây |
| `draft` → `published` | owner | `assignment.send` | đặt `published_at`; sinh `post.auto`; đặt nhắc 24h/2h |
| quá `due_at` | — | — | vẫn nhận bài, `submissions.late = true` |
| → `closed` | owner | `assignment.update` | ngừng nhận bài |

Giao lại cùng `(class_id, exam_id)` → **bài giao mới** với `attempt_no + 1`, nhãn "lần 2".
Không bao giờ ghi đè bài giao cũ.

### 1.3 submission — bài nộp
```
(chưa có) → writing ──em bấm nộp──→ submitted
```
`writing` là bản nháp tự lưu mỗi 10 giây. **Cô không thấy `writing`** — chưa nộp là chưa tồn tại với cô.
`late = submitted_at > assignment.due_at`. Nộp thiếu từ vẫn cho, ghi `words` thật.
`duration_s` = số giây em ngồi viết, đo từ lúc mở màn viết tới lúc bấm nộp. Cô cần nó để đọc bài
đúng cách: 289 từ trong 52 phút và 312 từ trong 19 phút là hai bài khác nhau, dù nháp band bằng
nhau. Bài **số hoá từ giấy** không có `duration_s`, và chỗ hiển thị phải bỏ trống chứ không in
"viết 0 phút" — đó là một câu sai về học viên.

### 1.4 draft — nháp chấm (lớp 3)
```
queued → running → ready ──cô gửi──→ consumed
           │         │
           │         └──quá expires_at──→ expired
           └──lỗi──→ failed ──thử lại──→ queued
```
| Trạng thái | Nghĩa |
|---|---|
| `queued` | đã nhận `submission.create`, chờ tới lượt |
| `running` | đang gọi model |
| `ready` | có band/lỗi/nhận xét/tin cậy; đã tính `flags[]` |
| `failed` | model lỗi hoặc JSON không qua schema — **thử lại tối đa 3 lần**, giãn 1/5/25 phút |
| `consumed` | cô đã gửi review dựa trên nó; sinh `teacher_edits` |
| `expired` | quá `expires_at` mà cô chưa dùng |

`failed` lần 3 → bài rơi về **chấm tay**, hiện trong "Chấm bài" kèm lý do, không im lặng.

### 1.5 review — nhận xét (lớp 1, chỉ thêm)
```
(chưa có) ──cô bấm Gửi──→ sent
```
Không có trạng thái "nháp review" — nháp là `drafts`. Không sửa dòng đã gửi.
**Cô sửa sau khi gửi = thêm dòng `reviews` mới** cùng `submission_id`; em thấy bản mới nhất
kèm dòng "cô đã sửa lại nhận xét". Bản cũ vẫn còn để truy vết.

### 1.6 proposal — đề xuất (lớp 3)
```
open ──cô đồng ý──→ accepted → (sinh hành động lớp 1)
  │
  ├──cô từ chối──→ rejected
  └──quá expires_at──→ expired
```
`accepted` **không tự làm gì** — nó chỉ mở đường cho một hành động lớp 1 do `owner` thực hiện,
ghi `by_account = owner`. Đề xuất hết hạn tự biến mất, không nhắc lại.

### 1.7 fee — học phí
```
upcoming ──còn ≤7 ngày──→ due_soon ──quá due_at──→ overdue
              │                          │
              └──────────đã trả──────────┴──→ paid
```
Không trạng thái nào ở đây tự sinh tin nhắn. Chỉ sinh `proposals(kind=renewal|retain)` chờ cô.

---

## 2. Sự kiện sinh việc

Việc chạy qua hàng đợi, **không** gọi trực tiếp. Nguồn kích hoạt duy nhất là một dòng `events`.

| Sự kiện vào | Việc chạy | Sự kiện ra | Lớp ghi |
|---|---|---|---|
| `exam.create` (có file) | OCR — AI#1 | `question.draft` | 2 |
| `assignment.send` | đăng bảng tin + đặt 2 mốc nhắc | `post.auto`, `reminder.auto` | 1 |
| `submission.create` | nháp chấm — AI#2 | `draft.create` | 3 |
| `review.send` | ① cập nhật hồ sơ — AI#3 | `profile.auto` | 2 |
| | ② lưu cặp cô sửa | `teacher_edit.create` | 1 |
| | ③ lỗi lặp ≥3 → sinh bài luyện | `practice.propose` | 3 |
| | ④ báo em có nhận xét mới | `notify.auto` | 1 |
| cron 07:00 | rà `fees` + `profiles` + ~~`attendance`~~† | `proposal.propose`† | 3 |
| cron mỗi đêm | quét `expires_at` | `draft.auto:expire`, `proposal.auto:expire` | 3 |
| cron mỗi đêm | quét lời mời quá 7 ngày | `membership.auto:expire` | 1 |

† Hai chỗ đã sửa lại cho khớp `can()`, xem §8 câu 8. `proposal.create` là tên sai: mức
`propose` của vai máy không bao gồm động từ `create`, nên sự kiện tên đó không bao giờ qua
được cửa quyền. Và `attendance` gạch đi vì `attendance.system` là `none` — máy chưa đọc được
bảng điểm danh, nên luật "nhắc nhẹ em vắng không phép sau 21:00" **chưa chạy**. Cô chốt câu 8
thì mở lại.

Nhắc chỉ gửi cho học viên **đã có tài khoản**, trong khung **9:00–21:30**. Ngoài khung → dời tới 9:00 hôm sau.
Không có dòng nào trong bảng này sinh ra `*.send` cho tin dính tiền — đó là việc của cô.

---

## 3. Thuật toán `can()`

Một hàm, gọi trước mọi thao tác. Thứ tự dưới đây **không đổi được** — mỗi bước là một cửa chặn.

```ts
function can(actor, action, object): boolean {
  const [type, verb] = action.split('.')            // "review.send" → ["review","send"]

  // 1. Máy: đọc được để làm việc, nhưng ghi thì chỉ nháp/đề xuất/tự chạy.
  //    (Sửa 2026-09 lúc cài đặt: bản đầu quên `view`, job chấm sẽ không đọc nổi
  //    chính bài nó phải chấm.)
  if (actor.role === 'system')
    return verb === 'view' || verb === 'draft' || verb === 'propose'
        || verb.startsWith('auto:')

  // 2. Khác tên miền → không bàn thêm.
  if (object.tenantId !== actor.tenantId) return false

  // 3. Object thuộc một lớp mà actor không ở trong đó.
  if (object.classId && !actor.classIds.includes(object.classId)) return false

  // 4. Gửi tới người thật: chỉ cô. Không cấp được, không cấu hình được.
  if (SEND_ACTIONS.includes(action) && actor.role !== 'owner') return false

  // 5. Trần cứng trợ giảng — bỏ qua mọi quyền đã cấp.
  if (actor.role === 'assistant' && HARD_CEILING.includes(type)) return false

  // 6. Mức quyền: cô cấp riêng theo lớp > mặc định theo vai.
  const level = actor.permissions?.[object.classId]?.[type]
             ?? DEFAULTS[type][actor.role]

  // 7. "own" nghĩa là chỉ trên đồ của chính mình.
  if (level === 'own' && object.ownerId !== actor.accountId) return false

  return allows(level, verb)
}
```

`SEND_ACTIONS`, `HARD_CEILING`, `DEFAULTS` **sinh từ `permissions.json`**, không gõ tay lần thứ hai.

### Mức quyền không phải thang bậc
Đừng so sánh bằng `>`. Mỗi mức là một tập verb riêng:

| Mức | Cho phép |
|---|---|
| `none` | — |
| `read` | `view` trong phạm vi |
| `own` | `view`, `create`, `update` — **chỉ khi** `object.ownerId === actor.accountId` |
| `propose` | `view` + `draft`, `propose` — chạm lớp 3, **không bao giờ** lớp 1 |
| `full` | tất cả, trừ `SEND_ACTIONS` nếu không phải owner |
| `auto` | "Tự làm": `view`, `draft`, `propose`, `create`, `update`, `approve`, `reject`, `auto:*` |

Lưu ý `auto` **không** phải mức riêng của `system`. `permissions.json` liệt kê nó trong
`assistant_grantable_levels`, và bốn mức cô cấp được cho trợ giảng — Không · Chỉ xem ·
Đề xuất · Tự làm — ánh xạ đúng vào `none` · `read` · `propose` · `auto`.
Vẫn không vượt được trần cứng (cửa 5) và `SEND_ACTIONS` (cửa 4).

`propose` **không** bao hàm `own`: trợ giảng mức "Đề xuất" không sửa được bài đăng của chính mình
trên bảng tin nếu `post` cấp `propose`. Cấp `own` nếu muốn thế.

### RLS phản chiếu, không thay thế
DB chỉ mirror nhánh `read` của hàm trên. Mọi `write` đi qua server. RLS là lưới thứ hai, không phải lưới duy nhất.

**Chính sách hỏi sang bảng khác thì phải đi qua hàm `security definer`.**
Chính sách của `tenants` cần biết người này có phải thành viên không → hỏi `memberships`;
chính sách của `memberships` cần biết người này có phải chủ không → hỏi `tenants`. Hai chính
sách gọi thẳng nhau thành vòng tròn và Postgres ném `infinite recursion detected in policy`.
Bọc mỗi câu hỏi đó vào một hàm `stable security definer set search_path = public, pg_temp`
(xem `app.is_active_member`, `app.is_tenant_owner`): hàm chạy dưới quyền chủ schema nên truy vấn
bên trong không kích hoạt RLS, vòng tròn đứt. Ghim `search_path` để không ai chèn bảng giả cùng tên.

---

## 4. Công thức

### 4.1 Band hiện tại (hồ sơ)
Lấy **4 bài gần nhất đã có `review`** của học viên, theo kỹ năng:
```
w_i = [4, 3, 2, 1][i]           # i=0 là bài mới nhất
w_i = w_i × 2  nếu bài là mock
band_current = Σ(w_i × band_i) / Σ(w_i)      làm tròn tới 0.25
```
Chỉ đọc `reviews`. **Không bao giờ** `drafts` — dù `drafts` mới hơn.

### 4.2 Lỗi lặp
- Cùng `error_code` xuất hiện ở **≥2 bài đã duyệt liên tiếp** → vào `recurring_errors`, đếm số lần.
- Đếm chạm **3** → sinh `practice_sets` (đề xuất, lớp 3), gắn kèm nhận xét cô đã duyệt.
- **Dứt** khi 2 bài đã duyệt liên tiếp không tái phạm → chuyển sang `resolved_errors`, giữ lịch sử.
- Nộp lại (`attempt_no > 1`) **không** tính là bài liên tiếp — tránh đếm trùng một lỗi.
- Đếm theo **số bài**, không theo số lần gạch: một bài mắc bốn lần vẫn là một bài. Số lần gạch
  phụ thuộc bài dài ngắn, nên "4 lần" không nói được lỗi này nặng hơn lỗi kia.
- Mẫu số là **số bài đã duyệt**. Bài đã đọc mà sạch lỗi VẪN vào mẫu số; bài chưa nộp thì không.

**Một chỗ tính, hai màn đọc.** Ngăn hồ sơ của cô và khối "Lỗi đang kéo em lại" của em cùng gọi
`gomLoiLap()`; khác nhau chỉ ở nguồn bài (cô đọc bài của em, em đọc bài của mình, mỗi bên qua
`can('review.view')` của mình). Trước đây hồ sơ phía cô là ba dòng chữ viết sẵn trong dữ liệu
mẫu, còn màn của em đếm thật — hai màn nói hai con số về cùng một học viên, và cô là người tin
con số của mình, nên cô nhắc em bằng một con số sai.

**Lỗi lẻ không phải lỗi lặp.** Lỗi mới thấy ở một bài vẫn hiện trên bài đó khi cô chấm, nhưng
không vào khối lỗi lặp — thấy một lần thì chưa kéo ai lại. Điều này giữ ngưỡng ≥2 ở trên khỏi bị
nới ra chỉ để đủ ba dòng như bản mẫu.

### 4.3 Tin cậy hồ sơ
| Số bài cô đã duyệt | Mức | Hệ quả |
|---|---|---|
| < 3 | thấp | **không** đề xuất lên lớp, không cảnh báo tụt |
| 3–5 | vừa | đề xuất được, luôn kèm "dựa trên N bài" |
| ≥ 6 | đủ | đầy đủ |

### 4.4 Cờ trên nháp chấm
Gắn cờ nếu **một trong**:
- `|band_draft − band_bài_trước| > 1.0`
- `confidence < 0.85`
- có câu OCR mang `warning` (không tìm ra đáp án)

Bài **có cờ** không nằm trong "Duyệt tất cả". ~~Trắc nghiệm `confidence ≥ 0.97` **và** công tắc bật
→ tự chốt, ghi `by = 'system:rule:mcq_autoclose'`~~‡; câu chữ mờ vẫn hỏi cô.

‡ **Chưa chạy, và không chạy được bằng cách nâng mức.** `review.system` là `propose`, mức đó
không cho động từ `auto:*` nào. Nâng lên `auto` thì mở luôn `review.auto:essay_autoclose` —
máy gửi được nhận xét tự luận cô chưa đọc. Đang dựng theo hướng **cô chốt cả lớp bằng một
hành động**, đúng như bản mẫu và `OPERATIONS.md` bước 4. Xem §8 câu 10.

### 4.5 Lên lớp
Đề xuất khi **đủ cả ba**: 2 bài liên tiếp ≥ `band_target` · tin cậy hồ sơ ≥ vừa · học phí không `overdue`.
Lớp mới chỉ mở khi đủ N người (cô đặt N). Học phí còn lại chuyển sang, **không thu lại**.

---

## 5. Chạy lại, trùng, hỏng

- **Mỗi job có khoá idempotent** = `(event_id, job_name)`. Chạy lại cùng event → không sinh dòng thứ hai.
- **Lớp 2 tính lại được**: xoá sạch `profiles` rồi dựng lại từ `reviews` phải ra **đúng** số cũ. Đây là test, không phải lời hứa.
- **Lớp 3 vứt được**: xoá `drafts` chưa dùng không mất gì; job sinh lại từ `submissions`.
- **Sự kiện ghi trước**: `insert events → mutate → commit` trong một transaction. Ghi sự kiện hỏng → thao tác không xảy ra.
- **Sự kiện đến trùng**: khử theo `event_id`, không theo nội dung.
- **AI trả JSON sai schema**: tính là `failed`, thử lại; không "sửa tạm" đầu ra rồi dùng.
- **Model đổi**: chạy `tests/ai/fixtures/` trước — khớp band ±0.5 ≥80% mới đổi config.

---

## 6. Bất biến — viết thành test, không phải lời hứa

1. Không dòng lớp 1 nào có `actor_role = 'system'`, trừ khi `by = 'system:rule:<id>'` và luật đó đang bật.
2. Mọi mutation có **đúng một** `events` ghi trước, cùng transaction.
3. `profiles.band_current` chỉ tính từ `reviews`. Không truy vết nào dẫn về `drafts`.
4. Không truy vấn nào của `student` trả về dòng `drafts`, `teacher_notes`, hay ma trận lớp.
5. Duy nhất một `submissions` cho mỗi `(assignment_id, student_id)`.
6. Duy nhất một `assignments` cho mỗi `(class_id, exam_id, attempt_no)`.
7. Không tin dính tiền rời hệ thống nếu thiếu `proposals.decided(action='accept', by=owner)`.
8. Mọi truy vấn có `tenant_id`; bảng theo lớp có thêm `class_id`.
9. Không màn nào của `student` chứa dữ liệu của học viên khác.
10. Xoá tenant → không dòng nào của tenant đó còn sót ở bất kỳ bảng nào.
11. Tên miền `status <> 'active'` → mọi thành viên đọc rỗng và không ghi được sự kiện nào, trừ dòng
    `tenants` của chính chủ. Chặn ở CSDL, không phải ẩn ở giao diện.
12. Không lần gọi AI nào xảy ra mà không có `ai_usage` xin trước. Vượt trần → `claim_ai_call` trả
    `NULL`, và `NULL` nghĩa là **không được gọi**.
13. Trúng cache số hoá thì không tốn ngân sách: tra cache **trước**, xin ngân sách **sau**.
14. Không dòng `exams` · `passages` · `questions` nào đổi mà không qua `app.import_digitized_exam`
    hoặc `app.save_exam_edit` — nên không lần sửa đề nào thiếu `events`, và không lần nào quên
    lan truyền xuống bài giao.
15. Câu hỏi có `answer` thì không còn `warning`, trừ khi cô tự ghi cảnh báo.

---

## 7. Ca biên đã quyết

| Tình huống | Xử lý | Vì sao |
|---|---|---|
| Cô sửa nhận xét sau khi đã gửi | Thêm dòng `reviews` mới, em thấy bản mới + "cô đã sửa lại" | lớp 1 chỉ thêm |
| Em rời lớp giữa chừng | Bài đã nộp **giữ nguyên** trong ma trận, gắn nhãn "đã nghỉ" | mất dữ liệu là mất thật |
| Cô sửa đáp án OCR sau khi đã giao bài | Chấm lại các bài đã nộp, sinh `draft` mới, báo cô | đáp án là lớp 2, sai thì tính lại |
| Nộp lần 2 | Cả hai bài giữ lại; **lần cuối** vào hồ sơ, lần đầu vẫn xem được | tiến bộ mới là thứ đo |
| Nháp chấm hỏng 3 lần | Rơi về chấm tay, hiện lý do trong "Chấm bài" | không im lặng nuốt lỗi |
| Trợ giảng bị hạ quyền giữa chừng | Có hiệu lực ngay, không cần đăng nhập lại; nháp đã tạo vẫn còn | quyền đọc mỗi lần `can()` |
| Em nộp sau khi lớp đã đóng | Chặn, hiện "lớp đã đóng", báo cô | tránh bài mồ côi |

---

## 8. Chưa quyết — cần cô chốt trước khi làm chặng liên quan

| # | Câu hỏi | Chặn chặng |
|---|---|---|
| 1 | Nộp lại lần 2: lấy band **lần cuối** (đang đề xuất) hay **cao nhất**? Ảnh hưởng cách em luyện. | 7 |
| 2 | Trợ giảng mức "Tự làm" có được chốt trắc nghiệm không? Trần cứng hiện chỉ chặn tiền/rubric/ghi chú/xuất. | 3 |
| 3 | Phụ huynh thấy **tiến bộ + việc**, không thấy điểm — vậy có thấy band mục tiêu không? | 9 |
| 4 | Bài luyện sinh ra mà em không làm trong 7 ngày: nhắc lại, hay lặng lẽ hết hạn? | 7 |
| 5 | Em học 2 lớp của cùng một cô: một hồ sơ hay hai? (`SRS` nói hồ sơ xuyên lớp → một; xác nhận) | 7 |
| 6 | ~~`permissions.json` thiếu 5 thực thể~~ — **đã áp §8.1** ngày 9/9 để dựng bài luyện của em. Cô xem lại bảng ở §8.1; đổi ý thì sửa `docs/permissions.json`, không sửa chỗ khác. | (đã mở) |
| 7 | **Trợ giảng có mức `propose` ở `assignment` nhưng không có lối vào nào hợp lệ.** `path` là `none` (không thấy lộ trình) và `exam` là `read` giới hạn "chỉ đề đã giao" — nên trợ giảng không chọn được đề nào để đề xuất giao. Khả năng có, đường đi không. Hai cách: (a) cho trợ giảng "giao lại" một bài lớp ĐÃ có (lần 2) — hợp `exam: read`; (b) hạ `assignment` của trợ giảng xuống `read` cho khớp thực tế. Cần cô chốt. | 1 |
| 8 | **§2 nói máy rà `attendance` mỗi 7:00, nhưng ma trận không cho.** Dòng cron ở §2 ghi "rà `fees` + `profiles` + `attendance` → `proposal.create`". Hai chỗ sai: (a) `attendance.system` là `none` ở §8.1, nên `can()` chặn cả `attendance.view` của vai máy — máy không đọc được bảng điểm danh; (b) `proposal.system` là `propose`, mà mức `propose` không bao gồm động từ `create`, nên tên sự kiện `proposal.create` do máy sinh không bao giờ qua được `can()` — phải là `proposal.propose`. Hệ quả thấy được: luật "vắng không phép + có tài khoản → nhắc nhẹ sau 21:00" của bản mẫu **chưa chạy**, và ngăn điểm danh đang nói thẳng ra như thế. Hai cách: (a) nâng `attendance.system` lên `read` (máy đọc để nháp nhắc và tính "đi học đều", vẫn KHÔNG `create`/`update` — ai có mặt thì chỉ người trong phòng biết); (b) giữ `none` và xoá `attendance` khỏi dòng cron ở §2 + khỏi ARCHITECTURE §4 lớp 4, tức là bỏ luôn luật nhắc vắng. Em nghiêng về (a): `read` là mức đúng cho "được xem để nháp, không được ghi sự thật". Cần cô chốt. | 7 |
| 9 | **`attendance` là "chỉ thêm" ở ARCHITECTURE §3, nhưng bảng thật không cho thêm.** Migration 0004 đặt `unique (class_id, session_no, student_id)`, nên điểm danh lại một buổi KHÔNG thể là thêm dòng — ràng buộc chặn dòng thứ hai. Hai câu đó không cùng đúng được. Em đã chọn **giữ ràng buộc, sửa tại chỗ** (0014 + bản demo), vì ràng buộc ấy đang chặn một lỗi thật: điểm danh hai lần một buổi thì mọi con số "đi học đều" đếm buổi đó hai lần. Lịch sử "cô đã đổi ý" thì `events` giữ, và giữ chắc hơn — `events` có trigger chặn cả UPDATE lẫn DELETE (0001), còn `attendance` không có gì ép. Nếu cô muốn lịch sử nằm TRONG bảng sự thật thì phải bỏ ràng buộc và thêm cột `supersedes_id`; khi đó sửa ARCHITECTURE §3 cùng lúc. | (đã chọn, chờ xác nhận) |
| 10 | **§4.4 nói máy TỰ CHỐT trắc nghiệm, ma trận không cho — và nâng mức cũng không phải cách.** §4.4: "Trắc nghiệm `confidence ≥ 0.97` **và** công tắc bật → tự chốt, ghi `by = 'system:rule:mcq_autoclose'`". Chính dòng `review` trong permissions.json cũng ghi chú `"system": "auto for mcq confidence>=0.97 if enabled"`. Nhưng mức của nó là `propose`, mà `propose` KHÔNG cho động từ `auto:*` nào — nên `review.auto:mcq_autoclose` bị chặn ở cửa 6. Đã thử nâng lên `auto` để xem hậu quả: nó mở luôn `review.auto:essay_autoclose`, tức là máy gửi được nhận xét TỰ LUẬN mà cô chưa đọc — đúng thứ công tắc `gui-tu-luan` (mặc định TẮT) sinh ra để chặn. Một dòng `review` không phân biệt được hai quyền đó. Em đã dựng theo hướng **cô chốt cả lớp bằng một hành động** (`chotTracNghiemCaLop`), vì đó là thứ ba trong bốn nguồn nói: bản mẫu vẽ nút "Chốt 8 & mở 2", `OPERATIONS.md` bước 4 ghi "🔵 Cô", và ma trận cho `review.send` là owner-only. Chỉ §4.4 nói khác. Hai cách nếu cô muốn máy tự chốt thật: (a) thêm object riêng, ví dụ `review_mcq`, với `system: auto` — ma trận nói được đúng điều cần nói; (b) sửa §4.4 cho khớp thực tế là cô bấm một lần. Cần cô chốt. | 4 |
| 11 | **Đề thiếu đáp án một câu thì cả lớp không chấm được, và 0007 không chừa cửa nào.** Dựng bảng chốt điểm mới thấy: `de-g1` có câu 12 máy không tìm ra đáp án, nên cả 18 bài đều "chờ cô". Cô điền đáp án vào NGÂN HÀNG ĐỀ không giải quyết được — `propagate_exam_edit` (0007) bỏ qua mọi bài giao đã có người nộp. Bỏ qua là ĐÚNG cho phần đề bài, nhưng điền một đáp án CÒN THIẾU khác về bản chất: sửa `de`/`luaChon` là đổi thứ em ĐÃ ĐỌC, còn điền `dapAn` đang rỗng là đổi thứ em CHƯA BAO GIỜ THẤY (em không nhìn đáp án; nó chỉ để chấm). Không có cửa này thì cô chấm tay 18 lần cho đúng một câu. Em đã mở đúng một cửa hẹp (`dienDapAnThieu`): chỉ khi đáp án đang rỗng, không ghi đè đáp án đã có, chỉ chạm `dapAn` và `canhBao`, và chấm lại cả lô ngay trong cùng hành động. Bản thật cần migration mở cùng cửa đó. | (đã dựng, chờ xác nhận) |
| 12 | ~~`teacher_notes` nằm trong `assistant_hard_ceiling` mà KHÔNG có dòng trong `objects`~~ — **đã sửa** 13/9. `can()` trả false cho MỌI vai, kể cả cô (chủ của ghi chú): cửa 6 không tìm thấy mức nào nên từ chối. Hệ quả là `hoSoDayDu` phải cắt ghi chú bằng `vai === 'owner'` và `luuGhiChu` hỏi `profile.update` — một component tự đặt chính sách, đúng thứ CLAUDE.md cấm, và chặn trợ giảng chỉ NHỜ TÌNH CỜ (họ đang ở mức `profile: read`; cấp `auto` là mở). Đây là dòng THIẾU, không phải chính sách cần chốt: trần cứng đã nói trợ giảng không bao giờ đọc, và cả thiết kế nói chỉ cô đọc — nên thêm `owner: full`, còn lại `none`. Kèm bài kiểm mới: mọi object trong trần cứng đều phải có dòng trong ma trận. | (đã sửa) |
| 13 | **Bản mẫu cho phụ huynh đọc "Nhận xét gửi học viên", ma trận thì không.** `review.parent` là `none`, và `OPERATIONS` ghi luật nhắn phụ huynh là "gửi tiến bộ và việc cụ thể, **không gửi điểm**" — mà nhận xét thì mang band. Hai nguồn thắng một, và đây là dữ liệu của một đứa trẻ nên em chọn bên kín hơn: phụ huynh thấy hồ sơ tiến bộ + học phí, không thấy nhận xét. Khối "mỗi vai thấy gì" ở màn Cấu hình nói thẳng chỗ khác này. Cô muốn phụ huynh đọc được nhận xét thì sửa `permissions.json`, không sửa màn. | (đã chọn, chờ xác nhận) |

### §8.1 Năm dòng còn thiếu — đã áp dụng 9/9/2026

Suy từ `ARCHITECTURE` §3 (lớp dữ liệu) và `OPERATIONS.md` (cột "Ai"). Đây là bảng **đang chạy**:

| object | owner | assistant | student | parent | system | vì sao |
|---|---|---|---|---|---|---|
| `proposal` | `full` | `none` | `none` | `none` | `propose` | lớp 3, cô quyết; trợ giảng không thấy vì đề xuất hay dính tiền |
| `draft` | `full` | `propose` | `none` | `none` | `propose` | `DECISIONS`: em **không** thấy band nháp của máy |
| `practice_set` | `full` | `read` | `own` | `none` | `propose` | bài luyện là của em, em làm được |
| `attendance` | `full` | `auto` | `own` | `own` | `none` | trợ giảng điểm danh được (bản mẫu lời mời ghi thế) |
| `path` | `full` | `none` | `none` | `none` | `none` | lộ trình là tài sản của cô — RLS ở 0004 đã theo luật này |

Hai hệ quả đã thấy ngay khi áp:

- `baiCanCham` (bản demo) hỏi được `draft.view` thay vì hỏi `review.propose` — câu hỏi đúng
  thay cho câu hỏi gần đúng. Em vẫn bị chặn, nhưng chặn vì chính sách `draft`, không phải
  vì tình cờ trùng kết quả.
- `attendance` được thêm vào `own_is_subject_not_author`: em **là chủ đề** của điểm danh
  chứ không phải người ghi ra nó. Không thêm thì mức `own` cho em tự sửa buổi vắng của mình.

`tests/unit/van-hanh.test.ts` giữ năm thực thể này dưới kiểm tra: máy đề xuất được nháp,
bài luyện, đề xuất — và vẫn không chạm được lộ trình, điểm danh, hay động từ `send`.
