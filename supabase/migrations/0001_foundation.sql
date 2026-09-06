-- 0001 — nền móng: tài khoản, tên miền, tư cách thành viên, nhật ký sự kiện.
--
-- Bốn bảng này là chặng 1 trong docs/PLAN.md. Ba luật của ARCHITECTURE §4–§5 được
-- ép ở đây bằng ràng buộc chứ không chỉ bằng mã ứng dụng: máy chỉ nháp/đề xuất,
-- "gửi" chỉ do cô, và nhật ký chỉ được thêm.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Hàm nội bộ của ứng dụng. Dựng sớm vì các chính sách RLS bên dưới cần tới.
create schema app;

-- ─────────────────────────── accounts ───────────────────────────
-- Toàn cục: một người = một dòng, dù học ở mấy tên miền.
create table accounts (
  id         uuid primary key default gen_random_uuid(),
  phone      text unique,
  email      citext unique,
  name       text not null,
  created_at timestamptz not null default now(),

  -- Cô vào bằng email, em vào bằng SĐT — phải có ít nhất một cửa.
  constraint accounts_needs_a_way_in check (phone is not null or email is not null)
);

-- ─────────────────────────── tenants ───────────────────────────
create table tenants (
  id               uuid primary key default gen_random_uuid(),
  subdomain        citext not null unique,
  owner_account_id uuid not null references accounts (id) on delete restrict,
  created_at       timestamptz not null default now(),

  constraint tenants_subdomain_shape check (subdomain ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$')
);

-- ─────────────────────────── memberships ───────────────────────────
create type membership_role   as enum ('owner', 'assistant', 'student', 'parent');
create type membership_status as enum ('pending', 'active', 'left', 'expired');

create table memberships (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid references accounts (id) on delete restrict,
  tenant_id     uuid not null references tenants (id) on delete cascade,
  -- FK tới classes thêm ở chặng 3; chặng 1 chưa có bảng đó.
  class_id      uuid,
  role          membership_role not null,
  status        membership_status not null default 'pending',
  permissions   jsonb not null default '{}'::jsonb,
  invite_token  text unique,
  invited_phone text,
  last_role     membership_role,
  created_at    timestamptz not null default now(),
  activated_at  timestamptz,

  -- Lời mời chưa nhận thì chưa gắn account; nhận rồi thì bắt buộc có.
  constraint memberships_pending_has_invite check (
    (status = 'pending' and invite_token is not null and invited_phone is not null)
    or (status <> 'pending' and account_id is not null)
  ),
  -- Một người một tư cách cho mỗi (tên miền, lớp).
  constraint memberships_unique_per_class unique nulls not distinct (account_id, tenant_id, class_id, role)
);

create index memberships_tenant_idx  on memberships (tenant_id);
create index memberships_account_idx on memberships (account_id);
create index memberships_class_idx   on memberships (class_id) where class_id is not null;

-- ─────────────────────────── events ───────────────────────────
-- Lớp 1. Ghi TRƯỚC khi hành vi có hiệu lực; ghi hỏng thì hành vi không xảy ra.
create type actor_role as enum ('owner', 'assistant', 'student', 'parent', 'system');

create table events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  class_id    uuid,
  actor_id    uuid references accounts (id) on delete set null,
  actor_role  actor_role not null,
  action      text not null,
  object_type text not null,
  object_id   uuid,
  payload     jsonb not null default '{}'::jsonb,
  -- Tính lúc ghi, không tính lúc đọc: danh sách account được nhìn thấy dòng này.
  visibility  uuid[] not null default '{}',
  at          timestamptz not null default now(),

  constraint events_action_shape check (action ~ '^[a-z_]+\.[a-z_]+(:[a-z_]+)?$'),

  -- ARCHITECTURE §4: máy chỉ được draft, propose, auto:*. Không create, không send.
  constraint events_system_may_only_draft check (
    actor_role <> 'system'
    or split_part(action, '.', 2) in ('draft', 'propose')
    or action like '%.auto:%'
  ),

  -- ARCHITECTURE §4 + permissions.json send_actions_owner_only: "gửi" chỉ do cô.
  constraint events_send_is_owner_only check (
    actor_role = 'owner'
    or action not in ('review.send', 'message.send', 'fee.message.send')
  ),

  -- Máy không có tài khoản; người thì phải có.
  constraint events_actor_matches_role check (
    (actor_role = 'system' and actor_id is null)
    or (actor_role <> 'system' and actor_id is not null)
  )
);

