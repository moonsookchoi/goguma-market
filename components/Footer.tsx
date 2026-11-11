import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS = [
  {
    title: "서비스",
    links: [
      { href: "/products", label: "중고거래" },
      { href: "/products/new", label: "판매글 쓰기" },
      { href: "/#categories", label: "카테고리" },
    ],
  },
  {
    title: "고객 지원",
    links: [
      { href: "/#how", label: "이용방법" },
      { href: "/#trust", label: "안전거래 가이드" },
      { href: "/signup", label: "회원가입" },
    ],
  },
  {
    title: "프로젝트",
    links: [{ href: "https://github.com/moonsookchoi/goguma-market", label: "GitHub 저장소" }],
  },
];

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo inverted />
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              고구마마켓은 가까운 이웃과 믿고 거래하는 동네 중고거래 플랫폼입니다. 수수료 없이, 안전하게, 따뜻하게.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-white">{col.title}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="transition hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>© 2026 GOGUMA MARKET. All rights reserved.</p>
          <p>개발 공부용 프로젝트 · Next.js + Supabase</p>
        </div>
      </div>
    </footer>
  );
}
