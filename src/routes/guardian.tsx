import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/guardian")({
  head: () => ({
    meta: [
      { title: "보호자 설정 · 안심 귀갓길" },
      { name: "description", content: "보호자 연락처를 등록하면 긴급 상황에 자동으로 알림이 전송돼요." },
      { property: "og:title", content: "보호자 설정" },
      { property: "og:description", content: "보호자 등록 및 위치 공유 관리" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guardian,
});

function Guardian() {
  const { guardianName, guardianPhone, setGuardian, clearGuardian } = useGuardian();
  const [name, setName] = useState(guardianName);
  const [phone, setPhone] = useState(guardianPhone);
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone.trim())) {
      alert("올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    setGuardian(name.trim() || "보호자", phone.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3">
        <Link to="/" className="text-xl">←</Link>
        <h1 className="text-sm font-bold text-foreground">보호자 설정</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <div className="text-4xl">👥</div>
          <h2 className="mt-3 text-lg font-bold text-foreground">
            내 안심 지킴이를 등록해요
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            보호자를 등록하면 아래 기능이 활성화됩니다:
          </p>
          <ul className="mt-3 space-y-1 text-xs text-foreground">
            <li>• 🚨 긴급신고 시 보호자에게 알림 문자 전송</li>
            <li>• 🗺️ 길찾기 진행 중 실시간 위치 공유</li>
            <li>• 📍 도착 시 자동 도착 알림</li>
          </ul>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-foreground">보호자 이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 엄마, 언니"
              maxLength={30}
              className="mt-1 block w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-foreground">보호자 휴대폰 번호</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              inputMode="tel"
              maxLength={13}
              className="mt-1 block w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <button
            onClick={save}
            className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow"
          >
            {saved ? "✓ 저장 완료" : "보호자 저장하기"}
          </button>

          {guardianPhone && (
            <>
              <div className="rounded-2xl bg-safe/10 p-4">
                <div className="text-xs font-bold text-safe-foreground">현재 등록된 보호자</div>
                <div className="mt-1 text-base font-bold text-foreground">
                  {guardianName || "보호자"} · {guardianPhone}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  이동 시 실시간 위치가 이 번호로 공유됩니다 (시뮬레이션).
                </p>
              </div>
              <Link
                to="/guardian-track"
                className="block w-full rounded-full bg-primary py-3 text-center text-sm font-bold text-primary-foreground shadow"
              >
                🧭 피보호자에게 가는 최단 경로
              </Link>

              <button
                onClick={() => {
                  if (confirm("보호자 등록을 해제하시겠어요?")) {
                    clearGuardian();
                    setName("");
                    setPhone("");
                  }
                }}
                className="w-full rounded-full border-2 border-primary py-2.5 text-sm font-bold text-primary"
              >
                보호자 등록 해제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
