"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  checkEmail?: string; // 이메일 인증이 필요할 때 안내할 주소
  fields?: Record<string, string>;
};

// Supabase 영어 에러 → 한국어
function toKorean(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (m.includes("email not confirmed")) return "이메일 인증이 아직 안 됐어요. 메일함을 확인해 주세요.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (m.includes("password should be") || m.includes("weak password"))
    return "비밀번호가 너무 쉬워요. 6자 이상으로 더 복잡하게 만들어 주세요.";
  if (m.includes("rate limit") || m.includes("security purposes"))
    return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  if (m.includes("invalid") && m.includes("email")) return "이메일 형식을 확인해 주세요.";
  return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fields = { email };

  if (!EMAIL_RE.test(email)) return { error: "이메일 형식을 확인해 주세요.", fields };
  if (!password) return { error: "비밀번호를 입력해 주세요.", fields };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: toKorean(error.message), fields };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const fields = { email, nickname, region };

  if (nickname.length < 2 || nickname.length > 12)
    return { error: "닉네임은 2~12자로 정해 주세요.", fields };
  if (!EMAIL_RE.test(email)) return { error: "이메일 형식을 확인해 주세요.", fields };
  if (password.length < 6) return { error: "비밀번호는 6자 이상이어야 해요.", fields };
  if (password !== passwordConfirm) return { error: "비밀번호 확인이 일치하지 않아요.", fields };
  if (region.length > 20) return { error: "동네 이름은 20자 이하로 적어 주세요.", fields };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // DB 트리거가 이 값으로 goguma_profiles 행을 만들어요
      data: { app: "goguma", nickname, region },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: toKorean(error.message), fields };

  // 이미 가입된 이메일이면 Supabase 는 에러 대신 identities 가 빈 사용자를 돌려줘요
  if (data.user && data.user.identities?.length === 0)
    return { error: "이미 가입된 이메일이에요. 로그인해 주세요.", fields };

  // 이메일 인증이 꺼져 있으면 바로 로그인 상태가 돼요
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/?welcome=1");
  }

  return { checkEmail: email };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
