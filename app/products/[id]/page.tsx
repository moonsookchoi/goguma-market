import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { BarChart3, Clock, Eye, Heart, MapPin, MessageCircle, Pencil, ShieldCheck } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getMarketPrices, getProduct } from "@/app/products/data";
import { STATUSES, getCategory, priceStats, timeAgo, won, type Product } from "@/lib/products";
import TempMeter from "@/components/TempMeter";
import { ProductThumb, StatusBadge } from "@/components/ProductCard";
import DeleteProductButton from "@/components/DeleteProductButton";
import ProductGallery from "@/components/ProductGallery";
import { BumpButton, ViewTracker, WishButton } from "@/components/ProductActions";
import { btn } from "@/components/ui";
import { changeStatus } from "../actions";
import { startChat } from "@/app/chats/actions";

// 브라우저 탭 제목을 판매글 제목으로
export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: `${product.title} · 고구마마켓` };
}

// R: 판매글 상세
export default function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: { params: PageProps<"/products/[id]">["params"] }) {
  const { id } = await params;
  const [product, user] = await Promise.all([getProduct(id), getCurrentUser()]);
  const supabase = await createClient();

  // 내가 찜했는지 · 이 글의 채팅 수 · 같은 카테고리 시세
  const [wishRes, chatRes, market] = await Promise.all([
    user
      ? supabase.from("goguma_wishes").select("product_id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("goguma_chat_rooms").select("id", { count: "exact", head: true }).eq("product_id", product.id),
    getMarketPrices({ category: product.category, near: product.region }),
  ]);
  const chatCount = chatRes.count ?? 0;
  const stats = priceStats(market.prices);

  const isOwner = user?.id === product.seller_id;
  const category = getCategory(product.category);
  const sellerName = product.seller?.nickname ?? "알 수 없음";
  const temp = Number(product.seller?.manner_temp ?? 36.5);
  const edited = new Date(product.updated_at).getTime() - new Date(product.created_at).getTime() > 60_000;

  return (
    <>
      <ViewTracker id={product.id} />
      <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-ink">홈</Link>
        <span aria-hidden>/</span>
        <Link href="/products" className="hover:text-ink">중고거래</Link>
        <span aria-hidden>/</span>
        <Link href={`/products?category=${category.key}`} className="hover:text-ink">{category.name}</Link>
      </nav>

      <article className="animate-rise mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        {product.images.length > 0 ? (
          <ProductGallery images={product.images} title={product.title} dim={product.status === "sold"} />
        ) : (
          <ProductThumb
            category={product.category}
            size="lg"
            className={`aspect-square rounded-2xl border border-line ${product.status === "sold" ? "opacity-60 grayscale" : ""}`}
          />
        )}

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} />
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-body ring-1 ring-inset ring-line">
              <category.icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {category.name}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">{product.title}</h1>
          <p className={`mt-4 text-3xl font-bold tracking-tight ${product.price === 0 ? "text-accent-600" : "text-ink"}`}>
            {won(product.price)}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> 조회 {product.view_count}</span>
            <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> 찜 {product.wish_count}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> 채팅 {chatCount}</span>
          </p>

          {/* 동네 시세와 비교 */}
          {stats && product.price > 0 && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">
              <BarChart3 className="h-3.5 w-3.5 shrink-0" />
              <span>
                {market.scope} {category.name} 평균 <b>{stats.avg.toLocaleString("ko-KR")}원</b> ·{" "}
                {product.price <= stats.avg ? "평균보다 저렴해요 👍" : "평균보다 조금 비싸요"}
              </span>
            </p>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
            <div className="bg-white p-4">
              <dt className="flex items-center gap-1.5 text-muted"><MapPin className="h-4 w-4" /> 거래 동네</dt>
              <dd className="mt-1 font-semibold text-ink">{product.region || "미정"}</dd>
            </div>
            <div className="bg-white p-4">
              <dt className="flex items-center gap-1.5 text-muted"><Clock className="h-4 w-4" /> 등록</dt>
              <dd className="mt-1 font-semibold text-ink">
                {timeAgo(product.created_at)}
                {edited && <span className="ml-1 text-xs font-normal text-muted">(수정됨)</span>}
              </dd>
            </div>
          </dl>

          {/* 판매자 + 매너 온도 */}
          <Link href={`/users/${product.seller_id}`} className="mt-4 flex items-center gap-3 rounded-xl border border-line p-4 transition hover:border-brand-200">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">
              {sellerName.slice(0, 1)}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink">{sellerName}</p>
              <p className="flex flex-wrap items-center gap-1 text-sm text-muted">
                {product.seller?.region || "동네 미설정"}
                {product.seller?.region_verified_at && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> 동네 인증
                  </span>
                )}
              </p>
            </div>
            <TempMeter temp={temp} />
          </Link>

          <div className="mt-auto pt-6">
            {isOwner ? (
              <div className="rounded-xl border border-line bg-surface p-5">
                <p className="text-sm font-semibold text-ink">판매글 관리</p>
                <p className="mt-0.5 text-xs text-muted">거래 상태를 바꾸면 목록에 바로 반영됩니다.</p>
                {/* U: 상태 바꾸기 — 버튼마다 다른 status 값을 보내요 */}
                <form action={changeStatus.bind(null, product.id)} className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-white p-1 ring-1 ring-line">
                  {(Object.keys(STATUSES) as Product["status"][]).map((s) => (
                    <button
                      key={s}
                      name="status"
                      value={s}
                      aria-pressed={product.status === s}
                      className={`rounded-md py-2 text-sm font-semibold transition ${
                        product.status === s ? "bg-brand-800 text-white" : "text-body hover:bg-surface"
                      }`}
                    >
                      {STATUSES[s].label}
                    </button>
                  ))}
                </form>
                <div className="mt-4 flex flex-wrap items-start justify-end gap-2">
                  <BumpButton id={product.id} />
                  <Link href="/chats" className={`${btn.outline} !px-4 !py-2 !text-sm`}>
                    <MessageCircle className="h-4 w-4" /> 채팅 {chatCount}
                  </Link>
                  <Link href={`/products/${product.id}/edit`} className={`${btn.outline} !px-4 !py-2 !text-sm`}>
                    <Pencil className="h-4 w-4" /> 수정
                  </Link>
                  <DeleteProductButton id={product.id} />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <WishButton id={product.id} initialWished={Boolean(wishRes.data)} count={product.wish_count} loggedIn={Boolean(user)} />
                <form action={startChat.bind(null, product.id)} className="flex-1">
                  <button className={`${btn.primary} h-12 w-full`} disabled={product.status === "sold"}>
                    <MessageCircle className="h-5 w-5" />
                    {product.status === "sold" ? "거래가 완료된 물건이에요" : "채팅으로 거래하기"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* 상세 설명 */}
      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-lg font-bold text-ink">상품 설명</h2>
        <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-[1.8] text-body">
          {product.description || <span className="text-muted">등록된 설명이 없습니다.</span>}
        </p>
      </section>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
      <div className="aspect-square animate-pulse rounded-2xl bg-surface" />
      <div className="space-y-4">
        <div className="h-6 w-1/3 animate-pulse rounded bg-surface" />
        <div className="h-9 w-3/4 animate-pulse rounded bg-surface" />
        <div className="h-9 w-1/3 animate-pulse rounded bg-surface" />
        <div className="h-24 animate-pulse rounded-xl bg-surface" />
      </div>
    </div>
  );
}
