import Link from "next/link";
import { SITE_NAME, TOOLS } from "./tools";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-stone-950 text-white/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.5fr_1fr] sm:px-6">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              🧰
            </span>
            <span className="font-black">{SITE_NAME}</span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed">
            一些簡單好用的小工具，免安裝、免登入，打開瀏覽器就能用。
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">工具</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {TOOLS.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="transition hover:text-white">
                  {t.emoji} {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-white/40">
        © 2026 {SITE_NAME} · Made with Next.js
      </div>
    </footer>
  );
}
