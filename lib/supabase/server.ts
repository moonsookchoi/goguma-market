import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// 서버 컴포넌트 · 서버 액션 · 라우트 핸들러에서 쓰는 Supabase 클라이언트
export async function createClient() {
  // 로그인 정보는 요청마다 달라요 → 미리 렌더링하지 말고 요청 시점에 실행 (Next.js 16)
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없어요. proxy.ts 가 세션을 갱신해 주니 무시해도 돼요.
          }
        },
      },
    },
  );
}

// 지금 로그인한 사용자 + 고구마마켓 프로필
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("goguma_profiles")
    .select("nickname, region")
    .eq("id", claims.sub)
    .maybeSingle();

  const email = (claims.email as string | undefined) ?? "";
  return {
    id: claims.sub,
    email,
    nickname: profile?.nickname ?? email.split("@")[0],
    region: profile?.region ?? "",
  };
}
