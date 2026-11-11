# 🍠 고구마마켓

우리 동네 중고거래 사이트 (개발 공부용) — **Next.js 16 + Supabase**

### 👉 [고구마마켓 바로 열기](https://goguma-market-ebon.vercel.app)

Vercel에 GitHub 저장소가 연결돼 있어서, `main`에 푸시하면 1~2분 뒤 사이트가 자동으로 바뀌어요.

## 실행하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 열기

## 1단계: 회원가입 · 로그인 · 로그아웃 ✅

| 파일 | 하는 일 |
|---|---|
| `app/page.tsx` | 홈 화면 (위쪽 떠다니는 카드는 장식용 예시, 아래 '방금 올라온 매물'은 DB) |
| `app/signup/` | 회원가입 페이지 + 폼 |
| `app/login/` | 로그인 페이지 + 폼 |
| `app/auth/actions.ts` | **서버 액션**: login / signup / logout |
| `app/auth/callback/route.ts` | 이메일 인증 링크를 눌렀을 때 세션 만들기 |
| `lib/supabase/server.ts` | 서버용 Supabase 클라이언트 + 현재 사용자 가져오기 |
| `lib/supabase/proxy.ts`, `proxy.ts` | 요청마다 로그인 쿠키 갱신 (Next 16에서 middleware → proxy 로 이름이 바뀜) |
| `components/Header.tsx` | 로그인 상태에 따라 바뀌는 상단 메뉴 |
| `supabase/01_goguma_profiles.sql` | 프로필 테이블 + 가입 시 자동 생성 트리거 |

### 흐름
1. 회원가입 폼 → `signup` 서버 액션 → `supabase.auth.signUp()` (닉네임·동네를 메타데이터로 같이 보냄)
2. DB 트리거가 `goguma_profiles` 행을 자동으로 만듦
3. 로그인 정보는 **쿠키**에 저장 → 서버 컴포넌트에서 `getClaims()` 로 확인
4. 로그아웃 → `signOut()` 으로 쿠키 삭제

## 2단계: 판매글 CRUD (사진 없이) ✅

CRUD = **C**reate(등록) · **R**ead(조회) · **U**pdate(수정) · **D**elete(삭제)

| 주소 | 화면 | CRUD |
|---|---|---|
| `/products` | 판매글 목록 + 카테고리 필터 | R |
| `/products/new` | 판매글 쓰기 (로그인 필요) | C |
| `/products/[id]` | 판매글 상세, 내 글이면 상태 변경·수정·삭제 버튼 | R · U · D |
| `/products/[id]/edit` | 판매글 수정 (내 글만) | U |

| 파일 | 하는 일 |
|---|---|
| `app/products/actions.ts` | **서버 액션**: createProduct / updateProduct / changeStatus / deleteProduct |
| `app/products/data.ts` | 판매글 읽어 오기 (한 개 / 최신 목록) |
| `lib/products.ts` | 카테고리·판매상태 목록, 가격·시간 표시 도우미 |
| `components/ProductForm.tsx` | 쓰기·수정 공용 폼 |
| `components/ProductCard.tsx` | 목록 카드 (대표 사진, 사진 없으면 카테고리 아이콘) |
| `supabase/02_goguma_products.sql` | 판매글 테이블 + RLS 보안 규칙 |

### 보안은 두 겹
1. **화면/서버 액션**: 로그인 안 하면 로그인 페이지로, 남의 글은 수정 화면이 404
2. **DB의 RLS 정책**: 누구나 읽기만 가능, 쓰기·수정·삭제는 `seller_id = 내 id` 일 때만
   → 화면 코드를 실수로 잘못 짜도 DB가 남의 글 수정을 막아 줘요.

## 3단계: 사진 여러 장 업로드 ✅

