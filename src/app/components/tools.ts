export type Tool = {
  href: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  features: string[];
  /** 卡片配色 */
  gradient: string;
  glow: string;
  text: string;
};

export const SITE_NAME = "LessonsLearn 小工具箱";

export const TOOLS: Tool[] = [
  {
    href: "/lottery",
    name: "幸運大轉盤",
    emoji: "🎡",
    tagline: "公平又刺激的抽獎神器",
    description: "輸入名單，按下按鈕，轉盤轉呀轉，停在誰就是誰。上課點名、聚會、決定誰請客都適用。",
    features: ["自由輸入抽獎名單", "跑馬燈轉盤動畫", "中獎自動移出名單", "保留中獎紀錄"],
    gradient: "from-green-400 to-emerald-600",
    glow: "group-hover:shadow-emerald-500/30",
    text: "text-emerald-300",
  },
  {
    href: "/pomodoro",
    name: "番茄鐘",
    emoji: "🍅",
    tagline: "專注 25 分鐘，效率翻倍",
    description: "用番茄工作法切分時間，專注時播放英文爵士樂，專注與休息交替進行。",
    features: ["專注 / 短休息 / 長休息", "專注時播放爵士背景音樂", "時間到提示音與通知", "專注任務紀錄"],
    gradient: "from-rose-400 to-red-600",
    glow: "group-hover:shadow-rose-500/30",
    text: "text-rose-300",
  },
  {
    href: "/lookup",
    name: "生字查詢",
    emoji: "📖",
    tagline: "一個字，查清楚",
    description: "輸入國字，馬上查到注音、部首、筆畫、字義和造詞，還能聽發音、看筆順動畫。",
    features: ["注音與多音字", "部首與筆畫", "字義與例句", "造詞與筆順動畫"],
    gradient: "from-amber-300 to-orange-600",
    glow: "group-hover:shadow-amber-500/30",
    text: "text-amber-300",
  },
];
