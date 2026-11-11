import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight, BadgePercent, CircleCheck, Lock, MapPin, MessageCircle, Navigation,
  PenLine, Search, ShieldCheck, Store, Users, Zap,
} from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLatestProducts, getNearbyProducts } from "@/app/products/data";
import { CATEGORIES } from "@/lib/products";
import { NEAR_KM } from "@/lib/regions";
import ProductCard, { EmptyProducts, ProductGrid, ProductGridSkeleton } from "@/components/ProductCard";
import { btn, Eyebrow, SectionHeader } from "@/components/ui";

const FEATURES = [
  { icon: BadgePercent, title: "수수료 0원", desc: "판매 금액 그대로 내 것. 중개 수수료 없이 이웃과 직접 거래합니다." },
  { icon: MapPin, title: "동네 기반 거래", desc: "내가 사는 동네를 중심으로 가까운 이웃의 매물을 먼저 보여 드립니다." },
  { icon: Zap, title: "1분 판매글 등록", desc: "제목, 카테고리, 가격만 입력하면 바로 등록. 상태 변경도 클릭 한 번이면 끝." },
];

const VALUES = [
  { value: "0원", label: "거래 수수료" },
  { value: "1분", label: "판매글 등록 시간" },
  { value: `${CATEGORIES.length}개`, label: "상품 카테고리" },
  { value: "24시간", label: "언제든 등록·거래" },
];

const TRUST = [
  { icon: Lock, title: "데이터 보안 정책", desc: "판매글 수정·삭제는 데이터베이스 단계에서 작성자 본인만 가능하도록 보호됩니다." },
  { icon: Users, title: "회원제 운영", desc: "로그인한 회원만 판매글을 등록할 수 있어 책임 있는 거래 문화를 만듭니다." },
  { icon: CircleCheck, title: "투명한 거래 상태", desc: "판매중 · 예약중 · 거래완료 상태를 실시간으로 표시해 헛걸음을 줄입니다." },
  { icon: MessageCircle, title: "채팅 기능 준비 중", desc: "이웃과 안전하게 대화할 수 있는 채팅 기능을 다음 단계에서 선보입니다." },
];

