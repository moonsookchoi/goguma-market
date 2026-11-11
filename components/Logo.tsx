// 고구마마켓 로고 — 단순한 기하학 심볼 + 워드마크 (기업형)
export function GogumaIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#3f2263" />
      {/* 고구마 단면: 보라 껍질 안의 주황 속살 */}
      <ellipse cx="16" cy="17.5" rx="9" ry="7" transform="rotate(-28 16 17.5)" fill="#7a4fb0" />
      <ellipse cx="16" cy="17.5" rx="5.6" ry="4.2" transform="rotate(-28 16 17.5)" fill="#ff9a4d" />
      <path d="M21 8.5c1.6-1.8 3.6-2.2 5-1.8-.5 1.7-2 3.1-4.2 3.4" fill="#5fd08a" />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <GogumaIcon />
      <span className="flex flex-col leading-none">
        <span className={`text-[17px] font-extrabold tracking-tight ${inverted ? "text-white" : "text-ink"}`}>
          고구마마켓
        </span>
        <span className={`mt-1 text-[9px] font-bold tracking-[0.2em] ${inverted ? "text-white/50" : "text-muted"}`}>
          GOGUMA MARKET
        </span>
      </span>
    </span>
  );
}
