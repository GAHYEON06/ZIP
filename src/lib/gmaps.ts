// 카카오 지도 JS SDK 동적 로드 함수
export function loadKakaoMaps(): Promise<typeof kakao.maps> {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
      return;
    }

    const appkey = import.meta.env.VITE_KAKAO_MAP_KEY || import.meta.env.KAKAO_REST_API_KEY;
    if (!appkey) {
      reject(new Error("카카오 지도 API 키(VITE_KAKAO_MAP_KEY 또는 KAKAO_REST_API_KEY)가 설정되지 않았습니다."));
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false&libraries=services`;
    script.async = true;
    script.onerror = () => reject(new Error("카카오 지도 SDK 로드 실패"));
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };

    document.head.appendChild(script);
  });
}
