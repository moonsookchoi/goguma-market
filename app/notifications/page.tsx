import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bell, HandCoins, Heart, Search, Star, X } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/products";
import { PageHeader } from "@/components/ui";
import KeywordForm from "@/components/KeywordForm";
import { openNotification, readAllNotifications, removeKeyword } from "./actions";

export const metadata: Metadata = { title: "알림 · 고구마마켓" };

const ICON: Record<string, React.ReactNode> = {
  price_drop: <Heart className="h-4 w-4 text-accent-600" />,
  keyword: <Search className="h-4 w-4 text-brand-700" />,
  offer: <HandCoins className="h-4 w-4 text-emerald-700" />,
  offer_result: <HandCoins className="h-4 w-4 text-emerald-700" />,
  review: <Star className="h-4 w-4 text-amber-500" />,
};

// 알림함 + 키워드 알림 관리
export default function NotificationsPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "알림" }]} title="알림" desc="찜한 물건 가격 변동, 키워드 새 글, 가격 제안, 후기 소식을 모아 봐요." width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Suspense fallback={<div className="h-60 animate-pulse rounded-xl bg-surface" />}>
          <Content />
        </Suspense>
      </div>
    </>
  );
}

async function Content() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const [{ data: list }, { data: keywords }] = await Promise.all([
    supabase.from("goguma_notifications").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("goguma_keywords").select("id, keyword").order("created_at"),
  ]);
  const unread = (list ?? []).filter((n) => !n.read_at).length;

  return (
    <div className="space-y-8">
      {/* 키워드 알림 */}
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="flex items-center gap-1.5 font-bold text-ink">
          <Search className="h-4 w-4" /> 키워드 알림
        </h2>
        <p className="mt-1 text-sm text-muted">
          등록한 단어가 들어간 새 글이 {user.region ? `${user.region} 근처(3km)에` : "내 동네에"} 올라오면 알려 드려요.
        </p>
        <KeywordForm />
        {(keywords ?? []).length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {(keywords ?? []).map((k) => (
              <li key={k.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-sm text-brand-900 ring-1 ring-brand-100">
                {k.keyword}
                <form action={removeKeyword.bind(null, k.id)}>
                  <button aria-label={`${k.keyword} 삭제`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-brand-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 알림 목록 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-ink">받은 알림 {unread > 0 && <span className="text-accent-600">{unread}</span>}</h2>
          {unread > 0 && (
            <form action={readAllNotifications}>
              <button className="text-sm font-semibold text-brand-700 hover:underline">모두 읽음</button>
            </form>
          )}
        </div>
        {(list ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-14 text-center">
            <Bell className="mx-auto h-9 w-9 text-muted" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-muted">아직 알림이 없어요.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {(list ?? []).map((n) => (
              <li key={n.id}>
                <form action={openNotification.bind(null, n.id, n.link)}>
                  <button className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-surface ${n.read_at ? "" : "bg-brand-50/50"}`}>
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line">{ICON[n.type] ?? <Bell className="h-4 w-4" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{n.title}</span>
                      <span className="mt-0.5 block truncate text-sm text-body">{n.body}</span>
                      <span className="mt-0.5 block text-xs text-muted">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
