"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateAnalytics } from "@/lib/domain/analytics";
import { createUserCourse, findCourseById, parBreakdown, upsertUserPreset } from "@/lib/domain/courses";
import { PAR_TEMPLATES, ROUND_TYPE_LABELS } from "@/lib/domain/constants";
import { isHoleRequiredComplete } from "@/lib/domain/progress";
import type {
  GolfCourse,
  HoleScore,
  RoundConfig,
  RoundRecord,
  RoundType,
  SwipeSensitivity,
  TeeShotDirection,
  UiPreferences,
} from "@/lib/domain/types";
import { useRoundStore } from "@/lib/store/round-store";

type Tab = "input" | "round" | "history" | "settings" | "complete";
type BinaryKey = "fwKeep" | "gir" | "bunkerIn";
type CourseFilter = "all" | "REGULAR" | "SHORT";
type RequiredField = "strokes" | "putts";
type ScoreSuggestion = { label: string; strokes: number; putts: number };
type CelebrationLevel = "eagle" | "birdie" | "par" | "bogey" | "none";
type RoundCompleteSummary = {
  roundId: string;
  courseName: string;
  playedAt: string;
  roundType: RoundType;
  totalScore: number;
  totalPar: number;
  diff: number;
  isBest: boolean;
  highlights: [string, string, string];
  encouragement: string;
  nextGoalText: string;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "input", label: "入力" },
  { id: "round", label: "ラウンド" },
  { id: "history", label: "履歴" },
  { id: "settings", label: "設定" },
];

const teeDirectionOptions: Array<{ id: TeeShotDirection; label: string }> = [
  { id: "LEFT", label: "左" },
  { id: "RIGHT", label: "右" },
  { id: "SHORT", label: "ショート" },
  { id: "OVER", label: "オーバー" },
];

const roundTypes: RoundType[] = ["FULL_18", "HALF_9", "SHORT"];
function surfaceClass(active = false) {
  return active
    ? "border-[#31513b] bg-[linear-gradient(145deg,#2f4d39,#1d2c21)] text-white shadow-[0_24px_48px_rgba(24,34,24,0.18)]"
    : "paper-panel text-ink";
}

