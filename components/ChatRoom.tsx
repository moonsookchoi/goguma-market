"use client";

// 실시간 채팅방
// - 메시지는 브라우저에서 Supabase 에 바로 저장하고, Realtime 으로 상대 화면에 즉시 나타나요.
// - 가격 제안 · 거래 약속 · 후기도 이 화면에서 처리해요.
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CalendarClock, HandCoins, MapPin, Send, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { answerOffer, setAppointment, writeReview } from "@/app/chats/actions";
import { btn, inputClass } from "@/components/ui";

export type ChatMessage = {
  id: number;
  room_id: number;
  sender_id: string;
  kind: "text" | "offer" | "system";
  body: string;
  offer_price: number | null;
  offer_status: "pending" | "accepted" | "declined" | null;
  read_at: string | null;
  created_at: string;
};

const MANNER_TAGS = ["시간 약속을 잘 지켜요", "친절하고 매너가 좋아요", "응답이 빨라요", "물건 상태가 설명과 같아요", "좋은 물건을 저렴하게 판매해요"];

export default function ChatRoom({
  roomId,
  userId,
  isSeller,
  initialMessages,
  appointment,
  safePlaces,
  canReview,
  price,
}: {
  roomId: number;
  userId: string;
  isSeller: boolean;
  initialMessages: ChatMessage[];
  appointment: { at: string | null; place: string };
  safePlaces: string[];
  canReview: boolean;
  price: number;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [panel, setPanel] = useState<null | "offer" | "appointment" | "review">(null);
  const [offer, setOffer] = useState(price ? String(Math.round((price * 0.9) / 1000) * 1000) : "");
  const [place, setPlace] = useState(appointment.place || safePlaces[0]);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState(createClient); // 클라이언트는 한 번만 만들어요

  // 실시간 구독: 이 방의 새 메시지 / 바뀐 메시지(제안 수락 등)
  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "goguma_chat_messages", filter: `room_id=eq.${roomId}` }, (p) => {
        const m = p.new as ChatMessage;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "goguma_chat_messages", filter: `room_id=eq.${roomId}` }, (p) => {
        const m = p.new as ChatMessage;
        setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  // 새 메시지가 오면 맨 아래로 + 상대 메시지는 읽음 처리
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
    const unread = messages.filter((m) => m.sender_id !== userId && !m.read_at).map((m) => m.id);
    if (unread.length) supabase.from("goguma_chat_messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {});
  }, [messages, userId, supabase]);

  async function send(payload: Partial<ChatMessage>) {
    setError(undefined);
    const { data, error: err } = await supabase
      .from("goguma_chat_messages")
      .insert({ room_id: roomId, sender_id: userId, ...payload })
      .select()
      .single();
    if (err) return setError("메시지를 보내지 못했어요. (차단된 상대일 수 있어요)");
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as ChatMessage]));
  }

  return (
    <>
      {/* 메시지 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-surface/40 px-4 py-4">
        {appointment.at && (
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
            <CalendarClock className="h-3.5 w-3.5" />
            약속: {new Date(appointment.at).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" })} · {appointment.place}
          </div>
        )}
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">첫 메시지를 보내 보세요. 예) 안녕하세요! 아직 구매 가능한가요?</p>}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          if (m.kind === "system") {
            return (
              <p key={m.id} className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-xs text-muted ring-1 ring-line">
                {m.body}
              </p>
            );
          }
          return (
            <div key={m.id} className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
              {m.kind === "offer" ? (
                <div className={`w-60 rounded-2xl border p-4 ${mine ? "border-brand-200 bg-brand-50" : "border-accent-100 bg-accent-50"}`}>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <HandCoins className="h-4 w-4" /> 가격 제안
                  </p>
                  <p className="mt-1 text-xl font-bold text-ink">{(m.offer_price ?? 0).toLocaleString("ko-KR")}원</p>
                  {m.offer_status === "pending" && isSeller && !mine ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => startTransition(() => answerOffer(m.id, roomId, false))} className="rounded-lg border border-line bg-white py-2 text-sm font-semibold">
                        거절
                      </button>
                      <button onClick={() => startTransition(() => answerOffer(m.id, roomId, true))} className="rounded-lg bg-brand-800 py-2 text-sm font-semibold text-white">
                        수락
                      </button>
                    </div>
                  ) : (
                    <p className={`mt-2 text-xs font-semibold ${m.offer_status === "accepted" ? "text-emerald-700" : m.offer_status === "declined" ? "text-red-600" : "text-muted"}`}>
                      {m.offer_status === "accepted" ? "✓ 수락됨 — 이 가격으로 거래해요" : m.offer_status === "declined" ? "거절됨" : "판매자의 응답을 기다리는 중"}
                    </p>
                  )}
                </div>
              ) : (
                <p className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] ${mine ? "rounded-br-sm bg-brand-800 text-white" : "rounded-bl-sm bg-white text-ink ring-1 ring-line"}`}>
                  {m.body}
                </p>
              )}
              <span className="shrink-0 pb-1 text-[10px] text-muted">
                {mine && m.read_at && <span className="mr-1 text-brand-600">읽음</span>}
                {new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 도구 패널: 가격 제안 / 거래 약속 / 후기 */}
      {panel === "offer" && (
        <div className="border-t border-line bg-white p-4">
          <p className="text-sm font-semibold text-ink">원하는 가격을 제안해 보세요</p>
          <div className="mt-2 flex gap-2">
            <input value={offer} onChange={(e) => setOffer(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className={inputClass} placeholder="금액" />
            <button
              className={btn.primary}
              onClick={() => {
                const v = Number(offer);
                if (!v) return;
                send({ kind: "offer", offer_price: v, offer_status: "pending" });
                setPanel(null);
              }}
            >
              제안
            </button>
          </div>
        </div>
      )}
      {panel === "appointment" && (
        <form action={setAppointment.bind(null, roomId)} onSubmit={() => setTimeout(() => setPanel(null), 0)} className="space-y-3 border-t border-line bg-white p-4">
          <p className="text-sm font-semibold text-ink">거래 약속 잡기 {isSeller && <span className="font-normal text-muted">(정하면 판매글이 예약중으로 바뀌어요)</span>}</p>
          <input type="datetime-local" name="at" required defaultValue={appointment.at?.slice(0, 16)} className={inputClass} />
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted"><MapPin className="h-3.5 w-3.5" /> 안전한 거래 장소 추천</p>
            <div className="flex flex-wrap gap-1.5">
              {safePlaces.map((p) => (
                <button type="button" key={p} onClick={() => setPlace(p)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${place === p ? "border-brand-700 bg-brand-50 text-brand-800" : "border-line"}`}>
                  {p}
                </button>
              ))}
            </div>
            <input name="place" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={40} required className={`${inputClass} mt-2`} />
          </div>
          <button className={`${btn.primary} w-full`}>약속 정하기</button>
        </form>
      )}
      {panel === "review" && <ReviewForm roomId={roomId} onDone={() => setPanel(null)} />}

      {/* 입력창 */}
      <div className="border-t border-line bg-white p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto">
          {!isSeller && (
            <ToolButton active={panel === "offer"} onClick={() => setPanel(panel === "offer" ? null : "offer")}>
              <HandCoins className="h-4 w-4" /> 가격 제안
            </ToolButton>
          )}
          <ToolButton active={panel === "appointment"} onClick={() => setPanel(panel === "appointment" ? null : "appointment")}>
            <CalendarClock className="h-4 w-4" /> 거래 약속
          </ToolButton>
          {canReview && (
            <ToolButton active={panel === "review"} onClick={() => setPanel(panel === "review" ? null : "review")}>
              <Star className="h-4 w-4" /> 거래 후기 남기기
            </ToolButton>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const body = text.trim();
            if (!body) return;
            setText("");
            send({ kind: "text", body });
          }}
          className="flex gap-2"
        >
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="메시지 보내기" className={inputClass} />
          <button className={`${btn.primary} !px-4`} aria-label="보내기">
            <Send className="h-4 w-4" />
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </>
  );
}

function ToolButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active ? "border-brand-700 bg-brand-50 text-brand-800" : "border-line text-body hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

// 거래 후기: 평가 3단계 + 매너 칭찬 태그 + 한마디
function ReviewForm({ roomId, onDone }: { roomId: number; onDone: () => void }) {
  const [state, action, pending] = useActionState<{ done?: boolean; error?: string }, FormData>(writeReview.bind(null, roomId), {});
  if (state.done) {
    return (
      <div className="border-t border-line bg-emerald-50 p-4 text-sm text-emerald-800">
        후기를 남겼어요. 상대의 매너 온도에 반영됐어요 🙏{" "}
        <button onClick={onDone} className="ml-2 underline">닫기</button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-3 border-t border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">거래는 어떠셨나요?</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["bad", "😕 별로예요"],
          ["good", "🙂 좋아요"],
          ["best", "😍 최고예요"],
        ].map(([v, label]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="rating" value={v} required className="peer sr-only" defaultChecked={v === "good"} />
            <span className="block rounded-lg border border-line py-2 text-center text-sm peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:font-semibold">{label}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MANNER_TAGS.map((t) => (
          <label key={t} className="cursor-pointer">
            <input type="checkbox" name="tags" value={t} className="peer sr-only" />
            <span className="block rounded-full border border-line px-3 py-1 text-xs peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-800">{t}</span>
          </label>
        ))}
      </div>
      <input name="comment" maxLength={300} placeholder="한마디 남기기 (선택)" className={inputClass} />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button disabled={pending} className={`${btn.primary} w-full`}>후기 보내기</button>
    </form>
  );
}
