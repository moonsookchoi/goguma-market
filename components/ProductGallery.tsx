"use client";

// 판매글 상세의 사진 보기: 큰 사진 + 아래 작은 사진 목록 (누르면 바뀜, 좌우 화살표·키보드로도 넘김)
import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imageUrl } from "@/lib/products";

export default function ProductGallery({ images, title, dim = false }: { images: string[]; title: string; dim?: boolean }) {
  const [index, setIndex] = useState(0);
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + images.length) % images.length);

  return (
    <div className={dim ? "opacity-60 grayscale" : ""}>
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface"
        tabIndex={images.length > 1 ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        aria-label={`${title} 사진 ${index + 1} / ${images.length}`}
      >
        <Image
          key={images[index]}
          src={imageUrl(images[index])}
          alt={`${title} 사진 ${index + 1}`}
          fill
          priority
          sizes="(min-width: 1024px) 600px, 100vw"
          className="animate-rise object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="이전 사진"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="다음 사진"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-md bg-ink/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((path, i) => (
            <button
              key={path}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`사진 ${i + 1} 보기`}
              aria-current={i === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${
                i === index ? "border-brand-700" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={imageUrl(path)} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
