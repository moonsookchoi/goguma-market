-- 고구마마켓 샘플 판매글 10개 (화면 확인용)
-- 판매자는 테스트 계정(닉네임 '테스트고구마')이에요. 로컬과 배포 사이트가 같은 DB라 양쪽 모두에 보여요.
-- 지울 때: delete from public.goguma_products where description like '%[샘플]%';
--          (사진 파일은 Storage 대시보드 > goguma_product_images 에서 지우거나, 사이트에서 글을 삭제하면 같이 지워져요)
--
-- 샘플 사진: 지금은 Unsplash(무료 라이선스) 실제 사진을 webp로 바꿔 올려 둔 상태예요. (예전 일러스트 원본: supabase/sample-images/*.svg)
--   브라우저에서 webp(1200px)로 바꿔 테스트 계정 폴더에 올리고, 각 판매글 images 칸에 경로를 넣었어요.

insert into public.goguma_products (seller_id, title, description, price, category, region, status, created_at)
select p.id, s.title, s.description || E'\n\n[샘플] 화면 확인용 예시 판매글입니다.', s.price, s.category, s.region, s.status,
       now() - s.ago::interval
from public.goguma_profiles p
cross join (values
  ('아이폰 15 Pro 256GB 내추럴 티타늄', '작년 10월 구매, 항상 케이스와 필름 끼워서 사용했어요. 배터리 성능 91%. 박스와 충전 케이블 같이 드려요.', 890000, 'digital', '망원동', 'selling', '8 minutes'),
  ('원목 4인 식탁 세트 (의자 포함)', '이사로 정리합니다. 원목이라 튼튼하고 생활 기스 조금 있어요. 직접 가져가셔야 해요.', 120000, 'furniture', '연남동', 'reserved', '35 minutes'),
  ('노스페이스 눕시 패딩 L 블랙', '두 시즌 입었고 드라이클리닝 완료했어요. 오염이나 찢어진 곳 없습니다.', 150000, 'clothes', '합정동', 'selling', '1 hour'),
  ('유아 원목 블록 장난감 세트', '아이가 커서 안 가지고 놀아요. 소독 후 보관했습니다. 필요한 분께 나눔해요.', 0, 'kids', '서교동', 'selling', '2 hours'),
  ('드롱기 전자동 커피머신', '매일 아침 잘 쓰던 커피머신이에요. 정기적으로 세척해서 상태 좋아요. 원두 조금 같이 드려요.', 280000, 'living', '성산동', 'selling', '3 hours'),
  ('캠핑 의자 2개 + 롤테이블', '캠핑 두 번 다녀왔어요. 수납 가방까지 모두 있습니다.', 65000, 'sports', '상암동', 'sold', '5 hours'),
  ('개발 서적 5권 묶음 (리액트, 자바스크립트)', '공부하면서 본 책들이에요. 밑줄 조금 있어요. 개발 공부하시는 분께 저렴하게 드려요.', 25000, 'books', '공덕동', 'selling', '9 hours'),
  ('닌텐도 스위치 OLED + 게임 2개', '구성품 전부 있고 화면 깨끗해요. 마리오카트, 동물의 숲 포함입니다.', 330000, 'hobby', '망원동', 'selling', '1 day'),
  ('강아지 이동장 (중형견용)', '한 번 사용했어요. 10kg 정도까지 넉넉합니다. 깨끗하게 닦아서 드려요.', 30000, 'pets', '도화동', 'selling', '2 days'),
  ('몬스테라 큰 화분 (1m)', '잎이 풍성하게 잘 자랐어요. 화분째 드리고, 차로 옮기셔야 해요.', 40000, 'plants', '연희동', 'selling', '3 days')
) as s(title, description, price, category, region, status, ago)
where p.nickname = '테스트고구마';

-- 날짜를 과거로 넣었으니 수정일도 맞춰 줘요 ('수정됨' 표시가 안 뜨게)
alter table public.goguma_products disable trigger goguma_products_set_updated_at;
update public.goguma_products set updated_at = created_at where description like '%[샘플]%';
alter table public.goguma_products enable trigger goguma_products_set_updated_at;
