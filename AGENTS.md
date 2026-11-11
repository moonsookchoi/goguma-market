# 고구마마켓 — 에이전트 작업 지침

## 사용자와 진행 방식
- 사용자는 **개발을 공부하는 중**이다. 설명은 쉬운 한국어로, 전문 용어는 처음 나올 때 풀어서 설명한다.
- 프로젝트는 **한 단계씩** 진행한다. 지금 요청받은 단계만 구현하고, 다음 단계 기능을 미리 만들지 않는다.
  - [x] 1단계: 홈 화면 + 회원가입 / 로그인 / 로그아웃
  - [ ] 2단계: 상품 등록 (사진 업로드) → 3단계: 목록·상세·검색 → 4단계: 찜·마이페이지 → 5단계: 채팅
  - 단계가 끝나면 `README.md`와 `작업정리.md`의 진행 상황 체크박스를 갱신한다.
- 코드에는 공부에 도움이 되게 **짧은 한국어 주석**으로 "왜 이렇게 하는지"를 남긴다.
- 아직 DB에 없는 데이터(예: 홈의 인기 매물)는 예시 데이터임을 화면과 코드에 표시한다.

## ⚠️ Supabase — 가계부와 같은 프로젝트를 재활용 중
- Supabase 프로젝트 `moonsookchoi's Project` (ref: `jazfkgxdotdwhzlpcunu`)는 **가계부 앱과 함께 쓴다.**
  - 가계부 저장소: https://github.com/moonsookchoi/gagyebu , 가계부 테이블: `public.entries`
- **가계부 테이블(`entries`)과 그 정책은 절대 수정·삭제하지 않는다.**
- 고구마마켓 테이블·함수·트리거·Storage 버킷 이름은 **반드시 `goguma_`로 시작**한다. (예: `goguma_profiles`, `goguma_products`)
- `auth.users`(회원)는 두 앱이 공유한다.
  - 가입할 때 메타데이터에 `app: "goguma"`를 넣고, 트리거 `goguma_handle_new_user`는 이 값이 있을 때만 `goguma_profiles` 행을 만든다.
  - `auth.users`에 트리거를 추가하거나 바꿀 때는 가계부 쪽 가입에 영향이 없는지 확인한다.
- 새 테이블은 항상 **RLS를 켜고** 정책을 만든다. 스키마를 바꾼 뒤에는 Supabase 보안 점검(advisors)을 돌린다.
- DB를 바꾸면 그 SQL을 `supabase/NN_설명.sql` 파일로도 저장한다. (예: `supabase/02_goguma_products.sql`)
- 테이블 삭제, 데이터 삭제 같은 되돌릴 수 없는 작업은 먼저 사용자에게 확인을 받는다.
- 현재 Supabase **이메일 인증은 꺼져 있다** (가입 즉시 로그인). 켜게 되면 Authentication → URL Configuration에 배포 주소를 추가해야 한다.

## 키와 비밀 정보
- Supabase 주소와 키는 `.env.local`에만 둔다. 이 파일은 **GitHub에 올리지 않는다** (`.gitignore`의 `.env*`).
- 공개해도 되는 값은 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 뿐이다. **secret / service_role 키는 코드나 클라이언트에 넣지 않는다.**
- 환경변수를 추가하면 Vercel 환경변수에도 같이 등록한다 (`vercel env add`).

## GitHub · Vercel 배포
- GitHub 저장소: https://github.com/moonsookchoi/goguma-market (`main` 브랜치)
- Vercel 프로젝트 `goguma-market`이 GitHub와 연결돼 있어서 **`main`에 푸시하면 자동으로 배포된다.**
  - 사이트: https://goguma-market-ebon.vercel.app
- 커밋과 푸시는 사용자가 요청할 때만 한다. 푸시하기 전에 `npx tsc --noEmit`과 `npm run lint`를 통과시킨다.
- 가계부 저장소는 별도 프로젝트다. 사용자가 요청할 때만 수정한다.

## 실행 환경 (Windows)
- Node.js는 winget으로 설치했다. 새로 연 셸에서 `node`를 못 찾으면 PATH에 다음 경로를 추가한다:
  `C:\Users\student\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64`
- 로컬 실행: `npm run dev` → http://localhost:3000

## Next.js 16 주의
- `middleware`가 아니라 **`proxy.ts`**를 쓴다 (세션 갱신은 `lib/supabase/proxy.ts`).
- `cacheComponents`가 켜져 있다. 쿠키나 `searchParams`를 읽는 컴포넌트는 `<Suspense>`로 감싼다.
- Supabase 서버 클라이언트는 `lib/supabase/server.ts`의 `createClient()`를 쓴다. 이 함수는 `connection()`을 먼저 호출한다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
