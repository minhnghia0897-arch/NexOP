-- 0007 — bài giao là ảnh chụp, và giới hạn tần suất đếm trong CSDL.
--
-- Hai bài học nhập từ bản OBLUE đang chạy (docs/SO-SANH-BAN-CU-BAN-MOI.md §3.1, §3.2).
-- Cả hai đều là chỗ hỏng mà KHÔNG báo lỗi, nên phải ép ở tầng CSDL.

-- ═══════════════════ 1. Bài giao ═══════════════════
--
-- ARCHITECTURE §2 ban đầu để assignments trỏ exam_id — liên kết sống. Cô sửa đề lúc lớp
-- đang làm bài là đổi câu hỏi dưới chân em.
--
-- Nên bài giao giữ BẢN CHÉP của câu hỏi tại thời điểm giao. exam_id vẫn còn, để biết bài
-- này sinh từ đề nào và để lan truyền khi cô sửa đề.

create table assignments (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants (id) on delete cascade,
  class_id     uuid not null references classes (id) on delete cascade,
  -- Đề gốc. Xoá đề thì bài đã giao vẫn còn — em đã làm rồi, không thể mất bài.
  exam_id      uuid references exams (id) on delete set null,

  -- Ảnh chụp câu hỏi lúc giao. Đây là bộ câu hỏi em thật sự làm.
  questions    jsonb not null,

  due_at       timestamptz,
  grading      exam_grading not null default 'draft',
  weight       numeric(4, 2) not null default 1,
  -- UC-05: giao lại cùng một đề cho cùng một lớp = "lần 2", không phải ghi đè.
  attempt_no   int not null default 1,
  published_at timestamptz,
  created_at   timestamptz not null default now(),

  constraint assignments_questions_is_array check (jsonb_typeof(questions) = 'array'),
  constraint assignments_attempt_positive check (attempt_no > 0),
  constraint assignments_weight_positive check (weight > 0),
  constraint assignments_unique_attempt unique (class_id, exam_id, attempt_no)
);

create index assignments_class_idx on assignments (class_id, due_at desc);
create index assignments_exam_idx on assignments (exam_id) where exam_id is not null;

-- Lớp và bài giao phải cùng tên miền, cùng lý do với memberships_class_same_tenant ở 0004.
alter table assignments
  add constraint assignments_class_same_tenant
  check (app.class_belongs_to_tenant(class_id, tenant_id));

-- ─────────────── giao bài ───────────────
-- Chép câu hỏi từ ngân hàng vào bài giao, trong một hàm nên không có khoảng trống nào
-- mà bài giao tồn tại với bộ câu hỏi rỗng.
create function app.publish_assignment(
  p_tenant_id  uuid,
  p_owner_id   uuid,
  p_class_id   uuid,
  p_exam_id    uuid,
  p_due_at     timestamptz default null,
  p_attempt_no int default 1
) returns uuid
language plpgsql as $$
declare
  v_questions jsonb;
  v_grading   exam_grading;
  v_id        uuid;
begin
  perform app.record_event(
    p_tenant_id, 'owner', 'assignment.send', 'assignment',
    p_class_id, p_owner_id, null,
    jsonb_build_object('exam_id', p_exam_id, 'attempt_no', p_attempt_no),
    array[p_owner_id]
  );

  -- Chụp lại đúng bộ câu hỏi tại thời điểm này.
  --
  -- `filter (where q.id is not null)` là bắt buộc: với left join lên một đề chưa có câu
  -- hỏi nào, jsonb_agg gom đúng một hàng toàn NULL và trả về `[null]` — dài 1, không
  -- phải rỗng. Thiếu filter thì cửa chặn "đề chưa có câu hỏi" không bao giờ bật, và lớp
  -- nhận một bài gồm đúng một câu hỏi rỗng.
  select coalesce(jsonb_agg(to_jsonb(q) order by q.no) filter (where q.id is not null),
                  '[]'::jsonb),
         e.grading
    into v_questions, v_grading
    from exams e
    left join questions q on q.exam_id = e.id
   where e.id = p_exam_id and e.tenant_id = p_tenant_id
   group by e.grading;

  if v_questions is null then
    raise exception 'Đề không tồn tại trong tên miền này';
  end if;
  if jsonb_array_length(v_questions) = 0 then
    raise exception 'Đề chưa có câu hỏi nào — không giao được';
  end if;

  insert into assignments (tenant_id, class_id, exam_id, questions, due_at, grading,
                           attempt_no, published_at)
  values (p_tenant_id, p_class_id, p_exam_id, v_questions, p_due_at, v_grading,
          p_attempt_no, now())
  returning id into v_id;

  return v_id;
