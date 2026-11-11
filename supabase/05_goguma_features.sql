-- 고구마마켓: 추가 기능 한 번에 (찜, 알림, 키워드 알림, 채팅, 가격 제안, 거래 약속, 후기·매너 온도,
--            신고·차단, 관리자, 동네 인증, 조회수, 끌어올리기)
-- 가계부와 같은 Supabase 프로젝트에 이미 적용됨. 모든 이름은 goguma_ 로 시작해요.

-- ───────────── 1) 동네 좌표 표 (동네 인증·키워드 알림 거리 계산에 사용) ─────────────
create table if not exists public.goguma_regions (
  name text primary key,
  gu text not null,
  lat double precision not null,
  lng double precision not null,
  station text not null default ''
);
alter table public.goguma_regions enable row level security;
create policy "goguma regions readable" on public.goguma_regions for select to anon, authenticated using (true);

-- 두 좌표 사이 거리(km) — 하버사인 공식
create or replace function public.goguma_distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable set search_path = ''
as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ───────────── 2) 기존 테이블에 칸 추가 ─────────────
alter table public.goguma_profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists region_verified_at timestamptz,
  add column if not exists manner_temp numeric(4,1) not null default 36.5;

alter table public.goguma_products
  add column if not exists view_count integer not null default 0,
  add column if not exists wish_count integer not null default 0,
  add column if not exists bumped_at timestamptz not null default now(),
  add column if not exists hidden boolean not null default false;

update public.goguma_products set bumped_at = created_at where bumped_at > created_at;
create index if not exists goguma_products_bumped_at_idx on public.goguma_products (bumped_at desc);

-- 프로필: 본인이 고칠 수 있는 칸은 닉네임·동네·사진만 (관리자 여부·온도·인증은 못 고치게)
revoke update on public.goguma_profiles from authenticated;
grant update (nickname, region, avatar_url) on public.goguma_profiles to authenticated;

-- 동네를 바꾸면 인증은 다시 받아야 해요
create or replace function public.goguma_reset_region_verified()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.region is distinct from old.region and new.region_verified_at is not distinct from old.region_verified_at then
    new.region_verified_at = null;
  end if;
  return new;
end;
$$;
drop trigger if exists goguma_profiles_reset_verified on public.goguma_profiles;
create trigger goguma_profiles_reset_verified before update on public.goguma_profiles
  for each row execute function public.goguma_reset_region_verified();

-- 판매글 '수정됨' 표시는 내용이 바뀔 때만 (조회수·찜 수·끌어올리기·상태는 제외)
create or replace function public.goguma_set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if (new.title, new.description, new.price, new.category, new.region, new.images)
     is distinct from (old.title, old.description, old.price, old.category, old.region, old.images) then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- 관리자인지 확인하는 함수
create or replace function public.goguma_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select is_admin from public.goguma_profiles where id = (select auth.uid())), false);
$$;

-- 숨김 처리된 글은 본인과 관리자만 볼 수 있게 + 관리자는 숨김/해제 가능
drop policy if exists "goguma products are viewable by everyone" on public.goguma_products;
create policy "goguma products are viewable by everyone"
  on public.goguma_products for select to anon, authenticated
  using (hidden = false or seller_id = (select auth.uid()) or public.goguma_is_admin());

-- 판매자가 고칠 수 있는 칸은 내용·상태·끌어올리기 시간만 (조회수·찜 수·숨김은 못 고치게)
revoke update on public.goguma_products from authenticated;
grant update (title, description, price, category, region, status, images, bumped_at) on public.goguma_products to authenticated;

-- 관리자 전용: 판매글 숨기기/다시 보이기
create or replace function public.goguma_admin_set_hidden(p_id bigint, p_hidden boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.goguma_is_admin() then raise exception 'admin only'; end if;
  update public.goguma_products set hidden = p_hidden where id = p_id;
end;
$$;
grant execute on function public.goguma_admin_set_hidden(bigint, boolean) to authenticated;

-- 조회수 +1 (누구나 호출 가능, 이 칸만 바꿈)
create or replace function public.goguma_increment_view(p_id bigint)
returns void language sql security definer set search_path = ''
as $$
  update public.goguma_products set view_count = view_count + 1 where id = p_id and hidden = false;
$$;
grant execute on function public.goguma_increment_view(bigint) to anon, authenticated;

-- ───────────── 3) 알림함 ─────────────
create table if not exists public.goguma_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.goguma_profiles(id) on delete cascade,
  type text not null, -- price_drop | keyword | offer | offer_result | review | chat
  title text not null,
  body text not null default '',
  link text not null default '/',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists goguma_notifications_user_idx on public.goguma_notifications (user_id, created_at desc);