function panelTitle(title: string, hint?: string) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-[1.15rem] font-semibold text-ink">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-black/55">{hint}</p> : null}
      </div>
    </div>
  );
}

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`paper-panel fade-up rounded-[30px] p-5 backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function averageLabel(value: number | null) {
  if (value == null) return "-";
  return value.toFixed(1);
}

function percentage(value: number | null) {
  if (value == null) return "-";
  return `${Math.round(value * 100)}%`;
}

function sourceLabel(source?: string) {
  if (source === "rakuten_gora") return "Rakuten GORA";
  if (source === "official") return "Official";
  if (source === "user") return "User Verified";
  return "Manual";
}

function confidenceLabel(confidence?: string) {
  if (confidence === "official") return "公式確認";
  if (confidence === "user_verified") return "ユーザー検証";
  return "未検証";
}

function courseMatch(course: GolfCourse, query: string) {
  if (!query.trim()) return true;
  const target = `${course.name} ${course.prefecture} ${course.area} ${course.description}`.toLowerCase();
  return target.includes(query.trim().toLowerCase());
}

function chipClass(active: boolean, tone: "solid" | "light" = "light") {
  if (active && tone === "solid") return "bg-fairway text-white border-fairway";
  if (active) return "bg-sand text-ink border-sand";
  return "bg-white text-ink border-black/10";
}

function boolPatch(key: BinaryKey, value: boolean | null): Partial<HoleScore> {
  return { [key]: value } as Partial<HoleScore>;
}

function penaltyPatch(hole: HoleScore, key: "obCount" | "otherPenaltyCount", next: number) {
  const safe = Math.max(0, next);
  const obCount = key === "obCount" ? safe : hole.obCount;
  const otherPenaltyCount = key === "otherPenaltyCount" ? safe : hole.otherPenaltyCount;

  return {
    [key]: safe,
    penaltyTotal: obCount + otherPenaltyCount,
  } as Partial<HoleScore>;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function relativeScoreLabel(value: number, par: number) {
  const diff = value - par;
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  return diff > 2 ? `+${diff}` : `${diff}`;
}

function relativeScoreClass(value: number, par: number) {
  const diff = value - par;
  if (diff <= -2) return "text-[#ffd166]";
  if (diff === -1) return "text-emerald-300";
  if (diff === 0) return "text-white";
  if (diff === 1) return "text-amber-300";
  if (diff === 2) return "text-red-300";
  return diff > 2 ? "text-red-400" : "text-emerald-300";
}

function relativeDiffLabel(diff: number) {
  if (diff === 0) return "Par";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function relativeDiffClass(diff: number) {
  if (diff <= -2) return "text-[#c89a3d]";
  if (diff === -1) return "text-emerald-600";
  if (diff === 0) return "text-black/45";
  if (diff === 1) return "text-amber-600";
  if (diff === 2) return "text-red-500";
  return "text-red-600";
}

function teeDirectionLabel(direction: TeeShotDirection | null | undefined) {
  if (direction === "LEFT") return "左";
  if (direction === "RIGHT") return "右";
  if (direction === "SHORT") return "ショート";
  if (direction === "OVER") return "オーバー";
  return "-";
}

function roundFormLabel(holes: HoleScore[]) {
  const recent = holes.filter((item) => item.strokes != null).slice(-3);
  if (recent.length === 0) return "STEADY";
  const avgDiff =
    recent.reduce((sum, item) => sum + ((item.strokes as number) - item.par), 0) / recent.length;
  if (avgDiff <= -0.4) return "HOT";
  if (avgDiff >= 1.2) return "STRUGGLING";
  return "STEADY";
}

function classifyCelebration(strokes: number | null, par: number): CelebrationLevel {
  if (strokes == null) return "none";
  const diff = strokes - par;
  if (diff <= -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  return "none";
}

function celebrationConfig(level: CelebrationLevel) {
  if (level === "eagle") {
    return {
      emoji: "🦅",
      title: "Eagle!",
      sub: "伝説の一打",
      className: "from-[#ffd166] to-[#d49f2a] text-[#1f1b12]",
      duration: 1200,
    };
  }
  if (level === "birdie") {
    return {
      emoji: "🐦",
      title: "Birdie!",
      sub: "この調子",
      className: "from-emerald-500 to-emerald-700 text-white",
      duration: 1000,
    };
  }
  if (level === "par") {
    return {
      emoji: "✓",
      title: "Par",
      sub: "安定したホール",
      className: "from-[#24402f] to-[#1a2f24] text-white",
      duration: 700,
    };
  }
  if (level === "bogey") {
    return {
      emoji: "",
      title: "+1",
      sub: "次で取り返そう",
      className: "from-[#3b3d42] to-[#202329] text-white",
      duration: 550,
    };
  }
  return {
    emoji: "",
    title: "",
    sub: "",
    className: "from-transparent to-transparent text-transparent",
    duration: 0,
  };
}

function parTotal(holes: HoleScore[]) {
  return holes.reduce((sum, hole) => sum + hole.par, 0);
}

function scoreDiff(strokes: number | null, par: number) {
  if (strokes == null) return null;
  return strokes - par;
}

function scoreTrendArrow(latestFirstScores: number[]) {
  if (latestFirstScores.length < 3) return "→";
  const recent = latestFirstScores.slice(0, 3);
  const previous = latestFirstScores.slice(3, 6);
  if (previous.length === 0) return "→";
  const recentAvg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAvg = previous.reduce((sum, value) => sum + value, 0) / previous.length;
  if (recentAvg < previousAvg - 0.7) return "↑";
  if (recentAvg > previousAvg + 0.7) return "↓";
  return "→";
}

function swipeThreshold(sensitivity: SwipeSensitivity) {
  if (sensitivity === "low") return 30;
  if (sensitivity === "high") return 16;
  return 22;
}

function fontScaleClass(scale: UiPreferences["fontScale"]) {
  if (scale === "large") return "text-[106%]";
  if (scale === "xlarge") return "text-[112%]";
  return "";
}

function parAchievement(holes: HoleScore[]) {
  const scored = holes.filter((hole) => hole.strokes != null);
  if (scored.length === 0) {
    return { underOrEqualPar: 0, overPar: 0, sample: 0 };
  }
  const underOrEqualPar = scored.filter((hole) => (hole.strokes as number) <= hole.par).length;
  return {
    underOrEqualPar,
    overPar: scored.length - underOrEqualPar,
    sample: scored.length,
  };
}

function puttDistribution(holes: HoleScore[]) {
  const known = holes.filter((hole) => hole.putts != null);
  return {
    one: known.filter((hole) => hole.putts === 1).length,
    two: known.filter((hole) => hole.putts === 2).length,
    threePlus: known.filter((hole) => (hole.putts as number) >= 3).length,
    unknown: holes.length - known.length,
    sample: holes.length,
  };
}

function suggestionsForPar(par: number): ScoreSuggestion[] {
  if (par <= 3) {
    return [
      { label: "Par", strokes: 3, putts: 2 },
      { label: "Bogey", strokes: 4, putts: 2 },
      { label: "Birdie", strokes: 2, putts: 1 },
    ];
  }
  if (par === 4) {
    return [
      { label: "Par", strokes: 4, putts: 2 },
      { label: "Bogey", strokes: 5, putts: 2 },
      { label: "Double", strokes: 6, putts: 2 },
    ];
  }
  return [
    { label: "Par", strokes: 5, putts: 2 },
    { label: "Bogey", strokes: 6, putts: 2 },
    { label: "Birdie", strokes: 4, putts: 2 },
  ];
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  accent = false,
}: {
  label: string;
  value: number | null;
  onDecrement: () => void;
  onIncrement: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border p-3 ${
        accent
          ? "border-[#4d6f58]/40 bg-[linear-gradient(145deg,#365741,#1f3327)] text-white shadow-[0_18px_40px_rgba(24,34,24,0.22)]"
          : "paper-panel"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm font-medium ${accent ? "text-white/72" : "text-black/55"}`}>{label}</p>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            accent ? "bg-white/10 text-white/82" : "gold-pill"
          }`}
        >
          Control
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[64px_1fr_64px] items-center gap-3">
        <button
          className={`rounded-[18px] py-3 text-2xl font-semibold ${
            accent ? "bg-white/10 text-white" : "border border-black/10 bg-white text-ink"
          }`}
          onClick={onDecrement}
        >
          -
        </button>
        <div
          className={`rounded-[18px] py-3 text-center text-3xl font-bold ${
            accent ? "bg-white/10 text-white" : "bg-white/90 text-ink shadow-inner"
          }`}
        >
          {value ?? "-"}
        </div>
        <button
          className={`rounded-[18px] py-3 text-2xl font-semibold ${
            accent ? "bg-white/10 text-white" : "border border-black/10 bg-white text-ink"
          }`}
          onClick={onIncrement}
        >
          +
        </button>
      </div>
    </div>
  );
}

function RotaryDialInput({
  label,
  value,
  par,
  min,
  max,
  threshold,
  onStep,
}: {
  label: string;
  value: number | null;
  par: number;
  min: number;
  max: number;
  threshold: number;
  onStep: (delta: number) => void;
}) {
  const startY = useRef<number | null>(null);
  const carry = useRef(0);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    startY.current = event.clientY;
    carry.current = 0;
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (startY.current == null) return;
    const dy = event.clientY - startY.current;
    carry.current += dy;
    const steps = Math.floor(Math.abs(carry.current) / threshold);
    if (steps === 0) return;
    const direction = carry.current < 0 ? 1 : -1;
    onStep(direction * steps);
    carry.current = carry.current % threshold;
    startY.current = event.clientY;
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    startY.current = null;
    carry.current = 0;
  }

  const hasValue = value != null;
  const shownValue = value ?? par;
  const shown = hasValue ? shownValue : "-";
  const relation = hasValue ? relativeScoreLabel(shownValue, par) : "未入力";
  const relationClass = hasValue ? relativeScoreClass(shownValue, par) : "text-white/60";
  const prevValue = clampNumber(shownValue - 1, min, max);
  const nextValue = clampNumber(shownValue + 1, min, max);

  return (
    <div className="rounded-[28px] border border-[#4d6f58]/45 bg-[linear-gradient(155deg,#365741,#1d3126)] p-4 text-white shadow-[0_20px_44px_rgba(24,34,24,0.26)]">
      <p className="text-xs uppercase tracking-[0.14em] text-white/62">{label}</p>
      <div
        className="mt-3 rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] px-4 py-5 text-center select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="dial-arrow text-xs tracking-[0.18em] text-white/45">↑ ↑ ↑</div>
        <p className="mt-1 text-xs tracking-[0.16em] text-white/48">SWIPE UP / DOWN</p>
        <p className="mt-3 text-lg font-semibold text-white/24">{prevValue}</p>
        <div className="mt-1 border-y border-white/12 py-3">
          <strong className="font-display block text-[62px] leading-none">{shown}</strong>
          <p className={`mt-2 text-sm font-semibold ${relationClass}`}>{relation}</p>
        </div>
        <p className="mt-2 text-lg font-semibold text-white/24">{nextValue}</p>
        <div className="dial-arrow mt-2 text-xs tracking-[0.18em] text-white/45">↓ ↓ ↓</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="rounded-xl border border-white/16 bg-white/8 px-3 py-3 text-lg font-semibold active:scale-[0.98]"
          onClick={() => onStep(-1)}
        >
          -1
        </button>
        <button
          className="rounded-xl border border-white/16 bg-white/8 px-3 py-3 text-lg font-semibold active:scale-[0.98]"
          onClick={() => onStep(1)}
        >
          +1
        </button>
      </div>
    </div>
  );
}

function MomentumMiniBar({
  holes,
  currentHoleNo,
  tone = "dark",
}: {
  holes: HoleScore[];
  currentHoleNo?: number;
  tone?: "dark" | "light";
}) {
  const labelClass = tone === "dark" ? "text-white/45" : "text-black/45";
  const baseClass = tone === "dark" ? "bg-white/20" : "bg-black/15";
  const evenClass = tone === "dark" ? "bg-white/60" : "bg-black/45";
  const ringClass = tone === "dark" ? "ring-white/70" : "ring-black/55";

  return (
    <div className="mt-3 flex items-end gap-1 overflow-x-auto pb-1">
      {holes.map((item) => {
        const diff = item.strokes == null ? null : item.strokes - item.par;
        const barHeight = diff == null ? 4 : 6 + Math.min(Math.abs(diff), 4) * 2;
        const colorClass = diff == null ? baseClass : diff < 0 ? "bg-emerald-400" : diff === 0 ? evenClass : "bg-amber-400";
        const active = item.holeNo === currentHoleNo;

        return (
          <div key={`momentum-${item.holeNo}`} className="flex min-w-[18px] flex-col items-center gap-1">
            <div className={`w-3 rounded-full ${colorClass} ${active ? `ring-1 ${ringClass}` : ""}`} style={{ height: `${barHeight}px` }} />
            <span className={`text-[9px] ${active ? (tone === "dark" ? "text-white" : "text-ink") : labelClass}`}>H{item.holeNo}</span>
          </div>
        );
      })}
    </div>
  );
}

function BinaryField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <div className="paper-panel rounded-[26px] p-4">
      <p className="mb-3 text-sm font-medium text-black/55">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "○", value: true },
          { label: "×", value: false },
          { label: "-", value: null },
        ].map((option) => (
          <button
            key={option.label}
            className={`rounded-2xl border px-3 py-3 font-semibold ${chipClass(value === option.value)}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CelebrationOverlay({ level }: { level: CelebrationLevel }) {
  const config = celebrationConfig(level);
  if (level === "none" || config.duration === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div className={`celebrate-pop w-full max-w-sm rounded-[26px] bg-gradient-to-br p-6 text-center shadow-[0_30px_70px_rgba(0,0,0,0.38)] ${config.className}`}>
        {config.emoji ? <p className="text-3xl">{config.emoji}</p> : null}
        <p className="mt-2 font-display text-[2rem] leading-none">{config.title}</p>
        <p className="mt-2 text-sm font-medium opacity-90">{config.sub}</p>
      </div>
    </div>
  );
}

