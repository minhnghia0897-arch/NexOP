-- 0006 — ngân hàng đề: đề, đoạn văn, câu hỏi.
--
-- DECISIONS 2026-09: "Đề thuộc ngân hàng của cô, không thuộc lớp." Lớp đóng thì đề
-- còn; mở lớp mới từ lộ trình là đề theo về, không nhân bản. Vì vậy exams gắn vào
-- tenant chứ KHÔNG gắn vào class — cầu nối là bảng assignments ở chặng 5.
--
-- Phủ UC-03 (số hoá đề bằng OCR) và UC-04 (soạn/sửa câu hỏi).

create type exam_skill as enum (
  'reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'
);

-- ARCHITECTURE §2: grading(auto|draft|manual).
create type exam_grading as enum ('auto', 'draft', 'manual');

-- UC-04: bốn loại, trộn được trong một đề.
create type question_type as enum ('mcq', 'fill', 'tfng', 'essay');

create table exams (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  name        text not null,
  skill       exam_skill not null,
  level       text,
  tags        text[] not null default '{}',
  duration_minutes int,
  grading     exam_grading not null default 'draft',
  -- % tin cậy của lần OCR; null nghĩa là cô soạn tay, không qua máy đọc.
  ocr_confidence numeric(4, 3),
  -- Tệp gốc trong Storage, để đối chiếu khi cô ngờ máy đọc sai.
  source_path text,
  created_at  timestamptz not null default now(),

  constraint exams_duration_positive check (duration_minutes is null or duration_minutes > 0),
  constraint exams_confidence_range check (
    ocr_confidence is null or (ocr_confidence >= 0 and ocr_confidence <= 1)
  )
);

create index exams_tenant_idx on exams (tenant_id, skill);

-- ─────────────────────────── passages ───────────────────────────
-- UC-04: "đoạn văn dùng chung cho dải câu".
create table passages (
  id       uuid primary key default gen_random_uuid(),
  exam_id  uuid not null references exams (id) on delete cascade,
  text     text not null,
  from_no  int not null,
  to_no    int not null,

  constraint passages_range_sane check (from_no > 0 and to_no >= from_no)
);

create index passages_exam_idx on passages (exam_id);

-- ─────────────────────────── questions ───────────────────────────
create table questions (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references exams (id) on delete cascade,
  no          int not null,
  type        question_type not null,
  text        text not null,
  -- mcq/tfng: các lựa chọn. fill/essay: không có.
  options     jsonb,
  -- UC-04: "Bấm lại đáp án đúng → bỏ chọn → chấm tay". Đáp án rỗng LÀ cách nói
  -- "câu này chấm tay", nên không được để nó xảy ra một cách tình cờ — xem ràng buộc.
  answer      text,
  explanation text,
  passage_id  uuid references passages (id) on delete set null,
  -- UC-03: câu không tìm thấy đáp án gắn cảnh báo và mặc định chấm tay.
  warning     text,
  -- UC-03: "nguồn đáp án (trang) hiển thị được".
  source_page int,
  confidence  numeric(4, 3),

  constraint questions_no_positive check (no > 0),
  constraint questions_unique_no unique (exam_id, no),
  constraint questions_confidence_range check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  ),
  constraint questions_source_page_positive check (source_page is null or source_page > 0),

  -- mcq và tfng phải có lựa chọn; fill và essay thì không.
  constraint questions_options_match_type check (
    (type in ('mcq', 'tfng') and options is not null and jsonb_array_length(options) >= 2)
    or (type in ('fill', 'essay') and options is null)
  ),

  -- Tự luận không có đáp án chấm máy — đó là bản chất, không phải thiếu sót.
  constraint questions_essay_has_no_answer check (type <> 'essay' or answer is null),

  -- Câu chấm máy được mà lại thiếu đáp án thì phải nói rõ VÌ SAO.
  -- Không có ràng buộc này, một câu OCR đọc hụt sẽ lặng lẽ thành câu không ai chấm:
  -- máy bỏ qua vì không có đáp án, cô bỏ qua vì không thấy cảnh báo.
  constraint questions_missing_answer_needs_warning check (
    type = 'essay' or answer is not null or warning is not null
  )
);

create index questions_exam_idx on questions (exam_id, no);
create index questions_warning_idx on questions (exam_id) where warning is not null;

-- Đoạn văn và câu hỏi phải thuộc cùng một đề, và dải của đoạn phải phủ số câu.
-- Gán nhầm thì em đọc một đoạn văn không liên quan tới câu đang làm.
create function app.passage_fits_question(p_passage_id uuid, p_exam_id uuid, p_no int)
returns boolean
language sql stable as $$
  select p_passage_id is null
      or exists (
        select 1 from passages
        where id = p_passage_id
          and exam_id = p_exam_id
          and p_no between from_no and to_no
      );
$$;

alter table questions
  add constraint questions_passage_fits
  check (app.passage_fits_question(passage_id, exam_id, no));

-- ─────────────────────────── RLS ───────────────────────────
-- permissions.json: exam → owner full, assistant read, student none.
--
-- Học viên KHÔNG đọc bảng đề. UC-05 nói "chỉ thành viên lớp thấy đề", nhưng đường
-- em thấy đề là qua bài giao, không phải qua ngân hàng đề của cô. Mở exams cho học
-- viên là mở cả những đề cô chưa giao cho ai.
alter table exams     enable row level security;
alter table passages  enable row level security;
alter table questions enable row level security;

create function app.may_read_exam(p_exam_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from exams e
    join memberships m on m.tenant_id = e.tenant_id
    where e.id = p_exam_id
      and m.account_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'assistant')
  );
$$;

create policy exams_read_staff on exams
  for select using (
    app.is_tenant_owner(exams.tenant_id) or app.may_read_exam(exams.id)
  );

create policy passages_read_staff on passages
  for select using (app.may_read_exam(passages.exam_id));

create policy questions_read_staff on questions
  for select using (app.may_read_exam(questions.exam_id));
