import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Menu, Search, Star, LogOut, Shield, MessageSquare, Siren } from "lucide-react";

export const Route = createFileRoute("/")({
  component: MainWard,
});

function MainWard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 사이드 메뉴 열림 상태

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (window.L) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);

    function initMap() {
      if (mapRef.current && window.L && !mapInstanceRef.current) {
        const apiKey = "1BD705BC-E920-3526-B69B-B1E5B4C5C659";
        const vworldUrl = `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`;

        // 지도 생성 (원래의 선명한 지도 스타일 유지)
        const map = window.L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([37.5665, 126.9780], 14);

        window.L.tileLayer(vworldUrl, {
          maxZoom: 19,
          minZoom: 6,
        }).addTo(map);

        mapInstanceRef.current = map;
      }
    }
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-amber-50/25 font-sans select-none">
      {/* 1. 배경 지도 영역 (필터 제거하여 원래 선명한 지도로 복원) */}
      <div ref={mapRef} className="absolute inset-0 h-full w-full z-0" />

      {/* 2. 상단 검색 및 메뉴 오버레이 레이어 */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 gap-2 pointer-events-none">
        {/* 좌측 햄버거 버튼 (메뉴 열기) */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95 transition"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* 중앙 출발지 / 도착지 입력 박스 */}
        <div className="pointer-events-auto flex flex-1 flex-col rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-gray-100">
          {/* 출발지 */}
          <div className="flex items-center gap-2 py-1 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-800 shrink-0">출발지:</span>
            <input
              type="text"
              value={originText}
              onChange={(e) => setOriginText(e.target.value)}
              placeholder="내 위치 또는 장소 입력"
              className="w-full text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            />
            <button className="text-amber-400 hover:text-amber-500">
              <Star className="h-4 w-4 fill-amber-400" />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* 도착지 */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-xs font-bold text-gray-800 shrink-0">도착지:</span>
            <input
              type="text"
              value={destText}
              onChange={(e) => setDestText(e.target.value)}
              placeholder="목적지 입력"
              className="w-full text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            />
            <button className="text-gray-500 hover:text-gray-700">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 우측 로그아웃/나가기 버튼 */}
        <button className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95 transition">
          <LogOut className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* 3. 피그마 시안과 똑같은 사이드 메뉴 슬라이드 (신고 및 메뉴 기능) */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 flex">
          {/* 배경 어둡게 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />

          {/* 메뉴 패널 (노란빛 배경, 갈색 버튼들) */}
          <div className="relative w-[82%] max-w-xs bg-[#FFF5CC] h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-amber-200">
            <div>
              {/* 상단 로고 영역 */}
              <div className="flex flex-col items-center pt-2 pb-6">
                <div className="bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-amber-200/60 mb-2">
                  <span className="text-lg font-black tracking-wider bg-gradient-to-r from-emerald-600 via-blue-500 to-amber-500 bg-clip-text text-transparent">
                    Safe ZIP
                  </span>
                </div>
              </div>

              {/* 갈색 메인 버튼 5개 */}
              <div className="flex flex-col gap-3.5">
                <Link
                  to="/routes"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3.5 bg-[#8B5A2B] hover:bg-[#744a22] text-white font-bold text-sm rounded-xl shadow-md text-center transition active:scale-95"
                >
                  커뮤니티
                </Link>

                <Link
                  to="/security"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3.5 bg-[#8B5A2B] hover:bg-[#744a22] text-white font-bold text-sm rounded-xl shadow-md text-center transition active:scale-95"
                >
                  보안화면
                </Link>

                <button
                  onClick={() => {
                    alert("모니터링 화면으로 이동합니다.");
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-[#8B5A2B] hover:bg-[#744a22] text-white font-bold text-sm rounded-xl shadow-md text-center transition active:scale-95"
                >
                  모니터링
                </button>

                <button
                  onClick={() => {
                    alert("개인정보 설정 화면으로 이동합니다.");
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-[#8B5A2B] hover:bg-[#744a22] text-white font-bold text-sm rounded-xl shadow-md text-center transition active:scale-95"
                >
                  개인정보
                </button>

                <button
                  onClick={() => {
                    alert("설정 화면으로 이동합니다.");
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-[#8B5A2B] hover:bg-[#744a22] text-white font-bold text-sm rounded-xl shadow-md text-center transition active:scale-95"
                >
                  설정
                </button>
              </div>
            </div>

            {/* 하단 도움말, 로그아웃 및 귀여운 캐릭터 곰돌이 영역 */}
            <div className="flex items-end justify-between pb-2 pt-4">
              <div className="flex flex-col gap-1.5 text-xs font-bold text-gray-700">
                <button 
                  onClick={() => alert("도움말 센터입니다.")} 
                  className="text-left hover:text-amber-900 transition"
                >
                  도움말
                </button>
                <button 
                  onClick={() => alert("로그아웃 되었습니다.")} 
                  className="text-left hover:text-red-600 transition"
                >
                  로그아웃
                </button>
              </div>

              {/* 귀여운 곰돌이 일러스트 대체 아이콘/아바타 */}
              <div className="w-12 h-12 rounded-full bg-amber-200/80 border-2 border-amber-400 flex items-center justify-center shadow-inner text-xl">
                🐻
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 하단 안심 네비게이션 바 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex h-20 items-end justify-between bg-amber-100/90 px-8 pb-3 rounded-t-3xl border-t border-amber-200/50 shadow-2xl backdrop-blur-md">
        <Link
          to="/security"
          className="flex flex-col items-center gap-0.5 text-gray-800 hover:text-red-500 transition"
        >
          <Shield className="h-6 w-6 stroke-[2]" />
          <span className="text-[11px] font-black tracking-tight">보안화면</span>
        </Link>

        {/* 중앙 긴급신고 버튼 */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => alert("112 및 보호자에게 긴급 알림을 전송합니다.")}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white border-4 border-red-500 shadow-xl active:scale-95 transition"
          >
            <div className="flex flex-col items-center justify-center text-red-500">
              <Siren className="h-8 w-8 animate-pulse stroke-[2.5]" />
              <span className="text-xs font-black mt-0.5 tracking-tighter">긴급신고</span>
            </div>
          </button>
        </div>

        <Link
          to="/routes"
          className="flex flex-col items-center gap-0.5 text-gray-800 hover:text-red-500 transition"
        >
          <MessageSquare className="h-6 w-6 stroke-[2]" />
          <span className="text-[11px] font-black tracking-tight">커뮤니티</span>
        </Link>
      </div>
    </div>
  );
}
