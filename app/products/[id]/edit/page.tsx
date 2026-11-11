import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProduct } from "@/app/products/data";
import { updateProduct } from "@/app/products/actions";
import ProductForm from "@/components/ProductForm";

export const metadata: Metadata = { title: "판매글 수정 · 고구마마켓" };

// U: 판매글 수정 화면
export default function EditProductPage({ params }: PageProps<"/products/[id]/edit">) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">판매글 수정 ✏️</h1>
      <p className="mt-2 text-muted">바뀐 내용을 고쳐 주세요.</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-goguma-50" />}>
          <EditForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditForm({ params }: { params: PageProps<"/products/[id]/edit">["params"] }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const product = await getProduct(id);
  if (product.seller_id !== user.id) notFound(); // 남의 글은 수정 화면도 못 봐요

  return (
    <ProductForm
      // bind: 어떤 글을 고칠지(id)를 서버 액션에 미리 넣어 두기
      action={updateProduct.bind(null, product.id)}
      initial={{
        title: product.title,
        description: product.description,
        category: product.category,
        region: product.region,
        price: product.price > 0 ? String(product.price) : "",
        isFree: product.price === 0,
      }}
      submitLabel="수정 완료"
      cancelHref={`/products/${product.id}`}
    />
  );
}
