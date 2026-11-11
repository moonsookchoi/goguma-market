import Link from "next/link";
import { Suspense } from "react";
import { GogumaIcon } from "@/components/Logo";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLatestProducts } from "@/app/products/data";
import ProductCard, { EmptyProducts, ProductGridSkeleton } from "@/components/ProductCard";

// 첫 화면에 떠다니는 장식 카드용 예시 데이터 (실제 판매글은 아래 '방금 올라온 매물'에서 DB로 보여 줘요)
const SAMPLE_ITEMS = [
  { emoji: "🎧", title: "에어팟 프로 2세대", price: 159000, place: "망원동", ago: "3분 전", likes: 12, tone: "from-goguma-100 to-goguma-50" },
  { emoji: "🚲", title: "미니벨로 자전거", price: 85000, place: "연남동", ago: "12분 전", likes: 8, tone: "from-flesh-100 to-[#fff7ec]" },
  { emoji: "🪴", title: "몬스테라 큰 화분", price: 20000, place: "성수동", ago: "25분 전", likes: 21, tone: "from-[#e5f6ea] to-[#f4fbf6]" },
  { emoji: "📷", title: "필름카메라 올림푸스", price: 120000, place: "합정동", ago: "1시간 전", likes: 34, tone: "from-[#e6eefc] to-[#f4f7fe]" },
  { emoji: "🪑", title: "원목 의자 2개", price: 30000, place: "서교동", ago: "2시간 전", likes: 5, tone: "from-flesh-100 to-[#fffaf3]" },
  { emoji: "🎮", title: "닌텐도 스위치 OLED", price: 280000, place: "상수동", ago: "3시간 전", likes: 47, tone: "from-[#fde6ea] to-[#fff4f6]" },
  { emoji: "📚", title: "개발 서적 묶음", price: 15000, place: "공덕동", ago: "5시간 전", likes: 9, tone: "from-goguma-100 to-goguma-50" },
  { emoji: "🧸", title: "아기 애착인형", price: 0, place: "도화동", ago: "어제", likes: 16, tone: "from-[#fff3c9] to-[#fffbea]" },
];

const CATEGORIES = [
  ["📱", "디지털기기"], ["🛋️", "가구/인테리어"], ["👕", "의류"], ["👶", "유아동"],
  ["🍳", "생활/주방"], ["⚽", "스포츠/레저"], ["📚", "도서"], ["🎨", "취미/게임"],
  ["💄", "뷰티/미용"], ["🐶", "반려동물"], ["🎟️", "티켓/교환권"], ["🌱", "식물"],
];

const STEPS = [
  ["📸", "사진 찍고 올리기", "물건 사진과 가격만 적으면 1분이면 끝나요."],
  ["💬", "이웃과 채팅하기", "가까운 이웃과 바로 대화하고 약속을 잡아요."],
  ["🤝", "동네에서 만나기", "집 근처에서 만나 직접 보고 거래해요."],
];

const won = (n: number) => (n === 0 ? "나눔 🧡" : `${n.toLocaleString("ko-KR")}원`);

