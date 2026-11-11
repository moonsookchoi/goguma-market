import Link from "next/link";
import { GogumaIcon } from "@/components/Logo";

// 로그인 · 회원가입 공통 레이아웃 (왼쪽 브랜드 패널 + 오른쪽 폼)
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <aside className="relative hidden h-[560px] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-goguma-600 via-goguma-700 to-goguma-900 p-10 text-white lg:block">
        <div aria-hidden className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-flesh-400/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-goguma-500/50 blur-3xl" />
        <p className="relative text-sm font-semibold text-flesh-300">GOGUMA MARKET</p>
        <h2 className="relative mt-3 text-4xl font-extrabold leading-tight">
          오늘도 동네에서
          <br />
          따끈한 거래 한 판 🍠
        </h2>
        <p className="relative mt-4 max-w-xs text-white/70">
          가까운 이웃과 믿고 거래하는 우리 동네 중고마켓
        </p>
        <GogumaIcon className="absolute bottom-10 right-8 h-56 w-56 animate-float drop-shadow-2xl" />
        <div className="absolute bottom-12 left-10 flex gap-6">
          {[
            ["0원", "거래 수수료"],
            ["1분", "물건 올리기"],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="text-3xl font-black">{num}</p>
              <p className="text-sm text-white/60">{label}</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="animate-rise mx-auto w-full max-w-md">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-8 text-center text-sm text-muted">{footer}</p>
        <p className="mt-3 text-center text-sm">
          <Link href="/" className="text-muted underline-offset-4 hover:text-ink hover:underline">
            ← 홈으로
          </Link>
        </p>
      </section>
    </div>
  );
}

export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none transition placeholder:text-muted/60 focus:border-goguma-500 focus:ring-4 focus:ring-goguma-100"
      />
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-goguma-700 py-4 font-bold text-white shadow-xl shadow-goguma-700/25 transition hover:-translate-y-0.5 hover:bg-goguma-600 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
    >
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}

export function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">
      <span aria-hidden>⚠️</span>
      {message}
    </p>
  );
}
