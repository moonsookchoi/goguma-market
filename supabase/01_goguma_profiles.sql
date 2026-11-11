-- 고구마마켓 1단계: 회원 프로필 (가계부와 같은 Supabase 프로젝트에 이미 적용됨)
-- 다시 만들 때: Supabase 대시보드 > SQL Editor 에 붙여 넣고 Run
create table if not exists public.goguma_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 12),
  region text not null default '' check (char_length(region) <= 20),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.goguma_profiles enable row level security;

create policy "goguma profiles are viewable by everyone"
  on public.goguma_profiles for select to anon, authenticated using (true);

create policy "users can update own goguma profile"
  on public.goguma_profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 회원가입 시 프로필 자동 생성 (가입 메타데이터 app = 'goguma' 인 경우만)
create or replace function public.goguma_handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'app', '') = 'goguma' then
    insert into public.goguma_profiles (id, nickname, region)
    values (
      new.id,
      left(coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), '고구마' || substr(new.id::text, 1, 4)), 12),
      left(coalesce(new.raw_user_meta_data ->> 'region', ''), 20)
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.goguma_handle_new_user() from public, anon, authenticated;

drop trigger if exists goguma_on_auth_user_created on auth.users;
create trigger goguma_on_auth_user_created
  after insert on auth.users for each row execute function public.goguma_handle_new_user();
