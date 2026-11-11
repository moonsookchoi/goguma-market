import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { imageUrl, timeAgo } from "@/lib/products";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "채팅 · 고구마마켓" };

// 내 채팅 목록 (내가 산 쪽 + 판 쪽 모두)
export default function ChatsPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "채팅" }]} title="채팅" desc="이웃과 나눈 대화를 확인하세요." width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Suspense fallback={<div className="h-60 animate-pulse rounded-xl bg-surface" />}>
          <ChatList />
        </Suspense>
      </div>
    </>
  );
}

type RoomRow = {
  id: number;
  buyer_id: string;
  seller_id: string;
  last_message: string;
  last_message_at: string;
  product: { id: number; title: string; images: string[]; price: number } | null;
  buyer: { nickname: string } | null;
  seller: { nickname: string } | null;
};

async function ChatList() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data } = await supabase
    .from("goguma_chat_rooms")
    .select(
      "id, buyer_id, seller_id, last_message, last_message_at, product:goguma_products(id, title, images, price), buyer:goguma_profiles!goguma_chat_rooms_buyer_id_fkey(nickname), seller:goguma_profiles!goguma_chat_rooms_seller_id_fkey(nickname)",
    )
    .order("last_message_at", { ascending: false });
  const rooms = (data ?? []) as unknown as RoomRow[];

  // 안 읽은 메시지 수 (상대가 보낸 것 중 read_at 이 없는 것)
  const ids = rooms.map((r) => r.id);
  const { data: unread } = ids.length
    ? await supabase.from("goguma_chat_messages").select("room_id").in("room_id", ids).neq("sender_id", user.id).is("read_at", null)
    : { data: [] };
  const unreadBy = new Map<number, number>();
  (unread ?? []).forEach((m) => unreadBy.set(m.room_id, (unreadBy.get(m.room_id) ?? 0) + 1));

  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-muted" strokeWidth={1.5} />
        <p className="mt-4 font-semibold text-ink">아직 채팅이 없어요</p>
        <p className="mt-1 text-sm text-muted">마음에 드는 물건에서 &lsquo;채팅으로 거래하기&rsquo;를 눌러 보세요.</p>
        <Link href="/products" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">판매글 둘러보기 →</Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
      {rooms.map((r) => {
        const isSeller = r.seller_id === user.id;
        const partner = (isSeller ? r.buyer : r.seller)?.nickname ?? "알 수 없음";
        const n = unreadBy.get(r.id) ?? 0;
        return (
          <li key={r.id}>
            <Link href={`/chats/${r.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-surface">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">{partner.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm">
                  <b className="text-ink">{partner}</b>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted ring-1 ring-line">{isSeller ? "구매 희망" : "판매자"}</span>
                  <span className="text-xs text-muted">{timeAgo(r.last_message_at)}</span>
                </p>
                <p className="mt-1 truncate text-sm text-body">{r.last_message || "대화를 시작해 보세요"}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{r.product?.title}</p>
              </div>
              {n > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent-500 px-1.5 text-xs font-bold text-white">{n}</span>}
              {r.product?.images?.[0] && (
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                  <Image src={imageUrl(r.product.images[0])} alt="" fill sizes="48px" className="object-cover" />
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
