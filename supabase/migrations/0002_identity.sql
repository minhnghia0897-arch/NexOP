-- 0002 — danh tính: lời mời, mã OTP, đề xuất.
--
-- Chặng 2 trong docs/PLAN.md, phủ UC-02 (thêm học viên / mời) và UC-18 (đăng nhập).
-- Mọi hàm ở đây theo hợp đồng của 0001: câu lệnh đầu tiên là app.record_event().

-- SĐT lưu ở dạng đã chuẩn hoá, đúng một dạng. lib/domain/tenant/phone.ts chuẩn hoá
-- trước khi ghi; ràng buộc này là lưới thứ hai, để không đường nào lọt số thô vào.
alter table accounts
  add constraint accounts_phone_normalised
  check (phone is null or phone ~ '^\+84[0-9]{9}$');

alter table memberships
  add constraint memberships_invited_phone_normalised
  check (invited_phone is null or invited_phone ~ '^\+84[0-9]{9}$');

-- ─────────────────────────── proposals ───────────────────────────
-- Lớp 3: máy hoặc người lạ đề xuất, cô quyết. Có hạn, hết hạn thì thôi.
create type proposal_kind as enum ('renewal', 'retain', 'promote', 'invite', 'practice');
create type proposal_action as enum ('accept', 'reject');

create table proposals (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants (id) on delete cascade,
  kind           proposal_kind not null,
  target_id      uuid,
  payload        jsonb not null default '{}'::jsonb,
  reason         text not null,
  expires_at     timestamptz not null,
  decided_by     uuid references accounts (id) on delete set null,
  decided_at     timestamptz,
  decided_action proposal_action,
  created_at     timestamptz not null default now(),

  -- Đã quyết thì phải đủ cả ba: ai, lúc nào, quyết gì.
  constraint proposals_decision_is_complete check (
    (decided_by is null and decided_at is null and decided_action is null)
    or (decided_by is not null and decided_at is not null and decided_action is not null)
  )
);

create index proposals_tenant_open_idx on proposals (tenant_id, kind)
  where decided_at is null;

alter table proposals enable row level security;

-- Đề xuất là việc của cô. Không vai nào khác đọc.
create policy proposals_read_owner on proposals
  for select using (app.is_tenant_owner(proposals.tenant_id));

-- ─────────────────────────── otp_challenges ───────────────────────────
create type otp_channel as enum ('phone', 'email');

