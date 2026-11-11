"use server";

// 판매글 CRUD 서버 액션
// C(Create) 등록 · U(Update) 수정 · D(Delete) 삭제 — R(Read) 조회는 각 페이지에서 바로 해요.
// 진짜 보안은 DB의 RLS 정책이 지켜 줘요. (남의 글은 DB가 수정·삭제를 거부함)

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, STATUSES, type ProductStatus } from "@/lib/products";

export type ProductFormState = {
  error?: string;
  fields?: Record<string, string>;
};

// 폼 값 꺼내서 검사하기 (등록·수정 공용)
function readForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const region = String(formData.get("region") ?? "").trim();
  const isFree = formData.get("isFree") === "on";
  const priceText = String(formData.get("price") ?? "").replace(/[^0-9]/g, "");
  const price = isFree ? 0 : Number(priceText);

  const fields = { title, description, category, region, price: isFree ? "" : priceText, isFree: isFree ? "on" : "" };

  let error: string | undefined;
  if (title.length < 2 || title.length > 40) error = "제목은 2~40자로 적어 주세요.";
  else if (!CATEGORIES.some((c) => c.key === category)) error = "카테고리를 골라 주세요.";
  else if (!isFree && (!priceText || price <= 0)) error = "가격을 적어 주세요. 무료라면 '나눔'을 체크해 주세요.";
  else if (price > 1_000_000_000) error = "가격은 10억 원 이하로 적어 주세요.";
  else if (description.length > 2000) error = "설명은 2000자 이하로 적어 주세요.";
  else if (region.length > 20) error = "거래 동네는 20자 이하로 적어 주세요.";

  return { error, fields, values: { title, description, category, region, price } };
}

// 로그인한 사용자 id (없으면 로그인 페이지로)
async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

// C: 판매글 등록
export async function createProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const { error, fields, values } = readForm(formData);
  if (error) return { error, fields };

  const { supabase, userId } = await requireUserId();
  const { data, error: dbError } = await supabase
    .from("goguma_products")
    .insert({ ...values, seller_id: userId })
    .select("id")
    .single();

  if (dbError || !data) {
    console.error("createProduct", dbError);
    // 23503 = 외래키 오류: 고구마마켓 프로필이 없는 계정 (예: 다른 앱으로 가입한 계정)
    if (dbError?.code === "23503") return { error: "고구마마켓 프로필이 없는 계정이에요. 고구마마켓에서 새로 가입해 주세요.", fields };
    return { error: "글을 올리지 못했어요. 잠시 후 다시 시도해 주세요.", fields };
  }

  revalidatePath("/");
  redirect(`/products/${data.id}`);
}

// U: 판매글 수정 (id 는 bind 로 미리 넣어 둠)
export async function updateProduct(
  id: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { error, fields, values } = readForm(formData);
  if (error) return { error, fields };

  const { supabase, userId } = await requireUserId();
  const { data, error: dbError } = await supabase
    .from("goguma_products")
    .update(values)
    .eq("id", id)
    .eq("seller_id", userId) // 내 글만
    .select("id");

  if (dbError || !data?.length) {
    console.error("updateProduct", dbError);
    return { error: "글을 고치지 못했어요. 내 글이 맞는지 확인해 주세요.", fields };
  }

  revalidatePath("/");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

// U: 판매 상태만 바꾸기 (판매중 / 예약중 / 거래완료)
export async function changeStatus(id: number, formData: FormData) {
  const status = String(formData.get("status") ?? "") as ProductStatus;
  if (!(status in STATUSES)) return;

  const { supabase, userId } = await requireUserId();
  await supabase.from("goguma_products").update({ status }).eq("id", id).eq("seller_id", userId);

  revalidatePath("/");
  revalidatePath(`/products/${id}`);
}

// D: 판매글 삭제
export async function deleteProduct(id: number) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("goguma_products").delete().eq("id", id).eq("seller_id", userId);
  if (error) console.error("deleteProduct", error);

  revalidatePath("/");
  redirect("/products?deleted=1");
}
