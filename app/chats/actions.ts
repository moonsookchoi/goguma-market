"use server";

// 채팅 서버 액션: 채팅방 열기 · 거래 약속 정하기 · 가격 제안 응답 · 후기 남기기
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

// 판매글에서 '채팅하기' → 방이 있으면 그 방, 없으면 새로 만들기
export async function startChat(productId: number) {
  const { supabase, userId } = await requireUser();
  const { data: p } = await supabase.from("goguma_products").select("seller_id").eq("id", productId).maybeSingle();
  if (!p || p.seller_id === userId) redirect(`/products/${productId}`);

  const { data: existing } = await supabase
    .from("goguma_chat_rooms")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (existing) redirect(`/chats/${existing.id}`);

  const { data: room, error } = await supabase
    .from("goguma_chat_rooms")
    .insert({ product_id: productId, buyer_id: userId, seller_id: p.seller_id })
    .select("id")
    .single();
  if (error || !room) {
    console.error("startChat", error);
    redirect(`/products/${productId}?chat=blocked`);
  }
  redirect(`/chats/${room.id}`);
}

// 거래 약속 정하기 (판매자가 정하면 판매글이 '예약중'으로 바뀌어요)
export async function setAppointment(roomId: number, formData: FormData) {
  const { supabase, userId } = await requireUser();
  const at = String(formData.get("at") ?? "");
  const place = String(formData.get("place") ?? "").trim().slice(0, 40);
  if (!at || !place) return;

  const { data: room } = await supabase.from("goguma_chat_rooms").select("product_id, seller_id").eq("id", roomId).maybeSingle();
  if (!room) return;
  const when = new Date(at);
  await supabase.from("goguma_chat_rooms").update({ appointment_at: when.toISOString(), appointment_place: place }).eq("id", roomId);
  await supabase.from("goguma_chat_messages").insert({
    room_id: roomId,
    sender_id: userId,
    kind: "system",
    body: `📅 거래 약속: ${when.toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" })} · ${place}`,
  });
  if (room.seller_id === userId) {
    await supabase.from("goguma_products").update({ status: "reserved" }).eq("id", room.product_id).eq("seller_id", userId);
  }
  revalidatePath(`/chats/${roomId}`);
}

// 가격 제안 수락/거절 (판매자만)
export async function answerOffer(messageId: number, roomId: number, accept: boolean) {
  const { supabase, userId } = await requireUser();
  const { data: room } = await supabase.from("goguma_chat_rooms").select("seller_id").eq("id", roomId).maybeSingle();
  if (!room || room.seller_id !== userId) return;
  await supabase
    .from("goguma_chat_messages")
    .update({ offer_status: accept ? "accepted" : "declined" })
    .eq("id", messageId)
    .eq("offer_status", "pending");
  revalidatePath(`/chats/${roomId}`);
}

// 거래 후기 남기기 (매너 온도는 DB 트리거가 계산)
export async function writeReview(roomId: number, _prev: { done?: boolean; error?: string }, formData: FormData): Promise<{ done?: boolean; error?: string }> {
  const { supabase, userId } = await requireUser();
  const rating = String(formData.get("rating") ?? "");
  const tags = formData.getAll("tags").map(String).slice(0, 8);
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 300);
  if (!["best", "good", "bad"].includes(rating)) return { error: "평가를 골라 주세요." };

  const { data: room } = await supabase.from("goguma_chat_rooms").select("product_id, buyer_id, seller_id").eq("id", roomId).maybeSingle();
  if (!room) return { error: "채팅방을 찾을 수 없어요." };
  const reviewee = room.buyer_id === userId ? room.seller_id : room.buyer_id;

  const { error } = await supabase
    .from("goguma_reviews")
    .insert({ product_id: room.product_id, reviewer_id: userId, reviewee_id: reviewee, rating, tags, comment });
  if (error) {
    if (error.code === "23505") return { done: true };
    console.error("writeReview", error);
    return { error: "후기를 남기지 못했어요." };
  }
  revalidatePath(`/chats/${roomId}`);
  return { done: true };
}
