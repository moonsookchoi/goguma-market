// 동네 위치(대략적인 중심 좌표)와 거리 계산
// - 동네 이름은 자유롭게 입력하지만, 이 목록에 있는 동네끼리는 거리를 계산해서 "내 근처"를 찾을 수 있어요.
// - 좌표는 동네 중심을 대략 잡은 값이에요 (수백 m 오차). 공부용으로 서울 일부 동네만 넣었고, 필요하면 계속 추가하면 돼요.
// - 나중에 사용자가 많아지면 DB의 PostGIS(위치 확장 기능)로 옮기는 게 좋아요.

export type Region = { name: string; gu: string; lat: number; lng: number; station?: string };

export const REGIONS: Region[] = [
  // 마포구
  { name: "망원동", gu: "마포구", lat: 37.556, lng: 126.9015, station: "망원역" },
  { name: "합정동", gu: "마포구", lat: 37.5496, lng: 126.9139, station: "합정역" },
  { name: "서교동", gu: "마포구", lat: 37.553, lng: 126.919, station: "홍대입구역" },
  { name: "연남동", gu: "마포구", lat: 37.5627, lng: 126.9231, station: "홍대입구역 3번 출구" },
  { name: "성산동", gu: "마포구", lat: 37.566, lng: 126.91, station: "마포구청역" },
  { name: "상암동", gu: "마포구", lat: 37.579, lng: 126.889, station: "디지털미디어시티역" },
  { name: "상수동", gu: "마포구", lat: 37.548, lng: 126.923, station: "상수역" },
  { name: "신수동", gu: "마포구", lat: 37.547, lng: 126.933, station: "광흥창역" },
  { name: "대흥동", gu: "마포구", lat: 37.55, lng: 126.942, station: "대흥역" },
  { name: "염리동", gu: "마포구", lat: 37.548, lng: 126.946, station: "대흥역" },
  { name: "아현동", gu: "마포구", lat: 37.553, lng: 126.956, station: "아현역" },
  { name: "공덕동", gu: "마포구", lat: 37.5446, lng: 126.9516, station: "공덕역" },
  { name: "도화동", gu: "마포구", lat: 37.539, lng: 126.95, station: "마포역" },
  { name: "용강동", gu: "마포구", lat: 37.541, lng: 126.944, station: "마포역" },
  // 서대문구
  { name: "연희동", gu: "서대문구", lat: 37.568, lng: 126.93, station: "신촌역" },
  { name: "신촌동", gu: "서대문구", lat: 37.5596, lng: 126.9425, station: "신촌역" },
  { name: "창천동", gu: "서대문구", lat: 37.556, lng: 126.933, station: "신촌역" },
  { name: "대현동", gu: "서대문구", lat: 37.56, lng: 126.946, station: "이대역" },
  { name: "북가좌동", gu: "서대문구", lat: 37.578, lng: 126.912, station: "증산역" },
  { name: "남가좌동", gu: "서대문구", lat: 37.575, lng: 126.92, station: "가좌역" },
  { name: "홍은동", gu: "서대문구", lat: 37.59, lng: 126.937, station: "홍제역" },
  // 영등포구·양천구
  { name: "여의도동", gu: "영등포구", lat: 37.525, lng: 126.925, station: "여의도역" },
  { name: "당산동", gu: "영등포구", lat: 37.534, lng: 126.902, station: "당산역" },
  { name: "영등포동", gu: "영등포구", lat: 37.517, lng: 126.907, station: "영등포역" },
  { name: "문래동", gu: "영등포구", lat: 37.518, lng: 126.895, station: "문래역" },
  { name: "목동", gu: "양천구", lat: 37.53, lng: 126.875, station: "오목교역" },
  // 용산구·중구·종로구
  { name: "이태원동", gu: "용산구", lat: 37.534, lng: 126.994, station: "이태원역" },
  { name: "한남동", gu: "용산구", lat: 37.534, lng: 127.003, station: "한남역" },
  { name: "후암동", gu: "용산구", lat: 37.548, lng: 126.979, station: "숙대입구역" },
  { name: "명동", gu: "중구", lat: 37.563, lng: 126.983, station: "명동역" },
  { name: "혜화동", gu: "종로구", lat: 37.586, lng: 127.002, station: "혜화역" },
  { name: "삼청동", gu: "종로구", lat: 37.585, lng: 126.982, station: "안국역" },
  // 성동구·강남구·송파구
  { name: "성수동", gu: "성동구", lat: 37.544, lng: 127.056, station: "성수역" },
  { name: "행당동", gu: "성동구", lat: 37.558, lng: 127.031, station: "행당역" },
  { name: "압구정동", gu: "강남구", lat: 37.527, lng: 127.028, station: "압구정역" },
  { name: "역삼동", gu: "강남구", lat: 37.5, lng: 127.036, station: "역삼역" },
  { name: "삼성동", gu: "강남구", lat: 37.514, lng: 127.056, station: "삼성역" },
  { name: "잠실동", gu: "송파구", lat: 37.511, lng: 127.086, station: "잠실역" },
  // 관악구
  { name: "신림동", gu: "관악구", lat: 37.484, lng: 126.929, station: "신림역" },
  { name: "봉천동", gu: "관악구", lat: 37.482, lng: 126.942, station: "봉천역" },
];

// 이 거리(km) 안이면 "내 근처"로 봐요
export const NEAR_KM = 3;

// 입력한 동네 글자 → 목록의 동네 찾기
// "망원동", "망원", "마포구 망원동", " 망원동 " 모두 망원동으로 찾아요
export function findRegion(text: string | null | undefined): Region | null {
  if (!text) return null;
  const words = text.trim().split(/\s+/);
  for (const word of words.reverse()) {
    const w = word.endsWith("동") ? word : `${word}동`;
    const found = REGIONS.find((r) => r.name === w);
    if (found) return found;
  }
  return null;
}

// 두 동네 사이 거리(km) — 지구를 공 모양으로 보고 계산하는 '하버사인 공식'
export function distanceKm(a: Region, b: Region) {
  const R = 6371; // 지구 반지름(km)
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 1.234 → "1.2km", 0.35 → "350m", 0 → "같은 동네"
export function formatKm(km: number) {
  if (km < 0.05) return "같은 동네";
  if (km < 1) return `${Math.round(km * 10) * 100}m`;
  return `${km.toFixed(1)}km`;
}
