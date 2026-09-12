-- 0014 — điểm danh: hai cột còn thiếu, và một cửa duy nhất để ghi.
--
-- Lộ ra khi dựng ngăn điểm danh của bản mẫu. Bản mẫu ghi đúng hai luật ở chân màn:
--
--   "Vắng 2 buổi liên tiếp → tự vào Cần chú ý."
--   "Vắng KHÔNG PHÉP và có tài khoản → nhắc nhẹ sau 21:00."
--
-- Luật thứ hai không có dữ liệu để chạy: `attendance` ở 0004 chỉ có `present boolean`. Vắng
-- có phép và vắng trốn học vào cùng một cột, nên luật đó không bao giờ phân biệt được — và
-- một luật viết ra mà không chạy được thì tệ hơn là không viết, vì cô tin là nó đang chạy.
--
-- Và `attendance` không ghi AI điểm danh. `attendance.assistant` là mức `auto` (LOGIC §8.1):
-- trợ giảng ghi thẳng, không qua cô. Không lưu người ghi thì khi em khiếu nại một buổi vắng,
-- không ai trả lời được câu đầu tiên cô sẽ hỏi: ai điểm danh buổi đó.
--
-- ─────────── Chỗ ARCHITECTURE §3 và bảng này nói hai điều khác nhau ───────────
--
-- §3 xếp `attendance` vào lớp 1 — "Chỉ thêm". Nhưng 0004 đặt
-- `unique (class_id, session_no, student_id)`, nên SỬA MỘT BUỔI ĐÃ ĐIỂM DANH không thể là
-- thêm một dòng: ràng buộc chặn dòng thứ hai. Hai câu đó không cùng đúng được.
--
-- Chốt: giữ ràng buộc, và sửa tại chỗ. Lý do là ràng buộc ấy đang chặn một lỗi thật — điểm
-- danh hai lần một buổi rồi mọi con số "đi học đều" đếm buổi đó hai lần. Còn "chỉ thêm" thì
-- `events` giữ, và giữ chắc hơn: `events` có trigger chặn cả UPDATE lẫn DELETE (0001), nên
-- mỗi lần cô đổi ý vẫn còn nguyên một dòng trong nhật ký với giá trị cũ. Cái mất đi chỉ là
-- lịch sử nằm TRONG bảng sự thật; cái cần — truy lại được ai đổi gì lúc nào — vẫn còn.
--
-- Đã ghi thành LOGIC §8 câu 9 để cô xem lại; đổi ý thì sửa `docs/ARCHITECTURE.md` §3 và
-- migration này, không sửa chỗ khác.

-- ═══════════════════ 1. Hai cột còn thiếu ═══════════════════

alter table attendance
  add column excused boolean not null default false,
  add column recorded_by uuid references accounts (id);

-- Backfill về chủ tên miền trước khi đặt NOT NULL. Chưa có dòng thật nào, nhưng migration
-- phải chạy được trên một cơ sở đã có dữ liệu — không thì nó là migration chỉ chạy một lần
-- trên máy của người viết.
update attendance a
   set recorded_by = t.owner_account_id
  from classes c join tenants t on t.id = c.tenant_id
 where c.id = a.class_id and a.recorded_by is null;

/*
 * NOT NULL, không phải trigger.
 *
 * Bản đầu em viết một trigger raise exception "attendance.system = none — máy không ghi bảng
 * này". Nó chặn đúng thứ cần chặn nhưng nói sai lý do trong trường hợp thường gặp nhất: một
 * câu insert quên cột. Bài kiểm sẵn có ở `class.test.ts` đổ với đúng thông báo đó, và thông
 * báo ấy chỉ người đọc sang hướng hoàn toàn khác. NOT NULL nói cùng một điều, để Postgres ép,
 * và lý do thì nằm ở comment cột dưới đây.
 */
alter table attendance alter column recorded_by set not null;

-- Có mặt thì không có chuyện "có phép". Không chặn thì `present = true, excused = true` lọt
-- vào bảng, và mọi câu đếm "vắng không phép" sau đó phải tự đoán xem dòng đó nghĩa là gì.
alter table attendance
  add constraint attendance_excused_only_when_absent
  check (not (present and excused));

comment on column attendance.excused is
  'Vắng CÓ PHÉP. Chỉ có nghĩa khi present = false. Vắng không phép mới sinh việc cho cô.';
comment on column attendance.recorded_by is
  'Ai điểm danh. NOT NULL vì attendance.system = none: máy không ghi bảng này, nên mọi dòng phải có một người đứng tên. Cô, hoặc trợ giảng ở mức auto.';

