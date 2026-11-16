"use client";

import { useMemo, useRef, useState } from "react";

const SPIN_MS = 5000;
const SIZE = 400;
const CENTER = SIZE / 2;
const OUTER_R = 196; // 外框
const LIGHT_R = 181; // 燈泡所在圓
const RADIUS = 166; // 扇形半徑
const LIGHT_COUNT = 24;

// 扇形配色：深綠 / 淺綠交錯（奇數時最後一格用第三色，避免頭尾同色）
const TONES = [
  { fill: "url(#segDark)", text: "#ffffff" },
  { fill: "url(#segLight)", text: "#14532d" },
  { fill: "url(#segMid)", text: "#ffffff" },
];

const DEFAULT_NAMES = ["小明", "小華", "小美", "阿強", "小芳", "阿傑", "小婷", "阿凱"];

/** 角度以「正上方為 0 度、順時針」計算 */
function pointAt(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + r * Math.sin(rad), y: CENTER - r * Math.cos(rad) };
}

function slicePath(start: number, end: number) {
  const p0 = pointAt(start, RADIUS);
  const p1 = pointAt(end, RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${p0.x} ${p0.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${p1.x} ${p1.y} Z`;
}

function truncate(name: string, max: number) {
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}

function toneFor(i: number, n: number) {
  if (n % 2 === 1 && i === n - 1) return TONES[2];
  return TONES[i % 2];
}

function parseNames(input: string) {
  return input
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function LotteryWheel() {
  const [input, setInput] = useState(DEFAULT_NAMES.join("\n"));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<{ name: string; index: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [removeWinner, setRemoveWinner] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const names = useMemo(() => parseNames(input), [input]);
  const seg = names.length > 0 ? 360 / names.length : 360;
  const fontSize = Math.max(10, Math.min(20, 200 / Math.max(names.length, 1)));
  const maxChars = names.length > 20 ? 4 : names.length > 10 ? 5 : 7;
  const canSpin = !spinning && !winner && names.length >= 2;

  function spin() {
    if (!canSpin) return;

    const index = Math.floor(Math.random() * names.length);
    // 在該區塊中間 80% 的範圍隨機停下，避免停在邊界
    const target = index * seg + seg * (0.1 + Math.random() * 0.8);
    // 轉盤順時針轉 R 度後，指針(正上方)指到的是 (-R mod 360) 的位置
    const desired = (360 - target) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (desired - current + 360) % 360;
    const extraSpins = 6 + Math.floor(Math.random() * 3);

    setSpinning(true);
    setRotation(rotation + extraSpins * 360 + delta);

    const picked = names[index];
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSpinning(false);
      setWinner({ name: picked, index });
      setHistory((h) => [picked, ...h]);
    }, SPIN_MS);
  }

  /** 關閉中獎視窗；勾選「中獎後移除」時，才把得獎者那一行拿掉（同名只移除被抽中的那一個） */
  function confirmWinner() {
    if (winner && removeWinner) {
      let count = -1;
      setInput(
        input
          .split("\n")
          .filter((line) => {
            if (!line.trim()) return true;
            count += 1;
            return count !== winner.index;
          })
          .join("\n"),
      );
    }
    setWinner(null);
  }

  return (
    <div className="grid w-full items-start gap-10 lg:grid-cols-[1fr_320px]">
      {/* ===== 轉盤 ===== */}
      <section className="flex flex-col items-center gap-5">
        <div className="relative aspect-square w-full max-w-[440px] drop-shadow-[0_0_40px_rgba(74,222,128,0.35)]">
          {/* 固定外框 + 跑馬燈 */}
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <radialGradient id="rim" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#065f46" />
              </radialGradient>
            </defs>
            <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="url(#rim)" stroke="#bef264" strokeWidth={3} />
            <circle cx={CENTER} cy={CENTER} r={RADIUS + 4} fill="#052e16" stroke="#86efac" strokeWidth={2} />
            {Array.from({ length: LIGHT_COUNT }, (_, i) => {
              const p = pointAt((360 / LIGHT_COUNT) * i, LIGHT_R);
              const odd = i % 2 === 1;
              return (
                <circle key={i} cx={p.x} cy={p.y} r={5} fill={odd ? "#ffffff" : "#fde047"}>
                  <animate
                    attributeName="fill"
                    values={odd ? "#ffffff;#fde047;#ffffff" : "#fde047;#ffffff;#fde047"}
                    dur={spinning ? "0.3s" : "1.2s"}
                    repeatCount="indefinite"
                  />
                </circle>
              );
            })}
          </svg>

          {/* 會旋轉的扇形 */}
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={names.length ? `抽獎轉盤，共 ${names.length} 個名字` : "抽獎轉盤，尚未輸入名單"}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : "none",
            }}
          >
            <defs>
              <radialGradient id="segDark" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
              </radialGradient>
              <radialGradient id="segLight" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#dcfce7" />
              </radialGradient>
              <radialGradient id="segMid" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a3e635" />
                <stop offset="100%" stopColor="#4d7c0f" />
              </radialGradient>
            </defs>

            {names.length === 0 && <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#14532d" />}
            {names.length === 1 && <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#segDark)" />}

            {names.map((name, i) => {
              const start = i * seg;
              const mid = start + seg / 2;
              const tone = toneFor(i, names.length);
              const ty = CENTER - RADIUS * 0.68;
              return (
                <g key={`${name}-${i}`}>
                  {names.length > 1 && (
                    <path d={slicePath(start, start + seg)} fill={tone.fill} stroke="#166534" strokeWidth={1.5} />
                  )}
                  <g transform={`rotate(${mid} ${CENTER} ${CENTER})`}>
                    <text
                      x={CENTER}
                      y={ty}
                      fill={tone.text}
                      fontSize={fontSize}
                      fontWeight={800}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(-90 ${CENTER} ${ty})`}
                    >
                      {truncate(name, maxChars)}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* 中央按鈕 + 指針（固定不轉） */}
          <button
            onClick={spin}
            disabled={!canSpin}
            aria-label="開始抽獎"
            className="group absolute left-1/2 top-1/2 flex aspect-square w-[26%] -translate-x-1/2 -translate-y-1/2 items-center justify-center disabled:cursor-not-allowed"
          >
            {/* 指針 */}
            <span
              className="absolute -top-[38%] left-1/2 h-[50%] w-[40%] -translate-x-1/2 bg-gradient-to-b from-lime-200 to-green-500 drop-shadow"
              style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
            />
            {/* 按鈕本體 */}
            <span className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-lime-200 bg-gradient-to-b from-lime-300 via-green-500 to-green-700 shadow-[0_6px_0_#14532d,0_0_24px_rgba(190,242,100,0.6)] transition group-hover:brightness-110 group-active:translate-y-0.5 group-active:shadow-[0_3px_0_#14532d] group-disabled:brightness-90">
              <span className="text-center text-sm font-black leading-tight text-white drop-shadow sm:text-lg">
                {spinning ? (
                  "抽獎中"
                ) : (
                  <>
                    開始
                    <br />
                    抽獎
                  </>
                )}
              </span>
            </span>
          </button>
        </div>

        {names.length < 2 && (
          <p className="rounded-full bg-black/30 px-4 py-1 text-sm text-lime-100/80">請至少輸入 2 個名字才能抽獎</p>
        )}
      </section>

      {/* ===== 名單 & 紀錄 ===== */}
      <aside className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-lime-300/20 bg-black/30 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <label htmlFor="names" className="font-bold text-lime-200">
              抽獎名單
            </label>
            <span className="rounded-full bg-lime-300/15 px-2.5 py-0.5 text-xs text-lime-100">共 {names.length} 人</span>
          </div>
          <textarea
            id="names"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={spinning}
            rows={10}
            placeholder={"一行輸入一個名字\n例如：\n小明\n小華"}
            className="w-full resize-y rounded-xl border border-green-700 bg-green-950/60 p-3 text-sm text-white outline-none placeholder:text-green-300/40 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30 disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-2 text-sm">
            <label className="flex items-center gap-2 text-lime-100/90">
              <input
                type="checkbox"
                checked={removeWinner}
                onChange={(e) => setRemoveWinner(e.target.checked)}
                className="accent-lime-400"
              />
              中獎後從名單移除
            </label>
            <button
              onClick={() => setInput("")}
              disabled={spinning}
              className="text-lime-100/60 hover:text-lime-200 disabled:opacity-50"
            >
              清空名單
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-lime-300/20 bg-black/30 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lime-200">中獎紀錄</h2>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="text-sm text-lime-100/60 hover:text-lime-200">
                清除紀錄
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-lime-100/50">尚無紀錄</p>
          ) : (
            <ol className="flex max-h-64 flex-col gap-1.5 overflow-y-auto text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg bg-green-900/50 px-3 py-1.5">
                  <span className="w-8 font-mono text-lime-300/70">#{history.length - i}</span>
                  <span className="font-semibold">{h}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>

      {/* ===== 中獎彈窗 ===== */}
      {winner && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="中獎結果"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/70 p-4 backdrop-blur-sm"
          onClick={confirmWinner}
        >
          <div
            className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border-2 border-lime-300/60 bg-gradient-to-b from-green-600 to-green-900 px-8 pb-8 pt-10 text-center text-white shadow-[0_0_60px_rgba(132,204,22,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-8 text-6xl drop-shadow-lg">🎉</div>
            <p className="bg-gradient-to-b from-lime-100 to-lime-300 bg-clip-text text-2xl font-black tracking-widest text-transparent">
              恭喜中獎
            </p>
            <p className="my-2 w-full break-all rounded-2xl bg-white px-4 py-4 text-4xl font-black text-green-700 shadow-inner">
              {winner.name}
            </p>
            <button
              onClick={confirmWinner}
              autoFocus
              className="mt-2 w-full rounded-full bg-gradient-to-b from-yellow-200 to-amber-400 py-3 text-lg font-black text-green-900 shadow-[0_4px_0_#b45309] transition active:translate-y-0.5 active:shadow-[0_2px_0_#b45309]"
            >
              太棒了！
            </button>
          </div>
          <button
            onClick={confirmWinner}
            aria-label="關閉"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 text-xl text-white/80 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
