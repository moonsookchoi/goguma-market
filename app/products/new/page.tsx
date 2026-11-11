import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import ProductForm from "@/components/ProductForm";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "판매글 쓰기 · 고구마마켓" };

// C: 판매글 쓰기 화면
export default function NewProductPage() {
  return (
    <>
      <PageHeader
        width="max-w-4xl"
        crumbs={[{ href: "/products", label: "중고거래" }, { label: "판매글 쓰기" }]}
        title="판매글 쓰기"
        desc="이웃에게 판매할 물건을 소개해 주세요."
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface" />}>
          <NewProductForm />
        </Suspense>
      </div>
    </>
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
      submitLabel="판매글 등록하기"
      cancelHref="/products"
    />
  );
}
