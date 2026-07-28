import policeRaw from "@/data/police.json";
import safetyRaw from "@/data/safety.json";

type Point = { lat: number; lon: number };
const police = policeRaw as Point[];
const safety = safetyRaw as Point[];

// Haversine (meters)
function distM(a: google.maps.LatLngLiteral, b: Point) {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLon = toR(b.lon - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

// 안심시설(CCTV·보안등) 데이터가 존재하는 영역 (현재 서울권 공공데이터)
const facilityBounds = safety.reduce(
  (b, p) => ({
    minLat: Math.min(b.minLat, p.lat),
    maxLat: Math.max(b.maxLat, p.lat),
    minLon: Math.min(b.minLon, p.lon),
    maxLon: Math.max(b.maxLon, p.lon),
  }),
  { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 },
);

function inFacilityCoverage(pt: google.maps.LatLngLiteral, margin = 0.05) {
  return (
    pt.lat >= facilityBounds.minLat - margin &&
    pt.lat <= facilityBounds.maxLat + margin &&
    pt.lng >= facilityBounds.minLon - margin &&
    pt.lng <= facilityBounds.maxLon + margin
  );
}

// Sample path every ~50 points for speed
export function scorePath(path: google.maps.LatLngLiteral[], radiusM = 300) {
  const step = Math.max(1, Math.floor(path.length / 30));
  const samples = path.filter((_, i) => i % step === 0);
  let policeNearby = 0;
  let safetyFacilities = 0;
  const seenP = new Set<number>();
  const seenS = new Set<number>();
  for (const s of samples) {
    police.forEach((p, i) => {
      if (!seenP.has(i) && distM(s, p) < radiusM) {
        seenP.add(i);
        policeNearby++;
      }
    });
    safety.forEach((p, i) => {
      if (!seenS.has(i) && distM(s, p) < radiusM) {
        seenS.add(i);
        safetyFacilities++;
      }
    });
  }

  // 안심시설 데이터가 없는 지역(서울 외)에서는 경찰서 밀도 기반으로 점수를 환산
  const facilityDataAvailable = samples.some((s) => inFacilityCoverage(s));

  if (!facilityDataAvailable) {
    const km = Math.max(0.3, pathLengthKm(path));
    const density = policeNearby / km; // 경찰서/㎞
    const pScore = Math.min(policeNearby * 10, 45);
    const dScore = Math.min(density * 40, 45);
    return {
      safetyScore: Math.round(Math.max(25, pScore + dScore)),
      policeNearby,
      safetyFacilities,
      facilityDataAvailable,
    };
  }

  const pScore = Math.min(policeNearby * 8, 40);
  const fScore = Math.min(safetyFacilities * 2.5, 60);
  const safetyScore = Math.round(pScore + fScore);
  return { safetyScore, policeNearby, safetyFacilities, facilityDataAvailable };
}

function pathLengthKm(path: google.maps.LatLngLiteral[]) {
  let m = 0;
  for (let i = 1; i < path.length; i++) {
    m += distM(path[i - 1], { lat: path[i].lat, lon: path[i].lng });
  }
  return m / 1000;
}
