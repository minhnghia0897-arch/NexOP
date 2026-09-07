-- 0011 — hạn mức AI, kiểm trong CSDL trước khi gọi.
--
-- Nhập vết sẹo số 8 của bản OBLUE đang chạy: *"Vượt gói vẫn tiêu tiền API"*
-- (docs/SO-SANH-BAN-CU-BAN-MOI.md §3.3). Đây lại đúng kiểu hỏng không kêu: không có
-- exception nào, không ai thấy gì, chỉ tới cuối tháng hoá đơn mới nói.
--
-- PLAN.md §5 đặt ngân sách ≤3.000đ/học viên/tháng nhưng chưa có gì ép. Con số nằm trong
-- tài liệu thì không chặn được ai — cùng lỗi với `OTP_SO_LAN_THU_TOI_DA` ở 0007.
--
-- Kiểm ở đây chứ không ở tầng ứng dụng, vì cùng một lý do với giới hạn tần suất: nhiều
-- tiến trình, nhiều yêu cầu song song, và đếm ở đâu khác thì đếm sót.

-- ARCHITECTURE §7: đúng bốn điểm, không có điểm thứ năm. Enum này ép luôn chuyện đó —
-- muốn thêm điểm thứ năm phải sửa kiểu, tức là phải qua migration và qua người đọc nó.
create type ai_task as enum ('digitize', 'grade', 'profile', 'suggest');

-- Trần tháng do cô hoặc nền tảng đặt riêng. Để trống nghĩa là dùng công thức bên dưới.
alter table tenants add column ai_budget_vnd numeric(12, 2);
alter table tenants
  add constraint tenants_ai_budget_positive
  check (ai_budget_vnd is null or ai_budget_vnd >= 0);

/*
 * Mỗi lần xin gọi AI một dòng — kể cả lần bị từ chối.
 *
 * Giữ lại lần bị từ chối vì cùng lý do với rate_limit_events: muốn biết cô đang đụng
 * trần bao nhiêu lần thì phải thấy cả những lần không được đi qua. Một tên miền bị chặn
 * 40 lần trong tuần là tín hiệu bán hàng, không phải rác.
 *
 * Hai cột tiền: `est_cost_vnd` là ước tính lúc xin phép, `actual_cost_vnd` là số thật sau
 * khi gọi xong. Ngân sách tính trên `coalesce(actual, est)` — chưa quyết toán thì vẫn tính
 * bằng ước tính, nếu không thì hai chục lần gọi song song đều thấy ngân sách còn nguyên.
 */
create table ai_usage (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants (id) on delete cascade,
  task            ai_task not null,
  est_cost_vnd    numeric(12, 2) not null,
  actual_cost_vnd numeric(12, 2),
  allowed         boolean not null,
  cache_hit       boolean not null default false,
  at              timestamptz not null default now(),
  settled_at      timestamptz,

  constraint ai_usage_costs_not_negative check (
    est_cost_vnd >= 0 and (actual_cost_vnd is null or actual_cost_vnd >= 0)
  ),
  -- Lần bị chặn thì không gọi AI, nên không tốn gì.
  constraint ai_usage_denied_costs_nothing check (allowed or est_cost_vnd = 0),
  -- Và không quyết toán được một lần chưa từng xảy ra.
  constraint ai_usage_denied_never_settles check (actual_cost_vnd is null or allowed),
  constraint ai_usage_settled_together check (
    (actual_cost_vnd is null) = (settled_at is null)
  )
);

create index ai_usage_tenant_at_idx on ai_usage (tenant_id, at desc);
create index ai_usage_denied_idx on ai_usage (tenant_id, at desc) where not allowed;

-- Lớp 1 về tiền: sửa được thì con số cuối tháng vô nghĩa. Chỉ cho phép quyết toán đúng
-- một lần, và chỉ hai cột đó.
create function ai_usage_settle_once() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'ai_usage không xoá được — đây là sổ tiền';
  end if;

  if old.settled_at is not null then
    raise exception 'Lần gọi này đã quyết toán rồi, không sửa lại được';
  end if;

  if (new.id, new.tenant_id, new.task, new.est_cost_vnd, new.allowed, new.at)
     is distinct from
     (old.id, old.tenant_id, old.task, old.est_cost_vnd, old.allowed, old.at)
  then
    raise exception 'Chỉ được ghi chi phí thật; phần còn lại của dòng là bất biến';
  end if;

  return new;
end;
$$;

create trigger ai_usage_settle_once_only before update or delete on ai_usage
  for each row execute function ai_usage_settle_once();

