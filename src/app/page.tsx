import Link from "next/link";
import { TOOLS } from "./components/tools";

const HIGHLIGHTS = [
  { icon: "⚡", title: "免安裝", text: "打開瀏覽器就能用，不用下載任何東西。" },
  { icon: "🔓", title: "免登入", text: "不用註冊帳號，點進來馬上開始。" },
  { icon: "📱", title: "手機也好用", text: "電腦、平板、手機都能順暢操作。" },
];

export default function Home() {
  const mid = (TOOLS.length - 1) / 2;

  return (
    <main className="relative flex-1 overflow-hidden bg-stone-950 text-white">
      {/* ===== 背景裝飾 ===== */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute -right-32 top-20 h-[420px] w-[420px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute left-1/3 top-[620px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* ===== Hero ===== */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          目前收錄 {TOOLS.length} 個小工具
        </span>

        <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
            LessonsLearn
          </span>
          <br className="sm:hidden" />
          小工具箱
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
          上課抽人、讀書專注、查生字——學習和生活裡的小需求，
          <br className="hidden sm:block" />
          這裡都有一個簡單又好看的工具幫你搞定。
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href="#tools"
            className="rounded-full bg-white px-7 py-3 font-bold text-stone-900 shadow-lg shadow-white/10 transition hover:-translate-y-0.5 hover:shadow-white/20"
          >
            探索工具 ↓
          </a>
          <Link
            href={TOOLS[0].href}
            className="rounded-full border border-white/20 bg-white/5 px-7 py-3 font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            {TOOLS[0].emoji} 先玩玩轉盤
          </Link>
        </div>

        {/* 浮動的工具圖示 */}
        <div className="mt-16 flex items-center justify-center gap-5 sm:gap-8">
          {TOOLS.map((t, i) => (
            <div
              key={t.href}
              style={{ transform: `rotate(${(i - mid) * 10}deg) translateY(${i % 2 ? -12 : 0}px)` }}
            >
              <Link
                href={t.href}
                title={t.name}
                className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${t.gradient} text-4xl shadow-2xl transition hover:scale-110 sm:h-24 sm:w-24 sm:text-5xl`}
              >
                {t.emoji}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 工具介紹 ===== */}
      <section id="tools" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-300">Tools</span>
          <h2 className="text-3xl font-black sm:text-4xl">挑一個工具開始吧</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TOOLS.map((t, i) => (
            <Link
              key={t.href}
              href={t.href}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-white/25 hover:shadow-2xl ${t.glow}`}
            >
              {/* 角落光暈 */}
              <div
                className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${t.gradient} opacity-20 blur-2xl transition group-hover:opacity-40`}
              />

              <div className="relative flex items-start justify-between">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${t.gradient} text-3xl shadow-lg`}
                >
                  {t.emoji}
                </span>
                <span className="font-mono text-sm text-white/30">{String(i + 1).padStart(2, "0")}</span>
              </div>

              <h3 className="relative mt-6 text-2xl font-black">{t.name}</h3>
              <p className={`relative mt-1 text-sm font-semibold ${t.text}`}>{t.tagline}</p>
              <p className="relative mt-4 text-sm leading-relaxed text-white/60">{t.description}</p>

              <ul className="relative mt-5 flex flex-col gap-2 text-sm text-white/80">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className={`text-xs ${t.text}`}>✦</span>
                    {f}
                  </li>
                ))}
              </ul>

              <span className="relative mt-8 inline-flex items-center gap-1 font-bold text-white">
                開始使用
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== 特色 ===== */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="flex flex-col gap-2 bg-stone-950/90 p-7">
              <span className="text-2xl">{h.icon}</span>
              <h3 className="text-lg font-bold">{h.title}</h3>
              <p className="text-sm text-white/55">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 px-6 py-14 text-center shadow-2xl shadow-fuchsia-900/40">
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-white/15 blur-2xl" />
          <h2 className="relative text-3xl font-black sm:text-4xl">今天想用哪一個？</h2>
          <p className="relative mt-3 text-white/80">要開始讀書了嗎？先來一顆番茄，配上爵士樂專注 25 分鐘 🎷</p>
          <Link
            href="/pomodoro"
            className="relative mt-8 inline-block rounded-full bg-white px-8 py-3 font-bold text-fuchsia-700 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            🍅 開始專注
          </Link>
        </div>
      </section>
    </main>
  );
}
