# PHÂN QUYỀN — đặc tả hợp nhất

> Gộp `OBLUE_PHAN_QUYEN_3_VAI_TRO.md` (đặc tả ĐÍCH của bản `oblue.vn` cũ) với mô hình đang dựng
> ở repo này. **Đây là bản duy nhất cần đọc.** Tài liệu cũ giữ lại làm nguồn gốc của chính sách.
>
> Tài liệu cũ nói về schema khác (`organizations`, `class_teachers`, `student_assignments`,
> `exam_bank`, vai `teacher` / `assistant_teacher` / `student`). **Chính sách** của nó áp được
> nguyên; **tên bảng** thì không. Chỗ nào bản này khác, có ghi rõ vì sao ở §F.

---

## §A — Năm cá thể, không phải ba

Tài liệu cũ có ba vai. Bản này có **năm**, và hai vai thêm vào không phải cho đủ bộ: chúng là hai
nguồn ghi thật vào dữ liệu của một đứa trẻ.

| Vai | Là ai | Quyền đi theo |
|---|---|---|
| `owner` — **Cô** | Người mở tên miền. Toàn quyền trong tên miền của mình. | **VAI.** Cứ là chủ tên miền thì làm được, không cần điều kiện gì thêm |
| `assistant` — **Trợ giảng** | Cô mời vào để dạy và chấm. | **QUAN HỆ.** Phải có tên trong `Lop.troGiangIds` của lớp nào thì mới chạm được lớp đó |
| `student` — **Học viên** | Chỉ thấy dữ liệu của chính mình. App riêng dưới `/em`. | QUAN HỆ (thành viên lớp) + sở hữu |
| `parent` — **Phụ huynh** | Cô bật thì thấy tiến bộ và học phí của con. | Sở hữu (con mình) |
| `system` — **Máy** | Job nền và AI. Chỉ nháp và đề xuất, không bao giờ gửi. | Động từ (`draft`, `propose`, `auto:*`) |

Vai thứ sáu — quản trị nền tảng — đứng ngoài, không nằm trong tài liệu này.

### Câu quan trọng nhất

Quyền của **cô** theo VAI. Quyền của **trợ giảng** theo QUAN HỆ.

> Mời một trợ giảng vào mà quên phân lớp thì họ đăng nhập được và **không thấy gì cả**. Đây là
> hành vi ĐÚNG, không phải lỗi — nhưng phần mềm phải **nói ra điều đó** (`ChuaPhanLop`), đừng để
> họ nhìn màn trống mà không hiểu vì sao.

Quan hệ đó phải là **DỮ LIỆU**. Trước ngày 13/9 nó là chuỗi `'lop-65'` cắm trong mã, ở **sáu**
chỗ: `actorCuaVai`, màn Học viên, màn Lớp học, `soLieuLop`, panel lớp ở layout, và dải vai. Sáu
bản sao của một quan hệ chỉ cùng đúng cho tới lần đầu cô đổi phân công — và bản sao trong dải vai
là bản tệ nhất: nó nói thẳng vào mặt người dùng câu "chỉ lớp IELTS 6.5" trong khi cô đã phân sang
lớp khác. Nay tất cả hỏi `lopTrongTam(vai)` / `lopPhuTrach(accountId)`.

---

## §B — Hai tầng hàng rào

Quyền được kiểm ở hai nơi độc lập, và **hai tầng phải luôn nói cùng một điều**. Khi chúng lệch
nhau, tầng giao diện là tầng **nói dối** — vì nó không chặn được ai.

| Tầng | Nhiệm vụ | Ở đâu trong repo này |
|---|---|---|
| 1 · giao diện | Giúp người dùng **khỏi bấm nhầm**. Không phải an ninh. | `lamDuoc(vai, action, {lopId, cuaAi})` — hỏi đúng `can()` mà đường ghi dùng |
| 2 · cơ sở dữ liệu | **Hàng rào thật.** Mọi quyền phải có mặt ở đây. | RLS + trigger trong `supabase/migrations/` |

