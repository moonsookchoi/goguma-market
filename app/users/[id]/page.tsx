import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { listProducts } from "@/app/products/data";
import ProductCard, { ProductGrid } from "@/components/ProductCard";
import TempMeter from "@/components/TempMeter";
import { timeAgo } from "@/lib/products";

export const metadata: Metadata = { title: "판매자 프로필 · 고구마마켓" };

// 판매자 프로필: 매너 온도 · 받은 칭찬 · 거래 후기 · 판매 물건
export default function UserPage({ params }: PageProps<"/users/[id]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="h-60 animate-pulse rounded-xl bg-surface" />}>
        <Profile params={params} />
      </Suspense>
    </div>
  );
}

const RATING = { best: "😍 최고예요", good: "🙂 좋아요", bad: "😕 아쉬워요" } as const;

async function Profile({ params }: { params: PageProps<"/users/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: profile }, { data: reviews }, viewer] = await Promise.all([
    supabase.from("goguma_profiles").select("nickname, region, manner_temp, region_verified_at, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("goguma_reviews")
      .select("id, rating, tags, comment, created_at, reviewer:goguma_profiles!goguma_reviews_reviewer_id_fkey(nickname)")
      .eq("reviewee_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    getCurrentUser(),
  ]);
  if (!profile) notFound();
  const { rows } = await listProducts({ sellerId: id, userId: viewer?.id });

  // 받은 매너 칭찬 태그 개수 세기
  const tagCount = new Map<string, number>();
  (reviews ?? []).forEach((r) => (r.tags as string[]).forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)));
  const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-white p-6">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-800">{profile.nickname.slice(0, 1)}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">{profile.nickname}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            {profile.region || "동네 미설정"}
            {profile.region_verified_at && (
              <span className="inline-flex items-center gap-0.5 font-medium text-emerald-700"><ShieldCheck className="h-4 w-4" /> 동네 인증</span>
            )}
            · {timeAgo(profile.created_at)} 가입
          </p>
        </div>
        <TempMeter temp={Number(profile.manner_temp)} large />
      </div>

      {topTags.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-ink">받은 매너 칭찬</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topTags.map(([t, n]) => (
              <li key={t} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-900 ring-1 ring-brand-100">
                {t} <b>{n}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-bold text-ink">거래 후기 {reviews?.length ?? 0}</h2>
        {(reviews ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted">아직 받은 후기가 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
            {(reviews ?? []).map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-ink">
                  {RATING[r.rating as keyof typeof RATING]}{" "}
                  <span className="text-xs font-normal text-muted">· {(r.reviewer as unknown as { nickname: string } | null)?.nickname} · {timeAgo(r.created_at)}</span>
                </p>
                {r.comment && <p className="mt-1 text-body">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-ink">판매 물건 {rows.length}</h2>
        <div className="mt-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted">판매 중인 물건이 없어요.</p>
          ) : (
            <ProductGrid>
              {rows.map(({ product }) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ProductGrid>
          )}
        </div>
      </section>
    </>
  );
}
