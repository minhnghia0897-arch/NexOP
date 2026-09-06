-- 0004 — lớp học: lộ trình, lớp, bảng tin, điểm danh.
--
-- CLAUDE.md, câu phải nhớ số 1: "Lớp học là trung tâm của mọi sự kiện. Học viên gắn
-- vào lớp. Quyền đi theo lớp." Đến đây quyền theo lớp mới ép được ở tầng DB — trước
-- 0004 chưa có bảng lớp nào để RLS bám vào.

-- ─────────────────────────── paths ───────────────────────────
-- Lộ trình thuộc giáo viên, không thuộc lớp (DECISIONS 2026-09): lớp đóng thì lộ
-- trình còn, và mở lớp mới là đề theo về, không phải soạn lại.
create table paths (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  name       text not null,
  -- [{no, content, homework, exam_id?, weight?}] — ARCHITECTURE §2.
  sessions   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  constraint paths_sessions_is_array check (jsonb_typeof(sessions) = 'array')
);

create index paths_tenant_idx on paths (tenant_id);

-- ─────────────────────────── classes ───────────────────────────
create type class_status as enum ('upcoming', 'running', 'closed');

create table classes (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  name       text not null,
  schedule   text,
  capacity   int,
  -- Lộ trình mất thì lớp vẫn còn — lớp đã chạy rồi, không phụ thuộc bản thiết kế nữa.
  path_id    uuid references paths (id) on delete set null,
  status     class_status not null default 'upcoming',
  created_at timestamptz not null default now(),

  constraint classes_capacity_positive check (capacity is null or capacity > 0)
);

create index classes_tenant_idx on classes (tenant_id, status);

-- Giờ mới gắn được khoá ngoại đã hoãn từ 0001.
alter table memberships
  add constraint memberships_class_fk
  foreign key (class_id) references classes (id) on delete cascade;

-- Lớp và tư cách phải cùng một tên miền. Không có ràng buộc này thì cô A gắn được
-- học viên vào lớp của cô B, và mọi thứ dựng trên "quyền đi theo lớp" sụp.
create function app.class_belongs_to_tenant(p_class_id uuid, p_tenant_id uuid)
returns boolean
language sql stable as $$
  select p_class_id is null
      or exists (select 1 from classes where id = p_class_id and tenant_id = p_tenant_id);
$$;

alter table memberships
  add constraint memberships_class_same_tenant
  check (app.class_belongs_to_tenant(class_id, tenant_id));

-- ─────────────────────────── posts ───────────────────────────
create type post_kind as enum ('post', 'assignment', 'reminder');

create table posts (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes (id) on delete cascade,
  author_id  uuid references accounts (id) on delete set null,
  kind       post_kind not null default 'post',
  body       text not null,
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),

  -- Bài do máy tự đăng (bài giao, nhắc hạn) không có tác giả; bài người viết thì có.
  constraint posts_author_matches_kind check (
    (kind = 'post' and author_id is not null) or kind <> 'post'
  )
);

create index posts_class_idx on posts (class_id, pinned desc, created_at desc);

-- ─────────────────────────── attendance ───────────────────────────
create table attendance (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes (id) on delete cascade,
  session_no  int not null,
  student_id  uuid not null references accounts (id) on delete cascade,
  present     boolean not null,
  recorded_at timestamptz not null default now(),

  constraint attendance_session_positive check (session_no > 0),
  constraint attendance_one_per_session unique (class_id, session_no, student_id)
);

-- ─────────────────────────── RLS theo lớp ───────────────────────────
-- Câu hỏi "người này có ở trong lớp này không" phải trả lời được mà không kích hoạt
-- RLS, cùng lý do với app.is_active_member ở 0001 — nếu không thì thành vòng tròn.
create function app.is_class_member(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from memberships
    where class_id = p_class_id
      and account_id = auth.uid()
      and status = 'active'
  );
$$;

/** Cô sở hữu cả tên miền, nên không cần có tên trong từng lớp. */
create function app.owns_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from classes c
    join tenants t on t.id = c.tenant_id
    where c.id = p_class_id and t.owner_account_id = auth.uid()
  );
$$;

alter table paths      enable row level security;
alter table classes    enable row level security;
alter table posts      enable row level security;
alter table attendance enable row level security;

-- Lộ trình là tài sản của cô. Học viên và trợ giảng không thấy.
create policy paths_read_owner on paths
  for select using (app.is_tenant_owner(paths.tenant_id));

-- Lớp: cô thấy hết lớp của mình; người khác chỉ thấy lớp mình có tên trong đó.
create policy classes_read_own on classes
  for select using (
    app.is_tenant_owner(classes.tenant_id) or app.is_class_member(classes.id)
  );

-- Bảng tin đi theo lớp — đúng câu "quyền đi theo lớp".
create policy posts_read_class on posts
  for select using (app.owns_class(posts.class_id) or app.is_class_member(posts.class_id));

-- Điểm danh: cô thấy cả lớp; em chỉ thấy dòng của mình.
-- CLAUDE.md: "Không có màn nào so sánh học viên này với học viên khác cho học viên xem."
create policy attendance_read on attendance
  for select using (
    app.owns_class(attendance.class_id)
    or (student_id = auth.uid() and app.is_class_member(attendance.class_id))
  );
