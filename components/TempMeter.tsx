import { tempColor } from "@/lib/products";

// 매너 온도 표시 (숫자 + 막대). 기본 36.5℃, 후기에 따라 오르내려요
export default function TempMeter({ temp, large = false }: { temp: number; large?: boolean }) {
  return (
    <div className="text-right">
      <p className={`${large ? "text-3xl" : "text-lg"} font-bold ${tempColor(temp)}`}>{temp.toFixed(1)}℃</p>
      <div className={`mt-1 ${large ? "h-2 w-40" : "h-1.5 w-20"} ml-auto overflow-hidden rounded-full bg-surface ring-1 ring-line`}>
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-brand-500 to-accent-500" style={{ width: `${Math.min(100, temp)}%` }} />
      </div>
      <p className="mt-0.5 text-[11px] text-muted">매너 온도</p>
    </div>
  );
}
