"use client";

// 판매글 쓰기 · 수정 공용 폼
import { useActionState, useState } from "react";
import Link from "next/link";
import type { ProductFormState } from "@/app/products/actions";
import ImageUploader from "@/components/ImageUploader";
import { CATEGORIES } from "@/lib/products";
import { btn, ErrorBox, inputClass, Spinner } from "@/components/ui";

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initial: {
    title: string;
    description: string;
    category: string;
    region: string;
    price: string;
    isFree: boolean;
    images: string[];
  };
  userId: string; // 사진을 내 아이디 폴더에 올리기 위해 필요
  submitLabel: string;
  cancelHref: string;
};

// 폼의 한 구역 (왼쪽 제목 + 오른쪽 입력칸) — 기업 사이트 설정 화면 느낌
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-line py-8 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function ProductForm({ action, initial, userId, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const f = state.fields; // 오류가 나면 입력했던 값을 다시 채워 넣기
  const [isFree, setIsFree] = useState(f ? f.isFree === "on" : initial.isFree);
  const [titleLen, setTitleLen] = useState((f?.title ?? initial.title).length);

  return (
    <form action={formAction}>
      <Section title="상품 사진" desc="여러 장을 올릴 수 있어요. 밝고 선명한 사진일수록 거래가 빨라져요.">
        <ImageUploader userId={userId} initial={initial.images} />
      </Section>

      <Section title="기본 정보" desc="이웃이 한눈에 알아볼 수 있는 제목을 적어 주세요.">
        <label className="block">
          <span className="mb-2 flex items-baseline justify-between text-sm font-semibold text-ink">
            제목 <span className="text-xs font-normal text-muted">{titleLen}/40</span>
          </span>
          <input
            name="title"
            required
            minLength={2}
            maxLength={40}
            defaultValue={f?.title ?? initial.title}
            onChange={(e) => setTitleLen(e.target.value.length)}
            placeholder="예) 아이폰 15 Pro 256GB 판매합니다"
            className={inputClass}
          />
        </label>
      </Section>

      <Section title="카테고리" desc="물건에 가장 잘 맞는 카테고리 하나를 골라 주세요.">
        <fieldset>
          <legend className="sr-only">카테고리</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <label key={c.key} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={c.key}
                  required
                  defaultChecked={(f?.category ?? initial.category) === c.key}
                  className="peer sr-only"
                />
                <span className="flex items-center gap-2.5 rounded-lg border border-line bg-white px-3.5 py-3 text-sm font-medium text-body transition hover:border-ink/25 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-800 peer-checked:ring-1 peer-checked:ring-brand-700 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100">
                  <c.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {c.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="가격 및 거래 장소" desc="무료로 나눌 물건이라면 '나눔'을 선택하세요.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-2 flex items-center justify-between text-sm font-semibold text-ink">
              <label htmlFor="price">가격</label>
              <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-body">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-700"
                />
                나눔
              </label>
            </span>
            <div className="relative">
              <input
                id="price"
                name="price"
                inputMode="numeric"
                disabled={isFree}
                required={!isFree}
                defaultValue={f?.price ?? initial.price}
                placeholder={isFree ? "무료 나눔" : "0"}
                className={`${inputClass} pr-10 disabled:cursor-not-allowed disabled:bg-surface`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">원</span>
            </div>
          </div>
          <label className="block">
            <span className="mb-2 flex items-baseline justify-between text-sm font-semibold text-ink">
              거래 동네 <span className="text-xs font-normal text-muted">선택</span>
            </span>
            <input
              name="region"
              maxLength={20}
              defaultValue={f?.region ?? initial.region}
              placeholder="예) 망원동"
              className={inputClass}
            />
          </label>
        </div>
      </Section>

      <Section title="상세 설명" desc="물건 상태, 구매 시기, 거래 방법을 자세히 적을수록 신뢰도가 올라가요.">
        <textarea
          name="description"
          aria-label="상세 설명"
          rows={8}
          maxLength={2000}
          defaultValue={f?.description ?? initial.description}
          placeholder={"예) 작년 12월 구매, 케이스 끼워서 사용해 흠집 거의 없습니다.\n망원역 근처 직거래 원해요."}
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <p className="mt-2 text-right text-xs text-muted">최대 2,000자</p>
      </Section>

      <div className="mt-8 space-y-4">
        <ErrorBox message={state.error} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={cancelHref} className={btn.outline}>
            취소
          </Link>
          <button disabled={pending} className={`${btn.primary} sm:min-w-48`}>
            {pending && <Spinner />}
            {pending ? "저장하는 중..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
