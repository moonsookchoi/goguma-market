"use client";

import { useActionState, useRef } from "react";
import { addKeyword } from "@/app/notifications/actions";
import { btn, inputClass } from "@/components/ui";

// 키워드 등록 입력칸 (등록하면 칸을 비워요)
export default function KeywordForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(async (prev, fd) => {
    const res = await addKeyword(prev, fd);
    if (!res.error) ref.current?.reset();
    return res;
  }, {});
  return (
    <form ref={ref} action={action} className="mt-3">
      <div className="flex gap-2">
        <input name="keyword" maxLength={20} placeholder="예) 아이폰, 자전거, 캠핑" className={inputClass} />
        <button disabled={pending} className={`${btn.primary} shrink-0`}>등록</button>
      </div>
      {state.error && <p className="mt-1.5 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
