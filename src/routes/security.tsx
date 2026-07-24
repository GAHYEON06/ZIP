import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "보안 화면 · 안심 귀갓길" },
      { name: "description", content: "위장 화면 뒤에서 몰래 신고와 녹화를 시작하세요." },
      { property: "og:title", content: "보안 화면" },
      { property: "og:description", content: "위장 잠금화면 + 은밀 신고" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Security,
});

function Security() {
  const nav = useNavigate();
  const { guardianPhone } = useGuardian();
  const [tapCount, setTapCount] = useState(0);
  const [recording, setRecording] = useState(false);
  const [reported, setReported] = useState(false);
  const [pressStart, setPressStart] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tapTimerRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);

  const now = () => new Date();
  const [clock, setClock] = useState(now());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const triggerReport = async () => {
    setReported(true);
    setRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.warn("camera denied", e);
    }
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => cleanup, []);

  // Simulate "power button pressed 3 times" via 3 quick taps on power indicator
  const handlePowerTap = () => {
    setTapCount((c) => {
      const next = c + 1;
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = window.setTimeout(() => setTapCount(0), 1200);
      if (next >= 3 && !reported) {
        triggerReport();
        return 0;
      }
      return next;
    });
  };

  // Long-press anywhere to release
  const handlePressStart = () => {
    setPressStart(Date.now());
    const tick = () => {
      if (pressStart == null) return;
      const elapsed = Date.now() - (pressStart ?? Date.now());
      setHoldProgress(Math.min(1, elapsed / 2000));
      if (elapsed >= 2000) {
        cleanup();
        nav({ to: "/" });
        return;
      }
      holdRafRef.current = requestAnimationFrame(tick);
    };
    holdRafRef.current = requestAnimationFrame(tick);
  };
  const handlePressEnd = () => {
    setPressStart(null);
    setHoldProgress(0);
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
  };

  // proper long-press using elapsed time
  useEffect(() => {
    if (pressStart == null) return;
    let raf = 0;
    const loop = () => {
      const el = Date.now() - pressStart;
      setHoldProgress(Math.min(1, el / 2000));
      if (el >= 2000) {
        cleanup();
        nav({ to: "/" });
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pressStart, nav]);

  const time = clock.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = clock.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden text-white select-none"
      style={{
        backgroundImage:
          "linear-gradient(160deg, oklch(0.35 0.13 300) 0%, oklch(0.45 0.15 250) 40%, oklch(0.28 0.12 220) 100%)",
      }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {/* Camera preview when recording (hidden behind wallpaper) */}
      {recording && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          playsInline
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-4 flex items-center justify-between px-6 text-[11px]">
        <span>{time.slice(0, 5)}</span>
        <span className="flex items-center gap-1">
          <span>5G</span> <span>􀛨</span> <span>82%</span>
        </span>
      </div>

      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="text-6xl font-thin tracking-tight">{time}</div>
        <div className="text-sm opacity-80">{date}</div>

        {/* Fake notifications */}
        <div className="mt-10 w-72 space-y-2 text-left">
          <FakeNotif app="메시지" title="엄마" body="집에 언제 와?" />
          <FakeNotif app="캘린더" title="내일 09:00" body="스터디 모임" />
        </div>
      </div>

      {/* "Power button" affordance (top-right edge) */}
      <button
        onClick={handlePowerTap}
        aria-label="전원 버튼"
        className="absolute right-0 top-40 h-16 w-2 rounded-l bg-white/20"
      />
      {tapCount > 0 && !reported && (
        <div className="pointer-events-none absolute right-4 top-40 rounded-full bg-white/20 px-2 py-1 text-[10px]">
          {tapCount}/3
        </div>
      )}

      {/* Bottom hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2">
        <div className="h-1 w-32 rounded-full bg-white/40" />
        <div className="text-[10px] opacity-70">위로 스와이프하여 잠금 해제</div>
      </div>

      {/* Long-press progress */}
      {holdProgress > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex flex-col items-center">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${holdProgress * 100}%` }} />
          </div>
          <div className="mt-2 text-[10px]">길게 눌러 보안화면 해제…</div>
        </div>
      )}

      {/* Report indicator - subtle red dot */}
      {reported && (
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1 rounded-full bg-red-600/80 px-2 py-1 text-[10px]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC
        </div>
      )}

      {/* Info card only in first render */}
      <div className="absolute inset-x-4 top-16 rounded-2xl bg-black/40 p-3 text-[11px] backdrop-blur">
        <div className="font-bold">🛡️ 보안 화면 (위장모드)</div>
        <p className="mt-1 opacity-90">
          우측 전원버튼 아이콘을 3번 탭 → 몰래 112 신고 + 카메라 녹화 시작.
          화면을 2초간 길게 눌러 해제하세요.
          {guardianPhone && <> 보호자({guardianPhone})에게도 알림이 전송돼요.</>}
        </p>
      </div>

      <Link
        to="/"
        className="absolute left-3 top-3 rounded-full bg-white/20 px-2 py-1 text-[10px] backdrop-blur"
      >
        ← 나가기
      </Link>
    </div>
  );
}

function FakeNotif({ app, title, body }: { app: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <div className="flex items-center justify-between text-[10px] opacity-80">
        <span>{app}</span>
        <span>지금</span>
      </div>
      <div className="mt-0.5 text-xs font-bold">{title}</div>
      <div className="text-[11px] opacity-90">{body}</div>
    </div>
  );
}
