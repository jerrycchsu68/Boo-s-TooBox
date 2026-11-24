import type { Metadata } from "next";
import WordLookup from "./word-lookup";
import { SITE_NAME } from "../components/tools";

export const metadata: Metadata = {
  title: `生字查詢 | ${SITE_NAME}`,
  description: "查國字的注音、部首、筆畫、字義與造詞",
};

export default function LookupPage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#78350f_0%,#3b1d08_45%,#1c0f05_100%)] text-white">
      {/* 背景光暈 */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-6 px-4 py-10 sm:px-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="bg-gradient-to-b from-amber-50 via-amber-200 to-orange-400 bg-clip-text text-5xl font-black tracking-wider text-transparent drop-shadow-[0_4px_12px_rgba(251,191,36,0.4)] sm:text-6xl">
            生字查詢
          </h1>
          <p className="rounded-full border border-amber-300/30 bg-black/20 px-5 py-1 text-sm text-amber-100/90">
            注音 ｜ 部首筆畫 ｜ 字義 ｜ 造詞
          </p>
        </header>
        <WordLookup />
      </div>
    </main>
  );
}
