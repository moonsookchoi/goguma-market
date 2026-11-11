// 고구마 모양 로고 (SVG)
export function GogumaIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9b5fd0" />
          <stop offset="1" stopColor="#5a2886" />
        </linearGradient>
      </defs>
      <path d="M30 9c2-4 6-5 9-4-1 3-3 6-7 7" fill="#4caf6a" />
      <path d="M27 11c-1-3 0-6 2-8 2 2 3 5 1 8" fill="#6cc785" />
      <path
        d="M10 30c-3-8 3-17 13-19 9-2 17 3 17 11 0 9-8 19-19 20-6 1-9-5-11-12z"
        fill="url(#skin)"
      />
      <path d="M18 31c-1-5 2-10 7-11 4-1 7 1 7 5 0 5-4 9-9 10-3 0-4-2-5-4z" fill="#ffb066" opacity=".95" />
      <circle cx="17" cy="20" r="1.4" fill="#fff" opacity=".5" />
      <circle cx="31" cy="34" r="1.1" fill="#fff" opacity=".35" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <GogumaIcon />
      <span className="text-xl font-extrabold tracking-tight text-goguma-700">
        고구마<span className="text-flesh-500">마켓</span>
      </span>
    </span>
  );
}
