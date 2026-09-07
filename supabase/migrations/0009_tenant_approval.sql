-- 0009 — vòng đời tên miền: chờ duyệt → hoạt động → bị khoá.
--
-- Chốt của cô (docs/SO-SANH-BAN-CU-BAN-MOI.md §5): "admin duyệt". Bản cũ có super_admin
-- duyệt trung tâm mới; bản mới cũng cần, nhưng phải hẹp hơn — SRS §2 vẫn đúng: admin nền
-- tảng KHÔNG nhìn thấy nội dung bài học.
--
-- Vết sẹo số 3 của bản đang chạy nói rõ vì sao chuyện này không chỉ là một cột trạng thái:
-- "Tài khoản chờ duyệt phải bị đăng xuất ngay, không chỉ ẩn giao diện." Ẩn ở giao diện là
-- vẫn còn khoá vào dữ liệu; người dùng chờ duyệt gọi thẳng API là vào. Nên ở đây tên miền
-- chưa duyệt bị chặn ở HAI tầng, và cả hai đều ở trong CSDL:
--   • đọc — mọi hàm trợ giúp RLS đòi tên miền đang hoạt động;
--   • ghi — app.record_event từ chối ghi, mà không ghi được thì theo luật cứng của
--     CLAUDE.md hành vi không xảy ra.
-- Không có đường nào lách qua tầng ứng dụng, vì không tầng nào của ứng dụng tham gia.

create type tenant_status as enum ('pending', 'active', 'suspended');

alter table tenants
  add column status      tenant_status not null default 'pending',
  add column approved_at timestamptz,
  -- Ai bấm duyệt. Để trống được: những tên miền có trước khi dựng sổ này không có người ký.
  add column approved_by uuid references accounts (id) on delete set null,
  -- Lý do khoá, hiện cho cô đọc. Khoá mà không nói vì sao là đúng kiểu hỏng không kêu.
  add column status_reason text;

-- Tên miền đã dựng từ trước là đã chạy thật — không thể đẩy chúng về hàng chờ.
update tenants set status = 'active', approved_at = created_at where status = 'pending';

-- Không có bút phê thì không được sống. Ràng buộc này chặn đúng cái lỗi dễ xảy ra nhất:
-- một đoạn mã nào đó set status='active' mà quên ghi lại thời điểm, và về sau không ai
-- trả lời được câu "tên miền này được duyệt lúc nào, do ai".
alter table tenants
  add constraint tenants_live_has_approval
  check (status <> 'active' or approved_at is not null);

-- Khoá thì phải kèm lý do.
alter table tenants
  add constraint tenants_suspended_has_reason
  check (status <> 'suspended' or status_reason is not null);

create index tenants_pending_idx on tenants (created_at) where status = 'pending';

-- ═══════════════════ admin nền tảng ═══════════════════
--
-- Một bảng, một cột khoá chính. Vai này KHÔNG có mức quyền trong permissions.json và
-- không bao giờ nên có: can() trả lời câu "thành viên của tên miền này được làm gì bên
-- trong nó", còn admin không phải thành viên của tên miền nào.
--
-- Hệ quả là bảo đảm của SRS §2 đứng vững bằng cấu trúc chứ không bằng thiện chí: mọi
-- chính sách đọc nội dung đều đi qua memberships hoặc owner_account_id, nên một admin
-- không có tên trong tên miền đọc rỗng — kể cả khi anh ta tự cấp quyền admin.
create table platform_admins (
  account_id uuid primary key references accounts (id) on delete cascade,
  note       text,
  granted_at timestamptz not null default now()
);

alter table platform_admins enable row level security;
-- Không chính sách select nào. Bảng này chỉ máy chủ đọc, và các hàm security definer
-- dưới đây. Ai là admin không phải chuyện công khai.

create function app.is_platform_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from platform_admins where account_id = auth.uid());
$$;

-- ═══════════════════ cửa chặn: tên miền phải đang sống ═══════════════════

create function app.tenant_is_live(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from tenants where id = p_tenant_id and status = 'active');
$$;

comment on function app.tenant_is_live is
  'Tên miền đã được admin duyệt và chưa bị khoá. Mọi hàm trợ giúp RLS đi qua đây.';