end;
$$;

-- ─────────────── lan truyền khi cô sửa đề ───────────────
--
-- Vế còn lại của luật. Bản đang chạy học được bằng một lỗi thật: cô thêm đoạn văn đọc
-- hiểu, lưu, học viên mở ra không thấy — vì đang đọc ảnh chụp cũ. Cô không nghĩ mình sửa
-- "bản gốc"; cô nghĩ mình sửa "cái đề".
--
-- Khác bản cũ ở một điểm: bản cũ lan xuống MỌI bài giao khớp đề. Ở đây chỉ lan xuống bài
-- CHƯA AI NỘP. Lan xuống bài đã có người nộp là đổi đề sau lưng người đã làm xong — điểm
-- của em tính trên một bộ câu hỏi không còn tồn tại.
create function app.propagate_exam_edit(
  p_tenant_id uuid,
  p_owner_id  uuid,
  p_exam_id   uuid
) returns table (updated int, skipped int)
language plpgsql as $$
declare
  v_questions jsonb;
  v_updated   int;
  v_skipped   int;
begin
  select coalesce(jsonb_agg(to_jsonb(q) order by q.no), '[]'::jsonb)
    into v_questions
    from questions q where q.exam_id = p_exam_id;

  -- Đề bị xoá hết câu hỏi thì KHÔNG lan truyền. Đẩy bài giao về rỗng là biến bài của
  -- cả lớp thành bài không có gì để làm — cùng kiểu hỏng không kêu. Cô muốn gỡ bài thì
  -- gỡ bài giao, không phải làm rỗng nó.
  if jsonb_array_length(v_questions) = 0 then
    perform app.record_event(
      p_tenant_id, 'owner', 'assignment.update', 'assignment',
      null, p_owner_id, p_exam_id,
      jsonb_build_object('updated', 0, 'skipped', 0, 'reason', 'de_rong'),
      array[p_owner_id]
    );
    return query select 0, 0;
    return;
  end if;

  -- Bài đã có người nộp: giữ nguyên ảnh chụp.
  select count(*)::int into v_skipped
    from assignments a
   where a.exam_id = p_exam_id
     and a.tenant_id = p_tenant_id
     and exists (select 1 from submissions s where s.assignment_id = a.id);

  with da_sua as (
    update assignments a
       set questions = v_questions
     where a.exam_id = p_exam_id
       and a.tenant_id = p_tenant_id
       and a.questions is distinct from v_questions
       and not exists (select 1 from submissions s where s.assignment_id = a.id)
    returning 1
  )
  select count(*)::int into v_updated from da_sua;

  perform app.record_event(
    p_tenant_id, 'owner', 'assignment.update', 'assignment',
    null, p_owner_id, p_exam_id,
    jsonb_build_object('updated', v_updated, 'skipped', v_skipped),
    array[p_owner_id]
  );

  return query select v_updated, v_skipped;
end;
$$;

comment on function app.propagate_exam_edit is
  'Lan truyền sửa đề xuống bài giao chưa ai nộp. Trả về số bài đã sửa và số bài bỏ qua, để cô biết bài nào không nhận được thay đổi.';

