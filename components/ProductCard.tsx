import Link from "next/link";
import { getCategory, STATUSES, timeAgo, won, type Product } from "@/lib/products";

// 사진이 없는 동안 카테고리 이모지를 대표 이미지로 보여 줘요
export function ProductThumb({ category, className = "" }: { category: string; className?: string }) {
  const c = getCategory(category);
  return (
    <div className={`grid place-items-center bg-gradient-to-br ${c.tone} ${className}`}>
      <span aria-hidden>{c.emoji}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: Product["status"] }) {
  const s = STATUSES[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.badge}`}>{s.label}</span>;
}

export default function ProductCard({ product }: { product: Product }) {
  const sold = product.status === "sold";
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-line transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-goguma-900/10">
        <ProductThumb
          category={product.category}
          className={`aspect-square text-6xl transition duration-500 group-hover:[&>span]:rotate-6 group-hover:[&>span]:scale-125 sm:text-7xl [&>span]:transition [&>span]:duration-500 ${sold ? "opacity-50 grayscale" : ""}`}
        />
        {product.status !== "selling" && (
          <span className="absolute left-3 top-3">
            <StatusBadge status={product.status} />
          </span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 font-semibold">{product.title}</h3>
      <p className="mt-0.5 line-clamp-1 text-sm text-muted">
        {[product.region, timeAgo(product.created_at)].filter(Boolean).join(" · ")}
      </p>
      <p className={`mt-1 text-lg font-extrabold ${sold ? "text-muted" : ""}`}>{won(product.price)}</p>
    </Link>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-square animate-pulse rounded-3xl bg-goguma-50" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-goguma-50" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-goguma-50" />
        </div>
      ))}
    </div>
  );
}

export function EmptyProducts({ message = "아직 올라온 판매글이 없어요." }: { message?: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-line bg-white/50 px-6 py-16 text-center">
      <p className="text-5xl">🍠</p>
      <p className="mt-4 font-semibold">{message}</p>
      <p className="mt-1 text-sm text-muted">첫 번째 판매글의 주인공이 되어 보세요!</p>
      <Link
        href="/products/new"
        className="mt-6 inline-flex rounded-full bg-flesh-500 px-6 py-3 font-semibold text-white transition hover:bg-flesh-600"
      >
        + 판매글 쓰기
      </Link>
    </div>
  );
}
