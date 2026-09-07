-- 0010 — tên miền tự duyệt khi đăng ký.
--
-- Chốt của cô 2026-09-07, sau khi 0009 lên: hàng chờ cần người trực, mà chưa có người trực.
-- Một hàng chờ không ai đứng thì không phải là cửa an toàn — nó là cô đăng ký xong ngồi đợi
-- vô hạn, và bỏ đi.
--
-- ĐỔI ĐÚNG MỘT THỨ: mặc định của tên miền mới. Toàn bộ phần đắt của 0009 giữ nguyên —
-- ba trạng thái, hai cửa chặn (đọc qua năm hàm trợ giúp RLS, ghi qua record_event), lệnh
-- khoá kèm lý do có hiệu lực tức thì. Cái mất đi là một người gác cổng; cái còn lại là
-- cái van đóng được bất cứ lúc nào. Với sản phẩm chưa có người trực, van đáng giá hơn cổng.

-- ─────────────── ai duyệt: người hay máy ───────────────
--
-- Tự duyệt vẫn là một hành vi, nên vẫn phải vào nhật ký. Vai của nó là `system`, và
-- ARCHITECTURE §4 chỉ cho máy sinh `draft` / `propose` / `auto:*` — nên hành vi này tên là
-- `tenant.auto:approve`, không phải `tenant.approve`. Ràng buộc ở 0001 tự ép chuyện đó;
-- đặt tên sai thì migration này không chạy nổi.
--
-- Nhờ vậy phân biệt được hai loại bút phê mà không cần thêm cột: admin ký thì có dòng
-- `tenant.approve` với `actor_role = 'admin'` và `approved_by` trỏ tới người đó; máy duyệt
-- thì có dòng `tenant.auto:approve`, `actor_role = 'system'`, `approved_by` để trống.
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
  if p_action not in ('tenant.create', 'tenant.approve', 'tenant.auto:approve', 'tenant.suspend')
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

-- ─────────────── đăng ký: ra thẳng trạng thái hoạt động ───────────────
create or replace function app.register_tenant(
  p_subdomain text,
  p_owner_id  uuid,
  p_note      text default null
) returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  -- Vẫn sinh ra ở `pending` rồi mới nâng lên, chứ không insert thẳng `active`. Hai lý do:
  -- lời hứa "sự kiện trước, hiệu lực sau" áp cho cả lần duyệt này; và nếu về sau cô muốn
  -- bật lại hàng chờ thì chỗ phải sửa là đúng một dòng dưới đây, không phải cả hàm.
  insert into tenants (subdomain, owner_account_id)
  values (p_subdomain, p_owner_id)
  returning id into v_id;

  perform app.record_event(
    v_id, 'owner', 'tenant.create', 'tenant',
    null, p_owner_id, v_id,
    jsonb_build_object('subdomain', p_subdomain, 'note', p_note),
    array[p_owner_id]
  );

  perform app.record_event(
    v_id, 'system', 'tenant.auto:approve', 'tenant',
    null, null, v_id,
    jsonb_build_object('subdomain', p_subdomain),
    array[p_owner_id]
  );

  update tenants
     set status = 'active', approved_at = now()
   where id = v_id;

  -- Chủ tên miền có tư cách thành viên. Từ đây tư cách đó mở được việc, vì tên miền đã sống.
  insert into memberships (account_id, tenant_id, role, status, activated_at)
  values (p_owner_id, v_id, 'owner', 'active', now());

  return v_id;
end;
$$;

comment on function app.register_tenant is
  'Đăng ký tên miền mới, tự duyệt ngay. `pending` vẫn là trạng thái hợp lệ và vẫn bị chặn đủ — chỉ là không còn đường nào đi vào đó khi đăng ký.';

comment on function app.approve_tenant is
  'Admin duyệt tay. Từ 0010 đường chính là tự duyệt, nên hàm này chủ yếu dùng để GỠ KHOÁ một tên miền đang bị khoá.';