> 🚨 **Ẩn nút không phải là chặn.** Kiến trúc này gọi CSDL trực tiếp từ trình duyệt. Ai mở công cụ
> lập trình viên cũng gọi được API với đúng phiên của mình. Nếu một quyền chỉ tồn tại trong mã
> giao diện, coi như quyền đó **không tồn tại**.

Cách chắc nhất để hai tầng lệch là cho tầng 1 cắm sẵn **kết luận** (`vai === 'owner'`) thay vì
hỏi. Mười hai chỗ như thế đã được đổi sang `lamDuoc(...)`; hai chỗ trong đó còn lộ ra một lỗi
thật khi đổi:

- Màn Lớp học gộp "Thêm học viên" và "Giao bài" vào **một** `vai === 'owner'`. Hai nút là hai
  quyền khác nhau (`membership.create` và `assignment.create`); gộp lại thì hôm nào cô cho trợ
  giảng giao bài, nút Giao bài vẫn ẩn và cô sẽ đi tìm lỗi ở chỗ khác.
- Màn Chấm bài dùng `laCo` cho ba việc khác nhau (tab Rubric, nút gửi, chốt trắc nghiệm). Nay ba
  câu hỏi riêng: `rubric.view`, `review.send`, `review.send` theo lớp.

### Bảy cửa của `can()`, theo đúng thứ tự

Mỗi cửa trả `false` là dừng hẳn; không cửa nào sau đó cứu lại được (`lib/auth/can.ts`).

| # | Cửa | Chặn ai |
|---|---|---|
| 1 | Máy chỉ `draft` / `propose` / `auto:*` | Máy gửi thẳng cho người |
| 2 | Khác tên miền | Tên miền khác |
| 3 | Object thuộc lớp actor không ở trong | **Trợ giảng ở lớp không được phân** · em ở lớp khác |
| 4 | `SEND_ACTIONS` — gửi tới người thật | Mọi vai ngoài cô |
| 5 | Trần cứng trợ giảng | Trợ giảng, **kể cả khi cô cấp quyền cao nhất** |
| 6 | Mức: cô cấp riêng theo lớp thắng mặc định theo vai. Object lạ → **đóng** | |
| 7 | `own` chỉ áp lên đồ của chính mình | |
| 7b | `read_own`: xem theo phạm vi, **sửa** thì chỉ của mình | |

---

## §C — Ma trận đầy đủ

Sinh từ `docs/permissions.json` — **nguồn duy nhất**. Không gõ lại ma trận ở đâu khác, kể cả trong
test (`can.test.ts` chốt `OBJECT_TYPES` có đúng 20 dòng × 5 vai).

| Object | Cô | Trợ giảng | Học viên | Phụ huynh | Máy | |
|---|:--:|:--:|:--:|:--:|:--:|---|
| `account` | `full` | `read_own` | `read_own` | `read_own` | `read` |  |
| `class` | `full` | `read` | `read` | `none` | `none` |  |
| `membership` | `full` | `none` | `none` | `none` | `propose` |  |
| `profile` | `full` | `read` | `own` | `own` | `auto` |  |
| `teacher_notes` | `full` | `none` | `none` | `none` | `none` | 🔒 trần cứng |
| `exam` | `full` | `read` | `none` | `none` | `propose` |  |
| `assignment` | `full` | `propose` | `read` | `none` | `propose` |  |
| `submission` | `full` | `read` | `own` | `none` | `read` |  |
| `review` | `full` | `propose` | `own` | `none` | `propose` |  |
| `draft` | `full` | `propose` | `none` | `none` | `propose` |  |
| `proposal` | `full` | `none` | `none` | `none` | `propose` |  |
| `practice_set` | `full` | `read` | `own` | `none` | `propose` |  |
| `gradebook` | `full` | `read` | `none` | `none` | `auto` |  |
| `attendance` | `full` | `auto` | `own` | `own` | `none` |  |
| `post` | `full` | `own` | `own` | `none` | `auto` |  |
| `fee` | `full` | `none` | `own` | `own` | `propose` | 🔒 trần cứng |
| `rubric` | `full` | `none` | `none` | `none` | `auto` | 🔒 trần cứng |
| `path` | `full` | `none` | `none` | `none` | `none` |  |
| `export` | `full` | `none` | `own` | `none` | `none` | 🔒 trần cứng |
| `events` | `full(class)` | `own` | `own` | `none` | `none` |  |

