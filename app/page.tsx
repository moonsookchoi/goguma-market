import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight, BadgePercent, CircleCheck, Clock, Lock, MapPin, MessageCircle,
  PenLine, Search, ShieldCheck, Store, Users, Zap,
} from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLatestProducts } from "@/app/products/data";
import { CATEGORIES } from "@/lib/products";
import ProductCard, { EmptyProducts, ProductGrid, ProductGridSkeleton } from "@/components/ProductCard";
import { btn, Eyebrow, SectionHeader } from "@/components/ui";

// 첫 화면 오른쪽 '서비스 화면' 그림에만 쓰는 예시 데이터 (실제 판매글은 아래 '최신 매물'에서 DB로 보여 줘요)
const MOCK_ROWS = [
  { cat: 0, title: "아이폰 15 Pro 256GB", price: "890,000원", meta: "망원동 · 3분 전", status: "판매중" },
  { cat: 1, title: "원목 4인 식탁 세트", price: "120,000원", meta: "연남동 · 12분 전", status: "예약중" },
  { cat: 6, title: "개발 서적 5권 묶음", price: "나눔", meta: "합정동 · 25분 전", status: "판매중" },
];

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

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-24">
          <div className="animate-rise min-w-0">
            <Eyebrow>LOCAL MARKETPLACE PLATFORM</Eyebrow>
            <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-[3.6rem]">
              동네 거래의
              <br />
              <span className="text-brand-700">새로운 기준</span>, 고구마마켓
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              가까운 이웃과 믿고 거래하는 동네 중고거래 플랫폼. 수수료 없이, 안전하게,
              필요한 물건을 가장 가까운 곳에서 찾아보세요.
            </p>

            <form action="/products" className="mt-9 flex max-w-xl items-center gap-2 rounded-xl border border-line bg-white p-1.5 shadow-[0_8px_30px_-12px_rgb(15_13_20/0.15)]">
              <Search className="ml-3 h-5 w-5 shrink-0 text-muted" />
              <input
                name="q"
                aria-label="물건 검색"
                placeholder="어떤 물건을 찾고 계신가요?"
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-[15px] text-ink outline-none placeholder:text-muted/80"
              />
              <button className={`${btn.primary} !py-2.5`}>검색</button>
            </form>
            <p className="mt-3 text-xs text-muted">※ 검색 기능은 다음 단계에서 제공됩니다. 지금은 전체 판매글로 이동해요.</p>

            <Suspense fallback={<div className="mt-9 h-12" />}>
              <HeroButtons />
            </Suspense>
          </div>

          <HeroMock />
        </div>
      </section>

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

      {/* ───────── 최신 매물 (DB) ───────── */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <SectionHeader
            eyebrow="LATEST LISTINGS"
            title="방금 등록된 우리 동네 매물"
            action={{ href: "/products", label: "전체 매물 보기" }}
          />
          <div className="mt-12">
            <Suspense fallback={<ProductGridSkeleton />}>
              <LatestProducts />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ───────── 카테고리 ───────── */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
        <SectionHeader
          eyebrow="CATEGORIES"
          title="카테고리별로 찾아보세요"
          desc="디지털기기부터 식물까지, 생활에 필요한 모든 물건을 카테고리로 나눠 두었습니다."
        />
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/products?category=${c.key}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-3 py-6 text-center transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <c.icon className="h-7 w-7 text-brand-700 transition group-hover:scale-110" strokeWidth={1.5} />
              <span className="text-sm font-medium text-ink">{c.name}</span>
            </Link>
          ))}
          <Link
            href="/products"
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-brand-800 px-3 py-6 text-center text-white transition hover:bg-brand-700"
          >
            <ArrowRight className="h-6 w-6" />
            <span className="text-sm font-semibold">전체 보기</span>
          </Link>
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

// 첫 화면 오른쪽: 서비스 화면을 보여 주는 그림 (예시 데이터)
function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-30px_rgb(42_22_67/0.45)]">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-muted ring-1 ring-line">
            goguma-market / 중고거래
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">우리 동네 최신 매물</p>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">서비스 화면 예시</span>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {MOCK_ROWS.map((r) => {
              const Icon = CATEGORIES[r.cat].icon;
              return (
                <li key={r.title} className="flex items-center gap-4 py-3.5">
                  <span className="bg-grid grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-surface ring-1 ring-line">
                    <Icon className="h-6 w-6 text-brand-700" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{r.meta}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${r.price === "나눔" ? "text-accent-600" : "text-ink"}`}>{r.price}</p>
                    <p className={`mt-1 text-[11px] font-semibold ${r.status === "예약중" ? "text-emerald-700" : "text-accent-600"}`}>
                      {r.status}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 떠 있는 작은 정보 카드 */}
      <div className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-xl sm:flex">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-50 text-accent-600">
          <BadgePercent className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-muted">거래 수수료</p>
          <p className="font-bold text-ink">0원</p>
        </div>
      </div>
      <div className="absolute -right-4 -top-5 hidden items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-xl sm:flex">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Clock className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-muted">판매글 등록</p>
          <p className="font-bold text-ink">1분이면 충분</p>
        </div>
      </div>
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
  return (
    <div className="mt-9 flex flex-wrap items-center gap-3">
      {user ? (
        <Link href="/products/new" className={btn.primary}>
          판매글 등록하기 <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <Link href="/signup" className={btn.primary}>
          무료로 시작하기 <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      <Link href="/products" className={btn.outline}>
        매물 둘러보기
      </Link>
    </div>
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
