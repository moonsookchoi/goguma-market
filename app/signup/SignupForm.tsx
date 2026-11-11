"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthState } from "@/app/auth/actions";
import { ErrorBox, Field, SubmitButton } from "@/components/AuthShell";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signup, {});

  // 이메일 인증이 켜져 있을 때: 메일 확인 안내
  if (state.checkEmail) {
    return (
      <div className="animate-rise rounded-3xl bg-white p-8 text-center shadow-xl shadow-goguma-900/5 ring-1 ring-line">
        <p className="text-5xl">📬</p>
        <h2 className="mt-4 text-xl font-extrabold">메일함을 확인해 주세요!</h2>
        <p className="mt-2 text-muted">
          <b className="text-ink">{state.checkEmail}</b> 로 인증 메일을 보냈어요.
          <br />
          메일 속 링크를 누르면 가입이 끝나요.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-goguma-700 px-6 py-3 font-semibold text-white transition hover:bg-goguma-600"
        >
          로그인 하러 가기
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="닉네임"
          hint="2~12자"
          name="nickname"
          placeholder="달콤한고구마"
          minLength={2}
          maxLength={12}
          defaultValue={state.fields?.nickname}
          required
        />
        <Field
          label="우리 동네"
          hint="선택"
          name="region"
          placeholder="예) 망원동"
          maxLength={20}
          defaultValue={state.fields?.region}
        />
      </div>
      <Field
        label="이메일"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="goguma@example.com"
        defaultValue={state.fields?.email}
        required
      />
      <Field
        label="비밀번호"
        hint="6자 이상"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호"
        minLength={6}
        required
      />
      <Field
        label="비밀번호 확인"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호를 한 번 더"
        minLength={6}
        required
      />
      <ErrorBox message={state.error} />
      <div className="pt-2">
        <SubmitButton pending={pending}>{pending ? "가입하는 중..." : "가입하고 시작하기 🍠"}</SubmitButton>
      </div>
    </form>
  );
}
