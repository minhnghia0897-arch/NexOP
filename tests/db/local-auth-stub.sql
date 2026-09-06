-- Chỉ dùng để chạy test trên Postgres trần. KHÔNG phải migration.
--
-- Supabase dựng sẵn schema `auth` và các vai `anon` / `authenticated`. Postgres trần
-- thì không, nên migration sẽ hỏng ở `auth.uid()`. File này dựng đúng phần tối thiểu,
-- sao y cách Supabase định nghĩa auth.uid(), để test RLS chạy trên hành vi thật
-- chứ không phải trên bản mô phỏng.

create schema if not exists auth;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end
$$;

grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
