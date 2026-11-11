-- 고구마마켓 3단계: 판매글 사진 (여러 장)
-- 가계부와 같은 Supabase 프로젝트에 이미 적용됨. 다시 만들 때: SQL Editor 에 붙여 넣고 Run

-- 1) 판매글에 사진 경로 목록 추가 (순서대로 저장, 첫 번째 = 대표 사진, 최대 10장)
alter table public.goguma_products
  add column if not exists images text[] not null default '{}';

alter table public.goguma_products
  drop constraint if exists goguma_products_images_max;
alter table public.goguma_products
  add constraint goguma_products_images_max check (coalesce(array_length(images, 1), 0) <= 10);

-- 2) 사진 저장소(Storage 버킷): 누구나 볼 수 있는 공개 버킷, 한 장 최대 5MB, 이미지 파일만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('goguma_product_images', 'goguma_product_images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3) 보안 규칙: 사진은 "내 아이디 폴더" 안에만 올리고 지울 수 있어요
--    파일 경로 모양: {내 user id}/{랜덤이름}.webp
create policy "goguma images: users upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'goguma_product_images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "goguma images: users update own files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'goguma_product_images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "goguma images: users delete own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'goguma_product_images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- 사진 삭제(remove)는 내부적으로 조회(select) 권한도 필요해서, 내 폴더만 조회 가능하게 해요
create policy "goguma images: users read own files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'goguma_product_images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- 사진 보기는 공개 버킷이라 공개 주소로 누구나 볼 수 있어요. (다른 사람 폴더 목록 조회는 막혀 있음)
