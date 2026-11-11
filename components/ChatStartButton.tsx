"use client";

// '채팅으로 거래하기' 버튼 — 누르면 채팅방을 여는 동안 "여는 중..."을 보여 줘요
// (서버 액션이 끝날 때까지 1~2초 걸려서, 표시가 없으면 안 눌린 것처럼 보여요)
import { useFormStatus } from "react-dom";
import { MessageCircle } from "lucide-react";
import { btn, Spinner } from "@/components/ui";

export default function ChatStartButton({ sold }: { sold: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={`${btn.primary} h-12 w-full`} disabled={sold || pending}>
      {pending ? <Spinner /> : <MessageCircle className="h-5 w-5" />}
      {sold ? "거래가 완료된 물건이에요" : pending ? "채팅방 여는 중..." : "채팅으로 거래하기"}
    </button>
  );
}
