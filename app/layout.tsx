import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import Header, { HeaderSkeleton } from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "고구마마켓 · 우리 동네 중고거래 플랫폼",
  description: "가까운 이웃과 믿고 거래하는 동네 중고거래 플랫폼, 고구마마켓",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Header 는 로그인 쿠키를 읽는 동적 영역이라 Suspense 로 감싸요 (Next.js 16 Cache Components) */}
        <Suspense fallback={<HeaderSkeleton />}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