### Bảy mức

| Mức | Được làm gì |
|---|---|
| `none` | không gì |
| `read` | `view` |
| `read_own` | `view` theo phạm vi · `update` / `export` **của mình** |
| `own` | `view` / `create` / `update` / `export` của mình |
| `propose` | `view` / `draft` / `propose` |
| `auto` | `propose` + `create` / `update` / `approve` / `reject` — làm thẳng, không phải xin |
| `full` | mọi động từ |

**Mức KHÔNG phải thang bậc** — đừng so bằng `>`. `propose` không bao hàm `own`: trợ giảng mức "Đề
xuất" không sửa được bài đăng của chính mình.

**Mức quyết định VIẾT; phạm vi ĐỌC là câu hỏi riêng.** Đọc bị chặn bởi cửa 2–3 (tên miền, lớp), 
không bởi mức. Đó là lý do `post` của em là `own` mà em vẫn đọc được bài cô đăng: phạm vi đọc của
bảng tin là phạm vi **lớp**, hỏi `class.view`. `read_own` tồn tại cho đúng hình này: đọc rộng
theo phạm vi, viết hẹp theo sở hữu.

### `account` khác `profile` — hai chữ "hồ sơ", hai thứ

| | Là gì | Ai sửa |
|---|---|---|
| `account` | Hồ sơ **tài khoản**: tên, số điện thoại, ảnh | Chính người đó (`read_own`) |
| `profile` | Hồ sơ **năng lực**: band, lỗi lặp, tiến bộ | Cô và máy. Em chỉ là **chủ đề** |

Gộp hai thứ vào một chữ là chỗ mất quyền: `account` từng không có dòng nào trong ma trận, nên
**không ai sửa nổi tên của chính mình** — trợ giảng ở mức `profile: read` bị chặn, mà `profile`
lại là hồ sơ năng lực.

### Bốn object trần cứng

`fee` · `rubric` · `teacher_notes` · `export` — cô **muốn cấp cũng không cấp được**. Cửa 5 chặn
trước khi xét tới mức, nên một trợ giảng được cấp `auto` cho mọi thứ vẫn không đọc được học phí.

### Ba hành vi chỉ cô làm được

`review.send` · `message.send` · `fee.message.send` — gửi tới người thật. Cửa 4, owner-only,
không mức nào mở được.

---

## §D — Ranh giới riêng tư giữa hai giáo viên

Khi thêm học viên vào lớp (`hocVienThemDuoc`):

- **Cô** thấy toàn bộ học viên, kèm nhãn "đang ở lớp X" để chuyển lớp khi cần.
- **Trợ giảng** chỉ thấy em **chưa thuộc lớp nào**. Em của đồng nghiệp bị **ẩn hoàn toàn** khỏi
  danh sách chọn.

> Nguyên tắc, áp được cho mọi màn: **ẩn thứ người dùng không được chạm, đừng hiện ra rồi báo lỗi
> khi họ bấm.** Hiện rồi từ chối là vừa lộ thông tin, vừa làm người dùng bực.

Lý do: trợ giảng không cần biết đồng nghiệp đang dạy ai, và chuyển em giữa các lớp là quyết định
của người điều hành, không phải của người dạy.

---

## §E — Luồng có nhiều hơn một cá thể

### E1 · Đưa trợ giảng vào việc

| # | Ai | Việc |
|---|---|---|
| 1 | Cô | Mời qua số điện thoại / email. Kiểm: đúng chủ tên miền · chưa quá hạn mức lời mời · chưa thuộc tên miền · không tự mời mình |
| 2 | Máy | Sinh lời mời có token và hạn dùng |
| 3 | Trợ giảng | Mở liên kết, đặt OTP. Phiên đang đăng nhập của người khác **bị bỏ qua** — tránh nâng nhầm quyền cho người đang ngồi máy |
| 4 | Cô | **Phân lớp** → ghi `Lop.troGiangIds`. Chưa làm bước này thì trợ giảng vào chỉ thấy `ChuaPhanLop` |
| 5 | Trợ giảng | Thấy việc: lớp được phân, học viên trong lớp đó, bài của lớp đó |