-- ═══════════════════ 2. Một cửa duy nhất ═══════════════════
--
-- Cùng lý do với 0013: đường ghi thẳng bằng khoá service thì không sự kiện nào được ghi, và
-- luật cứng của CLAUDE.md là "mọi hành vi ghi vào events TRƯỚC khi có hiệu lực".
--
-- Nhận DANH SÁCH VẮNG, không nhận danh sách có mặt. Trong phòng cô gọi tên người thiếu; và
-- quan trọng hơn, "ai đang học lớp này" thì `memberships` biết, nên bắt ứng dụng gửi lên 18
-- dòng có mặt là mở đường cho nó gửi thiếu một dòng.
create function app.record_attendance(
  p_class_id   uuid,
  p_session_no int,
  p_absent     jsonb  -- [{"student_id": "...", "excused": true}, ...]
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_tenant  uuid;
  v_owner   uuid;
  v_actor   uuid := auth.uid();
  v_role    actor_role;
  v_absent  uuid[];
  v_roster  uuid[];
  v_la      uuid[];
begin
  select c.tenant_id, t.owner_account_id
    into v_tenant, v_owner
    from classes c join tenants t on t.id = c.tenant_id
   where c.id = p_class_id;

  if v_tenant is null then
    raise exception 'Không có lớp này';
  end if;

  if p_session_no <= 0 then
    raise exception 'Buổi phải là số dương';
  end if;

  -- Ai đang học lớp này, theo `memberships` — không theo thứ ứng dụng gửi lên.
  select coalesce(array_agg(account_id), '{}') into v_roster
  from memberships
  where class_id = p_class_id and status = 'active';

  select coalesce(array_agg((x->>'student_id')::uuid), '{}') into v_absent
  from jsonb_array_elements(coalesce(p_absent, '[]'::jsonb)) as x;

  -- Em vắng mà không thuộc lớp: chặn, không bỏ qua im lặng. Ứng dụng lọc rồi vẫn chặn ở
  -- đây, vì một id gõ sai vào bảng sự thật thì không có đường sửa lại cho sạch.
  select coalesce(array_agg(a), '{}') into v_la
  from unnest(v_absent) as a
  where not (a = any (v_roster));

  if array_length(v_la, 1) > 0 then
    raise exception 'Em % không học lớp này', v_la;
  end if;

  /*
   * Vai ghi vào sự kiện phải là vai THẬT, không phải 'owner' cắm sẵn.
   *
   * `attendance.assistant` là mức `auto`: trợ giảng điểm danh thẳng. Cắm 'owner' thì mọi
   * buổi trợ giảng điểm danh đọc thành cô điểm danh, và nhật ký nói sai đúng chỗ cô cần
   * nó nói đúng — khi em khiếu nại một buổi vắng.
   */
  if app.owns_class(p_class_id) then
    v_role := 'owner';
  elsif app.is_class_member(p_class_id) then
    v_role := 'assistant';
  else
    raise exception 'Không có quyền điểm danh lớp này';
  end if;

  -- Sự kiện TRƯỚC, rồi mới tới bảng. Thứ tự tham số theo app.record_event ở 0001:
  -- (tenant, role, action, object_type, class, actor, object, payload, visibility).
  --
  /*
   * Nhật ký tới CÔ và người ghi — không chỉ người ghi.
   *
   * `events_read_visible` ở 0001 là `auth.uid() = any (visibility)`: danh sách ấy là thứ
   * DUY NHẤT quyết định ai đọc được, không có ngoại lệ cho chủ tên miền. Để `array[v_actor]`
   * thì buổi trợ giảng điểm danh biến thành buổi CÔ KHÔNG ĐỌC ĐƯỢC trong nhật ký của chính
   * mình — và test bắt được đúng chỗ này.
   *
   * Em vắng thì không có tên: dòng này kể ai vắng trong CẢ LỚP.
   */
  perform app.record_event(
    v_tenant, v_role, 'attendance.create', 'attendance',
    p_class_id, v_actor, null,
    jsonb_build_object(
      'buoi_no', p_session_no,
      'co_mat', coalesce(array_length(v_roster, 1), 0)
                  - coalesce(array_length(v_absent, 1), 0),
      'vang', coalesce(p_absent, '[]'::jsonb)
    ),
    -- distinct: cô tự điểm danh thì v_owner = v_actor, không nhân đôi tên cô.
    (select array_agg(distinct x) from unnest(array[v_owner, v_actor]) as x)
  );

  -- Sửa tại chỗ, không thêm dòng — xem phần đầu file về `attendance_one_per_session`.
  insert into attendance (class_id, session_no, student_id, present, excused, recorded_by)
  select
    p_class_id,
    p_session_no,
    m.account_id,
    not (m.account_id = any (v_absent)),
    coalesce(
      (select (x->>'excused')::boolean
       from jsonb_array_elements(coalesce(p_absent, '[]'::jsonb)) as x
       where (x->>'student_id')::uuid = m.account_id),
      false
    ),
    v_actor
  from memberships m
  where m.class_id = p_class_id and m.status = 'active'
  on conflict (class_id, session_no, student_id) do update
    set present     = excluded.present,
        excused     = excluded.excused,
        recorded_by = excluded.recorded_by,
        recorded_at = now();
end;
$$;

comment on function app.record_attendance is
  'Cửa duy nhất ghi điểm danh. Nhận danh sách VẮNG; ai đang học thì memberships biết. Ghi sự kiện trước, sửa tại chỗ sau.';
