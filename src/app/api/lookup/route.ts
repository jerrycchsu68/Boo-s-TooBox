import type { NextRequest } from "next/server";
import { cacheLife } from "next/cache";

/**
 * 生字查詢轉接：資料來源為「Line國語小幫手」
 * https://linebot-lang.difangbaba.com/bopomofo（教育部國語辭典簡編本）
 */
const API = "https://linebot-lang.difangbaba.com/bot/bopomofo_cmd";
const SOURCE_URL = "https://linebot-lang.difangbaba.com/bopomofo";

type RawResult = Record<string, unknown> & { text?: string; option?: string };

export type Reading = { label: string; zhuyin: string };
export type FormationGroup = { zhuyin: string | null; words: string[] };
export type MeaningSection = { zhuyin: string; lines: string[] };

export type LookupResult = {
  char: string;
  readings: Reading[];
  radical: string | null;
  strokes: string | null;
  audioUrl: string | null;
  strokeUrl: string | null;
  strokeTrainUrl: string | null;
  formations: FormationGroup[];
  meanings: MeaningSection[];
  english: string | null;
  dictionary: string | null;
  sourceUrl: string;
};

async function ask(cmd: string): Promise<RawResult> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ cmd }),
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return (await res.json()) as RawResult;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** "(一)ㄋㄧˊ(二)ㄋㄧˋ" → [{label:"一",zhuyin:"ㄋㄧˊ"},...]；單音字 → [{label:"",zhuyin}] */
function parseReadings(raw: string | null): Reading[] {
  if (!raw) return [];
  const parts = [...raw.matchAll(/\(([一二三四五六七八九十]+)\)([^(]+)/g)];
  if (parts.length === 0) return [{ label: "", zhuyin: raw }];
  return parts.map((m) => ({ label: m[1], zhuyin: m[2].trim() }));
}

/** 多音字：[[讀音,[詞...]],...]；單音字：[[詞,詞,...]] */
function parseFormations(raw: unknown): FormationGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((g): FormationGroup[] => {
    if (!Array.isArray(g)) return [];
    if (g.length === 2 && typeof g[0] === "string" && Array.isArray(g[1])) {
      return [{ zhuyin: g[0], words: g[1].filter((w): w is string => typeof w === "string") }];
    }
    return [{ zhuyin: null, words: g.filter((w): w is string => typeof w === "string") }];
  });
}

/** 字義全文 → 依讀音分段 + 英文解釋 */
function parseMeanings(text: string | null): { meanings: MeaningSection[]; english: string | null } {
  if (!text || text.startsWith("找不到")) return { meanings: [], english: null };
  const [zh, en] = text.split("【英】");
  const body = zh
    .replace(/^.*的字義:\s*\n/, "")
    .replace(/參考字典：.*$/m, "")
    .trim();
  const meanings = body
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map(([zhuyin, ...lines]) => ({ zhuyin, lines }));
  const english = en ? en.replace(/資料來源：.*$/m, "").trim() || null : null;
  return { meanings, english };
}

async function lookup(char: string): Promise<LookupResult | null> {
  "use cache";
  cacheLife("days");

  const info = await ask(char);
  if (info.option !== "word") return null;

  const [formation, meaning] = await Promise.all([ask(`查造詞 ${char}`), ask(`查字義 ${char}`)]);
  const { meanings, english } = parseMeanings(str(meaning.text));

  return {
    char,
    readings: parseReadings(str(info.bopomofo)),
    radical: str(info.radical),
    strokes: str(info.strokes),
    audioUrl: str(info.audio),
    strokeUrl: str(info.animation2),
    strokeTrainUrl: str(info.animation1),
    formations: parseFormations(formation.all_formations),
    meanings,
    english,
    dictionary: str(info.dictionary),
    sourceUrl: SOURCE_URL,
  };
}

const HAN = /^\p{Script=Han}$/u;

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const char = [...q][0] ?? "";

  if (!HAN.test(char)) {
    return Response.json({ error: "請輸入一個國字" }, { status: 400 });
  }

  try {
    const result = await lookup(char);
    if (!result) {
      return Response.json({ error: `找不到「${char}」的資料` }, { status: 404 });
    }
    return Response.json(result);
  } catch {
    return Response.json({ error: "查詢服務暫時無法使用，請稍後再試" }, { status: 502 });
  }
}
