import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { BarChart3, CircleCheck, Gift, Navigation, Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMarketPrices, listProducts, type ListRow } from "@/app/products/data";
import { CATEGORIES, cleanQuery, getCategory, priceStats } from "@/lib/products";
import { NEAR_KM } from "@/lib/regions";
import ProductCard, { EmptyProducts, ProductGrid, ProductGridSkeleton } from "@/components/ProductCard";
import { btn, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "중고거래 · 고구마마켓" };

type Tab = "all" | "near" | "free";

// R: 판매글 목록 — 검색(q) · 카테고리 · 탭(전체/내 근처/나눔)
export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "중고거래" }]}
        title="중고거래"
        desc="우리 동네 이웃들이 등록한 판매글을 확인하세요."
        action={
          <Link href="/products/new" className={`${btn.primary} max-sm:!hidden`}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> 판매글 쓰기
          </Link>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
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
  const sp = await searchParams;
  const selected = typeof sp.category === "string" && CATEGORIES.some((c) => c.key === sp.category) ? sp.category : null;
  const q = cleanQuery(sp.q);
  const tab: Tab = sp.tab === "near" || sp.near === "1" ? "near" : sp.tab === "free" ? "free" : "all";

  // 주소 만들기: 하나를 바꿔도 나머지 선택(검색어·카테고리·탭)은 유지
  const href = (o: { category?: string | null; tab?: Tab }) => {
    const p = new URLSearchParams();
    const c = o.category === undefined ? selected : o.category;
    const t = o.tab ?? tab;
    if (q) p.set("q", q);
    if (c) p.set("category", c);
    if (t !== "all") p.set("tab", t);
    const s = p.toString();
    return s ? `/products?${s}` : "/products";
  };

  const user = await getCurrentUser();

  let rows: ListRow[] = [];
  let error = false;
  let notice: React.ReactNode = null;
  let nearLabel = "";

  if (tab === "near" && !user) {
    notice = (
      <Notice>
        로그인하면 내 동네 근처 매물을 볼 수 있어요.{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline underline-offset-4">로그인</Link>
      </Notice>
    );
  } else {
    const res = await listProducts({
      q,
      category: selected,
      freeOnly: tab === "free",
      near: tab === "near" ? (user?.region ?? "") : undefined,
      userId: user?.id,
    });
    rows = res.rows;
    error = res.error;
    if (tab === "near") {
      if (!res.center) {
        notice = (
          <Notice>
            {user?.region ? `'${user.region}'은(는) 아직 위치 정보가 없는 동네예요.` : "회원 정보에 동네가 없어요."}{" "}
            <Link href="/me" className="font-semibold text-brand-700 underline underline-offset-4">마이페이지에서 동네 설정하기</Link>
          </Notice>
        );
      } else nearLabel = `${res.center.name} ${NEAR_KM}km 이내`;
    }
  }

  // 시세: 검색어나 카테고리를 골랐을 때만 보여 줘요
  const market = q || selected ? await getMarketPrices({ category: selected, q, near: user?.region }) : null;
  const stats = market ? priceStats(market.prices) : null;

  return (
    <>
      {sp.deleted && (
        <p className="animate-rise mb-5 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <CircleCheck className="h-4 w-4 text-brand-700" /> 판매글이 삭제되었습니다.
        </p>
      )}

      {/* 검색창 */}
      <form action="/products" className="mb-5 flex items-center gap-2 rounded-xl border border-line bg-white p-1.5">
        <Search className="ml-2.5 h-5 w-5 shrink-0 text-muted" />
        <input
          name="q"
          defaultValue={q}
          aria-label="판매글 검색"
          placeholder="찾는 물건을 검색해 보세요 (예: 아이폰, 의자)"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-ink outline-none placeholder:text-muted/80"
        />
        {selected && <input type="hidden" name="category" value={selected} />}
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        <button className={`${btn.primary} !px-4 !py-2`}>검색</button>
      </form>

      {/* 탭: 전체 / 내 동네 근처 / 나눔 */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        <TabLink href={href({ tab: "all" })} active={tab === "all"}>전체 매물</TabLink>
        <TabLink href={href({ tab: "near" })} active={tab === "near"}>
          <Navigation className="h-4 w-4" /> 내 동네 근처
        </TabLink>
        <TabLink href={href({ tab: "free" })} active={tab === "free"}>
          <Gift className="h-4 w-4" /> 나눔 코너
        </TabLink>
      </div>

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
          {/* 동네 시세 */}
          {stats && market && (
            <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-brand-900">
                <BarChart3 className="h-4 w-4" />
                {market.scope} · {[q && `'${q}'`, selected && getCategory(selected).name].filter(Boolean).join(" ")} 시세
                <span className="font-normal text-muted">(판매글 {stats.count}개 기준)</span>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {(
                  [
                    ["평균", stats.avg],
                    ["중간값", stats.median],
                    ["최저", stats.min],
                    ["최고", stats.max],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label} className="rounded-lg bg-white px-3 py-2 ring-1 ring-line">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="mt-0.5 font-bold text-ink">{v.toLocaleString("ko-KR")}원</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {notice ?? (
            <>
              <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
                <p className="text-sm text-muted">
                  {nearLabel && <b className="text-brand-700">{nearLabel} · </b>}
                  {q && <b className="text-ink">&lsquo;{q}&rsquo; 검색 · </b>}
                  <b className="text-ink">{selected ? getCategory(selected).name : "전체"}</b> · 총{" "}
                  <b className="text-ink">{rows.length}</b>건
                </p>
                <p className="text-sm text-muted">{tab === "near" ? "가까운순" : "최신순"}</p>
              </div>
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  판매글을 불러오지 못했습니다. 새로고침해 주세요.
                </p>
              ) : rows.length === 0 ? (
                <EmptyProducts message={q ? `'${q}'에 맞는 판매글이 없습니다.` : "조건에 맞는 판매글이 없습니다."} />
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
      className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-[15px] font-semibold transition ${
        active ? "border-brand-800 text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
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
