"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "focus" | "short" | "long";

type Settings = {
  focus: number; // 分鐘
  short: number;
  long: number;
  longEvery: number; // 每幾顆番茄來一次長休息
  autoStart: boolean;
  sound: boolean;
};

type LogItem = { task: string; minutes: number; at: string };

const MODE_INFO: Record<
  Mode,
  { label: string; hint: string; bg: string; ring: string; accent: string; button: string }
> = {
  focus: {
    label: "專注",
    hint: "專心做一件事，別分心！",
    bg: "from-rose-900 via-red-950 to-stone-950",
    ring: "#fb7185",
    accent: "text-rose-300",
    button: "bg-rose-500 hover:bg-rose-400 shadow-rose-500/40",
  },
  short: {
    label: "短休息",
    hint: "起來走走、喝口水吧 ☕",
    bg: "from-emerald-900 via-teal-950 to-stone-950",
    ring: "#34d399",
    accent: "text-emerald-300",
    button: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40",
  },
  long: {
    label: "長休息",
    hint: "辛苦了，好好放鬆一下 🌿",
    bg: "from-sky-900 via-indigo-950 to-stone-950",
    ring: "#38bdf8",
    accent: "text-sky-300",
    button: "bg-sky-500 hover:bg-sky-400 shadow-sky-500/40",
  },
};

/** 英文爵士網路電台（皆為 HTTPS 串流，2026-11 實測可播放） */
const STATIONS = [
  { name: "Ella Radio – Modern Vocal Jazz", url: "https://stream.ella-radio.de/ella-modern-vocal-jazz/mp3-192/" },
  { name: "Crooner Radio – Legends（經典男女聲爵士）", url: "https://croonerradio_legends.ice.infomaniak.ch/croonerradio-legends-midfi.mp3" },
  { name: "Suite Jazz Radio", url: "https://jenny.torontocast.com:2000/stream/suitejazzradio" },
  { name: "Jazz Radio", url: "https://jazz-wr04.ice.infomaniak.ch/jazz-wr04-128.mp3" },
  { name: "Radio Swiss Jazz", url: "https://stream.srg-ssr.ch/m/rsj/mp3_128" },
];

const DEFAULT_SETTINGS: Settings = {
  focus: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  autoStart: false,
  sound: true,
};

const RING_R = 140;
const RING_C = 2 * Math.PI * RING_R;

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 用 Web Audio 產生提示音，不需要音檔 */
function playChime() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 2 ? 1046 : 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.32);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // 瀏覽器不支援就略過
  }
}

