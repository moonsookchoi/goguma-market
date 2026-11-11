import Link from "next/link";
import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "회원가입 · 고구마마켓" };

export default function SignupPage() {
  return (
    <AuthShell
      title="고구마마켓 시작하기 🍠"
      subtitle="닉네임과 이메일만 있으면 바로 가입할 수 있어요."
      footer={
        <>
          이미 회원이신가요?{" "}
          <Link href="/login" className="font-bold text-goguma-700 hover:underline">
            로그인
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
