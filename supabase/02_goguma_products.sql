-- 고구마마켓 2단계: 판매글 (사진 기능은 아직 없음)
-- 가계부와 같은 Supabase 프로젝트에 이미 적용됨. 다시 만들 때: SQL Editor 에 붙여 넣고 Run

create table if not exists public.goguma_products (
  id bigint generated always as identity primary key,
  -- 판매자: goguma_profiles 와 연결 (프로필이 지워지면 판매글도 같이 지워짐)
  seller_id uuid not null references public.goguma_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 40),
  description text not null default '' check (char_length(description) <= 2000),
  price integer not null check (price >= 0 and price <= 1000000000), -- 0원 = 나눔
  category text not null check (category in (
    'digital', 'furniture', 'clothes', 'kids', 'living', 'sports',
    'books', 'hobby', 'beauty', 'pets', 'tickets', 'plants', 'etc'
  )),
  region text not null default '' check (char_length(region) <= 20),
  status text not null default 'selling' check (status in ('selling', 'reserved', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goguma_products_created_at_idx on public.goguma_products (created_at desc);
create index if not exists goguma_products_seller_id_idx on public.goguma_products (seller_id);

-- 수정할 때 updated_at 자동 갱신
create or replace function public.goguma_set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists goguma_products_set_updated_at on public.goguma_products;
create trigger goguma_products_set_updated_at
  before update on public.goguma_products
  for each row execute function public.goguma_set_updated_at();

-- 보안 규칙(RLS): 누구나 보기, 로그인한 본인만 쓰기/고치기/지우기
alter table public.goguma_products enable row level security;

create policy "goguma products are viewable by everyone"
  on public.goguma_products for select to anon, authenticated using (true);

create policy "users can create own goguma products"
  on public.goguma_products for insert to authenticated
  with check ((select auth.uid()) = seller_id);

create policy "users can update own goguma products"
  on public.goguma_products for update to authenticated
  using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);

create policy "users can delete own goguma products"
  on public.goguma_products for delete to authenticated
  using ((select auth.uid()) = seller_id);
