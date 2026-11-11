import { REGIONS } from "@/lib/regions";

// 동네 입력칸 추천 목록 (<input list="region-list"> 와 연결)
// 목록에 있는 동네를 고르면 '내 동네 근처' 거리 계산이 가능해요. 목록에 없는 동네도 직접 적을 수는 있어요.
export const REGION_LIST_ID = "region-list";

export default function RegionDatalist() {
  return (
    <datalist id={REGION_LIST_ID}>
      {REGIONS.map((r) => (
        <option key={r.name} value={r.name} label={`서울 ${r.gu}`} />
      ))}
    </datalist>
  );
}
