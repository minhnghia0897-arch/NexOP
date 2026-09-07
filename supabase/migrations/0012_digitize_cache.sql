-- 0012 — cache số hoá dùng chung, khoá bằng băm tệp.
--
-- Vết sẹo thứ tư nhập từ bản đang chạy (docs/SO-SANH-BAN-CU-BAN-MOI.md §3.4). Bản cũ băm
-- nội dung tệp làm khoá và dùng chung liên trung tâm: hai cô số hoá cùng một quyển
-- Cambridge chỉ tốn một lần gọi AI.
--
-- Với thị trường luyện thi Việt Nam — nơi gần như ai cũng dạy từ mấy bộ Cambridge, ETS,
-- Oxford giống nhau — tỉ lệ trúng sẽ rất cao, và đây là cách rẻ nhất giữ ngân sách ở 0011.

-- ─────────────── ngoại lệ có chủ ý với luật "mọi query lọc theo tenant_id" ───────────────
--
-- Bảng này KHÔNG có tenant_id, và đó là điểm của nó. Nhưng ngoại lệ phải nói rõ vì sao
-- không phải là rò rỉ:
--
--   • Khoá là băm SHA-256 của **nội dung tệp**. Đọc được một dòng đòi hỏi đã có sẵn đúng
--     tệp đó trong tay — mà nếu đã có tệp thì đã có nội dung, cache không cho thêm gì.
--   • Lưu là kết quả bóc từ tệp, không phải dữ liệu của cô: không tên học viên, không
--     điểm, không nhận xét. Cô A không thấy gì của cô B ngoài chính quyển sách cả hai
--     đang cầm.
--   • Không chính sách RLS nào. Chỉ máy chủ đọc, qua hai hàm dưới đây.
--
-- Chỗ hở còn lại, ghi ra để đừng quên: **thời gian phản hồi**. Số hoá trúng cache trả về
-- trong một nhịp, trượt cache mất vài chục giây — nên cô A suy ra được "đã có người số hoá
-- đúng quyển này". Không sửa ở tầng CSDL được; nếu thấy không chấp nhận được thì tầng ứng
-- dụng phải làm trễ giả, hoặc tách cache theo tenant và chịu chi phí.

create table digitize_cache (
  file_sha256    text not null,
  -- Model và phiên bản prompt nằm TRONG khoá, không nằm ngoài. Thiếu chúng thì đổi model
  -- xong vẫn trả về bản bóc cũ, và cô không hiểu vì sao máy "vẫn đọc sai y như hôm qua"
  -- dù mình vừa nâng cấp — hỏng không kêu, đúng loại đắt nhất.
  model          text not null,
  prompt_version text not null,

  result         jsonb not null,
  pages          int,
  hits           int not null default 0,
  created_at     timestamptz not null default now(),
  last_hit_at    timestamptz,

  primary key (file_sha256, model, prompt_version),

  -- Băm phải đúng hình dạng SHA-256 viết thường. Nhận bừa một chuỗi bất kỳ làm khoá là mở
  -- đường cho người ngoài tự đặt khoá rồi nhét kết quả bóc giả vào cache của mọi người.
  constraint digitize_cache_sha_shape check (file_sha256 ~ '^[0-9a-f]{64}$'),
  constraint digitize_cache_result_is_object check (jsonb_typeof(result) = 'object'),
  constraint digitize_cache_hits_not_negative check (hits >= 0),
  constraint digitize_cache_pages_positive check (pages is null or pages > 0)
);

create index digitize_cache_cold_idx on digitize_cache (last_hit_at nulls first);

/*
 * Tra cache. Trả kết quả bóc, hoặc NULL nếu chưa có.
 *
 * Thứ tự đúng là TRA TRƯỚC, XIN NGÂN SÁCH SAU: trúng cache thì không gọi AI, nên không có
 * gì để xin. Làm ngược lại là mỗi lần trúng cache vẫn ăn một suất ngân sách của cô — vô lý
 * theo đúng nghĩa đen, vì lần đó không tốn đồng nào.
 */
create function app.lookup_digitize_cache(
  p_file_sha256    text,
  p_model          text,
  p_prompt_version text
) returns jsonb
language plpgsql
security definer set search_path = public, pg_temp as $$
declare
  v_result jsonb;
begin
  update digitize_cache
     set hits = hits + 1, last_hit_at = now()
   where file_sha256 = p_file_sha256
     and model = p_model
     and prompt_version = p_prompt_version
  returning result into v_result;

  return v_result;
end;
$$;

comment on function app.lookup_digitize_cache is
  'Tra cache số hoá theo băm tệp. Gọi TRƯỚC app.claim_ai_call — trúng cache thì không tốn ngân sách nào.';

/*
 * Cất kết quả bóc vào cache.
 *
 * Ghi đè khi trùng khoá thay vì bỏ qua: cùng tệp, cùng model, cùng prompt mà ra kết quả
 * khác nghĩa là lần trước hỏng dở chừng. Bản mới hơn đáng tin hơn.
 */
create function app.store_digitize_cache(
  p_file_sha256    text,
  p_model          text,
  p_prompt_version text,
  p_result         jsonb,
  p_pages          int default null
) returns void
language plpgsql
security definer set search_path = public, pg_temp as $$
begin
  insert into digitize_cache (file_sha256, model, prompt_version, result, pages)
  values (p_file_sha256, p_model, p_prompt_version, p_result, p_pages)
  on conflict (file_sha256, model, prompt_version)
  do update set result = excluded.result,
                pages = excluded.pages;
end;
$$;

-- Dọn bản bóc nguội. Giữ 180 ngày: một quyển sách luyện thi sống lâu hơn thế nhiều, nhưng
-- một tệp chỉ có đúng một người từng dùng thì không đáng chiếm chỗ mãi.
create function app.prune_digitize_cache() returns int
language plpgsql as $$
declare
  v_deleted int;
begin
  delete from digitize_cache
   where coalesce(last_hit_at, created_at) < now() - interval '180 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Không ai đọc bảng này qua RLS. Chỉ máy chủ, qua hai hàm trên.
alter table digitize_cache enable row level security;
