import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, type Product } from "@/lib/products";
import { NEAR_KM, distanceKm, findRegion } from "@/lib/regions";

// R: 주소의 id 로 판매글 한 개 가져오기 (없으면 404 페이지)
export async function getProduct(idText: string) {
  const id = Number(idText);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("goguma_products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  return data as unknown as Product;
}

// R: 내 동네 근처 판매글 (가까운 순)
// 최근 판매글을 가져와서, 동네 좌표로 거리를 계산해 NEAR_KM 안에 있는 것만 골라요.
// (공부용 규모라 앱에서 계산해요. 글이 아주 많아지면 DB에서 거리 계산하는 방식으로 바꾸면 돼요.)
export async function getNearbyProducts(myRegionText: string, opts: { category?: string | null; limit?: number } = {}) {
  const center = findRegion(myRegionText);
  if (!center) return null; // 내 동네가 좌표 목록에 없으면 거리 계산 불가

  const supabase = await createClient();
  let query = supabase.from("goguma_products").select(PRODUCT_SELECT).order("created_at", { ascending: false }).limit(300);
  if (opts.category) query = query.eq("category", opts.category);
  const { data } = await query;

  const items = ((data ?? []) as unknown as Product[])
    .map((product) => {
      const r = findRegion(product.region);
      return r ? { product, km: distanceKm(center, r) } : null;
    })
    .filter((x): x is { product: Product; km: number } => x !== null && x.km <= NEAR_KM)
    // 가까운 순 → 같은 거리면 판매중인 글 먼저 → 최신순
    .sort(
      (a, b) =>
        a.km - b.km ||
        Number(a.product.status === "sold") - Number(b.product.status === "sold") ||
        b.product.created_at.localeCompare(a.product.created_at),
    );

  return { center, items: opts.limit ? items.slice(0, opts.limit) : items };
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
