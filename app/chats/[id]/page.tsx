import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { imageUrl, won } from "@/lib/products";
import { findRegion } from "@/lib/regions";
import ChatRoom, { type ChatMessage } from "@/components/ChatRoom";
import { StatusBadge } from "@/components/ProductCard";
import TempMeter from "@/components/TempMeter";

export const metadata: Metadata = { title: "채팅방 · 고구마마켓" };

export default function ChatRoomPage({ params }: PageProps<"/chats/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-xl bg-surface" />}>
        <Room params={params} />
      </Suspense>
    </div>
  );
}

async function Room({ params }: { params: PageProps<"/chats/[id]">["params"] }) {
  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isInteger(roomId)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("goguma_chat_rooms")
    .select(
      "id, product_id, buyer_id, seller_id, appointment_at, appointment_place, product:goguma_products(id, title, price, images, status, region), buyer:goguma_profiles!goguma_chat_rooms_buyer_id_fkey(nickname, manner_temp), seller:goguma_profiles!goguma_chat_rooms_seller_id_fkey(nickname, manner_temp)",
    )
    .eq("id", roomId)
    .maybeSingle();
  if (!room) notFound(); // 내 방이 아니면 RLS 때문에 안 보여요

  type P = { nickname: string; manner_temp: number } | null;
  const r = room as unknown as {
    id: number; product_id: number; buyer_id: string; seller_id: string; appointment_at: string | null; appointment_place: string;
    product: { id: number; title: string; price: number; images: string[]; status: "selling" | "reserved" | "sold"; region: string } | null;
    buyer: P; seller: P;
  };
  const isSeller = r.seller_id === user.id;
  const partner = isSeller ? r.buyer : r.seller;
  const partnerId = isSeller ? r.buyer_id : r.seller_id;

  const [{ data: messages }, { data: myReview }] = await Promise.all([
    supabase.from("goguma_chat_messages").select("*").eq("room_id", roomId).order("created_at").limit(300),
    supabase.from("goguma_reviews").select("id").eq("product_id", r.product_id).eq("reviewer_id", user.id).maybeSingle(),
  ]);

  // 안전 거래 장소 추천: 거래 동네(없으면 내 동네) 기준
  const reg = findRegion(r.product?.region) ?? findRegion(user.region);
  const safePlaces = reg
    ? [`${reg.station ?? reg.name} 출구 앞`, `${reg.name} 주민센터 앞`, `${reg.name} 파출소 근처`, `${reg.station ?? reg.name} 근처 편의점(CCTV)`]
    : ["가까운 지하철역 출구 앞", "주민센터 앞", "파출소 근처", "CCTV 있는 편의점 앞"];

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-white">
      {/* 위: 상대 + 물건 */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link href="/chats" aria-label="채팅 목록" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Link href={`/users/${partnerId}`} className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{partner?.nickname ?? "알 수 없음"}</p>
          <p className="text-xs text-muted">{isSeller ? "구매 희망자" : "판매자"}</p>
        </Link>
        <TempMeter temp={Number(partner?.manner_temp ?? 36.5)} />
      </div>
      {r.product && (
        <Link href={`/products/${r.product.id}`} className="flex items-center gap-3 border-b border-line bg-surface/60 px-4 py-2.5">
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface ring-1 ring-line">
            {r.product.images[0] && <Image src={imageUrl(r.product.images[0])} alt="" fill sizes="44px" className="object-cover" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{r.product.title}</p>
            <p className="text-sm font-bold text-ink">{won(r.product.price)}</p>
          </div>
          <StatusBadge status={r.product.status} />
        </Link>
      )}

      <ChatRoom
        roomId={r.id}
        userId={user.id}
        isSeller={isSeller}
        initialMessages={(messages ?? []) as ChatMessage[]}
        appointment={{ at: r.appointment_at, place: r.appointment_place }}
        safePlaces={safePlaces}
        canReview={!myReview && r.product?.status !== "selling"}
        price={r.product?.price ?? 0}
      />
    </div>
  );
}
