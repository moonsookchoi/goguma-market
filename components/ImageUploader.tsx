"use client";

// 판매글 사진 여러 장 올리기
// 흐름: 파일 고르기 → 브라우저에서 크기 줄이기 → Supabase Storage 에 바로 업로드 → 경로를 hidden input 으로 폼에 실어 보내기
import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IMAGE_BUCKET, MAX_IMAGES, imageUrl } from "@/lib/products";

type Item =
  | { kind: "done"; path: string; isNew: boolean } // 올라간 사진 (isNew: 이번에 새로 올린 것)
  | { kind: "uploading"; id: string; preview: string }; // 올라가는 중

const MAX_SIDE = 1600; // 긴 변 최대 1600px 로 줄여요

// 큰 사진을 줄여서 webp 로 바꾸기 (용량 ↓, 업로드 속도 ↑)
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("이미지를 변환하지 못했어요.");
  return blob;
}

export default function ImageUploader({ userId, initial }: { userId: string; initial: string[] }) {
  const [items, setItems] = useState<Item[]>(initial.map((path) => ({ kind: "done", path, isNew: false })));
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const remaining = MAX_IMAGES - items.length;
  const uploading = items.some((i) => i.kind === "uploading");

  async function addFiles(fileList: FileList | File[]) {
    setError(undefined);
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    if (files.length > remaining) setError(`사진은 최대 ${MAX_IMAGES}장까지 올릴 수 있어요.`);
    const picked = files.slice(0, Math.max(0, remaining));

    // 1) 먼저 미리보기를 '올리는 중' 상태로 보여 주고
    const pending = picked.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    setItems((prev) => [...prev, ...pending.map((p) => ({ kind: "uploading" as const, id: p.id, preview: p.preview }))]);

    // 2) 한 장씩 줄여서 업로드 (동시에 진행)
    await Promise.all(
      pending.map(async ({ id, file, preview }) => {
        try {
          const blob = await shrinkImage(file);
          const path = `${userId}/${crypto.randomUUID()}.webp`; // 내 아이디 폴더 안에만 올릴 수 있어요 (Storage 보안 규칙)
          const { error: upErr } = await supabase.storage
            .from(IMAGE_BUCKET)
            .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
          if (upErr) throw upErr;
          setItems((prev) => prev.map((it) => (it.kind === "uploading" && it.id === id ? { kind: "done", path, isNew: true } : it)));
        } catch (e) {
          console.error("upload", e);
          setError("일부 사진을 올리지 못했어요. 다시 시도해 주세요.");
          setItems((prev) => prev.filter((it) => !(it.kind === "uploading" && it.id === id)));
        } finally {
          URL.revokeObjectURL(preview);
        }
      }),
    );
  }

  function remove(index: number) {
    const item = items[index];
    setItems((prev) => prev.filter((_, i) => i !== index));
    // 이번에 새로 올린 사진은 바로 Storage 에서도 지워요.
    // 원래 있던 사진은 '수정 완료'를 눌렀을 때 서버에서 지워요. (취소하면 그대로 남도록)
    if (item.kind === "done" && item.isNew) {
      supabase.storage.from(IMAGE_BUCKET).remove([item.path]);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }

  return (
    <div>
      {/* 서버로 보낼 값: 올라간 사진 경로들 (순서 = 화면 순서) */}
      {items.map((it) => (it.kind === "done" ? <input key={it.path} type="hidden" name="images" value={it.path} /> : null))}
      {uploading && <input type="hidden" name="uploading" value="1" />}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`grid grid-cols-3 gap-3 rounded-xl border border-dashed p-3 transition sm:grid-cols-4 lg:grid-cols-5 ${
          dragging ? "border-brand-600 bg-brand-50" : "border-line bg-surface/60"
        }`}
      >
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-white text-muted transition hover:border-brand-300 hover:text-brand-700"
          >
            <ImagePlus className="h-6 w-6" strokeWidth={1.75} />
            <span className="text-xs font-semibold">
              {items.length}/{MAX_IMAGES}
            </span>
          </button>
        )}

        {items.map((it, i) => (
          <div key={it.kind === "done" ? it.path : it.id} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
            {it.kind === "done" ? (
              <Image src={imageUrl(it.path)} alt={`사진 ${i + 1}`} fill sizes="160px" className="object-cover" />
            ) : (
              <>
                {/* 아직 올라가기 전이라 내 컴퓨터의 임시 미리보기 주소(blob:)를 그대로 보여 줘요 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="h-full w-full object-cover opacity-50" />
                <span className="absolute inset-0 grid place-items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-700" />
                </span>
              </>
            )}

            {i === 0 && it.kind === "done" && (
              <span className="absolute left-1.5 top-1.5 rounded bg-brand-800 px-1.5 py-0.5 text-[10px] font-bold text-white">대표</span>
            )}

            {it.kind === "done" && (
              <>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`사진 ${i + 1} 삭제`}
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-white transition hover:bg-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {/* 순서 바꾸기 (맨 앞 = 대표 사진) */}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="앞으로"
                    className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink shadow disabled:invisible"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="뒤로"
                    className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink shadow disabled:invisible"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = ""; // 같은 파일을 다시 고를 수 있게
        }}
      />

      <p className="mt-2 text-xs text-muted">
        최대 {MAX_IMAGES}장 · 끌어다 놓아도 돼요 · 첫 번째 사진이 대표 사진이 되고, 화살표로 순서를 바꿀 수 있어요.
      </p>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
