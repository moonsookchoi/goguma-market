import { createBrowserClient } from "@supabase/ssr";

// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트
// 사진은 크기가 커서 서버를 거치지 않고 브라우저에서 Storage 로 바로 올려요.
// 로그인 쿠키를 같이 써서, Storage 보안 규칙이 "누가 올리는지" 알 수 있어요.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