-- ─────────────── trần tháng ───────────────
--
-- DECISIONS: "Tính phí theo học viên hoạt động, không theo ghế giáo viên." Ngân sách AI
-- đi theo cùng một logic — cô nhiều học viên thì được tiêu nhiều hơn, vì cô cũng trả
-- nhiều hơn. Hai con số dưới đây là chỗ DUY NHẤT chỉnh, và cả hai đều để đổi được.
--
-- SÀN tồn tại vì công thức thuần tuý phá đúng người ta muốn giữ: cô mới, 3 học viên,
-- được 9.000đ/tháng — không đủ số hoá một quyển đề, nên chưa kịp thấy sản phẩm hay ở đâu
-- thì đã cụt. Sàn là chi phí thu hút khách, không phải lỗ hổng.
create function app.ai_budget_vnd(p_tenant_id uuid) returns numeric
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select ai_budget_vnd from tenants where id = p_tenant_id),
    greatest(
      50000::numeric,                       -- sàn mỗi tháng
      3000::numeric * (                     -- PLAN.md §5: ≤3.000đ/học viên/tháng
        select count(distinct account_id)
          from memberships
         where tenant_id = p_tenant_id and role = 'student' and status = 'active'
      )
    )
  );
$$;

comment on function app.ai_budget_vnd is
  'Trần chi AI cho tháng này. Trần riêng trên tenants nếu có, không thì 3.000đ mỗi học viên hoạt động, tối thiểu 50.000đ.';

/** Đã tiêu bao nhiêu trong tháng dương lịch hiện tại. Chưa quyết toán thì tính ước tính. */
create function app.ai_spent_vnd(p_tenant_id uuid) returns numeric
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(coalesce(actual_cost_vnd, est_cost_vnd)), 0)
    from ai_usage
   where tenant_id = p_tenant_id
     and allowed
     and at >= date_trunc('month', now());
$$;

/*
 * Xin phép gọi AI. Trả về id của lần gọi, hoặc NULL nếu vượt trần.
 *
 * NULL nghĩa là KHÔNG ĐƯỢC GỌI. Không có đường nào khác: `lib/ai/` phải xin trước, và
 * không có id thì không quyết toán được, nên một lần gọi lén sẽ không có mặt trong sổ —
 * và đó là thứ soi ra được bằng cách đối chiếu hoá đơn nhà cung cấp với bảng này.
 *
 * Khoá tư vấn theo tenant để "đọc rồi ghi" là một khối: thiếu nó thì hai mươi yêu cầu
 * đồng thời đều thấy ngân sách còn nguyên và cùng đi qua — đúng cái cảnh vết sẹo số 8 tả.
 */
create function app.claim_ai_call(
  p_tenant_id    uuid,
  p_task         ai_task,
  p_est_cost_vnd numeric
) returns uuid
language plpgsql as $$
declare
  v_budget numeric;
  v_spent  numeric;
  v_owner  uuid;
  v_id     uuid;
begin
  if p_est_cost_vnd is null or p_est_cost_vnd < 0 then
    raise exception 'Ước tính chi phí phải là số không âm';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_tenant_id::text));

  v_budget := app.ai_budget_vnd(p_tenant_id);
  v_spent  := app.ai_spent_vnd(p_tenant_id);

  if v_spent + p_est_cost_vnd > v_budget then
    select owner_account_id into v_owner from tenants where id = p_tenant_id;

    -- Cô phải BIẾT là mình đụng trần. Hết hạn mức mà máy im lặng không làm gì thì cô
    -- tưởng hệ thống hỏng, và đó là kiểu hỏng đắt nhất — cô mất niềm tin, không mất tiền.
    perform app.record_event(
      p_tenant_id, 'system', 'ai.auto:limit', 'ai_usage',
      null, null, null,
      jsonb_build_object('task', p_task, 'budget_vnd', v_budget, 'spent_vnd', v_spent),
      array[v_owner]
    );

    insert into ai_usage (tenant_id, task, est_cost_vnd, allowed)
    values (p_tenant_id, p_task, 0, false);

    return null;
  end if;

  insert into ai_usage (tenant_id, task, est_cost_vnd, allowed)
  values (p_tenant_id, p_task, p_est_cost_vnd, true)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function app.claim_ai_call is
  'Xin phép trước khi gọi AI. NULL = vượt trần, KHÔNG được gọi. Mọi lần gọi phải qua đây.';

/** Ghi chi phí thật sau khi gọi xong. Một lần duy nhất cho mỗi lần gọi. */
create function app.settle_ai_call(
  p_claim_id        uuid,
  p_actual_cost_vnd numeric,
  p_cache_hit       boolean default false
) returns void
language plpgsql as $$
begin
  if p_actual_cost_vnd is null or p_actual_cost_vnd < 0 then
    raise exception 'Chi phí thật phải là số không âm';
  end if;

  update ai_usage
     set actual_cost_vnd = p_actual_cost_vnd,
         cache_hit = p_cache_hit,
         settled_at = now()
   where id = p_claim_id;

  if not found then
    raise exception 'Không có lần gọi nào mang id này';
  end if;
end;
$$;

-- Cô đọc được sổ chi AI của mình — đó là tiền của cô.
alter table ai_usage enable row level security;

create policy ai_usage_read_owner on ai_usage
  for select using (app.is_tenant_owner(ai_usage.tenant_id));
