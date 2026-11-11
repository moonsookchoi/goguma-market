import Link from "next/link";
import { Bell, LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { btn } from "@/components/ui";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

const NAV = [
  { href: "/products", label: "중고거래" },
  { href: "/chats", label: "채팅" },
  { href: "/#categories", label: "카테고리" },
  { href: "/#trust", label: "안전거래" },
  { href: "/#how", label: "이용방법" },
];

// 맨 위 공지 띠
function AnnouncementBar() {
  return (
    <div className="bg-brand-950 text-[13px] text-white/80">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 sm:px-6">
        <span className="rounded bg-accent-500 px-1.5 py-0.5 text-[11px] font-bold text-white">NEW</span>
        <span className="truncate">판매글 서비스가 오픈했어요. 지금 우리 동네 매물을 둘러보세요.</span>
        <Link href="/products" className="hidden shrink-0 font-semibold text-white underline-offset-4 hover:underline sm:inline">
          바로가기 →
        </Link>
      </div>
    </div>
  );
}

function Shell({ right }: { right: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <div className="border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-10">
            <Link href="/" aria-label="고구마마켓 홈">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-body transition hover:bg-surface hover:text-ink"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          {right}
        </div>
      </div>
    </header>
  );
}

// 로그인 정보를 불러오는 동안 보여 줄 자리표시
export function HeaderSkeleton() {
  return <Shell right={<span className="h-10 w-44 animate-pulse rounded-lg bg-surface" />} />;
}

export default async function Header() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Shell
        right={
          <div className="flex items-center gap-2">
            <Link href="/login" className={btn.ghost}>
              로그인
            </Link>
            <Link href="/signup" className={`${btn.primary} !px-4 !py-2.5 !text-sm`}>
              회원가입
            </Link>
          </div>
        }
      />
    );
  }

  // 안 읽은 알림 수
  const supabase = await createClient();
  const { count } = await supabase.from("goguma_notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  const unread = count ?? 0;

  return (
    <Shell
      right={
        <div className="flex items-center gap-2">
          <div className="mr-1 hidden items-center gap-2.5 md:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
              {user.nickname.slice(0, 1)}
            </span>
            <span className="text-sm leading-tight">
              <b className="block font-semibold text-ink">{user.nickname}</b>
              {user.region && <span className="text-xs text-muted">{user.region}</span>}
            </span>
          </div>
          {/* 알림함 (안 읽은 알림 수) */}
          <Link href="/notifications" aria-label={`알림 ${unread}개`} className="relative grid h-10 w-10 place-items-center rounded-lg text-body transition hover:bg-surface hover:text-ink">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link href="/products/new" className={`${btn.accent} !px-3.5 !py-2.5 !text-sm`}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">판매글 쓰기</span>
            <span className="sm:hidden">글쓰기</span>
          </Link>
          <form action={logout}>
            <button className={btn.ghost} aria-label="로그아웃">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </form>
        </div>
      }
    />
  );
}
