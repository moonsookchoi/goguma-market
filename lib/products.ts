// 판매글에서 같이 쓰는 값과 도우미 함수 (서버·클라이언트 공용)

import {
  Baby, BookOpen, CookingPot, Dumbbell, Gamepad2, Package, PawPrint, Shirt,
  Smartphone, Sofa, Sparkles, Sprout, Ticket, type LucideIcon,
} from "lucide-react";

// 카테고리: DB에는 영어 key, 화면에는 이름과 선 아이콘. 사진 기능이 생기기 전까지는 아이콘이 대표 이미지 역할
export const CATEGORIES: readonly { key: string; name: string; icon: LucideIcon }[] = [
  { key: "digital", name: "디지털기기", icon: Smartphone },
  { key: "furniture", name: "가구/인테리어", icon: Sofa },
  { key: "clothes", name: "의류", icon: Shirt },
  { key: "kids", name: "유아동", icon: Baby },
  { key: "living", name: "생활/주방", icon: CookingPot },
  { key: "sports", name: "스포츠/레저", icon: Dumbbell },
  { key: "books", name: "도서", icon: BookOpen },
  { key: "hobby", name: "취미/게임", icon: Gamepad2 },
  { key: "beauty", name: "뷰티/미용", icon: Sparkles },
  { key: "pets", name: "반려동물", icon: PawPrint },
  { key: "tickets", name: "티켓/교환권", icon: Ticket },
  { key: "plants", name: "식물", icon: Sprout },
  { key: "etc", name: "기타", icon: Package },
];

export type CategoryKey = string;

export function getCategory(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

// 판매 상태
export const STATUSES = {
  selling: { label: "판매중", badge: "bg-accent-50 text-accent-600 ring-accent-100" },
  reserved: { label: "예약중", badge: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  sold: { label: "거래완료", badge: "bg-surface text-muted ring-line" },
} as const;

export type ProductStatus = keyof typeof STATUSES;

// DB 한 줄(+ 판매자 프로필)의 모양
export type Product = {
  id: number;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: CategoryKey;
  region: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  images: string[]; // Storage 안의 사진 경로들 (첫 번째 = 대표 사진)
  seller: { nickname: string; region: string } | null;
};

// 목록·상세에서 쓰는 select 문 (판매자 닉네임까지 한 번에 가져오기)
export const PRODUCT_SELECT =
  "id, seller_id, title, description, price, category, region, status, created_at, updated_at, images, seller:goguma_profiles(nickname, region)";

// ── 사진 ──
export const IMAGE_BUCKET = "goguma_product_images";
export const MAX_IMAGES = 10;

// Storage 경로 → 누구나 볼 수 있는 공개 주소
export function imageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

export const won = (n: number) => (n === 0 ? "나눔" : `${n.toLocaleString("ko-KR")}원`);

// "3분 전" 같은 상대 시간
export function timeAgo(iso: string) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}
