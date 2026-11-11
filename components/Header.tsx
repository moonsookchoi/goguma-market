import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

// 로그인 정보를 불러오는 동안 보여 줄 자리표시
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <span className="h-9 w-36 animate-pulse rounded-full bg-goguma-50" />
      </div>
    </header>
  );
}

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="고구마마켓 홈">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-[15px] font-medium text-muted md:flex">
          <Link href="/products" className="transition hover:text-ink">중고거래</Link>
          <Link href="/#category" className="transition hover:text-ink">카테고리</Link>
          <Link href="/#how" className="transition hover:text-ink">이용방법</Link>
        </nav>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/products/new"
              className="rounded-full bg-flesh-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-flesh-500/25 transition hover:-translate-y-0.5 hover:bg-flesh-600"
            >
              + 글쓰기
            </Link>
            <div className="hidden items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm ring-1 ring-line sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-goguma-500 to-flesh-500 text-xs font-bold text-white">
                {user.nickname.slice(0, 1)}
              </span>
              <span className="text-sm font-semibold">{user.nickname}</span>
              {user.region && <span className="text-xs text-muted">· {user.region}</span>}
            </div>
            <form action={logout}>
              <button className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-goguma-50 hover:text-goguma-700">
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-goguma-50"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-goguma-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-goguma-700/25 transition hover:-translate-y-0.5 hover:bg-goguma-600"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