function HoleEditor({
  record,
  uiPreferences,
  bestReferenceScore,
  onRoundComplete,
}: {
  record: RoundRecord;
  uiPreferences: UiPreferences;
  bestReferenceScore: number | null;
  onRoundComplete: (summary: RoundCompleteSummary) => void;
}) {
  const updateHole = useRoundStore((state) => state.updateHole);
  const goToHole = useRoundStore((state) => state.goToHole);
  const completeRound = useRoundStore((state) => state.completeRound);
  const [message, setMessage] = useState("");
  const [showExtraSheet, setShowExtraSheet] = useState(false);
  const [quickMode, setQuickMode] = useState(true);
  const [activeField, setActiveField] = useState<RequiredField>("strokes");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationLevel>("none");
  const [lastUndo, setLastUndo] = useState<{
    holeNo: number;
    prev: Pick<HoleScore, "strokes" | "putts" | "puttsUnknown">;
  } | null>(null);
  const [quickFeedback, setQuickFeedback] = useState("");
  const quickFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardStartY = useRef<number | null>(null);
  const cardCarry = useRef(0);
  const suppressCardClick = useRef<RequiredField | null>(null);
  const hole = record.holes.find((item) => item.holeNo === record.round.currentHoleNo) ?? record.holes[0];

  useEffect(() => {
    setMessage("");
    setActiveField("strokes");
    setLastUndo(null);
    setShowExtraSheet(false);
  }, [hole?.holeNo]);

  useEffect(() => {
    return () => {
      if (quickFeedbackTimer.current) {
        clearTimeout(quickFeedbackTimer.current);
      }
      if (celebrationTimer.current) {
        clearTimeout(celebrationTimer.current);
      }
    };
  }, []);

  if (!hole) return null;

  const canAdvance = isHoleRequiredComplete(hole, record.round.configSnapshot);
  const canGoPrev = hole.holeNo > 1;
  const isLastHole = hole.holeNo === record.round.holesCount;
  const recommended = useMemo(() => suggestionsForPar(hole.par), [hole.par]);
  const highContrastMode = uiPreferences.highContrast;
  const cardStepThreshold = swipeThreshold(uiPreferences.swipeSensitivity);

  function triggerCelebration(level: CelebrationLevel) {
    const meta = celebrationConfig(level);
    if (meta.duration === 0) return;
    if (celebrationTimer.current) {
      clearTimeout(celebrationTimer.current);
    }
    setCelebration(level);
    celebrationTimer.current = setTimeout(() => {
      setCelebration("none");
      celebrationTimer.current = null;
    }, meta.duration);
  }

  function buildRoundCompleteSummary(totalScore: number): RoundCompleteSummary {
    const totalPar = parTotal(record.holes);
    const diff = totalScore - totalPar;
    const birdieOrBetter = record.holes.filter(
      (item) => item.strokes != null && item.strokes <= item.par - 1,
    ).length;
    const parOrBetter = record.holes.filter(
      (item) => item.strokes != null && item.strokes <= item.par,
    ).length;
    const onePutt = record.holes.filter((item) => item.putts === 1).length;
    const isBest = bestReferenceScore == null || totalScore < bestReferenceScore;
    const encouragement = isBest
      ? "自己ベスト更新です。今日の積み重ねが上達につながっています。"
      : "ラウンド完了お疲れさまでした。記録の継続がいちばんの上達ルートです。";
    const nextGoal = Math.max(totalScore - 1, 1);

    return {
      roundId: record.round.id,
      courseName: record.round.courseName || "フリーラウンド",
      playedAt: record.round.playedAt,
      roundType: record.round.roundType,
      totalScore,
      totalPar,
      diff,
      isBest,
      highlights: [
        `Par以内 ${parOrBetter}/${record.holes.length} ホール`,
        `バーディ以上 ${birdieOrBetter} ホール`,
        `1パット ${onePutt} ホール`,
      ],
      encouragement,
      nextGoalText: `次回の目標: ${nextGoal} 打`,
    };
  }

  function flashQuickFeedback(text: string) {
    setQuickFeedback(text);
    if (quickFeedbackTimer.current) {
      clearTimeout(quickFeedbackTimer.current);
    }
    quickFeedbackTimer.current = setTimeout(() => {
      setQuickFeedback("");
    }, 900);
  }

  function maybeHaptic() {
    if (!uiPreferences.haptics) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }

  function nuancedHaptic(field: RequiredField, nextValue: number) {
    if (!uiPreferences.haptics) return;
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    if (field === "putts") {
      navigator.vibrate(8);
      return;
    }
    const diff = nextValue - hole.par;
    if (diff <= -1) {
      navigator.vibrate([12, 45, 12]);
      return;
    }
    if (diff === 0) {
      navigator.vibrate([10, 30, 10]);
      return;
    }
    if (diff >= 2) {
      navigator.vibrate(20);
      return;
    }
    navigator.vibrate(8);
  }

  async function patchRequired(nextPatch: Partial<Pick<HoleScore, "strokes" | "putts" | "puttsUnknown">>) {
    const prev = {
      strokes: hole.strokes,
      putts: hole.putts,
      puttsUnknown: hole.puttsUnknown,
    };
    setLastUndo({
      holeNo: hole.holeNo,
      prev,
    });
    await updateHole(hole.holeNo, nextPatch);
  }

  async function handleDialStep(delta: number) {
    setMessage("");
    if (activeField === "strokes") {
      const nextValue = clampNumber((hole.strokes ?? hole.par) + delta, 1, 15);
      nuancedHaptic("strokes", nextValue);
      await patchRequired({ strokes: nextValue });
      flashQuickFeedback(`打数 ${nextValue}`);
      return;
    }
    const nextValue = clampNumber((hole.putts ?? 2) + delta, 0, 9);
    nuancedHaptic("putts", nextValue);
    await patchRequired({ putts: nextValue });
    flashQuickFeedback(`パット ${nextValue}`);
  }

  async function handleFieldCardTap(field: RequiredField) {
    setMessage("");
    if (activeField !== field) {
      setActiveField(field);
      maybeHaptic();
      flashQuickFeedback(field === "strokes" ? "打数を選択" : "パットを選択");
      return;
    }

    if (field === "strokes") {
      const nextValue = clampNumber((hole.strokes ?? hole.par) + 1, 1, 15);
      nuancedHaptic("strokes", nextValue);
      await patchRequired({ strokes: nextValue });
      flashQuickFeedback(`打数 ${nextValue}`);
      return;
    }

    const nextValue = clampNumber((hole.putts ?? 2) + 1, 0, 9);
    nuancedHaptic("putts", nextValue);
    await patchRequired({ putts: nextValue });
    flashQuickFeedback(`パット ${nextValue}`);
  }

  async function handleUndo() {
    if (!lastUndo || lastUndo.holeNo !== hole.holeNo) {
      setMessage("このホールで戻せる入力がありません。");
      return;
    }
    await updateHole(hole.holeNo, lastUndo.prev);
    setLastUndo(null);
    setMessage("1手戻しました。");
    flashQuickFeedback("Undo");
  }

  async function handleApplySuggestion(suggestion: ScoreSuggestion) {
    setMessage("");
    maybeHaptic();
    await patchRequired({
      strokes: suggestion.strokes,
      putts: suggestion.putts,
    });
    setActiveField("strokes");
    flashQuickFeedback(`${suggestion.label}: ${suggestion.strokes}/${suggestion.putts}`);
  }

  async function handleTeeDirection(next: TeeShotDirection | null) {
    setMessage("");
    maybeHaptic();
    await updateHole(hole.holeNo, { teeShotDirection: next });
    flashQuickFeedback(next ? `ティー: ${teeDirectionLabel(next)}` : "ティー方向クリア");
  }

  function onCardPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    cardStartY.current = event.clientY;
    cardCarry.current = 0;
    suppressCardClick.current = null;
  }

  function onCardPointerMove(event: React.PointerEvent<HTMLButtonElement>, field: RequiredField) {
    if (activeField !== field) return;
    if (cardStartY.current == null) return;
    const dy = event.clientY - cardStartY.current;
    cardCarry.current += dy;
    const steps = Math.floor(Math.abs(cardCarry.current) / cardStepThreshold);
    if (steps === 0) return;
    const direction = cardCarry.current < 0 ? 1 : -1;
    suppressCardClick.current = field;
    void handleDialStep(direction * steps);
    cardCarry.current = cardCarry.current % cardStepThreshold;
    cardStartY.current = event.clientY;
  }

  function onCardPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    cardStartY.current = null;
    cardCarry.current = 0;
  }

  function handleCardClick(field: RequiredField) {
    if (suppressCardClick.current === field) {
      suppressCardClick.current = null;
      return;
    }
    void handleFieldCardTap(field);
  }

  async function handleAdvance() {
    if (isAdvancing) return;
    if (!canAdvance) {
      setMessage("打数を入力してから次のホールへ進みます。");
      return;
    }

    setMessage("");
    const level = uiPreferences.celebration ? classifyCelebration(hole.strokes, hole.par) : "none";
    triggerCelebration(level);

    if (!isLastHole) {
      setIsAdvancing(true);
      await goToHole(hole.holeNo + 1);
      setIsAdvancing(false);
      return;
    }

    const totalScore = record.holes.reduce((sum, item) => sum + (item.strokes ?? 0), 0);
    const summary = buildRoundCompleteSummary(totalScore);
    setIsAdvancing(true);
    const completed = await completeRound();
    setIsAdvancing(false);
    if (!completed) {
      setMessage("全ホールの必須項目がそろうとラウンドを完了できます。");
      return;
    }
    onRoundComplete(summary);
  }

  return (
    <>
      <CelebrationOverlay level={celebration} />
      <div className={`space-y-3 overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+148px)] md:pb-0 ${highContrastMode ? "contrast-125" : ""} ${fontScaleClass(uiPreferences.fontScale)}`}>
      <ShellCard className={`sticky bottom-[calc(env(safe-area-inset-bottom)+80px)] z-[5] space-y-3 md:static ${highContrastMode ? "border-2 border-black bg-white" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-[1.1rem] font-semibold text-ink">スコア入力</h3>
            <p className="mt-1 text-xs text-black/55">Hole {hole.holeNo}/{record.round.holesCount} | Par {hole.par}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                quickMode
                  ? "border-[#4d6f58]/40 bg-[linear-gradient(145deg,#365741,#1f3327)] text-white"
                  : "border-black/12 bg-white text-ink"
              }`}
              onClick={() => {
                setQuickMode((current) => !current);
                setShowExtraSheet(false);
                setActiveField("strokes");
              }}
            >
              {quickMode ? "クイック入力中" : "詳細入力中"}
            </button>
            <button
              className="rounded-full border border-black/12 bg-white px-3 py-1.5 text-xs font-semibold text-ink"
              onClick={() => {
                void handleUndo();
              }}
            >
              ↶ Undo
            </button>
          </div>
        </div>

        <div className={`grid gap-2 ${quickMode ? "grid-cols-1" : "grid-cols-2"}`}>
          <button
            className={`rounded-[18px] border px-3 py-3 text-left ${
              activeField === "strokes"
                ? "bg-[linear-gradient(145deg,#365741,#1f3327)] border-[#4d6f58]/40 text-white"
                : "border-black/10 bg-white text-ink"
            }`}
            onClick={() => handleCardClick("strokes")}
            onPointerDown={activeField === "strokes" ? onCardPointerDown : undefined}
            onPointerMove={activeField === "strokes" ? (event) => onCardPointerMove(event, "strokes") : undefined}
            onPointerUp={activeField === "strokes" ? onCardPointerUp : undefined}
            onPointerCancel={activeField === "strokes" ? onCardPointerUp : undefined}
            style={activeField === "strokes" ? { touchAction: "none", userSelect: "none" } : undefined}
          >
            <p className={`text-xs ${activeField === "strokes" ? "text-white/60" : "text-black/45"}`}>打数</p>
            <strong className="mt-1 block text-3xl">{hole.strokes ?? "-"}</strong>
            {activeField === "strokes" ? (
              <p className="mt-1 text-[10px] tracking-[0.14em] text-white/55">↑ SWIPE ↓</p>
            ) : null}
          </button>
          {!quickMode ? (
            <button
              className={`rounded-[18px] border px-3 py-3 text-left ${
                activeField === "putts"
                  ? "bg-[linear-gradient(145deg,#365741,#1f3327)] border-[#4d6f58]/40 text-white"
                  : "border-black/10 bg-white text-ink"
              }`}
              onClick={() => handleCardClick("putts")}
              onPointerDown={activeField === "putts" ? onCardPointerDown : undefined}
              onPointerMove={activeField === "putts" ? (event) => onCardPointerMove(event, "putts") : undefined}
              onPointerUp={activeField === "putts" ? onCardPointerUp : undefined}
              onPointerCancel={activeField === "putts" ? onCardPointerUp : undefined}
              style={activeField === "putts" ? { touchAction: "none", userSelect: "none" } : undefined}
            >
              <p className={`text-xs ${activeField === "putts" ? "text-white/60" : "text-black/45"}`}>パット</p>
              <strong className="mt-1 block text-3xl">{hole.putts ?? "-"}</strong>
              {activeField === "putts" ? (
                <p className="mt-1 text-[10px] tracking-[0.14em] text-white/55">↑ SWIPE ↓</p>
              ) : null}
            </button>
          ) : null}
        </div>

        {!quickMode ? (
          <div className="grid grid-cols-3 gap-2">
            {recommended.map((item) => (
              <button
                key={`suggestion-${item.label}-${item.strokes}-${item.putts}`}
                className="rounded-xl border border-[#c6b18a] bg-[#f7f2e8] px-2 py-2 text-left text-ink active:scale-[0.98]"
                onClick={() => {
                  void handleApplySuggestion(item);
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.08em] text-black/45">{item.label}</p>
                <p className="mt-1 text-sm font-semibold">{item.strokes}打 / {item.putts}P</p>
              </button>
            ))}
          </div>
        ) : (
          <button
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink"
            onClick={() => {
              setQuickMode(false);
              setActiveField("putts");
            }}
          >
            パット・提案入力を開く
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded-xl border border-black/10 bg-white px-3 py-3 text-lg font-semibold text-ink active:scale-[0.98]"
            onClick={() => {
              void handleDialStep(-1);
            }}
          >
            -1
          </button>
          <button
            className="rounded-xl border border-black/10 bg-white px-3 py-3 text-lg font-semibold text-ink active:scale-[0.98]"
            onClick={() => {
              void handleDialStep(1);
            }}
          >
            +1
          </button>
        </div>

        {!quickMode ? (
          <div className="space-y-2 rounded-[18px] border border-black/10 bg-white/80 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/55">ティーショット</p>
              <span className="text-xs font-semibold text-black/55">
                {teeDirectionLabel(hole.teeShotDirection)}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <button
                className={`rounded-xl border px-2 py-2 text-xs font-semibold ${hole.teeShotDirection == null ? "bg-fairway text-white border-fairway" : "border-black/12 bg-white text-ink"}`}
                onClick={() => {
                  void handleTeeDirection(null);
                }}
              >
                -
              </button>
              {teeDirectionOptions.map((option) => (
                <button
                  key={`tee-direction-${option.id}`}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold ${
                    hole.teeShotDirection === option.id
                      ? "bg-fairway text-white border-fairway"
                      : "border-black/12 bg-white text-ink"
                  }`}
                  onClick={() => {
                    void handleTeeDirection(option.id);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="min-h-6">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition ${
              quickFeedback ? "bg-fairway text-white opacity-100" : "opacity-0"
            }`}
          >
            {quickFeedback || "."}
          </span>
        </div>

        <div className="grid grid-cols-[88px_68px_1fr] gap-2">
          <button
            className={`rounded-[18px] px-3 py-3 text-sm font-semibold ${
              canGoPrev ? "bg-cream text-ink" : "bg-black/5 text-black/25"
            }`}
            onClick={() => canGoPrev && goToHole(hole.holeNo - 1)}
            disabled={!canGoPrev}
          >
            前へ
          </button>
          <button
            className={`rounded-[18px] border px-3 py-3 text-sm font-semibold ${
              showExtraSheet
                ? "border-[#4d6f58]/40 bg-[linear-gradient(145deg,#365741,#1f3327)] text-white"
                : "border-black/12 bg-white text-ink"
            }`}
            onClick={() => setShowExtraSheet((current) => !current)}
            disabled={isAdvancing}
            aria-label="詳細入力を開く"
          >
            ⋯
          </button>
          <button
            className={`rounded-[18px] px-4 py-3 text-left font-semibold ${
              canAdvance ? "gold-pill" : "ink-button text-white"
            }`}
            onClick={() => {
              void handleAdvance();
            }}
            disabled={isAdvancing}
          >
            <span className={`block text-xs uppercase tracking-[0.18em] ${canAdvance ? "text-black/45" : "text-white/55"}`}>
              {isLastHole ? "Finish" : "Next Hole"}
            </span>
            <span className="mt-1 block text-lg">{isLastHole ? "ラウンドを完了" : `Hole ${hole.holeNo + 1} へ進む`}</span>
          </button>
        </div>

        {message ? (
          <div className="rounded-2xl border border-danger/20 bg-[#fff4f1] px-4 py-2 text-sm font-medium text-danger">
            {message}
          </div>
        ) : null}
      </ShellCard>

      <ShellCard className="space-y-2 overflow-hidden p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-ink">ホール切替</h3>
          <span className="text-xs text-black/50">横スクロール</span>
        </div>
        <div className="w-full min-w-0 overflow-x-auto pb-1">
          <div className="flex w-max gap-2">
            {record.holes.map((item) => {
              const active = item.holeNo === hole.holeNo;
              const score = item.strokes;
              const diff = score == null ? null : score - item.par;
              const filled = isHoleRequiredComplete(item, record.round.configSnapshot);
              return (
                <button
                  key={`inline-hole-${item.holeNo}`}
                  className={`w-[74px] shrink-0 rounded-xl border px-2 py-2 text-center ${
                    active
                      ? "bg-[linear-gradient(145deg,#365741,#1f3327)] border-[#4d6f58]/40 text-white"
                      : filled
                        ? "border-[#c7d5c5] bg-white text-ink"
                        : "border-black/10 bg-white text-ink"
                  }`}
                  onClick={() => goToHole(item.holeNo)}
                >
                  <p className={`text-[10px] font-medium ${active ? "text-white/60" : "text-black/45"}`}>H{item.holeNo}</p>
                  <p className="mt-0.5 text-base font-semibold">{score ?? "-"}</p>
                  <p className={`text-[10px] font-semibold ${diff == null ? "text-black/30" : active ? "text-white/75" : relativeDiffClass(diff)}`}>
                    {diff == null ? `Par ${item.par}` : relativeDiffLabel(diff)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </ShellCard>

      {showExtraSheet ? (
        <>
          <button
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setShowExtraSheet(false)}
            aria-label="詳細入力を閉じる"
          />
          <div className="fixed inset-x-0 bottom-0 z-40 max-h-[78vh] overflow-y-auto rounded-t-[28px] border border-[#d6c3a0] bg-[rgba(247,243,235,0.98)] p-4 shadow-[0_-18px_40px_rgba(24,34,24,0.22)] md:static md:max-h-none md:rounded-[30px] md:border md:bg-transparent md:p-0 md:shadow-none">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15 md:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink">補足項目（任意）</h3>
              <button
                className="rounded-full border border-black/12 bg-white px-3 py-1 text-xs font-semibold text-ink"
                onClick={() => setShowExtraSheet(false)}
              >
                閉じる
              </button>
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-5">
                {record.round.configSnapshot.ob ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Stepper
                      label="OB"
                      value={hole.obCount}
                      onDecrement={() => updateHole(hole.holeNo, penaltyPatch(hole, "obCount", hole.obCount - 1))}
                      onIncrement={() => updateHole(hole.holeNo, penaltyPatch(hole, "obCount", hole.obCount + 1))}
                    />
                    <Stepper
                      label="その他ペナ"
                      value={hole.otherPenaltyCount}
                      onDecrement={() =>
                        updateHole(hole.holeNo, penaltyPatch(hole, "otherPenaltyCount", hole.otherPenaltyCount - 1))
                      }
                      onIncrement={() =>
                        updateHole(hole.holeNo, penaltyPatch(hole, "otherPenaltyCount", hole.otherPenaltyCount + 1))
                      }
                    />
                  </div>
                ) : (
                  <Stepper
                    label="ペナルティ"
                    value={hole.penaltyTotal}
                    onDecrement={() => updateHole(hole.holeNo, { penaltyTotal: Math.max(0, hole.penaltyTotal - 1) })}
                    onIncrement={() => updateHole(hole.holeNo, { penaltyTotal: hole.penaltyTotal + 1 })}
                  />
                )}

                <div className="rounded-[22px] border border-dashed border-[#c6b18a] bg-white/85 px-4 py-3 text-sm text-black/60">
                  合計ペナルティ <strong className="ml-2 text-xl text-ink">{hole.penaltyTotal}</strong>
                </div>
              </div>

              <div className="grid gap-3">
                {record.round.configSnapshot.fw && hole.par >= 4 ? (
                  <BinaryField
                    label="FWキープ"
                    value={hole.fwKeep}
                    onChange={(value) => updateHole(hole.holeNo, boolPatch("fwKeep", value))}
                  />
                ) : null}
                {record.round.configSnapshot.gir ? (
                  <BinaryField
                    label="GIR"
                    value={hole.gir}
                    onChange={(value) => updateHole(hole.holeNo, boolPatch("gir", value))}
                  />
                ) : null}
                {record.round.configSnapshot.bunker ? (
                  <BinaryField
                    label="バンカーIN"
                    value={hole.bunkerIn}
                    onChange={(value) => updateHole(hole.holeNo, boolPatch("bunkerIn", value))}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
      </div>
    </>
  );
}

function RoundStart({
  onStarted,
}: {
  onStarted: () => void;
}) {
  const startRound = useRoundStore((state) => state.startRound);
  const courses = useRoundStore((state) => state.courses);
  const saveCourseMaster = useRoundStore((state) => state.saveCourseMaster);
  const roundDefaults = useRoundStore((state) => state.roundDefaults);
  const currentRound = useRoundStore((state) => state.currentRound);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [roundType, setRoundType] = useState<RoundType>("FULL_18");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id ?? null);
  const [customCourseName, setCustomCourseName] = useState("");
  const [parDraft, setParDraft] = useState("");
  const [courseSaveMessage, setCourseSaveMessage] = useState("");
  const [showParEditor, setShowParEditor] = useState(false);
  const [startMessage, setStartMessage] = useState("");

  const areas = useMemo(() => ["all", ...new Set(courses.map((course) => course.area))], [courses]);

  useEffect(() => {
    if (!selectedCourseId && courses[0]) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesArea = area === "all" || course.area === area;
        const matchesCategory = courseFilter === "all" || course.category === courseFilter;
        return matchesArea && matchesCategory && courseMatch(course, query);
      }),
    [area, courseFilter, courses, query],
  );

  const selectedCourse = useMemo(
    () => findCourseById(selectedCourseId, courses),
    [courses, selectedCourseId],
  );

  const supportedPresets = selectedCourse?.presets ?? [];
  const activePreset =
    supportedPresets.find((preset) => preset.roundType === roundType) ?? supportedPresets[0] ?? null;
  const selectedCourseName = selectedCourse?.name || customCourseName || "フリーラウンド";
  const presetBreakdown = activePreset ? parBreakdown(activePreset.holePars) : null;
  const parsedParDraft = useMemo(
    () =>
      parDraft
        .split(/[,\s/]+/)
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value >= 3 && value <= 6),
    [parDraft],
  );
  const expectedHoleCount = activePreset?.holePars.length ?? PAR_TEMPLATES[roundType].length;
  const isParCountValid = parsedParDraft.length === expectedHoleCount;
  const hasCustomParInput = parDraft.trim().length > 0;
  const canStartRound = !hasCustomParInput || isParCountValid;

  useEffect(() => {
    if (!selectedCourse) return;
    const supportsType = selectedCourse.presets.some((preset) => preset.roundType === roundType);
    if (!supportsType) {
      setRoundType(selectedCourse.presets[0].roundType);
    }
  }, [roundType, selectedCourse]);

  useEffect(() => {
    setParDraft(activePreset?.holePars.join(" ") ?? "");
    setCourseSaveMessage("");
    setStartMessage("");
  }, [activePreset?.id]);

  async function handleSaveCourseMaster() {
    if (parsedParDraft.length === 0) {
      setCourseSaveMessage("Par配列を 3 4 5 のように入力してください。");
      return;
    }
    if (!isParCountValid) {
      setCourseSaveMessage(`この種別では ${expectedHoleCount} ホール分のParが必要です。`);
      return;
    }

    if (selectedCourse) {
      const updated = upsertUserPreset(selectedCourse, {
        roundType,
        label: `${ROUND_TYPE_LABELS[roundType]} User Verified`,
        holePars: parsedParDraft,
      });
      await saveCourseMaster(updated);
      setCourseSaveMessage("このコースのPar配列を保存しました。");
      return;
    }

    const userCourse = createUserCourse({
      name: customCourseName,
      category: roundType === "SHORT" ? "SHORT" : "REGULAR",
      roundType,
      holePars: parsedParDraft,
    });
    await saveCourseMaster(userCourse);
    setSelectedCourseId(userCourse.id);
    setCourseSaveMessage("未登録コースをマスタに保存しました。");
  }

  if (currentRound) {
    return null;
  }

  return (
    <ShellCard className="mb-6 overflow-hidden bg-[linear-gradient(145deg,#fbf7ef,#eef2e8)]">
      {panelTitle("ラウンドを開始")}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="paper-panel rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-black/55">コースを探す</p>
            </div>
            <input
              className="mt-4 w-full rounded-2xl border border-black/10 bg-cream px-4 py-3 outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例: 東京 / 千葉 / 習志野"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {areas.map((item) => (
                <button
                  key={item}
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    area === item ? "bg-fairway text-white" : "bg-cream text-fairway"
                  }`}
                  onClick={() => setArea(item)}
                >
                  {item === "all" ? "すべて" : item}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { id: "all", label: "すべて" },
                { id: "REGULAR", label: "通常コース" },
                { id: "SHORT", label: "ショートコース" },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    courseFilter === item.id ? "bg-fairway text-white" : "bg-cream text-fairway"
                  }`}
                  onClick={() => setCourseFilter(item.id as CourseFilter)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[540px] overflow-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
            {filteredCourses.length === 0 ? (
              <div className="paper-panel col-span-full rounded-[26px] p-5 text-sm text-black/60">
                条件に一致するコースがありません。`エリア` か `コース種別` を広げるか、下の `自由入力` から始めてください。
              </div>
            ) : (
              filteredCourses.map((course) => {
                const active = course.id === selectedCourseId;
                return (
                  <button
                    key={course.id}
                    className={`rounded-[26px] border p-4 text-left transition ${surfaceClass(active)}`}
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-white/15 text-white" : "bg-cream text-fairway"}`}>
                        {course.category === "SHORT" ? "SHORT" : course.area}
                      </span>
                      <span className={`text-xs ${active ? "text-white/65" : "text-black/45"}`}>{course.prefecture}</span>
                    </div>
                    <strong className={`font-display mt-4 block text-lg ${active ? "text-white" : "text-ink"}`}>{course.name}</strong>
                    <p className={`mt-2 text-sm leading-6 ${active ? "text-white/80" : "text-black/60"}`}>
                      {course.description}
                    </p>
                  </button>
                );
              })
            )}
            </div>
          </div>

          <div className="paper-panel rounded-[24px] border border-dashed border-[#c9b38e] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-black/55">自由入力で始める</p>
              <button
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedCourseId === null ? "bg-fairway text-white" : "bg-cream text-fairway"
                }`}
                onClick={() => setSelectedCourseId(null)}
              >
                未登録コース
              </button>
            </div>
            <input
              className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
              value={customCourseName}
              onChange={(event) => {
                setSelectedCourseId(null);
                setCustomCourseName(event.target.value);
              }}
              placeholder="コース未登録ならここに入力"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-forest rounded-[28px] p-5 text-white">
            <h3 className="font-display text-[1.5rem] font-semibold">{selectedCourseName}</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/10 p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">Area</p>
                <p className="mt-1 text-sm font-semibold">{selectedCourse?.category === "SHORT" ? "Short" : selectedCourse?.area ?? "Free"}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">Par</p>
                <p className="mt-1 text-sm font-semibold">{activePreset ? `${activePreset.holePars.reduce((sum, value) => sum + value, 0)}` : "-"}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">Holes</p>
                <p className="mt-1 text-sm font-semibold">{activePreset ? `${activePreset.holePars.length}` : "-"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                {sourceLabel(selectedCourse?.source)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                {confidenceLabel(activePreset?.confidence)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(selectedCourse?.presets ?? roundTypes.map((type) => ({ roundType: type, label: ROUND_TYPE_LABELS[type], holePars: [] }))).map((preset) => {
                const active = preset.roundType === roundType;
                return (
                  <button
                    key={`${preset.roundType}-${preset.label}`}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      active ? "bg-white text-fairway" : "bg-white/10 text-white"
                    }`}
                    onClick={() => setRoundType(preset.roundType)}
                  >
                    {ROUND_TYPE_LABELS[preset.roundType]}
                  </button>
                );
              })}
            </div>

            {activePreset ? (
              <div className="mt-5 rounded-[22px] bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/65">使用プリセット</p>
                    <strong className="mt-1 block text-lg">{activePreset.label}</strong>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    {activePreset.holePars.length}H
                  </span>
                </div>
                <p className="mt-3 text-xs leading-6 text-white/70">
                  Par配列: {activePreset.holePars.join(" / ")}
                </p>
                {presetBreakdown ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                      Par3 x {presetBreakdown.par3}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                      Par4 x {presetBreakdown.par4}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                      Par5 x {presetBreakdown.par5}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <details
              className="mt-5 rounded-[22px] bg-white/10 p-4"
              open={showParEditor}
              onToggle={(event) => setShowParEditor((event.currentTarget as HTMLDetailsElement).open)}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <p className="text-sm text-white/65">ホールごとのParを編集</p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  {showParEditor ? "閉じる" : "開く"}
                </span>
              </summary>
              <div className="mt-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                    入力: {parsedParDraft.length}H
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                    必要: {expectedHoleCount}H
                  </span>
                  <span className={`rounded-full px-3 py-1 font-semibold ${isParCountValid ? "bg-[#9fcf93]/20 text-[#dff7d8]" : "bg-[#7c2d2d]/40 text-[#ffd8d8]"}`}>
                    {isParCountValid ? "OK" : "不足/過多"}
                  </span>
                </div>
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  value={parDraft}
                  onChange={(event) => {
                    setParDraft(event.target.value);
                    setStartMessage("");
                  }}
                  placeholder="例: 4 4 3 5 4 3 4 5 4"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className="gold-pill rounded-full px-4 py-2 text-xs font-semibold"
                    onClick={handleSaveCourseMaster}
                  >
                    コースマスタに保存
                  </button>
                  <span className="text-xs text-white/60">
                    source: user / confidence: user_verified
                  </span>
                </div>
                {courseSaveMessage ? (
                  <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/80">
                    {courseSaveMessage}
                  </p>
                ) : null}
                {!isParCountValid && hasCustomParInput ? (
                  <p className="mt-3 rounded-2xl bg-[#7c2d2d]/35 px-3 py-2 text-xs text-[#ffd8d8]">
                    Par配列が {expectedHoleCount} ホール分になっていません。
                  </p>
                ) : null}
              </div>
            </details>
          </div>

          <div className="paper-panel rounded-[24px] p-4">
            <p className="text-sm font-medium text-black/55">新規ラウンドの記録項目</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                roundDefaults.fw ? "FWキープ" : null,
                roundDefaults.gir ? "GIR" : null,
                roundDefaults.ob ? "OB" : null,
                roundDefaults.bunker ? "バンカーIN" : null,
              ]
                .filter(Boolean)
                .map((label) => (
                  <span key={label} className="gold-pill rounded-full px-3 py-2 text-xs font-semibold">
                    {label}
                  </span>
                ))}
            </div>
          </div>

          <button
            className="ink-button w-full rounded-[26px] px-5 py-5 text-left text-white"
            onClick={async () => {
              if (!canStartRound) {
                setShowParEditor(true);
                setStartMessage(`開始前にPar配列を ${expectedHoleCount} ホール分に揃えてください。`);
                return;
              }
              await startRound({
                playedAt: new Date().toISOString(),
                courseId: selectedCourse?.id ?? null,
                courseName: selectedCourseName === "フリーラウンド" ? "" : selectedCourseName,
                roundType,
                holePars: hasCustomParInput && isParCountValid ? parsedParDraft : activePreset?.holePars,
              });
              onStarted();
            }}
          >
            <span className="text-sm uppercase tracking-[0.24em] text-white/55">Start</span>
            <strong className="font-display mt-2 block text-2xl">今日のラウンドを始める</strong>
            <p className="mt-2 text-sm text-white/75">入力は都度保存し、比較はラウンド種別ごとに分けます。</p>
          </button>
          {startMessage ? (
            <p className="rounded-2xl border border-danger/30 bg-[#fff4f1] px-4 py-3 text-sm text-danger">
              {startMessage}
            </p>
          ) : null}
        </div>
      </div>
    </ShellCard>
  );
}

function RoundInfoPanel({
  record,
  uiPreferences,
  onSaveUiPreferences,
  onOpenSettings,
}: {
  record: RoundRecord;
  uiPreferences: UiPreferences;
  onSaveUiPreferences: (preferences: Partial<UiPreferences>) => Promise<void>;
  onOpenSettings: () => void;
}) {
  const hole = record.holes.find((item) => item.holeNo === record.round.currentHoleNo) ?? record.holes[0];
  const formLabel = useMemo(() => roundFormLabel(record.holes), [record.holes]);
  const highContrastMode = uiPreferences.highContrast;
  const completed = useMemo(
    () => record.holes.filter((item) => isHoleRequiredComplete(item, record.round.configSnapshot)).length,
    [record.holes, record.round.configSnapshot],
  );

  if (!hole) return null;

  return (
    <ShellCard className={`${highContrastMode ? "border-2 border-black bg-white p-4 text-black md:p-5" : "glass-forest overflow-hidden p-4 text-white md:p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.15rem] font-semibold md:text-[1.35rem]">
            {record.round.courseName || "フリーラウンド"}
          </h2>
          <p className={`mt-1 text-sm ${highContrastMode ? "text-black/85" : "text-white/78"}`}>
            Hole {hole.holeNo}/{record.round.holesCount} | Par {hole.par}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`rounded-full border px-2.5 py-1.5 text-sm font-semibold ${
              highContrastMode ? "border-black bg-black text-white" : "border-white/25 bg-white/10 text-white"
            }`}
            onClick={() => {
              void onSaveUiPreferences({ highContrast: !highContrastMode });
            }}
            aria-label="高コントラスト切替"
          >
            ☀︎
          </button>
          <button
            className={`rounded-full border px-2.5 py-1.5 text-sm font-semibold ${
              highContrastMode ? "border-black bg-black text-white" : "border-white/25 bg-white/10 text-white"
            }`}
            onClick={onOpenSettings}
            aria-label="設定を開く"
          >
            ⚙︎
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`text-xs font-semibold tracking-[0.14em] ${highContrastMode ? "text-black/75" : "text-white/70"}`}>
          Round Form
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            formLabel === "HOT"
              ? "bg-emerald-400/20 text-emerald-100"
              : formLabel === "STRUGGLING"
                ? "bg-red-400/20 text-red-100"
                : highContrastMode
                  ? "bg-black text-white"
                  : "bg-white/15 text-white"
          }`}
        >
          {formLabel}
        </span>
      </div>
      <MomentumMiniBar holes={record.holes} currentHoleNo={hole.holeNo} />
      <div className={`mt-3 text-xs ${highContrastMode ? "text-black/75" : "text-white/72"}`}>
        入力済み {completed}/{record.round.holesCount} ホール
      </div>
    </ShellCard>
  );
}

function HistoryPanel({
  records,
  courses,
}: {
  records: RoundRecord[];
  courses: GolfCourse[];
}) {
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.round.playedAt.localeCompare(a.round.playedAt)),
    [records],
  );
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);

  return (
    <ShellCard>
      {panelTitle("履歴", "ホールごとの流れまで確認")}
      {sortedRecords.length === 0 ? (
        <p className="text-sm text-black/60">履歴はまだありません</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortedRecords.map((record) => {
            const { round, holes } = record;
            const course = findCourseById(round.courseId, courses);
            const par = parTotal(holes);
            const diff = scoreDiff(round.totalScore, par);
            const form = roundFormLabel(holes);
            return (
              <div key={round.id} className="paper-panel rounded-[26px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-black/45">{formatDate(round.playedAt)}</p>
                    <strong className="font-display mt-2 block text-lg">{round.courseName || "フリーラウンド"}</strong>
                    <p className="mt-2 text-sm text-black/55">{course ? `${course.prefecture} / ${course.area}` : "コース未紐付け"}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-fairway">
                    {ROUND_TYPE_LABELS[round.roundType]}
                  </span>
                </div>

                <MomentumMiniBar holes={holes} tone="light" />

                <div className="mt-4 flex items-center justify-between rounded-[20px] bg-white/88 px-4 py-3">
                  <div>
                    <p className="text-xs text-black/45">状態</p>
                    <p className="mt-1 font-semibold text-ink">{round.status === "IN_PROGRESS" ? "入力中" : "完了"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-black/45">総打数</p>
                    <p className="mt-1 text-xl font-semibold text-ink">{round.totalScore ?? "-"}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`font-semibold ${diff == null ? "text-black/40" : relativeDiffClass(diff)}`}>
                    {diff == null ? "未完了ラウンド" : `対Par ${relativeDiffLabel(diff)}`}
                  </span>
                  <span className="rounded-full bg-[#edf2e8] px-3 py-1 font-semibold text-ink">
                    Form {form}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-black/50">
                  <span>Par {par}</span>
                  <div className="text-right">
                    <p>{holes.length}H</p>
                    <p>{Math.round((holes.filter((item) => item.putts != null).length / holes.length) * 100)}% putt入力</p>
                  </div>
                </div>
                <button
                  className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink"
                  onClick={() =>
                    setExpandedRoundId((current) => (current === round.id ? null : round.id))
                  }
                >
                  {expandedRoundId === round.id ? "詳細を閉じる" : "ホール詳細を見る"}
                </button>
                {expandedRoundId === round.id ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {holes.map((hole) => {
                      const holeDiff = scoreDiff(hole.strokes, hole.par);
                      return (
                        <div
                          key={`history-hole-${round.id}-${hole.holeNo}`}
                          className="rounded-[14px] border border-black/8 bg-white/85 px-2 py-2 text-center"
                        >
                          <p className="text-[10px] text-black/45">H{hole.holeNo}</p>
                          <p className="mt-0.5 text-sm font-semibold text-ink">{hole.strokes ?? "-"}</p>
                          <p className="text-[10px] text-black/45">P{hole.putts ?? "-"}</p>
                          <p className="text-[10px] text-black/45">T{teeDirectionLabel(hole.teeShotDirection)}</p>
                          <p className={`text-[10px] font-semibold ${holeDiff == null ? "text-black/35" : relativeDiffClass(holeDiff)}`}>
                            {holeDiff == null ? `Par${hole.par}` : relativeDiffLabel(holeDiff)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </ShellCard>
  );
}

function AnalyticsPanel({ records }: { records: RoundRecord[] }) {
  const [roundType, setRoundType] = useState<RoundType>("FULL_18");
  const snapshot = useMemo(() => calculateAnalytics(records, roundType), [records, roundType]);
  const completed = useMemo(
    () =>
      records
        .filter((record) => record.round.status === "COMPLETED" && record.round.roundType === roundType)
        .sort((a, b) => b.round.playedAt.localeCompare(a.round.playedAt)),
    [records, roundType],
  );
  const latestScores = useMemo(
    () =>
      completed
        .map((record) => record.round.totalScore)
        .filter((score): score is number => score != null),
    [completed],
  );
  const allCompletedHoles = useMemo(
    () => completed.flatMap((record) => record.holes),
    [completed],
  );
  const parRate = useMemo(() => parAchievement(allCompletedHoles), [allCompletedHoles]);
  const putts = useMemo(() => puttDistribution(allCompletedHoles), [allCompletedHoles]);
  const trend = scoreTrendArrow(latestScores);

  return (
    <ShellCard>
      {panelTitle("分析", "傾向をひと目で確認")}
      <div className="mb-4 flex flex-wrap gap-2">
        {roundTypes.map((type) => (
          <button
            key={type}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              roundType === type ? "bg-fairway text-white" : "bg-cream text-ink"
            }`}
            onClick={() => setRoundType(type)}
          >
            {ROUND_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {snapshot.roundCount === 0 ? (
        <p className="text-sm text-black/60">分析対象のラウンドがまだありません</p>
      ) : (
        <>
          <div className="mb-3 paper-panel rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-black/55">直近スコアトレンド</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                trend === "↑" ? "bg-emerald-100 text-emerald-700" : trend === "↓" ? "bg-red-100 text-red-700" : "bg-[#eef0ea] text-ink"
              }`}>
                {trend === "↑" ? "改善中" : trend === "↓" ? "要調整" : "横ばい"}
              </span>
            </div>
            <div className="mt-3 flex items-end gap-2 overflow-x-auto pb-1">
              {latestScores.slice(0, 10).map((score, idx) => {
                const best = Math.min(...latestScores);
                const worst = Math.max(...latestScores);
                const range = Math.max(1, worst - best);
                const height = 10 + ((score - best) / range) * 28;
                return (
                  <div key={`score-bar-${idx}`} className="flex min-w-[34px] flex-col items-center gap-1">
                    <div className="w-6 rounded-t-md rounded-b-sm bg-[#3a5b44]" style={{ height: `${height}px` }} />
                    <p className="text-[10px] font-semibold text-black/65">{score}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "ベスト", value: snapshot.bestScore ?? "-", hint: `${snapshot.roundCount}ラウンド` },
              { label: "平均スコア", value: averageLabel(snapshot.averageScore), hint: "全完了ラウンド" },
              { label: "最近5ラウンド", value: averageLabel(snapshot.recentFiveAverage), hint: "直近の傾向" },
              { label: "平均パット", value: averageLabel(snapshot.averagePutts), hint: `対象${snapshot.puttSampleCount}ホール` },
              { label: "GIR率", value: percentage(snapshot.girRate), hint: `対象${snapshot.girSampleCount}ホール` },
              { label: "FW率", value: percentage(snapshot.fwRate), hint: `対象${snapshot.fwSampleCount}ホール` },
            ].map((item) => (
              <div key={item.label} className="paper-panel rounded-[24px] p-4">
                <p className="text-sm text-black/50">{item.label}</p>
                <strong className="font-display mt-3 block text-3xl">{item.value}</strong>
                <p className="mt-3 text-xs text-black/45">{item.hint}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="paper-panel rounded-[24px] p-4">
              <p className="text-sm text-black/50">Par以内達成率</p>
              <p className="mt-2 text-3xl font-display text-ink">
                {parRate.sample === 0 ? "-" : `${Math.round((parRate.underOrEqualPar / parRate.sample) * 100)}%`}
              </p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#2f5b42,#79b48d)]"
                  style={{
                    width:
                      parRate.sample === 0
                        ? "0%"
                        : `${Math.round((parRate.underOrEqualPar / parRate.sample) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-black/55">
                <span>Par以内 {parRate.underOrEqualPar}</span>
                <span>Over {parRate.overPar}</span>
              </div>
            </div>
            <div className="paper-panel rounded-[24px] p-4">
              <p className="text-sm text-black/50">パット分布</p>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  { label: "1P", value: putts.one, color: "bg-emerald-500" },
                  { label: "2P", value: putts.two, color: "bg-[#365741]" },
                  { label: "3P+", value: putts.threePlus, color: "bg-amber-500" },
                  { label: "不明", value: putts.unknown, color: "bg-black/35" },
                ].map((item) => {
                  const width = putts.sample === 0 ? 0 : Math.max(4, Math.round((item.value / putts.sample) * 100));
                  return (
                    <div key={`putt-distribution-${item.label}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-black/70">{item.label}</span>
                        <span className="text-black/55">
                          {item.value} ({putts.sample === 0 ? 0 : Math.round((item.value / putts.sample) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-black/10">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {completed.slice(0, 2).map((record) => {
              const diff = scoreDiff(record.round.totalScore, parTotal(record.holes));
              return (
                <div key={`analytic-recent-${record.round.id}`} className="rounded-[22px] border border-black/8 bg-white/70 px-4 py-3">
                  <p className="text-xs text-black/45">{formatDate(record.round.playedAt)} / {record.round.courseName || "フリーラウンド"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <strong className="text-lg text-ink">{record.round.totalScore ?? "-"}</strong>
                    <span className={`text-xs font-semibold ${diff == null ? "text-black/35" : relativeDiffClass(diff)}`}>
                      {diff == null ? "-" : relativeDiffLabel(diff)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </ShellCard>
  );
}

function RoundCompletePanel({
  summary,
  onContinue,
}: {
  summary: RoundCompleteSummary;
  onContinue: () => void;
}) {
  return (
    <ShellCard className="overflow-hidden bg-[linear-gradient(140deg,#243b2d,#18241d)] text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">Round Complete</p>
          <h2 className="font-display mt-2 text-[1.8rem] leading-tight">{summary.courseName}</h2>
          <p className="mt-2 text-sm text-white/70">
            {formatDate(summary.playedAt)} / {ROUND_TYPE_LABELS[summary.roundType]}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          {summary.isBest ? "NEW BEST" : "FINISHED"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] bg-white/10 px-4 py-3">
          <p className="text-xs text-white/60">総打数</p>
          <p className="mt-1 text-3xl font-semibold">{summary.totalScore}</p>
        </div>
        <div className="rounded-[20px] bg-white/10 px-4 py-3">
          <p className="text-xs text-white/60">対Par</p>
          <p className={`mt-1 text-3xl font-semibold ${relativeDiffClass(summary.diff)}`}>
            {relativeDiffLabel(summary.diff)}
          </p>
        </div>
        <div className="rounded-[20px] bg-white/10 px-4 py-3">
          <p className="text-xs text-white/60">Par合計</p>
          <p className="mt-1 text-3xl font-semibold">{summary.totalPar}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-white/15 bg-white/8 px-4 py-4">
        <p className="text-sm font-semibold text-white/88">今回のハイライト</p>
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          {summary.highlights.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/20 bg-white/10 px-4 py-3">
        <p className="text-sm text-white/88">{summary.encouragement}</p>
        <p className="mt-2 text-sm font-semibold text-[#d8c099]">{summary.nextGoalText}</p>
      </div>

      <button
        className="mt-5 w-full rounded-[20px] bg-white px-4 py-4 font-semibold text-ink"
        onClick={onContinue}
      >
        履歴と分析を見る
      </button>
    </ShellCard>
  );
}

function SettingsPanel({
  defaults,
  uiPreferences,
  onSaveRoundDefaults,
  onSaveUiPreferences,
}: {
  defaults: RoundConfig;
  uiPreferences: UiPreferences;
  onSaveRoundDefaults: (config: RoundConfig) => Promise<void>;
  onSaveUiPreferences: (preferences: Partial<UiPreferences>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(defaults);
  const [uiDraft, setUiDraft] = useState(uiPreferences);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(defaults);
  }, [defaults]);

  useEffect(() => {
    setUiDraft(uiPreferences);
  }, [uiPreferences]);

  return (
    <ShellCard>
      {panelTitle("設定", "入力操作と表示を好みに合わせる")}
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-black/60">記録項目（新規ラウンドの初期値）</p>
        {(
          [
            ["fw", "FWキープ"],
            ["gir", "GIR"],
            ["ob", "OB"],
            ["bunker", "バンカーIN"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="paper-panel flex items-center justify-between rounded-[24px] px-4 py-4">
            <span className="font-medium text-ink">{label}</span>
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [key]: event.target.checked,
                }))
              }
            />
          </label>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        <p className="text-sm font-semibold text-black/60">操作・表示</p>
        {(
          [
            ["highContrast", "高コントラスト表示"],
            ["haptics", "バイブフィードバック"],
            ["celebration", "スコア演出"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="paper-panel flex items-center justify-between rounded-[24px] px-4 py-4">
            <span className="font-medium text-ink">{label}</span>
            <input
              type="checkbox"
              checked={uiDraft[key]}
              onChange={(event) =>
                setUiDraft((current) => ({
                  ...current,
                  [key]: event.target.checked,
                }))
              }
            />
          </label>
        ))}
        <label className="paper-panel flex items-center justify-between rounded-[24px] px-4 py-4">
          <span className="font-medium text-ink">スワイプ感度</span>
          <select
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
            value={uiDraft.swipeSensitivity}
            onChange={(event) =>
              setUiDraft((current) => ({
                ...current,
                swipeSensitivity: event.target.value as UiPreferences["swipeSensitivity"],
              }))
            }
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </label>
        <label className="paper-panel flex items-center justify-between rounded-[24px] px-4 py-4">
          <span className="font-medium text-ink">フォントサイズ</span>
          <select
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
            value={uiDraft.fontScale}
            onChange={(event) =>
              setUiDraft((current) => ({
                ...current,
                fontScale: event.target.value as UiPreferences["fontScale"],
              }))
            }
          >
            <option value="normal">標準</option>
            <option value="large">大</option>
            <option value="xlarge">特大</option>
          </select>
        </label>
        <label className="paper-panel flex items-center justify-between rounded-[24px] px-4 py-4">
          <span className="font-medium text-ink">距離単位</span>
          <select
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
            value={uiDraft.distanceUnit}
            onChange={(event) =>
              setUiDraft((current) => ({
                ...current,
                distanceUnit: event.target.value as UiPreferences["distanceUnit"],
              }))
            }
          >
            <option value="yard">ヤード</option>
            <option value="meter">メートル</option>
          </select>
        </label>
      </div>

      <button
        className="mt-5 w-full rounded-[24px] bg-fairway px-4 py-4 font-semibold text-white"
        onClick={async () => {
          await onSaveRoundDefaults(draft);
          await onSaveUiPreferences(uiDraft);
          setMessage("設定を保存しました。");
        }}
      >
        設定を保存
      </button>
      {message ? (
        <p className="mt-3 rounded-xl border border-black/10 bg-white/80 px-4 py-2 text-sm text-black/65">
          {message}
        </p>
      ) : null}
    </ShellCard>
  );
}

export function AppShell() {
  const boot = useRoundStore((state) => state.boot);
  const hydrated = useRoundStore((state) => state.hydrated);
  const currentRound = useRoundStore((state) => state.currentRound);
  const rounds = useRoundStore((state) => state.rounds);
  const courses = useRoundStore((state) => state.courses);
  const roundDefaults = useRoundStore((state) => state.roundDefaults);
  const uiPreferences = useRoundStore((state) => state.uiPreferences);
  const saveDefaults = useRoundStore((state) => state.saveDefaults);
  const saveUiPreferences = useRoundStore((state) => state.saveUiPreferences);
  const [tab, setTab] = useState<Tab>("history");
  const [completedSummary, setCompletedSummary] = useState<RoundCompleteSummary | null>(null);

  useEffect(() => {
    void boot();
  }, [boot]);

  useEffect(() => {
    if (currentRound) {
      setCompletedSummary(null);
      setTab("input");
    } else if (tab === "input" || tab === "round") {
      setTab("history");
    }
  }, [currentRound, tab]);

  const bestReferenceScore = useMemo(() => {
    if (!currentRound) return null;
    const comparable = rounds
      .filter(
        (item) =>
          item.round.id !== currentRound.round.id &&
          item.round.status === "COMPLETED" &&
          item.round.roundType === currentRound.round.roundType,
      )
      .map((item) => item.round.totalScore)
      .filter((score): score is number => score != null);
    if (comparable.length === 0) return null;
    return Math.min(...comparable);
  }, [currentRound, rounds]);

  if (!hydrated) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-10">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-card">読み込み中...</div>
      </main>
    );
  }

  const visibleTabs = currentRound ? tabs : tabs.filter((item) => item.id !== "input" && item.id !== "round");

  return (
    <main className="mx-auto min-h-screen max-w-7xl overflow-x-hidden px-4 py-6 pb-28 md:px-6 md:py-10 md:pb-10">
      {tab !== "complete" ? <RoundStart onStarted={() => setTab("input")} /> : null}

      <nav className="mb-6 hidden flex-wrap gap-2 md:flex">
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === item.id ? "ink-button text-white" : "paper-panel text-ink"
            }`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-6">
        {tab === "input" && currentRound ? (
          <HoleEditor
            record={currentRound}
            uiPreferences={uiPreferences}
            bestReferenceScore={bestReferenceScore}
            onRoundComplete={(summary) => {
              setCompletedSummary(summary);
              setTab("complete");
            }}
          />
        ) : null}
        {tab === "round" && currentRound ? (
          <RoundInfoPanel
            record={currentRound}
            uiPreferences={uiPreferences}
            onSaveUiPreferences={saveUiPreferences}
            onOpenSettings={() => setTab("settings")}
          />
        ) : null}
        {tab === "history" ? <HistoryPanel records={rounds} courses={courses} /> : null}
        {tab === "complete" && completedSummary ? (
          <RoundCompletePanel
            summary={completedSummary}
            onContinue={() => {
              setTab("history");
            }}
          />
        ) : null}
        {tab === "settings" ? (
          <SettingsPanel
            defaults={roundDefaults}
            uiPreferences={uiPreferences}
            onSaveRoundDefaults={saveDefaults}
            onSaveUiPreferences={saveUiPreferences}
          />
        ) : null}
      </div>

      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-[#d6c3a0] bg-[rgba(247,243,235,0.92)] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur md:hidden ${tab === "input" ? "opacity-80" : ""}`}>
        <div
          className="paper-panel mx-auto grid max-w-xl gap-2 rounded-[24px] p-2"
          style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
        >
          {visibleTabs.map((item) => (
            <button
              key={item.id}
              className={`rounded-[18px] px-3 py-3 text-sm font-semibold ${
                tab === item.id ? "ink-button text-white" : "text-ink"
              }`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
