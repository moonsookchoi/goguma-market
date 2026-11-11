import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { CircleCheck, Navigation, Plus } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getNearbyProducts } from "@/app/products/data";
import { NEAR_KM } from "@/lib/regions";
import { CATEGORIES, PRODUCT_SELECT, getCategory, type Product } from "@/lib/products";
import ProductCard, { EmptyProducts, ProductGrid, ProductGridSkeleton } from "@/components/ProductCard";
import { btn, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "중고거래 · 고구마마켓" };

// R: 판매글 목록 (카테고리로 거르기: /products?category=digital)
export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "중고거래" }]}
        title="중고거래"
        desc="우리 동네 이웃들이 등록한 판매글을 확인하세요."
        action={
          <Link href="/products/new" className={btn.primary}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> 판매글 쓰기
          </Link>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Suspense fallback={<ListFallback />}>
          <ProductList searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function ListFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <div className="h-80 animate-pulse rounded-xl bg-surface" />
      <ProductGridSkeleton count={6} />
    </div>
  );
}

async function ProductList({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const { category, deleted, near } = await searchParams;
  const selected = typeof category === "string" && CATEGORIES.some((c) => c.key === category) ? category : null;
  const nearMode = near === "1"; // '내 근처' 탭

  // 주소 만들기: 카테고리·탭을 바꿔도 다른 선택은 유지
  const href = (opts: { category?: string | null; near?: boolean }) => {
    const p = new URLSearchParams();
    const c = opts.category === undefined ? selected : opts.category;
    if (c) p.set("category", c);
    if (opts.near ?? nearMode) p.set("near", "1");
    const q = p.toString();
    return q ? `/products?${q}` : "/products";
  };

  // 목록 데이터: 전체(최신순) 또는 내 근처(가까운 순)
  let rows: { product: Product; km?: number }[] = [];
  let error = false;
  let nearNotice: React.ReactNode = null;
  let nearLabel = "";

  if (nearMode) {
    const user = await getCurrentUser();
    if (!user) {
      nearNotice = (
        <NearNotice>
          로그인하면 내 동네 근처 매물을 볼 수 있어요.{" "}
          <Link href="/login" className="font-semibold text-brand-700 underline underline-offset-4">로그인</Link>
        </NearNotice>
      );
    } else {
      const nearby = await getNearbyProducts(user.region, { category: selected });
      if (!nearby) {
        nearNotice = (
          <NearNotice>
            {user.region ? `'${user.region}'은(는) 아직 위치 정보가 없는 동네예요.` : "회원 정보에 동네가 없어요."} 전체 매물을 확인해 주세요.
          </NearNotice>
        );
      } else {
        rows = nearby.items;
        nearLabel = `${nearby.center.name} ${NEAR_KM}km 이내`;
      }
    }
  } else {
    const supabase = await createClient();
    let query = supabase.from("goguma_products").select(PRODUCT_SELECT).order("created_at", { ascending: false }).limit(60);
    if (selected) query = query.eq("category", selected);
    const res = await query;
    error = Boolean(res.error);
    rows = ((res.data ?? []) as unknown as Product[]).map((product) => ({ product }));
  }

  return (
    <>
      {/* 탭: 전체 매물 / 내 근처 */}
      <div className="mb-8 flex gap-1 border-b border-line">
        <TabLink href={href({ near: false })} active={!nearMode}>
          전체 매물
        </TabLink>
        <TabLink href={href({ near: true })} active={nearMode}>
          <Navigation className="h-4 w-4" /> 내 동네 근처
        </TabLink>
      </div>

      {deleted && (
        <p className="animate-rise mb-6 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <CircleCheck className="h-4 w-4 text-brand-700" /> 판매글이 삭제되었습니다.
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* 카테고리 필터: 큰 화면은 왼쪽 사이드바, 작은 화면은 가로 스크롤 */}
        <aside>
          <p className="hidden text-xs font-bold tracking-[0.15em] text-muted lg:block">CATEGORY</p>
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:mt-3 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
            <FilterItem href={href({ category: null })} active={!selected} label="전체" />
            {CATEGORIES.map((c) => (
              <FilterItem key={c.key} href={href({ category: c.key })} active={selected === c.key} label={c.name} icon={<c.icon className="h-4 w-4" strokeWidth={1.75} />} />
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {nearNotice ?? (
            <>
              <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
                <p className="text-sm text-muted">
                  {nearLabel && <b className="text-brand-700">{nearLabel} · </b>}
                  <b className="text-ink">{selected ? getCategory(selected).name : "전체"}</b> · 총{" "}
                  <b className="text-ink">{rows.length}</b>건
                </p>
                <p className="text-sm text-muted">{nearMode ? "가까운순" : "최신순"}</p>
              </div>
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  판매글을 불러오지 못했습니다. 새로고침해 주세요.
                </p>
              ) : rows.length === 0 ? (
                <EmptyProducts
                  message={
                    nearMode
                      ? `${nearLabel}에 등록된 ${selected ? getCategory(selected).name + " " : ""}판매글이 없습니다.`
                      : selected
                        ? `${getCategory(selected).name} 카테고리에 등록된 판매글이 없습니다.`
                        : undefined
                  }
                />
              ) : (
                <ProductGrid>
                  {rows.map(({ product, km }) => (
                    <ProductCard key={product.id} product={product} distanceKm={km} />
                  ))}
                </ProductGrid>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-[15px] font-semibold transition ${
        active ? "border-brand-800 text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function NearNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-body">
      <Navigation className="h-4 w-4 shrink-0 text-muted" />
      <span>{children}</span>
    </p>
  );
}

function FilterItem({ href, active, label, icon }: { href: string; active: boolean; label: string; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition max-lg:border ${
        active
          ? "bg-brand-800 font-semibold text-white max-lg:border-brand-800 lg:bg-brand-50 lg:text-brand-800"
          : "text-body hover:bg-surface hover:text-ink max-lg:border-line max-lg:bg-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
