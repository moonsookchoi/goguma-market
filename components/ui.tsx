// 여러 화면에서 같이 쓰는 기업형 UI 조각들
import Link from "next/link";

// 버튼 모양 (Link 와 button 둘 다에 쓰려고 클래스 문자열로 둬요)
export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70",
  accent:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-accent-600",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-[15px] font-semibold text-ink transition hover:border-ink/30 hover:bg-surface",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-body transition hover:bg-surface hover:text-ink",
  white:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-[15px] font-semibold text-brand-900 transition hover:bg-brand-50",
};

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/70 hover:border-ink/25 focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

// 섹션 제목 위의 작은 영문 라벨
export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`flex items-center gap-2 text-xs font-bold tracking-[0.18em] ${dark ? "text-accent-400" : "text-brand-600"}`}>
      <span className={`h-px w-6 ${dark ? "bg-accent-400" : "bg-brand-600"}`} />
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-[2.5rem] sm:leading-[1.2]">{title}</h2>
        {desc && <p className="mt-4 text-[17px] leading-relaxed text-muted">{desc}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-700">
          {action.label}
          <span className="transition group-hover:translate-x-1">→</span>
        </Link>
      )}
    </div>
  );
}

// 하위 페이지 맨 위의 제목 띠 (경로 표시 + 제목 + 오른쪽 버튼)
export function PageHeader({
  crumbs,
  title,
  desc,
  action,
  width = "max-w-7xl",
}: {
  crumbs: { href?: string; label: string }[];
  title: string;
  desc?: string;
  action?: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="bg-grid border-b border-line bg-surface">
      <div className={`mx-auto ${width} px-4 py-6 sm:px-6 sm:py-8`}>
        <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            홈
          </Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              {c.href ? (
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-ink">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
            {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}

export function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

export function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}
