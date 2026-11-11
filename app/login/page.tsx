import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인 · 고구마마켓" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell
      title="다시 만나서 반가워요 👋"
      subtitle="이메일로 로그인하고 동네 거래를 이어가세요."
      footer={
        <>
          아직 회원이 아니신가요?{" "}
          <Link href="/signup" className="font-bold text-goguma-700 hover:underline">
            회원가입
          </Link>
        </>
      }
    >
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithError searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

// 인증 메일 링크가 실패하면 /login?error=auth 로 와요
async function LoginFormWithError({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  return (
    <LoginForm
      initialError={error === "auth" ? "인증 링크가 만료됐거나 올바르지 않아요. 다시 로그인해 주세요." : undefined}
    />
  );
}
