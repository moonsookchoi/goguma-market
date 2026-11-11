"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/app/products/actions";

// 삭제는 되돌릴 수 없으니 한 번 더 물어봐요
export default function DeleteProductButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("이 판매글을 삭제할까요?\n삭제하면 되돌릴 수 없어요.")) {
          startTransition(() => deleteProduct(id));
        }
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "삭제 중..." : "삭제"}
    </button>
  );
}
