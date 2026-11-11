// 판매글에서 같이 쓰는 값과 도우미 함수 (서버·클라이언트 공용)

// 카테고리: DB에는 영어 key, 화면에는 이름과 이모지. 사진 기능이 생기기 전까지는 이모지가 대표 이미지 역할
export const CATEGORIES = [
  { key: "digital", name: "디지털기기", emoji: "📱", tone: "from-[#e6eefc] to-[#f4f7fe]" },
  { key: "furniture", name: "가구/인테리어", emoji: "🛋️", tone: "from-flesh-100 to-[#fffaf3]" },
  { key: "clothes", name: "의류", emoji: "👕", tone: "from-[#fde6ea] to-[#fff4f6]" },
  { key: "kids", name: "유아동", emoji: "🧸", tone: "from-[#fff3c9] to-[#fffbea]" },
  { key: "living", name: "생활/주방", emoji: "🍳", tone: "from-flesh-100 to-[#fff7ec]" },
  { key: "sports", name: "스포츠/레저", emoji: "⚽", tone: "from-[#e5f6ea] to-[#f4fbf6]" },
  { key: "books", name: "도서", emoji: "📚", tone: "from-goguma-100 to-goguma-50" },
  { key: "hobby", name: "취미/게임", emoji: "🎮", tone: "from-[#fde6ea] to-[#fff4f6]" },
  { key: "beauty", name: "뷰티/미용", emoji: "💄", tone: "from-[#fde6f3] to-[#fff4fa]" },
  { key: "pets", name: "반려동물", emoji: "🐶", tone: "from-[#fff3c9] to-[#fffbea]" },
  { key: "tickets", name: "티켓/교환권", emoji: "🎟️", tone: "from-goguma-100 to-goguma-50" },
  { key: "plants", name: "식물", emoji: "🌱", tone: "from-[#e5f6ea] to-[#f4fbf6]" },
  { key: "etc", name: "기타", emoji: "📦", tone: "from-[#efe9e4] to-[#f8f5f2]" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function getCategory(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

// 판매 상태
export const STATUSES = {
  selling: { label: "판매중", badge: "bg-flesh-100 text-flesh-600" },
  reserved: { label: "예약중", badge: "bg-[#e5f6ea] text-[#2f8a4c]" },
  sold: { label: "거래완료", badge: "bg-[#efe9e4] text-muted" },
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
  seller: { nickname: string; region: string } | null;
};

// 목록·상세에서 쓰는 select 문 (판매자 닉네임까지 한 번에 가져오기)
export const PRODUCT_SELECT =
  "id, seller_id, title, description, price, category, region, status, created_at, updated_at, seller:goguma_profiles(nickname, region)";

export const won = (n: number) => (n === 0 ? "나눔 🧡" : `${n.toLocaleString("ko-KR")}원`);

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