const STEPS = [
  { icon: Users, title: "회원가입", desc: "이메일과 닉네임, 우리 동네만 입력하면 가입 완료." },
  { icon: PenLine, title: "판매글 등록", desc: "물건 정보와 가격을 적어 1분 만에 판매글을 올립니다." },
  { icon: Store, title: "동네에서 거래", desc: "가까운 이웃과 만나 직접 확인하고 거래를 마칩니다." },
];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="overflow-x-clip">
      <Suspense fallback={null}>
        <WelcomeBanner searchParams={searchParams} />
      </Suspense>

      {/* ───────── HERO ───────── */}
      <section className="relative border-b border-line">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div aria-hidden className="absolute right-0 top-0 -z-10 h-[520px] w-[620px] bg-[radial-gradient(closest-side,rgb(122_79_176/0.14),transparent)]" />

        {/* 첫 화면은 짧게: 바로 아래 매물이 보이도록 높이를 줄였어요 */}
        <div className="animate-rise mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:pt-10">
          <Eyebrow>LOCAL MARKETPLACE PLATFORM</Eyebrow>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                동네 거래의 <span className="text-brand-700">새로운 기준</span>, 고구마마켓
              </h1>
              <p className="mt-2 text-[15px] text-muted sm:text-base">
                가까운 이웃과 믿고 거래하는 동네 중고거래 플랫폼. 수수료 없이, 안전하게.
              </p>
            </div>
            {/* 검색 + 버튼을 한 줄에 */}
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
              <form
                action="/products"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white p-1.5 shadow-[0_8px_30px_-12px_rgb(15_13_20/0.15)] lg:w-[420px] lg:flex-none"
                title="검색 기능은 다음 단계에서 제공돼요. 지금은 전체 판매글로 이동해요."
              >
                <Search className="ml-2.5 h-5 w-5 shrink-0 text-muted" />
                <input
                  name="q"
                  aria-label="물건 검색"
                  placeholder="어떤 물건을 찾고 계신가요?"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-ink outline-none placeholder:text-muted/80"
                />
                <button className={`${btn.primary} !px-4 !py-2`}>검색</button>
              </form>
              <Suspense fallback={null}>
                <HeroButtons />
              </Suspense>
            </div>
          </div>
        </div>

        {/* 카테고리 바로가기 (가로로 넘겨 보기) */}
        <div id="categories" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-8 sm:px-6">
          <nav aria-label="카테고리" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {CATEGORIES.map((c) => (
              <Link
                key={c.key}
                href={`/products?category=${c.key}`}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-body transition hover:border-brand-200 hover:text-brand-800"
              >
                <c.icon className="h-4 w-4 text-brand-700" strokeWidth={1.75} />
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* ───────── 우리 동네 근처 매물 (로그인 + 동네 정보가 있을 때) ───────── */}
      <Suspense fallback={null}>
        <NearbySection />
      </Suspense>

      {/* ───────── 최신 매물 (DB) ───────── */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
          <ListingHeader eyebrow="LATEST LISTINGS" title="방금 등록된 매물" href="/products" link="전체 매물 보기" />
          <div className="mt-6">
            <Suspense fallback={<ProductGridSkeleton />}>
              <LatestProducts />
            </Suspense>
          </div>
        </div>
      </section>

      {/* 로그인 안 한 사람에게: 근처 매물 안내 */}
      <Suspense fallback={null}>
        <GuestNearbyCta />
      </Suspense>

      {/* ───────── 아래부터는 서비스 소개 ───────── */}

      {/* ───────── 핵심 수치 ───────── */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <div
              key={v.label}
              className={`py-10 text-center lg:py-12 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
            >
              <p className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{v.value}</p>
              <p className="mt-2 text-sm text-muted">{v.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 서비스 소개 ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <SectionHeader
          eyebrow="WHY GOGUMA"
          title={<>이웃과 거래하는 가장 쉬운 방법</>}
          desc="복잡한 절차 없이, 꼭 필요한 기능만 담았습니다. 고구마마켓은 동네 거래의 처음부터 끝까지 함께합니다."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group bg-white p-8 transition hover:bg-brand-50/40 lg:p-10">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:bg-brand-800 group-hover:text-white">
                <f.icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-6 text-xl font-bold text-ink">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 안전거래 (어두운 섹션) ───────── */}
      <section id="trust" className="relative scroll-mt-28 overflow-hidden bg-brand-950 text-white">
        <div aria-hidden className="bg-grid-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div aria-hidden className="absolute -right-40 top-0 h-[500px] w-[500px] bg-[radial-gradient(closest-side,rgb(249_122_31/0.18),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Eyebrow dark>TRUST & SAFETY</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-[1.2]">
              믿을 수 있는 거래를 위한
              <br />
              고구마마켓의 약속
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/60">
              안전한 거래 환경은 플랫폼의 기본입니다. 회원 인증부터 데이터 보안까지, 고구마마켓은 이웃 간
              거래가 안심할 수 있도록 설계되었습니다.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-white/70">
              <ShieldCheck className="h-5 w-5 text-accent-400" />
              Supabase 행 단위 보안(RLS) 정책 적용
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {TRUST.map((t) => (
              <div key={t.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07]">
                <t.icon className="h-6 w-6 text-accent-400" strokeWidth={1.75} />
                <h3 className="mt-5 text-lg font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 이용방법 ───────── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
        <div className="text-center">
          <div className="flex justify-center">
            <Eyebrow>HOW IT WORKS</Eyebrow>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-[2.5rem]">세 단계면 충분합니다</h2>
        </div>
        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          <div aria-hidden className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-line md:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative text-center">
              <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full border border-line bg-white text-brand-700 shadow-sm">
                <s.icon className="h-6 w-6" strokeWidth={1.75} />
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-accent-500 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-6 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-muted">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-brand-800 px-6 py-16 sm:px-14">
          <div aria-hidden className="bg-grid-dark absolute inset-0 [mask-image:radial-gradient(ellipse_at_right,black,transparent_70%)]" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">지금 바로 시작하세요</h2>
              <p className="mt-3 text-lg text-white/70">우리 동네 이웃들이 고구마마켓에서 기다리고 있습니다.</p>
            </div>
            <Suspense fallback={<div className="h-12 w-48" />}>
              <CtaButtons />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}

// R: 최신 판매글 8개
async function LatestProducts() {
  const products = await getLatestProducts(8);
  if (products.length === 0) return <EmptyProducts />;
  return (
    <ProductGrid>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ProductGrid>
  );
}

// 매물 섹션 제목 (짧고 낮게 — 매물이 빨리 보이도록)
function ListingHeader({
  eyebrow,
  title,
  desc,
  href,
  link,
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc?: string;
  href: string;
  link: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        {link} <span className="transition group-hover:translate-x-1">→</span>
      </Link>
    </div>
  );
}

// 로그인 안 한 사람에게만: 근처 매물 기능 안내
async function GuestNearbyCta() {
  const user = await getCurrentUser();
  if (user) return null;
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-7 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
                <Navigation className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-lg font-bold text-ink">우리 동네 근처 매물만 모아 보세요</p>
                <p className="mt-1 text-muted">로그인하면 내 동네에서 {NEAR_KM}km 안의 매물을 가까운 순서로 보여 드려요.</p>
              </div>
            </div>
            <Link href="/login" className={btn.primary}>
              로그인하고 보기
            </Link>
          </div>
        </div>
      </section>
  );
}

// R: 내 동네 근처 매물 (로그인한 사람만)
async function NearbySection() {
  const user = await getCurrentUser();
  if (!user) return null; // 로그인 안 한 사람은 아래쪽 GuestNearbyCta 가 안내해요

  const nearby = await getNearbyProducts(user.region, { limit: 8 });

  // 2) 동네 정보가 없거나, 위치를 모르는 동네 → 안내만
  if (!nearby) {
    return (
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <p className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-body">
            <Navigation className="h-4 w-4 text-muted" />
            {user.region
              ? `'${user.region}'은(는) 아직 위치 정보가 없는 동네라 근처 매물을 계산할 수 없어요.`
              : "회원 정보에 동네가 없어서 근처 매물을 보여 드릴 수 없어요."}
          </p>
        </div>
      </section>
    );
  }

  // 3) 근처 매물 보여 주기
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
        <ListingHeader
          eyebrow="NEAR ME"
          title={
            <>
              <span className="text-brand-700">{nearby.center.name}</span> 근처 매물
            </>
          }
          desc={`내 동네에서 ${NEAR_KM}km 안, 가까운 순서`}
          href="/products?near=1"
          link="근처 매물 전체 보기"
        />
        <div className="mt-6">
          {nearby.items.length === 0 ? (
            <EmptyProducts message={`아직 ${nearby.center.name} 근처에 등록된 판매글이 없습니다.`} />
          ) : (
            <ProductGrid>
              {nearby.items.map(({ product, km }) => (
                <ProductCard key={product.id} product={product} distanceKm={km} />
              ))}
            </ProductGrid>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 로그인 상태에 따라 달라지는 부분 ──
// 쿠키를 읽는 동적 영역이라 Suspense 안에서 따로 렌더링해요 (나머지는 정적으로 빠르게 뜸)

async function WelcomeBanner({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { welcome } = await searchParams;
  if (!welcome) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="border-b border-brand-100 bg-brand-50">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 text-sm text-brand-900 sm:px-6">
        <CircleCheck className="h-5 w-5 shrink-0 text-brand-700" />
        <p>
          <b>{user.nickname}</b>님, 고구마마켓 회원이 되신 것을 환영합니다.
        </p>
      </div>
    </div>
  );
}

async function HeroButtons() {
  const user = await getCurrentUser();
  // 로그인한 사람은 헤더에 '판매글 쓰기'가 있으니 버튼을 따로 안 보여 줘요
  if (user) return null;
  return (
    <Link href="/signup" className={`${btn.accent} shrink-0 !py-3`}>
      무료로 시작하기 <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

async function CtaButtons() {
  const user = await getCurrentUser();
  return (
    <div className="flex flex-wrap gap-3">
      <Link href={user ? "/products/new" : "/signup"} className={btn.white}>
        {user ? "판매글 등록하기" : "무료 회원가입"} <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/products"
        className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-white/10"
      >
        매물 둘러보기
      </Link>
    </div>
  );
}
