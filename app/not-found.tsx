import Link from "next/link";
import { btn } from "@/components/ui";

// 없는 주소나 지워진 판매글에 들어왔을 때 보여 주는 화면
export default function NotFound() {
  return (
    <div className="bg-grid relative">
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-brand-600">ERROR 404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">페이지를 찾을 수 없습니다</h1>
        <p className="mt-4 text-muted">요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.</p>
        <div className="mt-10 flex gap-3">
          <Link href="/" className={btn.outline}>
            홈으로
          </Link>
          <Link href="/products" className={btn.primary}>
            판매글 보러 가기
          </Link>
        </div>
      </div>
    </div>
  );
}
