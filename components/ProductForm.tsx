"use client";

// 판매글 쓰기 · 수정 공용 폼
import { useActionState, useState } from "react";
import Link from "next/link";
import type { ProductFormState } from "@/app/products/actions";
import { CATEGORIES } from "@/lib/products";
import { ErrorBox, SubmitButton } from "@/components/AuthShell";

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initial: { title: string; description: string; category: string; region: string; price: string; isFree: boolean };
  submitLabel: string;
  cancelHref: string;
};

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none transition placeholder:text-muted/60 focus:border-goguma-500 focus:ring-4 focus:ring-goguma-100";

export default function ProductForm({ action, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const f = state.fields; // 오류가 나면 입력했던 값을 다시 채워 넣기
  const [isFree, setIsFree] = useState(f ? f.isFree === "on" : initial.isFree);
  const [titleLen, setTitleLen] = useState((f?.title ?? initial.title).length);

  return (
    <form action={formAction} className="space-y-7">
      {/* 사진은 다음 단계에서 추가 예정 */}
      <div className="flex items-center gap-3 rounded-2xl bg-goguma-50 px-4 py-3 text-sm text-goguma-700">
        <span className="text-xl">📷</span>
        사진 올리기는 다음 단계에서 생겨요. 지금은 카테고리 이모지가 대표 이미지로 보여요.
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
          제목 <span className="text-xs font-normal text-muted">{titleLen}/40</span>
        </span>
        <input
          name="title"
          required
          minLength={2}
          maxLength={40}
          defaultValue={f?.title ?? initial.title}
          onChange={(e) => setTitleLen(e.target.value.length)}
          placeholder="예) 에어팟 프로 2세대 팝니다"
          className={inputClass}
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">카테고리</legend>
        <div className="flex flex-wrap gap-2">
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
              <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line transition hover:ring-goguma-200 peer-checked:bg-goguma-700 peer-checked:text-white peer-checked:ring-goguma-700 peer-focus-visible:ring-4 peer-focus-visible:ring-goguma-200">
                <span aria-hidden>{c.emoji}</span>
                {c.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 flex items-center justify-between text-sm font-semibold">
            <label htmlFor="price">가격</label>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-flesh-600">
              <input
                type="checkbox"
                name="isFree"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="h-4 w-4 accent-flesh-500"
              />
              나눔 🧡
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
              placeholder={isFree ? "무료로 나눠요" : "가격을 입력하세요"}
              className={`${inputClass} pr-10 disabled:bg-flesh-100/50`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">원</span>
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
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

      <label className="block">
        <span className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
          자세한 설명 <span className="text-xs font-normal text-muted">선택 · 2000자까지</span>
        </span>
        <textarea
          name="description"
          rows={7}
          maxLength={2000}
          defaultValue={f?.description ?? initial.description}
          placeholder={"물건 상태, 구매 시기, 거래 방법 등을 적어 주세요.\n신뢰할 수 있는 거래를 위해 자세히 적을수록 좋아요."}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      <ErrorBox message={state.error} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Link
          href={cancelHref}
          className="flex items-center justify-center rounded-2xl px-6 py-4 font-semibold text-muted ring-1 ring-line transition hover:bg-white sm:w-40"
        >
          취소
        </Link>
        <div className="flex-1">
          <SubmitButton pending={pending}>{pending ? "저장하는 중..." : submitLabel}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