### 흐름
1. 사진 고르기 (여러 장 / 끌어다 놓기, 최대 10장)
2. **브라우저에서** 긴 변 1600px로 줄이고 webp로 변환 → 용량이 확 줄어요
3. **브라우저가 Supabase Storage에 바로 업로드** (서버를 거치지 않아서 빠르고, 서버 용량 제한에도 안 걸려요)
4. 올라간 파일 경로(`내아이디/랜덤이름.webp`)만 폼에 담아 서버 액션으로 보내고, DB `images` 칸에 순서대로 저장
5. 첫 번째 사진 = 대표 사진 (목록 카드에 보임), 상세 화면은 갤러리로 넘겨 보기

| 파일 | 하는 일 |
|---|---|
| `components/ImageUploader.tsx` | 사진 고르기·줄이기·업로드·순서 바꾸기·삭제 |
| `components/ProductGallery.tsx` | 상세 화면 사진 갤러리 |
| `lib/supabase/client.ts` | 브라우저용 Supabase 클라이언트 (업로드할 때 사용) |
| `supabase/04_goguma_product_images.sql` | `images` 칸 + Storage 버킷 + 보안 규칙 |

### 사진 보안
- 버킷 `goguma_product_images`는 **공개 버킷**: 사진 주소로 누구나 볼 수 있어요.
- 올리기·지우기는 **내 아이디 폴더 안에서만** 가능 (Storage RLS). 서버 액션도 경로가 `내아이디/...` 인지 한 번 더 검사해요.
- 사진을 빼고 저장하거나 글을 지우면 Storage의 파일도 같이 지워요.

## 추가 기능: 내 동네 근처 매물 ✅

- 홈 화면의 **"○○동 근처 매물"** 섹션과 중고거래 목록의 **"내 동네 근처"** 탭
- 내 동네(회원가입 때 입력)에서 **3km 이내** 판매글만, **가까운 순서**로 보여 주고 카드에 거리(예: 1.3km)를 표시해요.

### 어떻게 거리를 계산하나
1. `lib/regions.ts`에 서울 일부 동네의 **대략적인 중심 좌표(위도·경도)** 목록이 있어요.
2. 내 동네와 판매글 동네를 이 목록에서 찾아서, **하버사인 공식**으로 두 점 사이 거리를 계산해요.
3. 3km(`NEAR_KM`) 안에 있는 것만 골라 가까운 순으로 정렬해요.

- 동네 입력칸에 **추천 목록**이 떠서, 목록에 있는 이름으로 입력하면 거리 계산이 돼요.
- 목록에 없는 동네는 거리 계산이 안 돼요 → `lib/regions.ts`에 동네를 추가하면 돼요.
- 공부용 규모라 앱에서 계산해요. 글이 아주 많아지면 DB의 PostGIS(위치 기능)로 옮기는 게 좋아요.

## 데이터베이스
- 가계부와 **같은 Supabase 프로젝트**를 써요. 섞이지 않게 고구마마켓 테이블은 `goguma_` 로 시작해요.
- 회원(`auth.users`)은 두 앱이 함께 쓰는 공간이에요.

## 환경변수 (`.env.local`, GitHub에 올라가지 않음)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```
나중에 배포(Vercel 등)할 때 이 두 값을 배포 사이트 설정에도 넣어 주세요.
배포 주소가 생기면 Supabase 대시보드 → Authentication → URL Configuration 의 **Site URL / Redirect URLs** 에도 추가해야 해요.

## 다음 단계 아이디어
- [x] 2단계: 판매글 CRUD (사진 없이)
- [x] 3단계: 사진 여러 장 업로드 (Supabase Storage)
- [x] 추가: 내 동네 근처 매물 (3km 이내, 가까운 순)
- [x] 4단계: 검색·시세·나눔·인기·끌어올리기·찜·채팅·가격 제안·거래 약속·후기·매너 온도
- [ ] 남은 것: 알림함 화면, 마이페이지, 신고·차단 화면, 관리자, PWA, AI 판매글 도우미
- [ ] 5단계: 찜하기, 마이페이지(프로필 수정)
- [ ] 6단계: 채팅
