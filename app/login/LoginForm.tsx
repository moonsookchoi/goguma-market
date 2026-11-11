"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/auth/actions";
import { ErrorBox, Field, SubmitButton } from "@/components/AuthShell";

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {
    error: initialError,
  });

  return (
    <form action={formAction} className="space-y-4">
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
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="비밀번호를 입력하세요"
        required
      />
      <ErrorBox message={state.error} />
      <div className="pt-2">
        <SubmitButton pending={pending}>{pending ? "로그인 중..." : "로그인"}</SubmitButton>
      </div>
    </form>
  );
}