type Item = (typeof SAMPLE_ITEMS)[number];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="overflow-x-clip">
      <Suspense fallback={null}>
        <WelcomeBanner searchParams={searchParams} />
      </Suspense>

      {/* ───────── HERO ───────── */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-goguma-200/60 blur-3xl" />
          <div className="absolute -right-24 top-24 h-[26rem] w-[26rem] rounded-full bg-flesh-300/50 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#ffe7a8]/60 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div className="animate-rise min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-goguma-200 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-goguma-700 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flesh-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-flesh-500" />
              </span>
              지금 우리 동네에서 거래 중
            </span>

            <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.15] tracking-tight sm:text-6xl">
              이웃과 나누는
              <br />
              <span className="bg-gradient-to-r from-goguma-600 via-[#c0479a] to-flesh-500 bg-clip-text text-transparent">
                따끈한 중고거래
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              안 쓰는 물건은 이웃에게, 필요한 물건은 가까운 곳에서.
              <br className="hidden sm:block" /> 갓 구운 고구마처럼 따뜻한 동네 거래를 시작해 보세요.
            </p>

            <form action="/" className="mt-9 flex max-w-lg items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-goguma-900/5 ring-1 ring-line">
              <span className="pl-3 text-xl" aria-hidden>🔍</span>
              <input
                name="q"
                aria-label="물건 검색"
                placeholder="어떤 물건을 찾고 있나요?"
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-muted/70"
              />
              <button className="rounded-xl bg-flesh-500 px-5 py-3 font-semibold text-white transition hover:bg-flesh-600">
                검색
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>인기 검색어</span>
              {["아이폰", "캠핑의자", "자전거", "나눔"].map((k) => (
                <span key={k} className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-line">#{k}</span>
              ))}
            </div>

            <Suspense fallback={<div className="mt-10 h-14" />}>
              <HeroButtons />
            </Suspense>
          </div>

          {/* 떠다니는 매물 카드 */}
          <div className="relative mx-auto h-[420px] w-full max-w-md sm:h-[480px]">
            <div className="absolute inset-6 rounded-[3rem] bg-gradient-to-br from-goguma-600 to-goguma-900 shadow-2xl shadow-goguma-900/30" />
            <div className="absolute inset-6 overflow-hidden rounded-[3rem]">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-flesh-400/40 blur-2xl" />
              <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-goguma-500/50 blur-2xl" />
            </div>
            <GogumaIcon className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl sm:h-48 sm:w-48" />

            <div className="absolute left-0 top-4 -rotate-6">
              <FloatCard item={SAMPLE_ITEMS[0]} className="animate-float" />
            </div>
            <div className="absolute right-0 top-28 rotate-[5deg]">
              <FloatCard item={SAMPLE_ITEMS[3]} className="animate-float-slow [animation-delay:-2s]" />
            </div>
            <div className="absolute bottom-6 left-6 rotate-3">
              <FloatCard item={SAMPLE_ITEMS[7]} className="animate-float-slow [animation-delay:-4s]" />
            </div>

            <div className="absolute bottom-24 right-0 flex animate-float items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl [animation-delay:-1s]">
              <span className="text-xl">💬</span>
              <div className="text-xs">
                <p className="font-bold">아직 구매 가능한가요?</p>
                <p className="text-muted">방금 · 망원동 이웃</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── 카테고리 마키 ───────── */}
      <section id="category" className="scroll-mt-20 border-y border-line bg-white/60 py-5">
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
            {[...CATEGORIES, ...CATEGORIES].map(([icon, name], i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold shadow-sm ring-1 ring-line"
              >
                <span className="text-lg">{icon}</span>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 최신 판매글 (DB에서 가져옴) ───────── */}
      <section id="hot" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-semibold text-flesh-600">🔥 NEW</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">방금 올라온 따끈한 매물</h2>
          </div>
          <Link href="/products" className="font-semibold text-goguma-700 hover:underline">
            전체 보기 →
          </Link>
        </div>

        <div className="mt-10">
          <Suspense fallback={<ProductGridSkeleton />}>
            <LatestProducts />
          </Suspense>
        </div>
      </section>

      {/* ───────── 이용 방법 ───────── */}
      <section id="how" className="scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-goguma-900 px-6 py-16 text-white sm:px-12">
          <p className="text-center font-semibold text-flesh-300">HOW IT WORKS</p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">거래는 고구마 굽기보다 쉬워요</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map(([icon, title, desc], i) => (
              <div key={title} className="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 transition hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-flesh-400 to-flesh-600 text-2xl shadow-lg shadow-flesh-600/30">
                    {icon}
                  </span>
                  <span className="text-5xl font-black text-white/10">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <Suspense fallback={null}>
        <GuestCta />
      </Suspense>

      <footer className="border-t border-line py-10 text-center text-sm text-muted">
        <p>© 2026 고구마마켓 · 개발 공부용 프로젝트</p>
      </footer>
    </div>
  );
}

// R: 최신 판매글 8개
async function LatestProducts() {
  const products = await getLatestProducts(8);
  if (products.length === 0) return <EmptyProducts />;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
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
    <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
      <div className="animate-rise flex items-center gap-3 rounded-2xl bg-goguma-700 px-5 py-4 text-white shadow-xl shadow-goguma-700/20">
        <span className="text-2xl">🎉</span>
        <p className="text-sm sm:text-base">
          <b>{user.nickname}</b>님, 고구마마켓에 오신 걸 환영해요! 따끈한 거래 시작해 볼까요?
        </p>
      </div>
    </div>
  );
}

async function HeroButtons() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-semibold shadow-sm ring-1 ring-line">
          👋 <b className="text-goguma-700">{user.nickname}</b>님, 오늘은 어떤 걸 찾아볼까요?
        </span>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      <Link
        href="/signup"
        className="group inline-flex items-center gap-2 rounded-full bg-goguma-700 px-7 py-4 font-bold text-white shadow-xl shadow-goguma-700/30 transition hover:-translate-y-0.5 hover:bg-goguma-600"
      >
        3초 만에 시작하기
        <span className="transition group-hover:translate-x-1">→</span>
      </Link>
      <Link href="/login" className="rounded-full px-6 py-4 font-semibold text-goguma-700 transition hover:bg-goguma-50">
        이미 회원이에요
      </Link>
    </div>
  );
}

async function GuestCta() {
  const user = await getCurrentUser();
  if (user) return null;

  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-flesh-400 via-flesh-500 to-[#e2558a] px-6 py-16 text-center text-white sm:px-12">
        <div aria-hidden className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div aria-hidden className="absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-goguma-600/40 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">우리 동네 이웃이 기다리고 있어요</h2>
        <p className="relative mt-3 text-white/85">가입하고 첫 거래를 시작해 보세요. 수수료는 0원!</p>
        <Link
          href="/signup"
          className="relative mt-8 inline-flex rounded-full bg-white px-8 py-4 font-bold text-flesh-600 shadow-xl transition hover:-translate-y-0.5"
        >
          무료로 가입하기
        </Link>
      </div>
    </section>
  );
}

function FloatCard({ item, className }: { item: Item; className: string }) {
  return (
    <div className={`w-40 rounded-3xl bg-white p-3 shadow-2xl shadow-goguma-900/20 sm:w-48 ${className}`}>
      <div className={`grid aspect-[4/3] place-items-center rounded-2xl bg-gradient-to-br ${item.tone}`}>
        <span className="text-5xl">{item.emoji}</span>
      </div>
      <p className="mt-2.5 line-clamp-1 text-sm font-semibold">{item.title}</p>
      <div className="mt-0.5 flex items-center justify-between">
        <p className="text-sm font-extrabold text-goguma-700">{won(item.price)}</p>
        <p className="text-[11px] text-muted">{item.place}</p>
      </div>
    </div>
  );
}
