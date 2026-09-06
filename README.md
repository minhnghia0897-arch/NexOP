# OBLUE kit — cách dùng với Claude Code

1. Copy toàn bộ thư mục này vào gốc repo.
2. Claude Code đọc `CLAUDE.md` tự động. Khi giao việc, nói rõ ngữ cảnh: "làm UC-05 trong docs/SRS.md", "thêm bảng theo docs/ARCHITECTURE.md §2".
3. Trước khi dựng UI: mở `design/_reference/*.html` trong trình duyệt và bảo Claude Code "giống bản mẫu, dùng design/tokens.css".
4. Trước khi đổi cách làm: đọc `docs/DECISIONS.md`; muốn đổi thì thêm mục mới, không xóa.
5. `docs/permissions.json` là nguồn duy nhất cho `lib/auth/can.ts` và test quyền.

Thứ tự dựng khuyến nghị: Tenant/Auth (§6) → Class + Membership → Exam + OCR → Assignment/Submission → Draft/Review → Profile → Growth. Events và `can()` từ ngày đầu.