-- ─────────────── submissions ───────────────
-- Lớp 1. Dựng ở đây vì lan truyền cần biết bài nào đã có người nộp.
create table submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  student_id    uuid not null references accounts (id) on delete cascade,
  content       text,
  words         int,
  duration_s    int,
  submitted_at  timestamptz,
  late          boolean not null default false,
  created_at    timestamptz not null default now(),

  -- UC-06: một bài nộp cho mỗi em, mỗi bài giao. Giao lại là attempt_no mới, tức
  -- assignment mới, nên không đụng dòng này.
  constraint submissions_one_per_student unique (assignment_id, student_id),
  constraint submissions_words_positive check (words is null or words >= 0),
  -- Đã nộp thì phải có nội dung; chưa nộp là bản nháp đang viết.
  constraint submissions_submitted_has_content check (
    submitted_at is null or content is not null
  )
);

create index submissions_assignment_idx on submissions (assignment_id);
create index submissions_student_idx on submissions (student_id, submitted_at desc);

-- ─────────────── RLS ───────────────
alter table assignments enable row level security;
alter table submissions enable row level security;

-- UC-05: "chỉ thành viên lớp thấy đề". Đây là đường em gặp đề — qua bài giao, không qua
-- ngân hàng. Và chỉ khi cô đã đăng, không phải lúc còn nháp.
create policy assignments_read_class on assignments
  for select using (
    app.owns_class(assignments.class_id)
    or (published_at is not null and app.is_class_member(assignments.class_id))
  );

-- Em chỉ thấy bài của em. CLAUDE.md: không màn nào so sánh học viên với nhau.
create policy submissions_read_own on submissions
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from assignments a
      where a.id = submissions.assignment_id and app.owns_class(a.class_id)
    )
  );

-- ═══════════════════ 2. Giới hạn tần suất ═══════════════════
--
-- Không có mật khẩu (ARCHITECTURE §6), nên OTP 6 chữ số là toàn bộ cánh cửa.
-- lib/domain/tenant/otp.ts khai báo tối đa 5 lần thử, nhưng hằng số ở tầng ứng dụng
-- không chặn được ai: mở tab khác là đếm lại từ đầu.
--
-- Đếm ở đây, trong CSDL, nên không lách được bằng nhiều tab hay nhiều máy.

create table rate_limit_events (
  id      bigserial primary key,
  -- Khoá gộp: 'otp:+84901234567', 'invite:<token>', 'login:<ip>'…
  key     text not null,
  at      timestamptz not null default now()
);

create index rate_limit_key_at_idx on rate_limit_events (key, at desc);

/*
 * Ghi một lần thử và trả về việc còn được phép hay không.
 *
 * Ghi TRƯỚC rồi mới đếm, nên lần thử vượt ngưỡng vẫn được ghi lại — muốn biết có ai
 * đang dò thì phải thấy cả những lần bị chặn.
 */
create function app.check_rate_limit(
  p_key      text,
  p_max      int,
  p_window_s int
) returns boolean
language plpgsql as $$
declare
  v_count int;
begin
  insert into rate_limit_events (key) values (p_key);

  select count(*)::int into v_count
    from rate_limit_events
   where key = p_key
     and at > now() - make_interval(secs => p_window_s);

  return v_count <= p_max;
end;
$$;

comment on function app.check_rate_limit is
  'Ghi một lần thử, trả false khi đã vượt ngưỡng trong cửa sổ. Đếm trong CSDL nên không lách được bằng nhiều tab.';

-- Dọn dấu vết cũ; giữ 30 ngày là đủ để điều tra một đợt dò.
create function app.prune_rate_limit_events() returns int
language plpgsql as $$
declare
  v_deleted int;
begin
  delete from rate_limit_events where at < now() - interval '30 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Không ai đọc bảng này qua RLS. Chỉ máy chủ.
alter table rate_limit_events enable row level security;
