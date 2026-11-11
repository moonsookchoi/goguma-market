import Link from "next/link";
import { GogumaIcon } from "@/components/Logo";

// 없는 주소나 지워진 판매글에 들어왔을 때 보여 주는 화면
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <GogumaIcon className="h-28 w-28 animate-float" />
      <p className="mt-6 text-sm font-bold text-flesh-600">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">앗, 찾는 페이지가 없어요</h1>
      <p className="mt-2 text-muted">삭제됐거나 주소가 잘못된 것 같아요.</p>
      <Link
        href="/products"
        className="mt-8 rounded-full bg-goguma-700 px-6 py-3 font-semibold text-white transition hover:bg-goguma-600"
      >
        판매글 보러 가기
      </Link>
    </div>
  );
}
