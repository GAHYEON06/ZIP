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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        // 원래의 선명하고 깔끔한 지도 복원
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
      {/* 1. 배경 지도 영역 (필터 없이 원래 지도 상태) */}
      <div ref={mapRef} className="absolute inset-0 h-full w-full z-0" />

      {/* 2. 상단 검색 및 메뉴 오버레이 레이어 */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 gap-2 pointer-events-none">
        {/* 좌측 햄버거 버튼 */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95 transition"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* 중앙 출발지 / 도착지 입력 박스 */}
        <div className="pointer-events-auto flex flex-1 flex-col rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-gray-100">
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

      {/* 3. 피그마 디자인 그대로 구현한 사이드 메뉴 */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 flex">
          {/* 백드롭 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />

          {/* 사이드 메뉴 패널 (피그마 시안의 노란빛 크림 배경) */}
          <div className="relative w-[82%] max-w-xs bg-[#FBF0C7] h-full shadow-2xl px-6 py-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-amber-200">
            <div>
              {/* 상단 'Safe ZIP' 피그마 로고 재현 */}
              <div className="flex flex-col items-center pt-2 pb-5">
                <div className="relative flex flex-col items-center">
                  {/* 상단 Safe 테두리 박스 */}
                  <div className="bg-[#8CBF95] px-3 py-1 rounded-xl shadow-sm border border-[#6FA77A] flex gap-1 items-center mb-1 z-10">
                    <span className="text-white font-black text-sm tracking-widest drop-shadow-xs">S a f e</span>
                  </div>
                  {/* 하단 입체 블록 글자 (Z I P) */}
                  <div className="flex gap-1.5 -mt-2">
                    <div className="w-8 h-8 bg-[#E75A88] rounded-lg shadow-md flex items-center justify-center text-white font-black text-lg border-b-4 border-[#B83B65]">Z</div>
                    <div className="w-8 h-8 bg-[#5C8BC3] rounded-lg shadow-md flex items-center justify-center text-white font-black text-lg border-b-4 border-[#3B6496]">I</div>
                    <div className="w-8 h-8 bg-[#ECA148] rounded-lg shadow-md flex items-center justify-center text-white font-black text-lg border-b-4 border-[#BD7726]">P</div>
                    <div className="w-8 h-8 bg-[#659B6E] rounded-lg shadow-md flex items-center justify-center text-white font-black text-lg border-b-4 border-[#456C4C]">O</div>
                  </div>
                </div>
              </div>

              {/* 피그마 시안과 동일한 둥근 갈색 메뉴 버튼 5개 */}
              <div className="flex flex-col gap-3 mt-2">
                <Link
                  to="/routes"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3.5 bg-[#8C5A28] hover:bg-[#724820] text-white font-bold text-sm rounded-xl shadow-md text-center tracking-wide transition active:scale-95"
                >
                  커뮤니티
                </Link>

                <Link
                  to="/security"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3.5 bg-[#8C5A28] hover:bg-[#724820] text-white font-bold text-sm rounded-xl shadow-md text-center tracking-wide transition active:scale-95"
                >
                  보안화면
                </Link>

                <button
                  onClick={() => {
                    alert("모니터링 화면으로 이동합니다.");
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-[#8C5A28] hover:bg-[#724820] text-white font-bold text-sm rounded-xl shadow-md text-center tracking-wide transition active:scale-95"
                >
                  모니터링
                </button>

                <button
                  onClick={() => {
                    alert("개인정보 화면으로 이동합니다.");
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-[#8C5A28] hover:bg-[#724820] text-white font-bold text-sm rounded-xl shadow-md text-center tracking-wide transition active:scale-95"
                >
                  개인정보
                </button>

                <button
                  onClick={() => {
                    alert("설정 화면으로 이동합니다.");
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3.5 bg-[#8C5A28] hover:bg-[#724820] text-white font-bold text-sm rounded-xl shadow-md text-center tracking-wide transition active:scale-95"
                >
                  설정
                </button>
              </div>
            </div>

            {/* 하단 도움말, 로그아웃 및 귀여운 곰돌이 캐릭터 배치 */}
            <div className="flex items-end justify-between pb-3 pt-2">
              <div className="flex flex-col gap-2 text-xs font-bold text-gray-700">
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

              {/* 피그마 시안에 있는 귀여운 곰돌이 캐릭터 표현 */}
              <div className="flex flex-col items-center">
                <div className="text-3xl filter drop-shadow-md animate-bounce duration-1000">
                  🐻
                </div>
                <span className="text-[10px] font-bold text-amber-800/60 mt-0.5">SafeZIP</span>
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
