# "경로를 찾지 못했다" 원인 및 수정 계획

## 원인
콘솔 로그가 확정적으로 보여줍니다:

> Directions Service: This API key is not authorized... The webpage is not allowed to use the directions service.

Lovable 관리형 Google Maps **브라우저 키**는 Maps JS + Places(New)에만 승인되어 있고, **Directions API 브라우저 호출은 정책상 거부**됩니다. `src/routes/routes.tsx`가 브라우저에서 `google.maps.DirectionsService.route()`를 4개 레이어 각각 호출하므로 전부 REQUEST_DENIED로 실패합니다. 지도 렌더링·자동완성이 정상인 것도 이 정책과 일치합니다.

## 수정 방향 (권장)
경로 계산을 서버 함수로 옮겨 **Google Maps Routes API를 게이트웨이 경유**로 호출합니다. 게이트웨이는 서버 키를 자동 주입하므로 브라우저 키 제한을 우회합니다.

### 변경 파일

1. **`src/lib/routes.functions.ts` (신규)**
   - `createServerFn({ method: "POST" })` + `inputValidator`(origin/destination LatLng, travelMode="WALK", 대안 경로 요청).
   - `fetch("https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes", ...)` 호출:
     - 헤더: `Authorization: Bearer ${process.env.LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${process.env.GOOGLE_MAPS_API_KEY}`, `X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.polyline.encodedPolyline,routes.legs.steps.startLocation,routes.legs.steps.endLocation,routes.legs.steps.distanceMeters`
     - body: `{ origin, destination, travelMode: "WALK", computeAlternativeRoutes: true, languageCode: "ko", regionCode: "KR" }`
   - 403 응답은 `error.details[].reason`을 검사해 사용자에게 서버키 제한 안내로 변환(지식 파일의 API_KEY_HTTP_REFERRER_BLOCKED / API_KEY_SERVICE_BLOCKED 분기).
   - 응답을 DTO로 정규화: `{ routes: [{ encodedPolyline, distanceMeters, durationSec, steps: [{ instruction, distanceMeters, startLatLng, endLatLng, encodedPolyline }] }] }`.

2. **`src/routes/routes.tsx`**
   - `DirectionsService` / `DirectionsRenderer` 사용을 제거.
   - `useServerFn(computeSafeRoutes)` + `useQuery`로 서버 함수 호출.
   - 응답 `encodedPolyline`을 `google.maps.geometry.encoding.decodePath`로 디코드하여 `Polyline`으로 지도에 그림 (loader에 `libraries: ["places","geometry"]`가 이미 포함되어야 함 — 아니면 추가).
   - 4개 레이어: 첫 호출의 `routes[]` 대안(최대 3~4개)에 기존 `scoreRoute()`를 각각 적용해 Safest/Balanced/Fastest/Lit 라벨링. (기존 로직 재사용, 입력만 Routes API 결과로 교체.)
   - `useRouteStore`에는 폴리라인 포인트 배열과 steps DTO를 저장(현재 DirectionsResult 대신).

3. **`src/routes/route-detail.tsx`**
   - `steps`를 서버 DTO(`instruction`, `distanceMeters`)에서 읽어 렌더. `navigationInstruction.instructions`는 HTML이 아닌 텍스트이므로 그대로 표시 가능.

4. **`src/routes/navigate.tsx`**
   - 경로 폴리라인/스텝 좌표를 store DTO에서 사용하도록 필드명만 조정. GPS/watchPosition 로직은 변경 없음.

5. **`src/lib/gmaps.ts`**
   - `libraries`에 `"geometry"` 추가(폴리라인 디코딩용). 이미 있다면 그대로.

6. **`src/lib/store.ts`**
   - `DirectionsResult` 타입 참조를 새 DTO 타입으로 교체.

### 검증
- `bunx tsgo --noEmit` 통과.
- 프리뷰에서 성신여자대학교→서울역 등 실경로로 4개 레이어가 계산되고 지도에 표시되는지 확인.
- 상세보기(스텝)와 실시간 안내 화면이 새 DTO로 정상 동작하는지 확인.

## 대안 (권장하지 않음)
사용자가 자신의 Google Cloud API 키를 만들어 Directions API 서비스를 허용한 뒤 커스텀 커넥션으로 교체. 관리형 키를 사용할 수 있는 이점을 잃습니다.
