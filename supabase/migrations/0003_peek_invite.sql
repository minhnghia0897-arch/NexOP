-- 0003 — xem trước lời mời mà không cần đăng nhập.
--
-- UC-02: "mở link thấy tên cô + tên lớp TRƯỚC khi nhập gì". Người mở link chưa đăng
-- nhập, mà RLS chỉ cho owner đọc memberships — đúng như permissions.json quy định.
--
-- Cách sai là đưa khoá service cho trang công khai để nó tự truy vấn: lúc đó cả bảng
-- mở ra, và chỉ còn mã ứng dụng đứng giữa. Cách ở đây là mở đúng những trường trang
-- cần, không hơn.
--
-- Cụ thể là KHÔNG trả về: SĐT đầy đủ (chỉ trả bản đã che), account_id, quyền đã cấp,
-- hay bất cứ gì về những thành viên khác trong lớp.

create type invite_peek as (
  found        boolean,
  status       text,
  subdomain    text,
  teacher_name text,
  role         text,
  class_id     uuid,
  phone_masked text
);

create function app.peek_invite(p_token text) returns invite_peek
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_m      memberships%rowtype;
  v_tenant tenants%rowtype;
  v_ten    text;
  v_digits text;
begin
  select * into v_m from memberships where invite_token = p_token;
  if not found then
    return (false, null, null, null, null, null, null)::invite_peek;
  end if;

  select * into v_tenant from tenants where id = v_m.tenant_id;
  select name into v_ten from accounts where id = v_tenant.owner_account_id;

  -- Che ngay tại đây. Trả số đầy đủ ra rồi mới che ở giao diện thì số vẫn đã rời DB.
  v_digits := right(regexp_replace(coalesce(v_m.invited_phone, ''), '\D', '', 'g'), 9);

  return (
    true,
    v_m.status::text,
    v_tenant.subdomain::text,
    v_ten,
    v_m.role::text,
    v_m.class_id,
    case
      when length(v_digits) = 9
        then '0' || substr(v_digits, 1, 3) || ' ••• ' || right(v_digits, 3)
      else '•••'
    end
  )::invite_peek;
end;
$$;

comment on function app.peek_invite is
  'Đủ để vẽ màn lời mời, không hơn. SĐT trả về đã che; không lộ account_id hay quyền.';

revoke all on function app.peek_invite(text) from public;
grant execute on function app.peek_invite(text) to anon, authenticated;

-- ─────────────── sửa ràng buộc duy nhất của tư cách thành viên ───────────────
-- 0001 đặt unique trên (account_id, tenant_id, class_id, role) với NULLS NOT DISTINCT.
-- Mọi lời mời chưa nhận đều có account_id NULL, nên hai lời mời cùng lớp cùng vai đụng
-- nhau: cô mời được đúng MỘT học viên cho mỗi lớp. UC-02 lại đòi dán cả danh sách từ
-- Excel/Zalo. Lỗi lộ ra khi test tạo lời mời thứ hai.
--
-- Luật đúng là hai luật khác nhau:
--   1. Một người không giữ hai tư cách cùng vai trong cùng lớp — chỉ tính khi đã có account.
--   2. Một số điện thoại không nhận hai lời mời còn treo cho cùng lớp cùng vai.
alter table memberships drop constraint memberships_unique_per_class;

create unique index memberships_one_per_person
  on memberships (account_id, tenant_id, class_id, role)
  nulls not distinct
  where account_id is not null;

create unique index memberships_one_pending_invite
  on memberships (tenant_id, class_id, invited_phone, role)
  nulls not distinct
  where status = 'pending';