function notify(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export default function PomodoroTimer() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DEFAULT_SETTINGS.focus * 60_000);
  const [endAt, setEndAt] = useState<number | null>(null); // 有值 = 計時中
  const [completed, setCompleted] = useState(0);
  const [task, setTask] = useState("");
  const [log, setLog] = useState<LogItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const askedPermission = useRef(false);

  // 背景音樂
  const [musicOn, setMusicOn] = useState(true);
  const [station, setStation] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [musicStatus, setMusicStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);

  const running = endAt !== null;
  const total = settings[mode] * 60_000;
  const progress = total > 0 ? 1 - remaining / total : 0;
  const info = MODE_INFO[mode];
  const shouldPlay = running && mode === "focus" && musicOn;

  const switchMode = useCallback(
    (next: Mode, autoStart = false) => {
      const ms = settings[next] * 60_000;
      setMode(next);
      setRemaining(ms);
      setEndAt(autoStart ? Date.now() + ms : null);
    },
    [settings],
  );

  // 一段結束
  const finish = useCallback(() => {
    if (settings.sound) playChime();
    if (mode === "focus") {
      const done = completed + 1;
      setCompleted(done);
      setLog((l) => [
        {
          task: task.trim() || "未命名任務",
          minutes: settings.focus,
          at: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }),
        },
        ...l,
      ]);
      const next: Mode = done % settings.longEvery === 0 ? "long" : "short";
      notify("🍅 專注完成！", `已完成 ${done} 顆番茄，該${MODE_INFO[next].label}了`);
      switchMode(next, settings.autoStart);
    } else {
      notify("⏰ 休息結束", "準備開始下一顆番茄吧！");
      switchMode("focus", settings.autoStart);
    }
  }, [mode, completed, task, settings, switchMode]);

  // 計時（用結束時間戳計算，切到背景分頁也不會跑慢）
  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => {
      const left = endAt - Date.now();
      if (left <= 0) {
        clearInterval(id);
        finish();
      } else {
        setRemaining(left);
      }
    }, 200);
    return () => clearInterval(id);
  }, [endAt, finish]);

  // 分頁標題顯示剩餘時間
  useEffect(() => {
    const prev = document.title;
    if (running) document.title = `${format(remaining)} ${info.label} | 番茄鐘`;
    return () => {
      document.title = prev;
    };
  }, [running, remaining, info.label]);

  // 專注計時中才播放爵士樂；暫停或休息時停止
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    if (shouldPlay) {
      const url = STATIONS[station].url;
      if (el.src !== url) el.src = url;
      el.play().catch(() => setMusicStatus("error"));
    } else {
      el.pause();
      // 中斷串流連線，下次播放從直播的最新進度開始
      el.removeAttribute("src");
      el.load();
    }
  }, [shouldPlay, station]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  const toggle = useCallback(() => {
    if (endAt !== null) {
      setRemaining(Math.max(0, endAt - Date.now()));
      setEndAt(null);
    } else {
      if (!askedPermission.current && typeof Notification !== "undefined" && Notification.permission === "default") {
        askedPermission.current = true;
        Notification.requestPermission();
      }
      setEndAt(Date.now() + remaining);
    }
  }, [endAt, remaining]);

  // 空白鍵 開始/暫停
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.code === "Space" && !["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(tag)) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    // 修改目前模式的時間且尚未計時 → 直接套用
    if (key === mode && !running) setRemaining((value as number) * 60_000);
  }

  const dotsDone = completed % settings.longEvery;

  return (
    <main className={`flex flex-1 flex-col bg-gradient-to-b ${info.bg} text-white transition-colors duration-700`}>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-8 px-4 py-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-black tracking-wide">🍅 番茄鐘</h1>
          <p className="text-sm text-white/60">專注 → 休息 → 再專注，一次只做一件事</p>
        </header>

        {/* 模式切換 */}
        <nav className="flex rounded-full bg-black/30 p-1 text-sm">
          {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-full px-5 py-2 font-semibold transition ${
                m === mode ? "bg-white text-stone-900 shadow" : "text-white/70 hover:text-white"
              }`}
            >
              {MODE_INFO[m].label}
            </button>
          ))}
        </nav>

        {/* 計時圓環 */}
        <div className="relative aspect-square w-full max-w-[320px]">
          <svg viewBox="0 0 320 320" className="h-full w-full -rotate-90">
            <circle cx={160} cy={160} r={RING_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={14} />
            <circle
              cx={160}
              cy={160}
              r={RING_R}
              fill="none"
              stroke={info.ring}
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.7s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className={`text-sm font-semibold tracking-widest ${info.accent}`}>{info.label}</span>
            <span className="font-mono text-6xl font-bold tabular-nums sm:text-7xl">{format(remaining)}</span>
            <span className="max-w-[70%] text-center text-xs text-white/60">{info.hint}</span>
          </div>
        </div>

        {/* 控制按鈕 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => switchMode(mode)}
            aria-label="重設"
            title="重設"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl hover:bg-white/20"
          >
            ↺
          </button>
          <button
            onClick={toggle}
            className={`w-40 rounded-full py-4 text-xl font-black shadow-lg transition active:scale-95 ${info.button}`}
          >
            {running ? "暫停" : remaining < total ? "繼續" : "開始"}
          </button>
          <button
            onClick={finish}
            aria-label="跳過"
            title="跳過（直接結束這一段）"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl hover:bg-white/20"
          >
            ⏭
          </button>
        </div>
        <p className="-mt-4 text-xs text-white/40">快捷鍵：空白鍵 開始 / 暫停</p>

        {/* 目前任務 & 進度 */}
        <section className="flex w-full flex-col gap-4 rounded-2xl bg-black/25 p-5 backdrop-blur">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="現在要專注在什麼事情上？"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/40 focus:border-white/40"
          />
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/60">距離長休息</span>
              {Array.from({ length: settings.longEvery }, (_, i) => (
                <span key={i} className={i < dotsDone ? "" : "opacity-25 grayscale"}>
                  🍅
                </span>
              ))}
            </div>
            <span className="text-white/80">
              今日完成 <b className="text-lg">{completed}</b> 顆
            </span>
          </div>
        </section>

        {/* 背景音樂 */}
        <section className="flex w-full flex-col gap-4 rounded-2xl bg-black/25 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">🎷 爵士背景音樂</h2>
            <span className="flex items-center gap-2 text-xs text-white/60">
              {musicStatus === "playing" && (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                  播放中
                </>
              )}
              {musicStatus === "loading" && "連線中…"}
              {musicStatus === "error" && <span className="text-amber-300">無法播放，請換一個電台</span>}
              {musicStatus === "idle" && (musicOn ? "專注開始時自動播放" : "已關閉")}
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={musicOn} onChange={(e) => setMusicOn(e.target.checked)} />
            專注時播放英文爵士樂（休息、暫停時自動停止）
          </label>
          <div className="grid gap-4 text-sm sm:grid-cols-[1fr_160px]">
            <label className="flex flex-col gap-1">
              <span className="text-white/60">電台</span>
              <select
                value={station}
                onChange={(e) => setStation(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-white/40 [&>option]:bg-stone-900"
              >
                {STATIONS.map((s, i) => (
                  <option key={s.url} value={i}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white/60">音量 {Math.round(volume * 100)}%</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-9 accent-rose-400"
              />
            </label>
          </div>
          <audio
            ref={audio}
            preload="none"
            onLoadStart={() => setMusicStatus("loading")}
            onEmptied={() => setMusicStatus("idle")}
            onWaiting={() => setMusicStatus("loading")}
            onPlaying={() => setMusicStatus("playing")}
            onError={() => shouldPlay && setMusicStatus("error")}
          />
        </section>

        {/* 設定 */}
        <section className="w-full rounded-2xl bg-black/25 backdrop-blur">
          <button
            onClick={() => setShowSettings((s) => !s)}
            aria-expanded={showSettings}
            className="flex w-full items-center justify-between px-5 py-4 font-semibold"
          >
            ⚙️ 設定
            <span className={`transition ${showSettings ? "rotate-180" : ""}`}>▾</span>
          </button>
          {showSettings && (
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 px-5 py-4 text-sm sm:grid-cols-4">
              {(
                [
                  ["focus", "專注（分）", 1, 120],
                  ["short", "短休息（分）", 1, 60],
                  ["long", "長休息（分）", 1, 60],
                  ["longEvery", "長休息間隔（顆）", 2, 10],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-white/60">{label}</span>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={settings[key]}
                    onChange={(e) => {
                      const v = Math.min(max, Math.max(min, Number(e.target.value) || min));
                      updateSetting(key, v);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-white/40"
                  />
                </label>
              ))}
              <label className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoStart}
                  onChange={(e) => updateSetting("autoStart", e.target.checked)}
                />
                結束後自動開始下一段
              </label>
              <label className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.sound}
                  onChange={(e) => updateSetting("sound", e.target.checked)}
                />
                結束時播放提示音
              </label>
            </div>
          )}
        </section>

        {/* 專注紀錄 */}
        {log.length > 0 && (
          <section className="flex w-full flex-col gap-3 rounded-2xl bg-black/25 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">📋 專注紀錄</h2>
              <button onClick={() => setLog([])} className="text-xs text-white/50 hover:text-white">
                清除
              </button>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm">
              {log.map((item, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span className="truncate">🍅 {item.task}</span>
                  <span className="shrink-0 text-white/50">
                    {item.at} · {item.minutes} 分
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
