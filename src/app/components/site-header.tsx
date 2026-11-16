"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "./tools";

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-stone-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg shadow-lg shadow-fuchsia-500/30 transition group-hover:rotate-12">
            🧰
          </span>
          <span className="text-lg font-black tracking-wide text-white">
            LessonsLearn<span className="hidden text-white/60 sm:inline"> 小工具箱</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {TOOLS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                title={t.name}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-white text-stone-900" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{t.emoji}</span>
                <span className="hidden sm:inline">{t.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