-- Bản không phụ thuộc auth.uid(), cho record_event dùng. Phải là security definer:
-- nếu đọc tenants qua RLS thì cùng một tên miền sẽ "sống" hay "không sống" tuỳ vai của
-- người đang gọi, và cửa chặn ghi trở thành ngẫu nhiên.
create function app.tenant_is_live_unchecked(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from tenants where id = p_tenant_id and status = 'active');
$$;

-- ─────────────── vá lại bốn hàm trợ giúp RLS ───────────────
-- Thêm một vế vào mỗi hàm, không đổi chữ ký, nên mọi chính sách đã viết tự hưởng.
-- Vá ở đây chứ không vá ở từng chính sách: bốn hàm này là chỗ hẹp mà mọi đường đọc
-- đều phải qua, còn chính sách thì sẽ còn thêm nữa và sẽ có cái quên.

create or replace function app.is_active_member(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from memberships m
    join tenants t on t.id = m.tenant_id
    where m.tenant_id = p_tenant_id
      and m.account_id = auth.uid()
      and m.status = 'active'
      and t.status = 'active'
  );
$$;

create or replace function app.is_tenant_owner(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from tenants
    where id = p_tenant_id
      and owner_account_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function app.is_class_member(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from memberships m
    join tenants t on t.id = m.tenant_id
    where m.class_id = p_class_id
      and m.account_id = auth.uid()
      and m.status = 'active'
      and t.status = 'active'
  );
$$;

create or replace function app.owns_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from classes c
    join tenants t on t.id = c.tenant_id
    where c.id = p_class_id
      and t.owner_account_id = auth.uid()
      and t.status = 'active'
  );
$$;

create or replace function app.may_read_exam(p_exam_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from exams e
    join memberships m on m.tenant_id = e.tenant_id
    join tenants t on t.id = e.tenant_id
    where e.id = p_exam_id
      and m.account_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'assistant')
      and t.status = 'active'
  );
$$;

-- ─────────────── cô vẫn thấy đơn của chính mình ───────────────
-- Chặn hết mà không chừa chỗ này thì cô đăng ký xong nhìn vào là trống trơn, không biết
-- mình đang chờ duyệt hay đã bị từ chối. Dòng tenants là đơn của cô — không phải nội
-- dung của ai — nên cho đọc bất kể trạng thái.
create policy tenants_read_own_request on tenants
  for select using (owner_account_id = auth.uid());

-- Admin thấy DANH SÁCH tên miền: subdomain, chủ, trạng thái. Hết. Không có chính sách
-- nào khác nhắc tới is_platform_admin, nên đây là toàn bộ tầm nhìn của vai này.
create policy tenants_read_admin on tenants
  for select using (app.is_platform_admin());