alter table public.goguma_notifications enable row level security;
create policy "users read own goguma notifications" on public.goguma_notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "users update own goguma notifications" on public.goguma_notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users delete own goguma notifications" on public.goguma_notifications
  for delete to authenticated using (user_id = (select auth.uid()));
-- 알림 만들기는 아래 트리거(security definer)만 해요

-- ───────────── 4) 찜 ─────────────
create table if not exists public.goguma_wishes (
  user_id uuid not null references public.goguma_profiles(id) on delete cascade,
  product_id bigint not null references public.goguma_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index if not exists goguma_wishes_product_idx on public.goguma_wishes (product_id);
alter table public.goguma_wishes enable row level security;
create policy "users read own goguma wishes" on public.goguma_wishes for select to authenticated using (user_id = (select auth.uid()));
create policy "users add own goguma wishes" on public.goguma_wishes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users remove own goguma wishes" on public.goguma_wishes for delete to authenticated using (user_id = (select auth.uid()));

-- 찜 수 자동 계산
create or replace function public.goguma_sync_wish_count()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.goguma_products
     set wish_count = (select count(*) from public.goguma_wishes where product_id = coalesce(new.product_id, old.product_id))
   where id = coalesce(new.product_id, old.product_id);
  return null;
end;
$$;
drop trigger if exists goguma_wishes_count on public.goguma_wishes;
create trigger goguma_wishes_count after insert or delete on public.goguma_wishes
  for each row execute function public.goguma_sync_wish_count();

-- 가격이 내려가면 찜한 사람들에게 알림
create or replace function public.goguma_notify_price_drop()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.price < old.price and new.hidden = false then
    insert into public.goguma_notifications (user_id, type, title, body, link)
    select w.user_id, 'price_drop',
           '찜한 물건 가격이 내려갔어요',
           new.title || ' · ' || to_char(old.price, 'FM999,999,999') || '원 → ' ||
             case when new.price = 0 then '나눔' else to_char(new.price, 'FM999,999,999') || '원' end,
           '/products/' || new.id
      from public.goguma_wishes w
     where w.product_id = new.id and w.user_id <> new.seller_id;
  end if;
  return new;
end;
$$;
drop trigger if exists goguma_products_price_drop on public.goguma_products;
create trigger goguma_products_price_drop after update of price on public.goguma_products
  for each row execute function public.goguma_notify_price_drop();

-- ───────────── 5) 키워드 알림 ─────────────
create table if not exists public.goguma_keywords (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.goguma_profiles(id) on delete cascade,
  keyword text not null check (char_length(keyword) between 1 and 20),
  created_at timestamptz not null default now(),
  unique (user_id, keyword)
);
alter table public.goguma_keywords enable row level security;
create policy "users manage own goguma keywords" on public.goguma_keywords
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 새 글이 올라오면: 제목에 키워드가 있고, 내 동네에서 3km 안이면 알림
-- (내 동네나 글 동네 위치를 모르면 동네 이름이 같을 때만)
create or replace function public.goguma_notify_keywords()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.goguma_notifications (user_id, type, title, body, link)
  select distinct on (k.user_id) k.user_id, 'keyword',
         '''' || k.keyword || ''' 키워드 새 글이 올라왔어요',
         new.title || coalesce(' · ' || nullif(new.region, ''), ''),
         '/products/' || new.id
    from public.goguma_keywords k
    join public.goguma_profiles p on p.id = k.user_id
    left join public.goguma_regions mr on mr.name = p.region
    left join public.goguma_regions pr on pr.name = new.region
   where k.user_id <> new.seller_id
     and new.title ilike '%' || k.keyword || '%'
     and (
       (mr.name is not null and pr.name is not null and public.goguma_distance_km(mr.lat, mr.lng, pr.lat, pr.lng) <= 3)
       or (p.region <> '' and p.region = new.region)
     )
   order by k.user_id;
  return new;
end;
$$;
drop trigger if exists goguma_products_keywords on public.goguma_products;
create trigger goguma_products_keywords after insert on public.goguma_products
  for each row execute function public.goguma_notify_keywords();

-- ───────────── 6) 차단 ─────────────
create table if not exists public.goguma_blocks (
  blocker_id uuid not null references public.goguma_profiles(id) on delete cascade,
  blocked_id uuid not null references public.goguma_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.goguma_blocks enable row level security;
create policy "users manage own goguma blocks" on public.goguma_blocks
  for all to authenticated using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

-- 두 사람 중 누가 누구를 차단했는지 (채팅 막기용)
create or replace function public.goguma_is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.goguma_blocks
                  where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- ───────────── 7) 채팅방 · 메시지 (가격 제안 포함) ─────────────
