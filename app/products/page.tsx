import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, PRODUCT_SELECT, getCategory, type Product } from "@/lib/products";
import ProductCard, { EmptyProducts, ProductGridSkeleton } from "@/components/ProductCard";

export const metadata: Metadata = { title: "중고거래 · 고구마마켓" };

// R: 판매글 목록 (카테고리로 거르기: /products?category=digital)
export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-flesh-600">🍠 중고거래</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">우리 동네 판매글</h1>
        </div>
        <Link
          href="/products/new"
          className="rounded-full bg-flesh-500 px-5 py-3 font-semibold text-white shadow-lg shadow-flesh-500/25 transition hover:-translate-y-0.5 hover:bg-flesh-600"
        >
          + 판매글 쓰기
        </Link>
      </div>

      <Suspense fallback={<ListFallback />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function ListFallback() {
  return (
    <>
      <div className="mt-8 h-10 animate-pulse rounded-full bg-goguma-50" />
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </>
  );
}

async function ProductList({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const { category, deleted } = await searchParams;
  const selected = typeof category === "string" && CATEGORIES.some((c) => c.key === category) ? category : null;

  const supabase = await createClient();
  let query = supabase.from("goguma_products").select(PRODUCT_SELECT).order("created_at", { ascending: false }).limit(60);
  if (selected) query = query.eq("category", selected);
  const { data, error } = await query;
  const products = (data ?? []) as unknown as Product[];

  return (
    <>
      {deleted && (
        <p className="animate-rise mt-6 rounded-2xl bg-goguma-700 px-5 py-3 text-sm text-white">🗑️ 판매글을 삭제했어요.</p>
      )}

      {/* 카테고리 필터 */}
      <nav className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <FilterChip href="/products" active={!selected}>
          전체
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.key} href={`/products?category=${c.key}`} active={selected === c.key}>
            {c.emoji} {c.name}
          </FilterChip>
        ))}
      </nav>

      <div className="mt-8">
        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">판매글을 불러오지 못했어요. 새로고침해 주세요.</p>
        ) : products.length === 0 ? (
          <EmptyProducts message={selected ? `${getCategory(selected).name} 판매글이 아직 없어요.` : undefined} />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
        active ? "bg-goguma-700 text-white ring-goguma-700" : "bg-white ring-line hover:ring-goguma-200"
      }`}
    >
      {children}
    </Link>
  );
}