create table otp_challenges (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references tenants (id) on delete cascade,
  channel      otp_channel not null,
  destination  text not null,
  code_hash    text not null,
  attempts     int not null default 0,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index otp_open_idx on otp_challenges (destination, created_at desc)
  where consumed_at is null;

-- Không ai đọc bảng này qua RLS. Chỉ máy chủ, bằng khoá service.
alter table otp_challenges enable row level security;

-- ─────────────────────────── lời mời ───────────────────────────

-- Cô mời một người vào lớp. Trả về token cho link /m/<token>.
create function app.create_invite(
  p_tenant_id     uuid,
  p_owner_id      uuid,
  p_role          membership_role,
  p_invited_phone text,
  p_token         text,
  p_class_id      uuid default null,
  p_name          text default null
) returns uuid
language plpgsql as $$
declare
  v_membership_id uuid;
begin
  perform app.record_event(
    p_tenant_id, 'owner', 'membership.create', 'membership',
    p_class_id, p_owner_id, null,
    jsonb_build_object('role', p_role, 'invited_phone', p_invited_phone, 'name', p_name),
    array[p_owner_id]
  );

  insert into memberships (tenant_id, class_id, role, status, invite_token, invited_phone)
  values (p_tenant_id, p_class_id, p_role, 'pending', p_token, p_invited_phone)
  returning id into v_membership_id;

  return v_membership_id;
end;
$$;

/*
 * Em mở link mời và nhập SĐT.
 *
 * Trả về trạng thái chứ không ném lỗi, vì UC-02 đòi "SĐT khác SĐT cô lưu → từ chối
 * VÀ cô nhận thông báo". Ném lỗi thì transaction lùi, sự kiện báo cho cô mất theo,
 * và cô không bao giờ biết có người lạ thử mở link của lớp mình.
 *
 * outcome ∈ accepted | phone_mismatch | expired | already_used | not_found
 */
create type invite_outcome as (outcome text, account_id uuid);

create function app.accept_invite(
  p_token text,
  p_phone text,
  p_name  text
) returns invite_outcome
language plpgsql as $$
declare
  v_m          memberships%rowtype;
  v_account_id uuid;
  v_owner_id   uuid;
begin
  -- Khoá dòng: hai người bấm cùng lúc thì chỉ một người nhận được lời mời.
  select * into v_m from memberships where invite_token = p_token for update;

  if not found then
    return ('not_found', null)::invite_outcome;
  end if;

  select owner_account_id into v_owner_id from tenants where id = v_m.tenant_id;

  if v_m.status <> 'pending' then
    perform app.record_event(
      v_m.tenant_id, 'system', 'membership.propose', 'membership',
      v_m.class_id, null, v_m.id,
      jsonb_build_object('outcome', 'already_used'), array[v_owner_id]
    );
    return ('already_used', null)::invite_outcome;
  end if;

  -- Link sống 7 ngày (ARCHITECTURE §6).
  if v_m.created_at + interval '7 days' < now() then
    perform app.record_event(
      v_m.tenant_id, 'system', 'membership.propose', 'membership',
      v_m.class_id, null, v_m.id,
      jsonb_build_object('outcome', 'expired'), array[v_owner_id]
    );
    update memberships set status = 'expired' where id = v_m.id;
    return ('expired', null)::invite_outcome;
  end if;

  -- Cửa khớp SĐT. Cả hai vế đã chuẩn hoá, nên so bằng là đủ.
  if v_m.invited_phone is distinct from p_phone then
    perform app.record_event(
      v_m.tenant_id, 'system', 'membership.propose', 'membership',
      v_m.class_id, null, v_m.id,
      jsonb_build_object('outcome', 'phone_mismatch', 'tried_phone', p_phone),
      array[v_owner_id]
    );
    return ('phone_mismatch', null)::invite_outcome;
  end if;

  -- SĐT đã có tài khoản ở tên miền khác → gắn vào, không tạo mới (UC-02).
  select id into v_account_id from accounts where phone = p_phone;
  if not found then
    insert into accounts (phone, name) values (p_phone, p_name)
    returning id into v_account_id;
  end if;

  perform app.record_event(
    v_m.tenant_id, 'system', 'membership.propose', 'membership',
    v_m.class_id, null, v_m.id,
    jsonb_build_object('outcome', 'accepted'),
    array[v_owner_id, v_account_id]
  );

  update memberships
     set account_id   = v_account_id,
         status       = 'active',
         activated_at = now()
   where id = v_m.id;

  return ('accepted', v_account_id)::invite_outcome;
end;
$$;

/*
 * SĐT không có tư cách nào ở tên miền → KHÔNG tạo account (ARCHITECTURE §6).
 * Chỉ ghi một đề xuất chờ cô duyệt. Người lạ không tự thêm mình vào lớp được.
 */
create function app.request_trial(
  p_tenant_id uuid,
  p_phone     text,
  p_name      text,
  p_note      text default null
) returns uuid
language plpgsql as $$
declare
  v_owner_id uuid;
  v_id       uuid;
begin
  select owner_account_id into v_owner_id from tenants where id = p_tenant_id;
  if not found then
    raise exception 'Tên miền không tồn tại';
  end if;

  perform app.record_event(
    p_tenant_id, 'system', 'membership.propose', 'membership',
    null, null, null,
    jsonb_build_object('kind', 'trial', 'phone', p_phone, 'name', p_name),
    array[v_owner_id]
  );

  insert into proposals (tenant_id, kind, payload, reason, expires_at)
  values (
    p_tenant_id, 'invite',
    jsonb_build_object('phone', p_phone, 'name', p_name, 'note', p_note),
    'Đăng ký học thử từ trang đăng nhập',
    now() + interval '30 days'
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ─────────────────── sửa ràng buộc tư cách thành viên ───────────────────
-- 0001 đòi mọi tư cách khác `pending` phải có account_id. Sai với lời mời hết hạn:
-- không ai nhận thì làm gì có account để gắn. Lỗi lộ ra khi test nhánh hết hạn 7 ngày.
--
-- Luật đúng: còn mang lời mời (pending, expired) thì phải có token và SĐT;
-- đã thành người thật (active, left) thì phải có account.
alter table memberships drop constraint memberships_pending_has_invite;

alter table memberships
  add constraint memberships_invite_or_account check (
    (status in ('pending', 'expired') and invite_token is not null and invited_phone is not null)
    or (status in ('active', 'left') and account_id is not null)
  );
