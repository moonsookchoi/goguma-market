import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, cleanQuery, type Product } from "@/lib/products";
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

// 내가 차단한 사람 id 목록 (그 사람 글은 목록에서 안 보이게)
export async function getBlockedIds(userId: string | null | undefined) {
  if (!userId) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase.from("goguma_blocks").select("blocked_id").eq("blocker_id", userId);
  return new Set((data ?? []).map((r) => r.blocked_id as string));
}

export type ListOptions = {
  q?: string; // 검색어 (제목·설명)
  category?: string | null;
  freeOnly?: boolean; // 나눔만
  near?: string | null; // 내 동네 이름 → 근처만, 가까운 순
  sellerId?: string; // 특정 판매자 글만
  userId?: string | null; // 지금 보는 사람 (차단 목록 적용)
  limit?: number;
};

export type ListRow = { product: Product; km?: number };

// R: 판매글 목록 — 검색·카테고리·나눔·내 근처를 한 함수에서 처리해요
// 반환값 center: 근처 모드일 때 내 동네 (위치를 모르면 null → 근처 계산 불가)
export async function listProducts(opts: ListOptions): Promise<{ rows: ListRow[]; center: ReturnType<typeof findRegion>; error: boolean }> {
  const center = opts.near !== undefined ? findRegion(opts.near) : null;
  if (opts.near !== undefined && !center) return { rows: [], center: null, error: false };

  const supabase = await createClient();
  let query = supabase
    .from("goguma_products")
    .select(PRODUCT_SELECT)
    .eq("hidden", false)
    .order("bumped_at", { ascending: false }) // 끌어올린 글이 위로
    .limit(center ? 300 : (opts.limit ?? 60));

  const q = cleanQuery(opts.q);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.freeOnly) query = query.eq("price", 0);
  if (opts.sellerId) query = query.eq("seller_id", opts.sellerId);

  const [{ data, error }, blocked] = await Promise.all([query, getBlockedIds(opts.userId)]);
  let rows: ListRow[] = ((data ?? []) as unknown as Product[])
    .filter((p) => !blocked.has(p.seller_id))
    .map((product) => ({ product }));

  if (center) {
    rows = rows
      .map(({ product }) => {
        const r = findRegion(product.region);
        return r ? { product, km: distanceKm(center, r) } : null;
      })
      .filter((x): x is { product: Product; km: number } => x !== null && x.km <= NEAR_KM)
      // 가까운 순 → 같은 거리면 판매중 먼저 → 최근 끌어올린 순
      .sort(
        (a, b) =>
          a.km - b.km ||
          Number(a.product.status === "sold") - Number(b.product.status === "sold") ||
          b.product.bumped_at.localeCompare(a.product.bumped_at),
      );
    if (opts.limit) rows = rows.slice(0, opts.limit);
  }

  return { rows, center, error: Boolean(error) };
}

// R: 내 동네 근처 판매글 (홈 화면용)
export async function getNearbyProducts(myRegionText: string, opts: { category?: string | null; limit?: number; userId?: string | null } = {}) {
  const { rows, center } = await listProducts({ near: myRegionText, category: opts.category, limit: opts.limit, userId: opts.userId });
  if (!center) return null;
  return { center, items: rows as { product: Product; km: number }[] };
}

// R: 최신 판매글 (홈 화면용)
export async function getLatestProducts(limit: number, userId?: string | null) {
  const { rows } = await listProducts({ limit, userId });
  return rows.map((r) => r.product);
}

// R: 이번 주 인기 매물 — 최근 2주 글 중 (조회수 + 찜 수 × 3) 점수가 높은 순
export async function getPopularProducts(limit: number, userId?: string | null) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data }, blocked] = await Promise.all([
    supabase
      .from("goguma_products")
      .select(PRODUCT_SELECT)
      .eq("hidden", false)
      .neq("status", "sold")
      .gte("created_at", since)
      .limit(200),
    getBlockedIds(userId),
  ]);
  return ((data ?? []) as unknown as Product[])
    .filter((p) => !blocked.has(p.seller_id))
    .sort((a, b) => b.view_count + b.wish_count * 3 - (a.view_count + a.wish_count * 3))
    .slice(0, limit);
}

// R: 시세용 — 같은 카테고리(+검색어) 판매글 가격들 (내 동네 근처가 있으면 근처만)
export async function getMarketPrices(opts: { category?: string | null; q?: string; near?: string | null }) {
  const supabase = await createClient();
  let query = supabase.from("goguma_products").select("price, region").eq("hidden", false).gt("price", 0).limit(500);
  const q = cleanQuery(opts.q);
  if (q) query = query.ilike("title", `%${q}%`);
  if (opts.category) query = query.eq("category", opts.category);
  const { data } = await query;
  let rows = data ?? [];
  const center = findRegion(opts.near);
  let scope = "전체 지역";
  if (center) {
    const near = rows.filter((r) => {
      const reg = findRegion(r.region);
      return reg && distanceKm(center, reg) <= NEAR_KM;
    });
    if (near.length >= 2) {
      rows = near;
      scope = `${center.name} 근처`;
    }
  }
  return { prices: rows.map((r) => r.price as number), scope };
}