### E2 · Đưa học viên vào lớp

| # | Ai | Việc |
|---|---|---|
| 1 | Em | Tự đăng ký trên tên miền của cô. Trạng thái chờ duyệt |
| 2 | **Cô** | Duyệt (`membership` là `none` với trợ giảng — cả giao diện lẫn CSDL) |
| 3 | Cô / trợ giảng | Xếp vào lớp. Trợ giảng chỉ xếp vào lớp mình, và chỉ chọn được em chưa thuộc lớp nào (§D) |
| 4 | Em | Thấy lớp, nhận bài |

### E3 · Giao bài rồi chấm

| # | Ai | Việc |
|---|---|---|
| 1 | Cô | Chọn đề, chọn lớp, đặt hạn. Trợ giảng ở mức `propose` thì bài nằm trạng thái `de_xuat`, chờ cô |
| 2 | Máy | **Đông cứng đề** (migration 0007) + sinh việc + đăng bảng tin |
| 3 | Em | Mở bài (`submission.create`, `writing`) → viết, nháp tự lưu → nộp (`submission.update`, `submitted`). **Nộp là chốt** |
| 4 | Máy | Nháp chấm — lớp 3, có hạn, em không thấy |
| 5 | Cô | Đọc, sửa, **gửi**. Trợ giảng soạn được và bấm "Gửi cho cô duyệt", không gửi thẳng cho em |
| 6 | Em | Nhận nhận xét + bài luyện theo lỗi |

Chi tiết vòng đời và bất biến: `docs/LOGIC.md` §1.3.

---

## §F — Chỗ bản này CỐ Ý khác tài liệu cũ

| Dòng trong tài liệu cũ | Bản này | Vì sao |
|---|---|---|
| Học viên ghi được dòng bài nộp, nên **cột điểm nằm cùng dòng** → phải chuyển sang RPC (§D2 mục 6) | Điểm nằm ở bảng `reviews` **riêng**, em không có đường ghi nào tới | Vấn đề khó nhất của bản cũ được giải bằng **hình dạng schema**, không bằng RPC. Em ghi `submissions` của mình là đủ, và trigger 0015 đóng băng dòng đã nộp |
| GV phụ **chấm và trả điểm** cho học viên | Trợ giảng **soạn** nhận xét; cô gửi (`review.send` owner-only, cửa 4) | Bản cũ không có AI nháp chấm, nên phải có người chấm. Bản này máy nháp và cô duyệt — nên "ai được nói với em" là câu khác. Cô muốn mở thì mở bằng cách cấp quyền, **không** bằng cách bỏ cửa 4 → xem §G |
| GV phụ **đặt mua / nâng gói** ✅ | Chỉ cô | Tài liệu cũ tự mâu thuẫn: §F cùng tài liệu ghi trợ giảng "không bao giờ thấy học phí". Tiêu tiền của cô thì phải là cô |
| GV phụ **tạo / sửa đề** trong ngân hàng (sửa đề của mình theo `created_by`) | Trợ giảng `exam: read` | Xem §G — cần cô chốt |
| "Xem khoá học: cả ba vai ✅" | `path` là `none` với mọi vai ngoài cô | Lộ trình là tài sản của cô, và là thứ để mở lớp thứ 5 mà không soạn lại. Bản cũ gọi "khoá học" là nội dung cho em học; hai thứ khác nhau |
| Giáo viên **không** tạo được bài nộp | Cô `submission: full` | Cô phải nhập được bài **giấy** của em vào hệ thống (số hoá). Chặn cô ở đây là chặn đúng luồng bán được sản phẩm |
| `useCanManageOrg()` / `useIsOrgOwner()` | `lamDuoc(vai, action)` | Không đặt tên theo VAI, đặt tên theo CÂU HỎI. Tên hàm theo vai là bẫy cho người sửa mã sau: "chủ trung tâm" mà thật ra kiểm vai trò |

---

## §G — Còn chờ cô chốt

