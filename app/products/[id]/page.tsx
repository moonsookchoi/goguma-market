import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProduct } from "@/app/products/data";
import { STATUSES, getCategory, timeAgo, won, type Product } from "@/lib/products";
import { ProductThumb, StatusBadge } from "@/components/ProductCard";
import DeleteProductButton from "@/components/DeleteProductButton";
import { changeStatus } from "../actions";

// 브라우저 탭 제목을 판매글 제목으로
export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: `${product.title} · 고구마마켓` };
}

// R: 판매글 상세
export default function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/products" className="text-sm font-semibold text-muted hover:text-ink">
        ← 목록으로
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: { params: PageProps<"/products/[id]">["params"] }) {
  const { id } = await params;
  const [product, user] = await Promise.all([getProduct(id), getCurrentUser()]);
  const isOwner = user?.id === product.seller_id;
  const category = getCategory(product.category);
  const sellerName = product.seller?.nickname ?? "알 수 없음";
  const edited = new Date(product.updated_at).getTime() - new Date(product.created_at).getTime() > 60_000;

  return (
    <article className="animate-rise mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
      <ProductThumb
        category={product.category}
        className={`aspect-square rounded-[2rem] text-[8rem] ring-1 ring-line sm:text-[10rem] ${product.status === "sold" ? "opacity-60 grayscale" : ""}`}
      />

      <div className="flex flex-col">
        {/* 판매자 */}
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-goguma-500 to-flesh-500 text-lg font-bold text-white">
            {sellerName.slice(0, 1)}
          </span>
          <div>
            <p className="font-bold">{sellerName}</p>
            <p className="text-sm text-muted">{product.seller?.region || "동네 미설정"}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <StatusBadge status={product.status} />
          <Link
            href={`/products?category=${category.key}`}
            className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-line hover:text-ink"
          >
            {category.emoji} {category.name}
          </Link>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">{product.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {[product.region, timeAgo(product.created_at), edited ? "수정됨" : ""].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-4 text-3xl font-black">{won(product.price)}</p>

        <p className="mt-6 min-h-24 whitespace-pre-wrap leading-relaxed text-ink/90">
          {product.description || <span className="text-muted">설명이 없어요.</span>}
        </p>

        <div className="mt-auto pt-8">
          {isOwner ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
              <p className="text-sm font-semibold text-muted">내 판매글 관리</p>
              {/* U: 상태 바꾸기 — 버튼마다 다른 status 값을 보내요 */}
              <form action={changeStatus.bind(null, product.id)} className="mt-3 grid grid-cols-3 gap-2">
                {(Object.keys(STATUSES) as Product["status"][]).map((s) => (
                  <button
                    key={s}
                    name="status"
                    value={s}
                    aria-pressed={product.status === s}
                    className={`rounded-xl py-2.5 text-sm font-bold transition ${
                      product.status === s ? "bg-goguma-700 text-white" : "bg-goguma-50 text-goguma-700 hover:bg-goguma-100"
                    }`}
                  >
                    {STATUSES[s].label}
                  </button>
                ))}
              </form>
              <div className="mt-4 flex justify-end gap-2">
                <Link
                  href={`/products/${product.id}/edit`}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-goguma-700 ring-1 ring-goguma-200 transition hover:bg-goguma-50"
                >
                  수정
                </Link>
                <DeleteProductButton id={product.id} />
              </div>
            </div>
          ) : (
            <button
              disabled
              title="채팅은 다음 단계에서 생겨요"
              className="w-full cursor-not-allowed rounded-2xl bg-flesh-500/60 py-4 font-bold text-white"
            >
              💬 채팅하기 (준비 중)
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="aspect-square animate-pulse rounded-[2rem] bg-goguma-50" />
      <div className="space-y-4">
        <div className="h-12 w-1/2 animate-pulse rounded-xl bg-goguma-50" />
        <div className="h-8 w-3/4 animate-pulse rounded-xl bg-goguma-50" />
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-goguma-50" />
        <div className="h-32 animate-pulse rounded-xl bg-goguma-50" />
      </div>
    </div>
  );
}
