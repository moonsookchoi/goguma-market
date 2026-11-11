# 🍠 고구마마켓

우리 동네 중고거래 사이트 (개발 공부용) — **Next.js 16 + Supabase**

## 실행하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 열기

## 1단계: 회원가입 · 로그인 · 로그아웃 ✅

| 파일 | 하는 일 |
|---|---|
| `app/page.tsx` | 홈 화면 (매물은 아직 예시 데이터) |
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
- [ ] 2단계: 상품 등록 (`goguma_products` 테이블 + 이미지 업로드 Storage)
- [ ] 3단계: 상품 목록 · 상세 · 검색
- [ ] 4단계: 찜하기, 마이페이지(프로필 수정)
- [ ] 5단계: 채팅
