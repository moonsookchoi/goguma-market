import { CircleCheck } from "lucide-react";
import { btn, ErrorBox as UiErrorBox, inputClass, Spinner } from "@/components/ui";
import { Logo } from "@/components/Logo";

const BENEFITS = ["거래 수수료 0원", "1분 만에 판매글 등록", "작성자 본인만 수정 가능한 안전한 데이터"];

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
    <div className="grid min-h-[calc(100vh-6.5rem)] lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-950 p-14 text-white lg:flex lg:flex-col">
        <div aria-hidden className="bg-grid-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div aria-hidden className="absolute -bottom-40 -right-40 h-[480px] w-[480px] bg-[radial-gradient(closest-side,rgb(249_122_31/0.22),transparent)]" />
        <div className="relative">
          <Logo inverted />
        </div>
        <div className="relative mt-auto">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            이웃과 믿고 거래하는
            <br />
            동네 중고거래 플랫폼
          </h2>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white/80">
                <CircleCheck className="h-5 w-5 text-accent-400" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-14 border-t border-white/10 pt-6 text-sm text-white/40">© 2026 GOGUMA MARKET</p>
        </div>
      </aside>

      <section className="flex items-center justify-center px-4 py-14 sm:px-6">
        <div className="animate-rise w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">{footer}</p>
        </div>
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
      <span className="mb-2 flex items-baseline justify-between text-sm font-semibold text-ink">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </span>
      <input {...props} className={inputClass} />
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button disabled={pending} className={`${btn.primary} w-full !py-3.5`}>
      {pending && <Spinner />}
      {children}
    </button>
  );
}

export const ErrorBox = UiErrorBox;
