import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, type Product } from "@/lib/products";

// R: 주소의 id 로 판매글 한 개 가져오기 (없으면 404 페이지)
export async function getProduct(idText: string) {
  const id = Number(idText);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("goguma_products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  return data as unknown as Product;
}

// R: 최신 판매글 몇 개 (홈 화면용)
export async function getLatestProducts(limit: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goguma_products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Product[];
}
