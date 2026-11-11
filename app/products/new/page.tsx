import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import ProductForm from "@/components/ProductForm";

export const metadata: Metadata = { title: "판매글 쓰기 · 고구마마켓" };

// C: 판매글 쓰기 화면
export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">판매글 쓰기 ✍️</h1>
      <p className="mt-2 text-muted">이웃에게 물건을 소개해 주세요.</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-goguma-50" />}>
          <NewProductForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewProductForm() {
  const user = await getCurrentUser();
  if (!user) redirect("/login"); // 로그인해야 글을 쓸 수 있어요

  return (
    <ProductForm
      action={createProduct}
      // 거래 동네는 내 프로필의 동네로 미리 채워 둬요
      initial={{ title: "", description: "", category: "", region: user.region, price: "", isFree: false }}
      submitLabel="판매글 올리기 🍠"
      cancelHref="/products"
    />
  );
}