create table if not exists public.goguma_chat_rooms (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.goguma_products(id) on delete cascade,
  buyer_id uuid not null references public.goguma_profiles(id) on delete cascade,
  seller_id uuid not null references public.goguma_profiles(id) on delete cascade,
  appointment_at timestamptz,          -- 거래 약속 시간
  appointment_place text not null default '' check (char_length(appointment_place) <= 40),
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index if not exists goguma_chat_rooms_buyer_idx on public.goguma_chat_rooms (buyer_id, last_message_at desc);
create index if not exists goguma_chat_rooms_seller_idx on public.goguma_chat_rooms (seller_id, last_message_at desc);
alter table public.goguma_chat_rooms enable row level security;

create policy "participants read goguma rooms" on public.goguma_chat_rooms
  for select to authenticated using ((select auth.uid()) in (buyer_id, seller_id));
create policy "buyers open goguma rooms" on public.goguma_chat_rooms
  for insert to authenticated with check (
    buyer_id = (select auth.uid())
    and exists (select 1 from public.goguma_products p where p.id = product_id and p.seller_id = goguma_chat_rooms.seller_id and p.hidden = false)
    and not public.goguma_is_blocked(buyer_id, seller_id)
  );
create policy "participants update goguma rooms" on public.goguma_chat_rooms
  for update to authenticated using ((select auth.uid()) in (buyer_id, seller_id)) with check ((select auth.uid()) in (buyer_id, seller_id));

create table if not exists public.goguma_chat_messages (
  id bigint generated always as identity primary key,
  room_id bigint not null references public.goguma_chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.goguma_profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'offer', 'system')),
  body text not null default '' check (char_length(body) <= 1000),
  offer_price integer check (offer_price is null or (offer_price >= 0 and offer_price <= 1000000000)),
  offer_status text check (offer_status in ('pending', 'accepted', 'declined')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists goguma_chat_messages_room_idx on public.goguma_chat_messages (room_id, created_at);
alter table public.goguma_chat_messages enable row level security;

create or replace function public.goguma_is_room_member(p_room bigint)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.goguma_chat_rooms r where r.id = p_room and (select auth.uid()) in (r.buyer_id, r.seller_id));
$$;

create policy "participants read goguma messages" on public.goguma_chat_messages
  for select to authenticated using (public.goguma_is_room_member(room_id));
create policy "participants send goguma messages" on public.goguma_chat_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and public.goguma_is_room_member(room_id)
    and not exists (select 1 from public.goguma_chat_rooms r where r.id = room_id and public.goguma_is_blocked(r.buyer_id, r.seller_id))
  );
create policy "participants update goguma messages" on public.goguma_chat_messages
  for update to authenticated using (public.goguma_is_room_member(room_id)) with check (public.goguma_is_room_member(room_id));

-- 메시지가 오면: 방의 마지막 메시지 갱신 + 가격 제안 알림
create or replace function public.goguma_on_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  r public.goguma_chat_rooms;
  receiver uuid;
  ptitle text;
begin
  select * into r from public.goguma_chat_rooms where id = new.room_id;
  receiver := case when new.sender_id = r.buyer_id then r.seller_id else r.buyer_id end;
  select title into ptitle from public.goguma_products where id = r.product_id;

  update public.goguma_chat_rooms
     set last_message = case new.kind
                          when 'offer' then '가격 제안: ' || to_char(new.offer_price, 'FM999,999,999') || '원'
                          else left(new.body, 60) end,
         last_message_at = new.created_at
   where id = new.room_id;

  if new.kind = 'offer' then
    insert into public.goguma_notifications (user_id, type, title, body, link)
    values (receiver, 'offer', '가격 제안이 도착했어요',
            ptitle || ' · ' || to_char(new.offer_price, 'FM999,999,999') || '원', '/chats/' || new.room_id);
  end if;
  return new;
end;
$$;
drop trigger if exists goguma_messages_after_insert on public.goguma_chat_messages;
create trigger goguma_messages_after_insert after insert on public.goguma_chat_messages
  for each row execute function public.goguma_on_message();