| # | Câu hỏi | Em nghiêng về |
|---|---|---|
| 1 | **Trợ giảng có được giao bài trực tiếp** vào lớp mình, hay chỉ đề xuất? Tài liệu cũ: giao trực tiếp. Bản này: `assignment: propose` | Cho cô **cấp được** mức `auto` theo từng lớp (đã có đường), mặc định vẫn `propose` |
| 2 | **Trợ giảng có được gửi nhận xét** cho em, hay soạn rồi cô gửi? Tài liệu cũ: gửi. Bản này: cửa 4 chặn tuyệt đối | Giữ cửa 4, nhưng cho `review.send` vào danh sách **cấp được theo lớp**. Nghĩa là mặc định không ai ngoài cô nói với em, và cô mở từng lớp nếu muốn |
| 3 | **Trợ giảng có được soạn đề** vào ngân hàng, sửa/xoá đề của chính mình? | Có — họ là người dạy. Cần thêm `De.taoBoi` và mức `read_own` cho `exam` |
| 4 | **Trợ giảng có được thêm/bớt học viên** trong lớp mình? Tài liệu cũ: có | Có, bó theo lớp (`membership` cấp được mức `auto` theo lớp) |

Cả bốn đều là **một dòng trong `permissions.json`** cộng với một dòng trong danh sách cấp được —
không phải viết lại gì. Em không tự đổi vì bốn câu này quyết định "ai được nói với học viên" và
"ai tiêu tiền của cô".

Hai câu cũ vẫn treo: `LOGIC.md` §8 c.8 (`attendance.system` → `read`?) và c.10 (máy tự chốt trắc
nghiệm hay cô bấm một lần?).

---

## §H — Mười luật cho bản sau

| # | Luật | Vì sao |
|---|---|---|
| 1 | Quyền cô theo **vai**; quyền trợ giảng theo **quan hệ với lớp** | Mô hình gốc, mọi thứ khác suy ra từ đây |
| 2 | Mỗi quyền phải có hàng rào ở CSDL, không chỉ ẩn nút | Gọi CSDL từ trình duyệt thì ẩn nút không chặn được ai |
| 3 | Quan hệ phân công là **dữ liệu**, không phải chuỗi trong mã | Sáu bản sao đã từng tồn tại; chúng cùng đúng cho tới lần đầu cô đổi phân công |
| 4 | Giao diện **hỏi** `can()`, không so vai bằng chuỗi | Hai tầng cắm sẵn hai kết luận thì chúng lệch mà không ai biết |
| 5 | Đặt tên hàm theo **câu hỏi**, không theo vai | `useIsOrgOwner()` mà chỉ kiểm vai trò là bẫy cho người sửa sau |
| 6 | Học viên không có đường ghi nào tới điểm | Chấm ở phía server; và để điểm ở **bảng khác** thì không cần phân quyền theo cột |
| 7 | Object lạ → **đóng**, không mở | Thêm object mà quên dòng trong ma trận thì `can()` từ chối, không im lặng cho qua |
| 8 | Trợ giảng chưa được phân lớp phải **đọc được lý do** | Trống rỗng không có lý do là chỗ người dùng nghĩ phần mềm hỏng |
| 9 | Ẩn thứ không được chạm khỏi danh sách chọn | Hiện rồi báo lỗi là vừa lộ thông tin, vừa làm người dùng bực |
| 10 | Mỗi lần siết một chính sách, **đăng nhập thử bằng tài khoản học viên** | Siết quá tay làm gãy cổng học viên mà không có lỗi nào báo ra |

---

## §I — Kiểm ở đâu

| Việc | Ở đâu |
|---|---|
| Bảy cửa của `can()`, ma trận đủ 20 × 5, em không đọc đồ của bạn | `tests/unit/can.test.ts` |
| Ba vai theo tài liệu cũ: quan hệ điều khiển phạm vi · §D ẩn danh sách · sửa hồ sơ của mình | `tests/unit/phan-quyen.test.ts` |
| RLS và trigger thật trên Postgres | `tests/db/rls.test.ts` · `tests/db/submission.test.ts` |
| Hai tầng nói cùng một điều, trên trình duyệt thật | `scripts/kiem-phan-quyen.mjs` |
