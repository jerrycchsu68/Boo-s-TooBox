import type { Metadata } from "next";
import PomodoroTimer from "./pomodoro-timer";
import { SITE_NAME } from "../components/tools";

export const metadata: Metadata = {
  title: `番茄鐘 | ${SITE_NAME}`,
  description: "番茄工作法計時器，專注時播放英文爵士背景音樂",
};

export default function PomodoroPage() {
  return <PomodoroTimer />;
}