-- 가격 제안을 수락/거절하면 제안한 사람에게 알림
create or replace function public.goguma_on_offer_result()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.kind = 'offer' and new.offer_status in ('accepted', 'declined') and old.offer_status = 'pending' then
    insert into public.goguma_notifications (user_id, type, title, body, link)
    values (new.sender_id, 'offer_result',
            case when new.offer_status = 'accepted' then '가격 제안이 수락됐어요 🎉' else '가격 제안이 거절됐어요' end,
            to_char(new.offer_price, 'FM999,999,999') || '원 제안', '/chats/' || new.room_id);
  end if;
  return new;
end;
$$;
drop trigger if exists goguma_messages_offer_result on public.goguma_chat_messages;
create trigger goguma_messages_offer_result after update of offer_status on public.goguma_chat_messages
  for each row execute function public.goguma_on_offer_result();

-- 실시간(Realtime)으로 메시지·방 변화를 받을 수 있게
alter publication supabase_realtime add table public.goguma_chat_messages;
alter publication supabase_realtime add table public.goguma_chat_rooms;
alter publication supabase_realtime add table public.goguma_notifications;

-- ───────────── 8) 거래 후기 · 매너 온도 ─────────────
create table if not exists public.goguma_reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.goguma_products(id) on delete cascade,
  reviewer_id uuid not null references public.goguma_profiles(id) on delete cascade,
  reviewee_id uuid not null references public.goguma_profiles(id) on delete cascade,
  rating text not null check (rating in ('best', 'good', 'bad')),
  tags text[] not null default '{}' check (coalesce(array_length(tags, 1), 0) <= 8),
  comment text not null default '' check (char_length(comment) <= 300),
  created_at timestamptz not null default now(),
  unique (product_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);
create index if not exists goguma_reviews_reviewee_idx on public.goguma_reviews (reviewee_id, created_at desc);
alter table public.goguma_reviews enable row level security;
create policy "goguma reviews are public" on public.goguma_reviews for select to anon, authenticated using (true);
-- 후기는 그 물건으로 채팅한 상대에게만 남길 수 있어요
create policy "chat partners write goguma reviews" on public.goguma_reviews
  for insert to authenticated with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1 from public.goguma_chat_rooms r
       where r.product_id = goguma_reviews.product_id
         and ((r.buyer_id = reviewer_id and r.seller_id = reviewee_id) or (r.seller_id = reviewer_id and r.buyer_id = reviewee_id))
    )
  );

-- 후기가 생기면 받은 사람 매너 온도 다시 계산 + 알림
-- 기본 36.5℃ · 최고예요 +0.5 · 좋아요 +0.2 · 별로예요 -0.5 (0~99℃)
create or replace function public.goguma_on_review()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.goguma_profiles
     set manner_temp = greatest(0, least(99, 36.5 + coalesce((
           select sum(case rating when 'best' then 0.5 when 'good' then 0.2 else -0.5 end)
             from public.goguma_reviews where reviewee_id = new.reviewee_id), 0)))
   where id = new.reviewee_id;

  insert into public.goguma_notifications (user_id, type, title, body, link)
  values (new.reviewee_id, 'review', '새 거래 후기가 도착했어요',
          case new.rating when 'best' then '최고예요! 😍' when 'good' then '좋아요 🙂' else '아쉬워요 😕' end,
          '/users/' || new.reviewee_id);
  return new;
end;
$$;
drop trigger if exists goguma_reviews_after_insert on public.goguma_reviews;
create trigger goguma_reviews_after_insert after insert on public.goguma_reviews
  for each row execute function public.goguma_on_review();

-- ───────────── 9) 신고 ─────────────
create table if not exists public.goguma_reports (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.goguma_products(id) on delete cascade,
  reporter_id uuid not null references public.goguma_profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'fraud', 'prohibited', 'abusive', 'etc')),
  detail text not null default '' check (char_length(detail) <= 300),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, reporter_id)
);
alter table public.goguma_reports enable row level security;
create policy "users create goguma reports" on public.goguma_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "admins read goguma reports" on public.goguma_reports
  for select to authenticated using (public.goguma_is_admin() or reporter_id = (select auth.uid()));
create policy "admins update goguma reports" on public.goguma_reports
  for update to authenticated using (public.goguma_is_admin()) with check (public.goguma_is_admin());

-- ───────────── 10) GPS 동네 인증 ─────────────
-- 현재 위치에서 가장 가까운 동네(2km 이내)를 찾아 내 동네로 정하고 인증 시간을 기록해요
create or replace function public.goguma_verify_region(p_lat double precision, p_lng double precision)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  found text;
begin
  if (select auth.uid()) is null then raise exception 'login required'; end if;
  select name into found from public.goguma_regions
   where public.goguma_distance_km(lat, lng, p_lat, p_lng) <= 2
   order by public.goguma_distance_km(lat, lng, p_lat, p_lng)
   limit 1;
  if found is null then return null; end if;
  update public.goguma_profiles set region = found, region_verified_at = now() where id = (select auth.uid());
  return found;
