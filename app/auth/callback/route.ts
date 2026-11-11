import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 회원가입 인증 메일의 링크를 누르면 여기로 와요 → 코드로 세션을 만들고 홈으로
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/?welcome=1`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
