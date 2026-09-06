# OBLUE kit — cách dùng với Claude Code

1. Copy toàn bộ thư mục này vào gốc repo.
2. Claude Code đọc `CLAUDE.md` tự động. Khi giao việc, nói rõ ngữ cảnh: "làm UC-05 trong docs/SRS.md", "thêm bảng theo docs/ARCHITECTURE.md §2".
3. Trước khi dựng UI: mở `design/_reference/*.html` trong trình duyệt và bảo Claude Code "giống bản mẫu, dùng design/tokens.css".
4. Trước khi đổi cách làm: đọc `docs/DECISIONS.md`; muốn đổi thì thêm mục mới, không xóa.
5. `docs/permissions.json` là nguồn duy nhất cho `lib/auth/can.ts` và test quyền.

Thứ tự dựng khuyến nghị: Tenant/Auth (§6) → Class + Membership → Exam + OCR → Assignment/Submission → Draft/Review → Profile → Growth. Events và `can()` từ ngày đầu.

## Xem bản mẫu

`index.html` ở gốc là khung xem 3 bản mẫu đã duyệt — chuyển qua lại giữa vai giáo viên,
học viên và luồng đăng nhập, có nút xem ở bề ngang 375px cho màn học viên.

**Cách nhanh nhất — không cần cài gì:** mở `https://minhnghia0897-arch.github.io/NexOP/`.

Trang đó do `.github/workflows/pages.yml` tự xuất bản mỗi lần đẩy lên `main`.
Lần chạy đầu tự bật Pages luôn (`configure-pages` với `enablement: true`), không phải vào Settings bấm tay.

File `.nojekyll` ở gốc giữ lại để phòng khi ai đó chuyển Pages sang kiểu xuất bản
thẳng từ nhánh: kiểu đó chạy qua Jekyll, mà Jekyll bỏ qua mọi thư mục bắt đầu bằng
dấu gạch dưới — tức là `design/_reference/` sẽ không lên và khung xem sẽ trống.

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