end;
$$;
grant execute on function public.goguma_verify_region(double precision, double precision) to authenticated;

-- 함수들: 일반 사용자가 직접 부를 필요 없는 건 막기
revoke execute on function public.goguma_sync_wish_count() from public, anon, authenticated;
revoke execute on function public.goguma_notify_price_drop() from public, anon, authenticated;
revoke execute on function public.goguma_notify_keywords() from public, anon, authenticated;
revoke execute on function public.goguma_on_message() from public, anon, authenticated;
revoke execute on function public.goguma_on_offer_result() from public, anon, authenticated;
revoke execute on function public.goguma_on_review() from public, anon, authenticated;

-- ───────────── 11) 동네 좌표 데이터 (lib/regions.ts 와 같은 값) ─────────────
insert into public.goguma_regions (name, gu, lat, lng, station) values
('망원동','마포구',37.556,126.9015,'망원역'),
('합정동','마포구',37.5496,126.9139,'합정역'),
('서교동','마포구',37.553,126.919,'홍대입구역'),
('연남동','마포구',37.5627,126.9231,'홍대입구역 3번 출구'),
('성산동','마포구',37.566,126.91,'마포구청역'),
('상암동','마포구',37.579,126.889,'디지털미디어시티역'),
('상수동','마포구',37.548,126.923,'상수역'),
('신수동','마포구',37.547,126.933,'광흥창역'),
('대흥동','마포구',37.55,126.942,'대흥역'),
('염리동','마포구',37.548,126.946,'대흥역'),
('아현동','마포구',37.553,126.956,'아현역'),
('공덕동','마포구',37.5446,126.9516,'공덕역'),
('도화동','마포구',37.539,126.95,'마포역'),
('용강동','마포구',37.541,126.944,'마포역'),
('연희동','서대문구',37.568,126.93,'신촌역'),
('신촌동','서대문구',37.5596,126.9425,'신촌역'),
('창천동','서대문구',37.556,126.933,'신촌역'),
('대현동','서대문구',37.56,126.946,'이대역'),
('북가좌동','서대문구',37.578,126.912,'증산역'),
('남가좌동','서대문구',37.575,126.92,'가좌역'),
('홍은동','서대문구',37.59,126.937,'홍제역'),
('여의도동','영등포구',37.525,126.925,'여의도역'),
('당산동','영등포구',37.534,126.902,'당산역'),
('영등포동','영등포구',37.517,126.907,'영등포역'),
('문래동','영등포구',37.518,126.895,'문래역'),
('목동','양천구',37.53,126.875,'오목교역'),
('이태원동','용산구',37.534,126.994,'이태원역'),
('한남동','용산구',37.534,127.003,'한남역'),
('후암동','용산구',37.548,126.979,'숙대입구역'),
('명동','중구',37.563,126.983,'명동역'),
('혜화동','종로구',37.586,127.002,'혜화역'),
('삼청동','종로구',37.585,126.982,'안국역'),
('성수동','성동구',37.544,127.056,'성수역'),
('행당동','성동구',37.558,127.031,'행당역'),
('압구정동','강남구',37.527,127.028,'압구정역'),
('역삼동','강남구',37.5,127.036,'역삼역'),
('삼성동','강남구',37.514,127.056,'삼성역'),
('잠실동','송파구',37.511,127.086,'잠실역'),
('신림동','관악구',37.484,126.929,'신림역'),
('봉천동','관악구',37.482,126.942,'봉천역')
on conflict (name) do update set gu=excluded.gu, lat=excluded.lat, lng=excluded.lng, station=excluded.station;

-- ───────────── 12) 로그인 안 한 사람은 못 부르게 (보안 점검 반영) ─────────────
-- goguma_increment_view(조회수)와 goguma_is_admin(공개 조회 규칙에서 사용)은 일부러 열어 둬요
revoke execute on function public.goguma_admin_set_hidden(bigint, boolean) from public, anon;
revoke execute on function public.goguma_verify_region(double precision, double precision) from public, anon;
revoke execute on function public.goguma_is_blocked(uuid, uuid) from public, anon;
revoke execute on function public.goguma_is_room_member(bigint) from public, anon;
grant execute on function public.goguma_is_blocked(uuid, uuid) to authenticated;
grant execute on function public.goguma_is_room_member(bigint) to authenticated;
