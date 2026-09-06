# OBLUE kit — cách dùng với Claude Code

1. Copy toàn bộ thư mục này vào gốc repo.
2. Claude Code đọc `CLAUDE.md` tự động. Khi giao việc, nói rõ ngữ cảnh: "làm UC-05 trong docs/SRS.md", "thêm bảng theo docs/ARCHITECTURE.md §2".
3. Trước khi dựng UI: mở `design/_reference/*.html` trong trình duyệt và bảo Claude Code "giống bản mẫu, dùng design/tokens.css".
4. Trước khi đổi cách làm: đọc `docs/DECISIONS.md`; muốn đổi thì thêm mục mới, không xóa.
5. `docs/permissions.json` là nguồn duy nhất cho `lib/auth/can.ts` và test quyền.

Thứ tự dựng khuyến nghị: Tenant/Auth (§6) → Class + Membership → Exam + OCR → Assignment/Submission → Draft/Review → Profile → Growth. Events và `can()` từ ngày đầu.

## Chạy app

```bash
pnpm install
cp .env.example .env.local     # điền khóa Supabase khi đã có project
pnpm dev                       # http://localhost:3000
```

| Lệnh | Việc |
|---|---|
| `pnpm dev` | máy chủ phát triển |
| `pnpm build` | dựng bản production |
| `pnpm lint` | ESLint + canh không có hex ngoài `design/tokens.css` |
| `pnpm typecheck` | `tsc --noEmit`, TypeScript strict |
| `pnpm test` | Vitest |
| `pnpm db:migrate` | `supabase db push` — cần Supabase CLI cài sẵn |

CI chạy `lint → typecheck → test → build` cho mọi pull request.
App chưa nối Supabase: `.env.local` thiếu khóa thì trang tĩnh vẫn chạy, chỉ hỏng khi
có màn nào thật sự gọi DB.

## Xem bản mẫu

`index.html` ở gốc là khung xem 3 bản mẫu đã duyệt — chuyển qua lại giữa vai giáo viên,
học viên và luồng đăng nhập, có nút xem ở bề ngang 375px cho màn học viên.

**Cách nhanh nhất — không cần cài gì:** mở `https://minhnghia0897-arch.github.io/NexOP/`.

Kho bật GitHub Pages theo kiểu *Deploy from a branch* — nhánh `main`, thư mục `/ (root)`.
Đẩy lên `main` là trang tự cập nhật sau một hai phút.

**Đừng xóa `.nojekyll` ở gốc.** Kiểu xuất bản này chạy file qua Jekyll, mà Jekyll bỏ qua
mọi thư mục có tên bắt đầu bằng dấu gạch dưới — tức là `design/_reference/` sẽ không được
xuất bản, khung xem vẫn lên nhưng cả 3 tab đều trống.

**Hoặc chạy tại máy:**

```
python3 -m http.server    # rồi mở http://localhost:8000
```

Mở thẳng `index.html` bằng file:// cũng chạy trên phần lớn trình duyệt; nếu trình duyệt
chặn nhúng file cục bộ thì khung sẽ chỉ đường sang nút "Mở riêng".

## Cấu trúc

```
CLAUDE.md              luật cứng, Claude Code đọc tự động
index.html             khung xem bản mẫu
docs/                  SRS · ARCHITECTURE · DECISIONS · OPERATIONS · PLAN · permissions.json
design/tokens.css      nguồn màu/chữ duy nhất
design/DESIGN.md       token, bố cục, thành phần
design/_reference/     3 bản mẫu đã duyệt — khi mâu thuẫn với DESIGN.md, bản mẫu thắng
```
