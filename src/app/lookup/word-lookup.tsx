"use client";

import { useRef, useState, type FormEvent } from "react";
import type { LookupResult } from "../api/lookup/route";

const SAMPLES = ["泥", "行", "鬧", "飛", "學"];
const MAX_CHARS = 12;

type State =
  | { status: "idle" }
  | { status: "loading"; char: string }
  | { status: "error"; char: string; message: string }
  | { status: "done"; data: LookupResult };

function hanChars(text: string): string[] {
  const seen = new Set<string>();
  for (const ch of text) {
    if (/\p{Script=Han}/u.test(ch)) seen.add(ch);
    if (seen.size >= MAX_CHARS) break;
  }
  return [...seen];
}

/** 把「[例]…」拆出來另外上色 */
function MeaningLine({ line }: { line: string }) {
  const [def, ...examples] = line.split("[例]");
  return (
    <li className="leading-relaxed">
      <span className="text-white/90">{def}</span>
      {examples.map((ex, i) => (
        <span key={i} className="ml-2 inline-block rounded-md bg-amber-400/10 px-2 py-0.5 text-sm text-amber-200">
          例｜{ex}
        </span>
      ))}
    </li>
  );
}

export default function WordLookup() {
  const [input, setInput] = useState("");
  const [chars, setChars] = useState<string[]>([]);
  const [state, setState] = useState<State>({ status: "idle" });
  const [history, setHistory] = useState<string[]>([]);
  const cache = useRef(new Map<string, LookupResult>());

  const current =
    state.status === "done" ? state.data.char : state.status === "idle" ? null : state.char;

  async function lookup(char: string) {
    const cached = cache.current.get(char);
    if (cached) {
      setState({ status: "done", data: cached });
      return;
    }
    setState({ status: "loading", char });
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(char)}`);
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", char, message: json.error ?? "查詢失敗" });
        return;
      }
      cache.current.set(char, json as LookupResult);
      setState({ status: "done", data: json as LookupResult });
      setHistory((h) => [char, ...h.filter((c) => c !== char)].slice(0, 20));
    } catch {
      setState({ status: "error", char, message: "網路連線失敗，請稍後再試" });
    }
  }

  function search(text: string) {
    const list = hanChars(text);
    setChars(list);
    if (list.length === 0) {
      setState({ status: "error", char: "", message: "請輸入至少一個國字" });
      return;
    }
    lookup(list[0]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    search(input);
  }

  function pick(text: string) {
    setInput(text);
    search(text);
  }

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[1fr_280px]">
      <div className="flex min-w-0 flex-col gap-6">
        {/* 搜尋框 */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-3xl border border-amber-300/20 bg-black/30 p-5 shadow-2xl backdrop-blur sm:p-6"
        >
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入要查的字，例如：泥"
              aria-label="要查詢的國字"
              className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-2xl text-white outline-none placeholder:text-base placeholder:text-white/35 focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/30"
            />
            <button
              type="submit"
              disabled={state.status === "loading"}
              className="shrink-0 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 px-6 font-black text-stone-900 shadow-lg shadow-orange-900/40 transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              查詢
            </button>
          </div>

          {chars.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-white/50">點選要看的字：</span>
              {chars.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => lookup(c)}
                  className={`h-11 w-11 rounded-xl text-xl font-bold transition ${
                    c === current
                      ? "bg-amber-300 text-stone-900"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white/50">試試看：</span>
              {SAMPLES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pick(c)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/80 transition hover:bg-white/10"
                >
                  {c}
                </button>
              ))}
              <span className="text-white/35">（一次可貼上多個字，最多 {MAX_CHARS} 個）</span>
            </div>
          )}
        </form>

        {/* 結果 */}
        {state.status === "idle" && (
          <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-white/50">
            📖 輸入一個字，查注音、部首、筆畫、字義和造詞
          </div>
        )}

        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-white/70">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
            正在查詢「{state.char}」…
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-6 text-center text-rose-200">
            {state.message}
          </div>
        )}

        {state.status === "done" && <ResultCard data={state.data} />}
      </div>

      {/* 側邊：查詢紀錄 */}
      <aside className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur lg:self-start">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">🕘 查詢紀錄</h2>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-xs text-white/40 transition hover:text-white/80"
            >
              清除
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-white/40">還沒有查過任何字</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {history.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => lookup(c)}
                className={`h-11 w-11 rounded-xl text-xl font-bold transition ${
                  c === current
                    ? "bg-amber-300 text-stone-900"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function ResultCard({ data }: { data: LookupResult }) {
  const [showEnglish, setShowEnglish] = useState(false);
  const multi = data.readings.length > 1;
  const wordCount = data.formations.reduce((n, g) => n + g.words.length, 0);

  return (
    <article className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur sm:p-7">
      {/* 字頭 */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center self-center rounded-2xl border-2 border-amber-300/60 bg-amber-50 text-7xl font-bold text-stone-900 shadow-lg sm:self-auto">
          {/* 田字格 */}
          <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-rose-300" />
          <span className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-rose-300" />
          <span className="relative">{data.char}</span>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {data.readings.map((r) => (
              <span
                key={r.label + r.zhuyin}
                className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xl font-bold text-amber-200"
              >
                {r.label && <span className="mr-1 text-sm text-amber-300/70">({r.label})</span>}
                {r.zhuyin}
              </span>
            ))}
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-white/80">
            {data.radical && (
              <div className="flex gap-2">
                <dt className="text-white/45">部首</dt>
                <dd>{data.radical}</dd>
              </div>
            )}
            {data.strokes && (
              <div className="flex gap-2">
                <dt className="text-white/45">筆畫</dt>
                <dd>{data.strokes} 畫</dd>
              </div>
            )}
          </dl>
          <div className="flex flex-wrap gap-2">
            {data.audioUrl && (
              <a
                href={data.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5"
              >
                🔊 聽發音
              </a>
            )}
            {data.strokeUrl && (
              <a
                href={data.strokeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                ✍️ 筆順動畫
              </a>
            )}
            {data.strokeTrainUrl && (
              <a
                href={data.strokeTrainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                🖐️ 筆順練習
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 字義 */}
      <section className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-lg font-black text-white">
          <span className="text-amber-300">✦</span> 字義
        </h3>
        {data.meanings.length === 0 ? (
          <p className="text-sm text-white/45">查無字義資料</p>
        ) : (
          data.meanings.map((m) => (
            <div key={m.zhuyin} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-2 font-bold text-amber-200">{m.zhuyin}</p>
              <ul className="flex flex-col gap-2 text-[15px]">
                {m.lines.map((l, i) => (
                  <MeaningLine key={i} line={l} />
                ))}
              </ul>
            </div>
          ))
        )}
        {data.english && (
          <div>
            <button
              type="button"
              onClick={() => setShowEnglish((v) => !v)}
              className="text-sm text-white/50 transition hover:text-white/85"
            >
              {showEnglish ? "▾" : "▸"} 英文解釋
            </button>
            {showEnglish && (
              <p className="mt-2 whitespace-pre-line rounded-2xl bg-black/20 p-4 text-sm leading-relaxed text-white/70">
                {data.english}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 造詞 */}
      <section className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-lg font-black text-white">
          <span className="text-amber-300">✦</span> 造詞
          <span className="text-sm font-normal text-white/40">共 {wordCount} 個</span>
        </h3>
        {wordCount === 0 ? (
          <p className="text-sm text-white/45">查無造詞資料</p>
        ) : (
          data.formations.map((g, gi) => (
            <div key={gi} className="flex flex-col gap-2">
              {multi && g.zhuyin && <p className="text-sm font-bold text-amber-200/90">{g.zhuyin}</p>}
              <div className="flex flex-wrap gap-2">
                {g.words.map((w) => (
                  <span
                    key={w}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-white/85"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <footer className="border-t border-white/10 pt-4 text-xs text-white/40">
        資料來源：
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">
          Line國語小幫手
        </a>
        {data.dictionary && `（${data.dictionary}）`}
      </footer>
    </article>
  );
}
