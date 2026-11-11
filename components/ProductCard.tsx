import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCategory, STATUSES, timeAgo, won, type Product } from "@/lib/products";
import { btn } from "@/components/ui";

// 사진이 없는 동안: 옅은 회색 타일 + 카테고리 선 아이콘을 대표 이미지로 보여 줘요
export function ProductThumb({
  category,
  size = "md",
  className = "",
}: {
  category: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const c = getCategory(category);
  const Icon = c.icon;
  return (
    <div className={`bg-grid relative grid place-items-center bg-surface ${className}`}>
      <span
        className={`grid place-items-center rounded-2xl bg-white text-brand-700 shadow-sm ring-1 ring-line ${
          size === "lg" ? "h-28 w-28" : "h-16 w-16"
        }`}
      >
        <Icon className={size === "lg" ? "h-12 w-12" : "h-7 w-7"} strokeWidth={1.5} />
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: Product["status"] }) {
  const s = STATUSES[status];
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.badge}`}>{s.label}</span>;
}

export default function ProductCard({ product }: { product: Product }) {
  const sold = product.status === "sold";
  const category = getCategory(product.category);
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition hover:border-brand-200 hover:shadow-[0_12px_32px_-12px_rgb(42_22_67/0.25)]"
    >
      <div className="relative">
        <ProductThumb category={product.category} className={`aspect-[4/3] ${sold ? "opacity-60 grayscale" : ""}`} />
        {product.status !== "selling" && (
          <span className="absolute left-3 top-3">
            <StatusBadge status={product.status} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-line p-4">
        <p className="text-xs font-medium text-brand-600">{category.name}</p>
        <h3 className="mt-1 line-clamp-1 font-semibold text-ink group-hover:text-brand-700">{product.title}</h3>
        <p className={`mt-2 text-lg font-bold ${sold ? "text-muted line-through" : "text-ink"}`}>
          {product.price === 0 ? <span className="text-accent-600">나눔</span> : won(product.price)}
        </p>
        <p className="mt-auto flex items-center gap-1 pt-3 text-xs text-muted">
          {product.region && (
            <>
              <MapPin className="h-3.5 w-3.5" />
              {product.region} ·{" "}
            </>
          )}
          {timeAgo(product.created_at)}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line">
          <div className="aspect-[4/3] animate-pulse bg-surface" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/4 animate-pulse rounded bg-surface" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </ProductGrid>
  );
}

export function EmptyProducts({ message = "아직 등록된 판매글이 없습니다." }: { message?: string }) {
  return (
    <div className="bg-grid rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-ink">{message}</p>
      <p className="mt-2 text-sm text-muted">첫 번째 판매글을 등록하고 이웃과 거래를 시작해 보세요.</p>
      <Link href="/products/new" className={`${btn.primary} mt-6`}>
        판매글 등록하기
      </Link>
    </div>
  );
}
