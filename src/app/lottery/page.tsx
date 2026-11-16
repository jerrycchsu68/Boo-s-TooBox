import type { Metadata } from "next";
import LotteryWheel from "./lottery-wheel";
import { SITE_NAME } from "../components/tools";

export const metadata: Metadata = {
  title: `幸運大轉盤 | ${SITE_NAME}`,
  description: "輸入名單，轉動轉盤抽出幸運兒",
};

export default function LotteryPage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#14532d_0%,#052e16_45%,#021a0c_100%)] text-white">
      {/* 背景光暈 */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-green-400/20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-6 px-4 py-10 sm:px-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="bg-gradient-to-b from-lime-100 via-lime-300 to-green-400 bg-clip-text text-5xl font-black tracking-wider text-transparent drop-shadow-[0_4px_12px_rgba(132,204,22,0.45)] sm:text-6xl">
            幸運大轉盤
          </h1>
          <p className="rounded-full border border-lime-300/30 bg-black/20 px-5 py-1 text-sm text-lime-100/90">
            輸入名單 ｜ 一鍵開抽 ｜ 好運降臨
          </p>
        </header>
        <LotteryWheel />
      </div>
    </main>
  );
}