-- ═══════════════════ ghi: không sống thì không làm gì được ═══════════════════
--
-- Cửa thứ hai, và là cửa quan trọng hơn. Vá từng hàm mutation thì hàm viết sau sẽ quên;
-- vá ở record_event thì không quên được, vì mọi mutation đều bắt buộc gọi nó (hợp đồng
-- ghi ở 0001). Tên miền chưa duyệt không ghi nổi một sự kiện nào, nên theo luật cứng
-- "ghi thất bại → hành vi không xảy ra", nó không làm được gì hết.
--
-- Trừ đúng ba hành vi về chính vòng đời tên miền — nếu không thì không có cách nào
-- duyệt một tên miền đang chờ duyệt.
create or replace function app.record_event(
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
  if p_action not in ('tenant.create', 'tenant.approve', 'tenant.suspend')
     and not app.tenant_is_live_unchecked(p_tenant_id)
  then
    raise exception 'Tên miền chưa được duyệt hoặc đang bị khoá — không hành vi nào có hiệu lực';
  end if;

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
  'Câu lệnh đầu tiên của mọi hàm mutation. Ràng buộc trên events chặn ở đây, và tên miền chưa duyệt cũng chặn ở đây, nên hành vi bị cấm không bao giờ có hiệu lực.';

-- ═══════════════════ ba hàm vòng đời ═══════════════════

/*
 * Đăng ký một tên miền mới. Ra ở trạng thái chờ, chưa làm được gì.
 *
 * Đây là chỗ DUY NHẤT trong toàn bộ hệ thống mà dòng dữ liệu đi trước sự kiện, và có
 * lý do vật lý: events.tenant_id là khoá ngoại trỏ tới tenants, nên tên miền phải tồn
 * tại thì mới ghi được sự kiện về nó. Lời hứa vẫn giữ nguyên, vì cả hai nằm trong một
 * transaction: ghi sự kiện hỏng thì dòng tenants cũng biến mất.
 *
 * Nói cho đúng thì tên miền chờ duyệt chưa phải một "hiệu lực" — nó là một lá đơn.
 * Hiệu lực bắt đầu ở approve_tenant, và ở đó sự kiện đi trước như mọi chỗ khác.
 */
create function app.register_tenant(
  p_subdomain text,
  p_owner_id  uuid,
  p_note      text default null
) returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  -- Ghi chú đăng ký nằm trong payload sự kiện, KHÔNG nằm ở status_reason:
  -- status_reason là lý do của lần đổi trạng thái gần nhất, và trộn hai thứ vào một cột
  -- thì ràng buộc "khoá phải kèm lý do" sẽ tự thoả bằng một ghi chú đăng ký cũ.
  insert into tenants (subdomain, owner_account_id)
  values (p_subdomain, p_owner_id)
  returning id into v_id;

  perform app.record_event(
    v_id, 'owner', 'tenant.create', 'tenant',
    null, p_owner_id, v_id,
    jsonb_build_object('subdomain', p_subdomain, 'note', p_note),
    array[p_owner_id]
  );

  -- Chủ tên miền có tư cách thành viên ngay, nhưng tư cách đó chưa mở được gì:
  -- is_active_member và is_tenant_owner đều đòi tên miền đang hoạt động.
  insert into memberships (account_id, tenant_id, role, status, activated_at)
  values (p_owner_id, v_id, 'owner', 'active', now());

  return v_id;
end;
$$;

/* Admin duyệt. Dùng được cả cho tên miền đang chờ lẫn tên miền vừa gỡ khoá. */
create function app.approve_tenant(
  p_admin_id  uuid,
  p_tenant_id uuid,
  p_note      text default null
) returns boolean
language plpgsql as $$
declare
  v_status tenant_status;
  v_owner  uuid;
begin
  if not exists (select 1 from platform_admins where account_id = p_admin_id) then
    raise exception 'Chỉ admin nền tảng mới duyệt được tên miền';
  end if;

  select status, owner_account_id into v_status, v_owner
    from tenants where id = p_tenant_id for update;
  if not found then
    raise exception 'Tên miền không tồn tại';
  end if;

  -- Duyệt lại một tên miền đang chạy là không có việc gì để làm. Trả false thay vì ném
  -- lỗi: bấm hai lần không phải là sai, chỉ là thừa.
  if v_status = 'active' then
    return false;
  end if;

  perform app.record_event(
    p_tenant_id, 'admin', 'tenant.approve', 'tenant',
    null, p_admin_id, p_tenant_id,
    jsonb_build_object('tu_trang_thai', v_status, 'note', p_note),
    array[v_owner, p_admin_id]
  );

  update tenants
     set status = 'active',
         approved_at = now(),
         approved_by = p_admin_id,
         status_reason = p_note
   where id = p_tenant_id;

  return true;
end;
$$;

/* Admin khoá. Bắt buộc có lý do — cô phải đọc được vì sao. */
create function app.suspend_tenant(
  p_admin_id  uuid,
  p_tenant_id uuid,
  p_reason    text
) returns boolean
language plpgsql as $$
declare
  v_status tenant_status;
  v_owner  uuid;
begin
  if not exists (select 1 from platform_admins where account_id = p_admin_id) then
    raise exception 'Chỉ admin nền tảng mới khoá được tên miền';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Khoá tên miền phải kèm lý do';
  end if;

  select status, owner_account_id into v_status, v_owner
    from tenants where id = p_tenant_id for update;
  if not found then
    raise exception 'Tên miền không tồn tại';
  end if;
  if v_status = 'suspended' then
    return false;
  end if;

  perform app.record_event(
    p_tenant_id, 'admin', 'tenant.suspend', 'tenant',
    null, p_admin_id, p_tenant_id,
    jsonb_build_object('tu_trang_thai', v_status, 'reason', p_reason),
    array[v_owner, p_admin_id]
  );

  update tenants
     set status = 'suspended', status_reason = p_reason
   where id = p_tenant_id;

  return true;
end;
$$;

comment on function app.suspend_tenant is
  'Khoá tên miền. Sau lệnh này mọi thành viên đọc rỗng và không ghi được gì — không phải ẩn ở giao diện mà chặn ở CSDL.';
