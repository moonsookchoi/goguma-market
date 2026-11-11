"use client";

// 판매글 상세의 작은 버튼들: 조회수 기록 · 찜 · 끌어올리기
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { bumpProduct, toggleWish } from "@/app/products/actions";

// 페이지를 열면 조회수 +1 (같은 탭에서 새로고침해도 한 번만)
export function ViewTracker({ id }: { id: number }) {
  useEffect(() => {
    const key = `viewed-${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    createClient().rpc("goguma_increment_view", { p_id: id });
  }, [id]);
  return null;
}

export function WishButton({ id, initialWished, count, loggedIn }: { id: number; initialWished: boolean; count: number; loggedIn: boolean }) {
  const [wished, setWished] = useState(initialWished);
  const [n, setN] = useState(count);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!loggedIn) return router.push("/login");
        // 먼저 화면을 바꾸고(낙관적 업데이트), 서버에 저장
        setWished(!wished);
        setN(n + (wished ? -1 : 1));
        start(async () => {
          const res = await toggleWish(id);
          if ("error" in res) router.push("/login");
        });
      }}
      aria-pressed={wished}
      className={`inline-flex h-12 shrink-0 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition ${
        wished ? "border-accent-500 bg-accent-50 text-accent-600" : "border-line bg-white text-body hover:border-ink/30"
      }`}
    >
      <Heart className={`h-5 w-5 ${wished ? "fill-accent-500 text-accent-500" : ""}`} />
      {n}
    </button>
  );
}

export function BumpButton({ id }: { id: number }) {
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await bumpProduct(id);
            setMsg(res.error ?? "끌어올렸어요! 목록 맨 위에 보여요.");
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-60"
      >
        <ArrowUpCircle className="h-4 w-4" /> 끌어올리기
      </button>
      {msg && <p className="mt-1 text-xs text-muted">{msg}</p>}
    </div>
  );
}
