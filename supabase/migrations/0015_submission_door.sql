-- 0015 — cửa của em: nộp được đúng bài của mình, và nộp rồi là CHỐT.
--
-- 0007 dựng bảng `submissions`, bật RLS, và viết ĐÚNG MỘT chính sách: `submissions_read_own`
-- cho `select`. RLS bật mà không có chính sách `insert` nào nghĩa là **không ai nộp được bài**
-- — kể cả em, kể cả cô. Toàn bộ luồng làm bài chưa từng có cửa vào.
--
-- Lộ ra khi dựng điều kiện luồng cho app của em, không lộ khi đọc từng migration rời: 0007 đọc
-- rất hoàn chỉnh nếu chỉ xét những gì nó nói về.
--
-- Ba việc ở đây:
--   1. cửa VÀO  — em tạo dòng của chính em, trong lớp của mình, cho bài cô đã đăng;
--   2. cửa SỬA  — em sửa được bản nháp CHƯA nộp, và chỉ nội dung;
--   3. cửa CHỐT — đã nộp thì không dòng nào sửa được nữa, kể cả bằng tay của cô.

-- ═══════════════════ 1. Em mở bài: dòng `writing` ═══════════════════
--
-- `submitted_at` phải null lúc tạo: dòng sinh ra ở trạng thái `writing` (LOGIC §1.3), không
-- phải "nộp luôn". Không chặn thì một lần gọi API là nộp xong, và mốc mở — thứ đo thời gian
-- làm bài — không bao giờ tồn tại.
create policy submissions_insert_own on submissions
  for insert with check (
    student_id = auth.uid()
    and submitted_at is null
    and exists (
      select 1 from assignments a
      where a.id = submissions.assignment_id
        and a.published_at is not null
        and app.is_class_member(a.class_id)
    )
  );

-- ═══════════════════ 2. Em viết: sửa nháp của chính mình ═══════════════════
--
-- `using` chọn dòng được phép chạm: của em, và CHƯA nộp. `with check` xét dòng SAU khi sửa, nên
-- nó là chỗ chặn việc đổi chủ hoặc đổi sang bài giao khác.
--
-- Cho `submitted_at` đi từ null sang có giá trị — đó chính là hành vi nộp. Đường ngược lại thì
-- `using` đã khoá: dòng đã nộp không vào được chính sách này nữa.
create policy submissions_write_own on submissions
  for update using (
    student_id = auth.uid()
    and submitted_at is null
  )
  with check (
    student_id = auth.uid()
  );

-- Em KHÔNG xoá bài. Không có chính sách `for delete` nào, nên RLS từ chối — nhưng nói ra ở đây
-- để người đọc sau không tưởng là quên: xoá bài nộp là xoá sự thật lớp 1.

-- ═══════════════════ 3. Đã nộp là chốt ═══════════════════
--
-- Trigger, không phải chỉ RLS. RLS chặn EM, còn trigger chặn MỌI đường: cô, trợ giảng, một job
-- nền, một câu UPDATE chạy tay trong bảng điều khiển Supabase. "Bài đã nộp không sửa được" là
-- bất biến của dữ liệu, không phải một quyền của một vai — nên nó phải nằm ở chỗ không vai nào
-- đi vòng được.
--
-- Vì sao chặt thế: band của em tính từ bài này, nhận xét cô gửi trích chính chữ trong này. Sửa
-- được nội dung sau khi nộp thì một trích dẫn cô đã gửi có thể không còn trong bài, và cả hồ sơ
-- năng lực của em thành thứ không kiểm lại được.
create or replace function app.submission_frozen_after_submit()
returns trigger language plpgsql as $$
begin
  if old.submitted_at is not null then
    -- Cho phép đúng một loại thay đổi: không thay đổi gì cả (UPDATE trùng giá trị, do một job
    -- chạy lại). So bằng `is distinct from` để null không làm phép so thành null.
    --
    -- KHÔNG so `duration_s` ở đây. Nó là cột TÍNH, và trong trigger `before update` cột tính
    -- chưa được tính: `new.duration_s` là null trong khi `old.duration_s` có giá trị, nên phép
    -- so luôn ra "khác" và mọi UPDATE đều bị chặn — kể cả `set content = content`. Cột tính
    -- cũng không cần canh: Postgres đã không cho ai ghi vào nó.
    if new.content is distinct from old.content
       or new.words is distinct from old.words
       or new.submitted_at is distinct from old.submitted_at
       or new.created_at is distinct from old.created_at
       or new.student_id is distinct from old.student_id
       or new.assignment_id is distinct from old.assignment_id
       or new.late is distinct from old.late then
      raise exception 'bài đã nộp thì không sửa được (submission %)', old.id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger submissions_frozen
  before update on submissions
  for each row execute function app.submission_frozen_after_submit();

-- Xoá cũng chặn ở tầng dữ liệu, cùng lý do: bài nộp là sự thật lớp 1, chỉ thêm.
create or replace function app.submission_no_delete_after_submit()
returns trigger language plpgsql as $$
begin
  if old.submitted_at is not null then
    raise exception 'bài đã nộp thì không xoá được (submission %)', old.id
      using errcode = 'check_violation';
  end if;
  return old;
end $$;

create trigger submissions_no_delete
  before delete on submissions
  for each row execute function app.submission_no_delete_after_submit();

-- ═══════════════════ 4. Thời gian làm bài: SUY ra, không nhận từ client ═══════════════════
--
-- `duration_s` có từ 0007 như một cột client ghi vào. Một con số client gửi thì em sửa được, mà
-- cô đọc nó như sự thật ("em viết 6 phút" → cô nghĩ em làm vội). Hai mốc thì khác: `created_at`
-- ghi lúc mở, `submitted_at` ghi lúc nộp, và thời gian là hiệu của chúng.
--
-- Nên cột này thành cột TÍNH: không ai ghi vào được, và nó không thể lệch với hai mốc.
alter table submissions drop column duration_s;

alter table submissions
  add column duration_s int
  generated always as (
    case
      when submitted_at is null then null
      else greatest(0, extract(epoch from (submitted_at - created_at))::int)
    end
  ) stored;

comment on column submissions.duration_s is
  'Số giây em ngồi làm bài, TÍNH từ created_at (mở bài) tới submitted_at (nộp). Không ai ghi vào được.';
