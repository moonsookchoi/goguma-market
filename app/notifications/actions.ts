"use server";

// 알림함 · 키워드 알림 서버 액션
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

// 모두 읽음
export async function readAllNotifications() {
  const { supabase, userId } = await requireUser();
  await supabase.from("goguma_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  revalidatePath("/", "layout");
}

// 알림 하나 열기: 읽음 처리 후 그 페이지로 이동
export async function openNotification(id: number, link: string) {
  const { supabase, userId } = await requireUser();
  await supabase.from("goguma_notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  redirect(link.startsWith("/") ? link : "/");
}

// 키워드 추가 (최대 10개)
export async function addKeyword(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const { supabase, userId } = await requireUser();
  const keyword = String(formData.get("keyword") ?? "").trim().slice(0, 20);
  if (!keyword) return { error: "키워드를 입력해 주세요." };
  const { count } = await supabase.from("goguma_keywords").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if ((count ?? 0) >= 10) return { error: "키워드는 10개까지 등록할 수 있어요." };
  const { error } = await supabase.from("goguma_keywords").insert({ user_id: userId, keyword });
  if (error && error.code !== "23505") return { error: "등록하지 못했어요." };
  revalidatePath("/notifications");
  return {};
}

export async function removeKeyword(id: number) {
  const { supabase, userId } = await requireUser();
  await supabase.from("goguma_keywords").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/notifications");
}
