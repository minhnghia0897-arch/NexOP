-- Chỉ dùng để chạy test trên Postgres trần. KHÔNG phải migration.
--
-- Supabase cấp sẵn quyền bảng cho `anon` / `authenticated` rồi để RLS quyết định
-- từng dòng. Postgres trần thì chưa cấp gì, nên nếu thiếu file này test sẽ "xanh"
-- vì không đọc được gì cả — tưởng RLS chặn, thật ra là thiếu quyền bảng.
grant select on all tables in schema public to anon, authenticated;
grant usage  on schema app to anon, authenticated;
grant execute on function app.is_active_member(uuid), app.is_tenant_owner(uuid) to anon, authenticated;
grant execute on function app.is_class_member(uuid), app.owns_class(uuid) to anon, authenticated;
grant execute on function app.may_read_exam(uuid) to anon, authenticated;
grant execute on function app.check_rate_limit(text, int, int) to anon, authenticated;