create index events_tenant_at_idx  on events (tenant_id, at desc);
create index events_class_at_idx   on events (class_id, at desc) where class_id is not null;
create index events_object_idx     on events (object_type, object_id);
create index events_visibility_idx on events using gin (visibility);

-- Chỉ thêm. Sửa hay xoá nhật ký thì mọi thứ dựng trên nó mất nghĩa.
create or replace function events_are_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'events chỉ được thêm, không sửa không xoá (ARCHITECTURE §3)';
end;
$$;

create trigger events_no_update before update on events
  for each row execute function events_are_append_only();
create trigger events_no_delete before delete on events
  for each row execute function events_are_append_only();

-- ─────────────────────────── RLS ───────────────────────────
-- RLS phản chiếu nhánh `read` của can(); mọi `write` vẫn đi qua server.
-- Bật cho mọi bảng, kể cả bảng tưởng như vô hại (CLAUDE.md, luật cứng).

alter table accounts    enable row level security;
alter table tenants     enable row level security;
alter table memberships enable row level security;
alter table events      enable row level security;

-- Mỗi người chỉ đọc dòng tài khoản của chính mình.
create policy accounts_read_self on accounts
  for select using (id = auth.uid());

-- Hai câu hỏi "người này có ở tên miền không" và "người này có phải chủ không"
-- phải trả lời được mà KHÔNG kích hoạt RLS, nếu không sẽ thành vòng tròn:
-- chính sách của tenants hỏi memberships, chính sách của memberships hỏi tenants,
-- Postgres báo "infinite recursion detected in policy".
--
-- security definer cho hàm chạy dưới quyền chủ schema nên truy vấn bên trong không
-- qua RLS. search_path ghim cứng để không ai chèn bảng giả cùng tên vào đường tìm.
create function app.is_active_member(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from memberships
    where tenant_id = p_tenant_id
      and account_id = auth.uid()
      and status = 'active'
  );
$$;

create function app.is_tenant_owner(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from tenants
    where id = p_tenant_id
      and owner_account_id = auth.uid()
  );
$$;

-- Tên miền: đọc được nếu đang là thành viên còn hoạt động.
create policy tenants_read_if_member on tenants
  for select using (app.is_active_member(tenants.id));

-- permissions.json: membership → chỉ owner có quyền. Vai khác đọc qua server
-- bằng khoá service, không qua RLS.
create policy memberships_read_owner on memberships
  for select using (app.is_tenant_owner(memberships.tenant_id));

-- Nhật ký: đúng bằng danh sách visibility đã tính lúc ghi.
create policy events_read_visible on events
  for select using (auth.uid() = any (visibility));

-- ─────────────────────── ghi sự kiện trước khi có hiệu lực ───────────────────────
-- CLAUDE.md: "Mọi hành vi ghi vào events TRƯỚC khi có hiệu lực. Ghi thất bại →
-- hành vi không xảy ra."
--
-- Supabase JS không mở được transaction trải nhiều câu lệnh, nên chỗ duy nhất giữ
-- được lời hứa đó là bên trong Postgres: mỗi mutation là một hàm, câu lệnh ĐẦU TIÊN
-- của nó gọi app.record_event(). Hàm chạy trong một transaction, nên hoặc cả sự kiện
-- lẫn thay đổi cùng vào, hoặc không gì vào cả.
--
-- Quy ước này là hợp đồng của mọi hàm mutation thêm về sau.

create function app.record_event(
  p_tenant_id   uuid,
  p_actor_role  actor_role,
  p_action      text,
  p_object_type text,
  p_class_id    uuid   default null,
  p_actor_id    uuid   default null,
  p_object_id   uuid   default null,
  p_payload     jsonb  default '{}'::jsonb,
  p_visibility  uuid[] default '{}'
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into events (
    tenant_id, class_id, actor_id, actor_role,
    action, object_type, object_id, payload, visibility
  )
  values (
    p_tenant_id, p_class_id, p_actor_id, p_actor_role,
    p_action, p_object_type, p_object_id, p_payload, p_visibility
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function app.record_event is
  'Câu lệnh đầu tiên của mọi hàm mutation. Ràng buộc trên events chặn ở đây, nên hành vi bị cấm không bao giờ có hiệu lực.';
