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
  // Normalize: cap at reasonable maxes
  const pScore = Math.min(policeNearby * 8, 40);
  const fScore = Math.min(safetyFacilities * 2.5, 60);
  const safetyScore = Math.round(pScore + fScore);
  return { safetyScore, policeNearby, safetyFacilities };
}
