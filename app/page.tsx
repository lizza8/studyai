"use client";

import { useEffect, useMemo, useState } from "react";
import StudyForm from "@/components/StudyForm";
import StressInput from "@/components/StressInput";
import StressMeter from "@/components/StressMeter";
import StudyPlan from "@/components/StudyPlan";
import Disclaimer from "@/components/Disclaimer";
import FocusTimer from "@/components/FocusTimer";
import QuickTips from "@/components/QuickTips";
import type { StudyPlanResponse, StressCheckResponse, FocusModeResponse } from "@/lib/ai";

const PLAN_KEY = "studysafe:last-plan";
const PROGRESS_KEY = "studysafe:plan-progress";
const GOAL_KEY = "studysafe:focus-goal";
const STRESS_HISTORY_KEY = "studysafe:stress-history";
const MODE_KEY = "studysafe:mode";
const WEEKLY_KEY = "studysafe:weekly-data";
const REFLECTION_KEY = "studysafe:reflection";

type StoredPlan = {
  plan: StudyPlanResponse;
  savedAt: string;
  meta: { hoursPerDay: number; selfStressLevel: number; mode: "Normal Week" | "Exam Week" | "Recovery Mode" };
};

type StressHistoryItem = {
  level: "Low" | "Medium" | "High";
  message: string;
  at: string;
};

type WeeklyDataPoint = {
  date: string;
  stressScore: number;
  studyCompletion: number;
};

type ReflectionEntry = {
  prompt: string;
  response: string;
  reply: string;
  at: string;
  mode: "Normal Week" | "Exam Week" | "Recovery Mode";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function computeBurnoutScore(sentimentScore: number, selfStress: number, hoursPerDay: number) {
  const stressComponent = ((selfStress - 1) / 4) * 30;
  const hoursComponent = (clamp(hoursPerDay, 0, 10) / 10) * 20;
  const score = sentimentScore * 0.5 + stressComponent + hoursComponent;
  return clamp(Math.round(score), 0, 100);
}

function scoreToLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 34) return "Low";
  if (score < 67) return "Medium";
  return "High";
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function upsertWeeklyData(data: WeeklyDataPoint[], entry: WeeklyDataPoint) {
  const next = [...data];
  const index = next.findIndex((item) => item.date === entry.date);
  if (index >= 0) {
    next[index] = entry;
  } else {
    next.push(entry);
  }
  return next.sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
}

function computeTrend(data: WeeklyDataPoint[]) {
  if (data.length < 4) return "Flat" as const;
  const lastThree = data.slice(-3).reduce((sum, item) => sum + item.stressScore, 0) / 3;
  const prevThree = data.slice(-6, -3).reduce((sum, item) => sum + item.stressScore, 0) / 3;
  if (lastThree - prevThree > 6) return "Up" as const;
  if (prevThree - lastThree > 6) return "Down" as const;
  return "Flat" as const;
}

export default function HomePage() {
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null);
  const [planSavedAt, setPlanSavedAt] = useState<string | null>(null);
  const [planCompletion, setPlanCompletion] = useState<Record<string, boolean>>({});
  const [stressResult, setStressResult] = useState<StressCheckResponse | null>(null);
  const [stressHistory, setStressHistory] = useState<StressHistoryItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [weeklyInsight, setWeeklyInsight] = useState<string>("");
  const [focusSuggestion, setFocusSuggestion] = useState<FocusModeResponse>({
    focusMinutes: 25,
    breakMinutes: 5,
    reason: "A steady focus rhythm helps build consistency."
  });
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [studyMeta, setStudyMeta] = useState({ hoursPerDay: 0, selfStressLevel: 1, mode: "Normal Week" as const });
  const [focusGoal, setFocusGoal] = useState("");
  const [reflectionPrompt, setReflectionPrompt] = useState("");
  const [reflectionResponse, setReflectionResponse] = useState("");
  const [reflectionReply, setReflectionReply] = useState("");
  const [reflectionHistory, setReflectionHistory] = useState<ReflectionEntry[]>([]);

  useEffect(() => {
    const storedPlan = localStorage.getItem(PLAN_KEY);
    if (storedPlan) {
      try {
        const parsed = JSON.parse(storedPlan) as StoredPlan;
        if (parsed?.plan?.dailyPlan) {
          setPlan(parsed.plan);
          setPlanSavedAt(parsed.savedAt);
          setStudyMeta(parsed.meta);
        }
      } catch {
        // Ignore bad localStorage data
      }
    }

    const storedProgress = localStorage.getItem(PROGRESS_KEY);
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress) as Record<string, boolean>;
        setPlanCompletion(parsed ?? {});
      } catch {
        // Ignore bad localStorage data
      }
    }

    const storedGoal = localStorage.getItem(GOAL_KEY);
    if (storedGoal) {
      setFocusGoal(storedGoal);
    }

    const storedHistory = localStorage.getItem(STRESS_HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as StressHistoryItem[];
        setStressHistory(parsed ?? []);
      } catch {
        // Ignore bad localStorage data
      }
    }

    const storedWeekly = localStorage.getItem(WEEKLY_KEY);
    if (storedWeekly) {
      try {
        const parsed = JSON.parse(storedWeekly) as WeeklyDataPoint[];
        setWeeklyData(parsed ?? []);
      } catch {
        // Ignore bad localStorage data
      }
    }

    const storedMode = localStorage.getItem(MODE_KEY) as typeof studyMeta.mode | null;
    if (storedMode) {
      setStudyMeta((prev) => ({ ...prev, mode: storedMode }));
    }

    const storedReflection = localStorage.getItem(REFLECTION_KEY);
    if (storedReflection) {
      try {
        const parsed = JSON.parse(storedReflection) as ReflectionEntry[];
        setReflectionHistory(parsed ?? []);
      } catch {
        // Ignore bad localStorage data
      }
    }

    const todayPrompt = [
      "What’s one thing you learned today?",
      "What small win are you proud of today?",
      "What felt challenging, and what helped even a little?",
      "Who supported you today, even in a small way?",
      "What would make tomorrow feel a bit easier?",
      "What is one kind thing you can say to yourself today?",
      "What is one task you handled well?"
    ];
    const promptIndex = new Date().getDay() % todayPrompt.length;
    setReflectionPrompt(todayPrompt[promptIndex]);
  }, []);

  const burnoutScore = useMemo(() => {
    const sentiment = stressResult?.sentimentScore ?? 0;
    return computeBurnoutScore(sentiment, studyMeta.selfStressLevel, studyMeta.hoursPerDay);
  }, [stressResult, studyMeta]);

  const burnoutLevel = scoreToLevel(burnoutScore);
  const isRedFlag = Boolean(stressResult?.redFlag);

  const progressPercent = plan
    ? Math.round(
        (plan.dailyPlan.filter((item) => planCompletion[item]).length / plan.dailyPlan.length) * 100
      )
    : 0;

  const chartPoints = useMemo(() => {
    if (!weeklyData.length) return "";
    const maxX = 240;
    const maxY = 80;
    const padding = 10;
    const points = weeklyData.map((item, index) => {
      const x = padding + (index / Math.max(weeklyData.length - 1, 1)) * (maxX - padding * 2);
      const y = padding + ((100 - item.stressScore) / 100) * (maxY - padding * 2);
      return `${x},${y}`;
    });
    return points.join(" ");
  }, [weeklyData]);

  const handlePlanGenerated = (
    data: StudyPlanResponse,
    meta: { hoursPerDay: number; selfStressLevel: number; mode: "Normal Week" | "Exam Week" | "Recovery Mode" },
    _input?: {
      subjects: string;
      deadlines: string;
      hoursPerDay: number;
      selfStressLevel: number;
      mode: "Normal Week" | "Exam Week" | "Recovery Mode";
    }
  ) => {
    const stored: StoredPlan = {
      plan: data,
      savedAt: new Date().toISOString(),
      meta
    };

    setPlan(data);
    setStudyMeta(meta);
    setPlanSavedAt(stored.savedAt);
    setCoachMessage(data.coachMessage);
    setPlanCompletion({});

    localStorage.setItem(PLAN_KEY, JSON.stringify(stored));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({}));
    localStorage.setItem(MODE_KEY, meta.mode);
  };

  const handleStressChecked = (data: StressCheckResponse) => {
    setStressResult(data);
    setCoachMessage(data.coachMessage);

    const nextHistory = [
      {
        level: data.stressLevel,
        message: data.supportiveMessage,
        at: new Date().toISOString()
      },
      ...stressHistory
    ].slice(0, 5);

    setStressHistory(nextHistory);
    localStorage.setItem(STRESS_HISTORY_KEY, JSON.stringify(nextHistory));

    const todayKey = getDateKey(new Date());
    const completionScore = plan?.dailyPlan?.length
      ? Math.round(
          (plan.dailyPlan.filter((item) => planCompletion[item]).length / plan.dailyPlan.length) * 100
        )
      : 0;
    const nextWeekly = upsertWeeklyData(weeklyData, {
      date: todayKey,
      stressScore: data.sentimentScore,
      studyCompletion: completionScore
    });
    setWeeklyData(nextWeekly);
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(nextWeekly));
  };

  const handleToggleCompletion = (item: string) => {
    setPlanCompletion((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));

      if (plan?.dailyPlan?.length) {
        const completionScore = Math.round(
          (plan.dailyPlan.filter((planItem) => next[planItem]).length / plan.dailyPlan.length) * 100
        );
        const todayKey = getDateKey(new Date());
        const nextWeekly = upsertWeeklyData(weeklyData, {
          date: todayKey,
          stressScore: stressResult?.sentimentScore ?? 0,
          studyCompletion: completionScore
        });
        setWeeklyData(nextWeekly);
        localStorage.setItem(WEEKLY_KEY, JSON.stringify(nextWeekly));
      }
      return next;
    });
  };

  const handleGoalSave = () => {
    localStorage.setItem(GOAL_KEY, focusGoal);
  };

  const handleRebalancePlan = () => {
    if (!plan?.rebalancePlan?.length) return;
    const updated = {
      ...plan,
      dailyPlan: plan.rebalancePlan,
      overloadDetected: false,
      overloadNotes: [],
      rebalancePlan: undefined,
      workloadWarning: "Plan rebalanced to reduce overload."
    };
    setPlan(updated);
    const stored: StoredPlan = {
      plan: updated,
      savedAt: new Date().toISOString(),
      meta: studyMeta
    };
    setPlanSavedAt(stored.savedAt);
    localStorage.setItem(PLAN_KEY, JSON.stringify(stored));
  };

  const handleModeChange = (mode: "Normal Week" | "Exam Week" | "Recovery Mode") => {
    setStudyMeta((prev) => ({ ...prev, mode }));
    localStorage.setItem(MODE_KEY, mode);
  };

  const handleReflectionSubmit = async () => {
    if (!reflectionResponse.trim()) return;
    const response = await fetch("/api/reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: reflectionPrompt,
        response: reflectionResponse,
        mode: studyMeta.mode
      })
    });
    if (!response.ok) return;
    const data = (await response.json()) as { supportiveReply?: string };
    const reply = data.supportiveReply ?? "Thanks for sharing. Keep taking it one step at a time.";
    setReflectionReply(reply);

    const entry: ReflectionEntry = {
      prompt: reflectionPrompt,
      response: reflectionResponse,
      reply,
      at: new Date().toISOString(),
      mode: studyMeta.mode
    };
    const nextHistory = [entry, ...reflectionHistory].slice(0, 5);
    setReflectionHistory(nextHistory);
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(nextHistory));
  };

  useEffect(() => {
    const fetchFocusSuggestion = async () => {
      try {
        const response = await fetch("/api/focus-mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stressLevel: stressResult?.stressLevel ?? "Low",
            selfStressLevel: studyMeta.selfStressLevel,
            mode: studyMeta.mode
          })
        });
        if (!response.ok) return;
        const data = (await response.json()) as FocusModeResponse;
        if (data?.focusMinutes) {
          setFocusSuggestion(data);
        }
      } catch {
        // Ignore focus mode errors
      }
    };

    if (!isRedFlag) {
      void fetchFocusSuggestion();
    }
  }, [stressResult?.stressLevel, studyMeta.selfStressLevel, studyMeta.mode, isRedFlag]);

  useEffect(() => {
    const fetchWeeklyInsight = async () => {
      if (!weeklyData.length) return;
      const trend = computeTrend(weeklyData);
      const consistencyScore =
        weeklyData.reduce((sum, item) => sum + item.studyCompletion, 0) / weeklyData.length;
      try {
        const response = await fetch("/api/weekly-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stressTrend: trend,
            consistencyScore,
            burnoutLevel
          })
        });
        if (!response.ok) return;
        const data = (await response.json()) as { insight?: string };
        if (data?.insight) {
          setWeeklyInsight(data.insight);
        }
      } catch {
        // Ignore weekly insight errors
      }
    };

    void fetchWeeklyInsight();
  }, [weeklyData, burnoutLevel]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="container py-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-white shadow-[0_0_30px_rgba(79,155,255,0.2)]">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-neon-green">StudySafe AI</p>
            <h1 className="text-3xl font-bold">Study smarter, stay balanced.</h1>
            <p className="max-w-2xl text-base text-slate-200">
              StudySafe AI helps you build a friendly study plan, check your stress level, and keep a healthy balance.
              It’s not a medical tool, just a supportive study buddy.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
              <span className="rounded-full border border-neon-purple/40 bg-slate-950/70 px-3 py-1">
                Mode: {studyMeta.mode}
              </span>
              {plan?.overloadDetected ? (
                <span className="rounded-full border border-neon-pink/40 bg-slate-950/70 px-3 py-1 text-neon-pink">
                  Overload detected
                </span>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-neon-blue/40 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Plan status</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {plan ? "Plan ready" : "No plan yet"}
              </p>
              <p className="text-xs text-slate-400">
                {planSavedAt ? `Saved ${new Date(planSavedAt).toLocaleString()}` : "Generate a plan to save it."}
              </p>
            </div>
            <div className="rounded-2xl border border-neon-green/40 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Progress</p>
              <p className="mt-2 text-lg font-semibold text-white">{progressPercent}% complete</p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-neon-green shadow-[0_0_12px_rgba(61,255,125,0.6)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-neon-pink/40 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Burnout risk</p>
              <p className="mt-2 text-lg font-semibold text-white">{burnoutLevel}</p>
              <p className="text-xs text-slate-400">Score: {burnoutScore}/100</p>
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {isRedFlag ? (
            <div className="rounded-2xl border border-neon-pink/50 bg-slate-950/70 p-6 text-sm text-slate-200 shadow-[0_0_18px_rgba(255,79,216,0.35)]">
              <p className="text-sm font-semibold text-neon-pink">Paused for safety</p>
              <p className="mt-2">
                Study planning is paused right now. If you can, reach out to a trusted adult, teacher, or counselor.
              </p>
            </div>
          ) : (
            <StudyForm
              mode={studyMeta.mode}
              onModeChange={handleModeChange}
              onPlanGenerated={handlePlanGenerated}
            />
          )}
          <div className="space-y-6">
            <StressInput mode={studyMeta.mode} onStressChecked={handleStressChecked} />
            <StressMeter score={burnoutScore} level={burnoutLevel} />
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {isRedFlag ? (
              <div className="rounded-2xl border border-neon-pink/50 bg-slate-950/70 p-6 text-sm text-slate-200 shadow-[0_0_18px_rgba(255,79,216,0.35)]">
                <p className="text-sm font-semibold text-neon-pink">Safety check</p>
                <p className="mt-2">
                  It sounds like you’re having a really hard time. You deserve support and you don’t have to handle
                  this alone.
                </p>
                <p className="mt-3 text-slate-300">
                  Please reach out to a trusted adult, teacher, or counselor. You can also pause this app and take a
                  slow breath.
                </p>
              </div>
            ) : plan ? (
              <div className="space-y-4">
                {plan.overloadDetected ? (
                  <div className="rounded-2xl border border-neon-yellow/40 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-neon-yellow">Heavy load detected</p>
                      <button
                        onClick={handleRebalancePlan}
                        className="rounded-lg bg-neon-yellow px-3 py-1 text-xs font-semibold text-slate-900 shadow-[0_0_10px_rgba(247,255,90,0.6)]"
                      >
                        Rebalance plan
                      </button>
                    </div>
                    <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-300">
                      {plan.overloadNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <StudyPlan plan={plan} completion={planCompletion} onToggle={handleToggleCompletion} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-sm text-slate-300">
                Your study plan will appear here after you generate one.
              </div>
            )}
            {!isRedFlag ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
                <h3 className="text-sm font-semibold">Today’s focus goal</h3>
                <p className="mt-2 text-xs text-slate-300">Write one small goal you can finish today.</p>
                <div className="mt-4 flex gap-3">
                  <input
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500"
                    value={focusGoal}
                    onChange={(event) => setFocusGoal(event.target.value)}
                    placeholder="Finish science summary notes"
                  />
                  <button
                    onClick={handleGoalSave}
                    className="rounded-lg bg-neon-purple px-4 text-sm font-semibold text-slate-900 shadow-[0_0_14px_rgba(168,85,247,0.55)]"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-6">
            {stressResult ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
                <h3 className="text-sm font-semibold">Stress check results</h3>
                <p className="mt-3 text-sm text-slate-200">{stressResult.supportiveMessage}</p>
                {stressResult.redFlag ? (
                  <div className="mt-4 rounded-lg border border-neon-pink/50 bg-slate-950/70 p-3 text-sm text-slate-200">
                    {stressResult.redFlagMessage ??
                      "Please reach out to a trusted adult, teacher, or counselor who can support you."}
                  </div>
                ) : (
                  <>
                    <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-200">
                      {stressResult.practicalAdvice.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    {stressResult.stressLevel === "High" ? (
                      <div className="mt-4 rounded-lg border border-neon-pink/40 bg-slate-950/70 p-3 text-sm text-slate-200">
                        If you’re feeling overwhelmed, consider reaching out to a trusted adult, teacher, or counselor.
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-sm text-slate-300">
                Your stress check results will appear here after you check in.
              </div>
            )}
            {stressHistory.length ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
                <h3 className="text-sm font-semibold">Recent check-ins</h3>
                <div className="mt-3 space-y-3">
                  {stressHistory.map((item) => (
                    <div key={item.at} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{item.level} stress</span>
                        <span>{new Date(item.at).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {coachMessage ? (
              <div className="rounded-2xl border border-neon-blue/30 bg-slate-950/60 p-4 text-sm font-semibold text-neon-blue shadow-[0_0_16px_rgba(79,155,255,0.45)]">
                {coachMessage}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
            <h3 className="text-sm font-semibold">Weekly wellbeing summary</h3>
            <p className="mt-2 text-xs text-slate-300">
              Tracks stress trend and consistency from your recent check-ins.
            </p>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              {weeklyData.length ? (
                <svg viewBox="0 0 240 80" className="h-24 w-full">
                  <polyline
                    fill="none"
                    stroke="url(#neonLine)"
                    strokeWidth="3"
                    points={chartPoints}
                  />
                  <defs>
                    <linearGradient id="neonLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f9bff" />
                      <stop offset="50%" stopColor="#3dff7d" />
                      <stop offset="100%" stopColor="#ff4fd8" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <p className="text-xs text-slate-400">Complete a few check-ins to see your trend.</p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-neon-blue/40 bg-slate-950/70 px-3 py-1">
                Trend: {computeTrend(weeklyData)}
              </span>
              <span className="rounded-full border border-neon-green/40 bg-slate-950/70 px-3 py-1">
                Consistency:{" "}
                {weeklyData.length
                  ? Math.round(
                      weeklyData.reduce((sum, item) => sum + item.studyCompletion, 0) / weeklyData.length
                    )
                  : 0}
                %
              </span>
              <span className="rounded-full border border-neon-pink/40 bg-slate-950/70 px-3 py-1">
                Burnout: {burnoutLevel}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-200">
              {weeklyInsight || "Keep logging check-ins to build your weekly insight."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
            <h3 className="text-sm font-semibold">Reflection prompt</h3>
            <p className="mt-2 text-xs text-slate-300">{reflectionPrompt}</p>
            <textarea
              className="mt-4 h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500"
              placeholder="Write a few sentences..."
              value={reflectionResponse}
              onChange={(event) => setReflectionResponse(event.target.value)}
            />
            <button
              onClick={handleReflectionSubmit}
              className="mt-3 w-full rounded-lg bg-neon-blue px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_0_16px_rgba(79,155,255,0.5)]"
            >
              Reflect
            </button>
            {reflectionReply ? (
              <p className="mt-3 text-sm text-slate-200">{reflectionReply}</p>
            ) : null}
          </div>
        </section>

        {!isRedFlag ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-3">
            <FocusTimer
              focusMinutes={focusSuggestion.focusMinutes}
              breakMinutes={focusSuggestion.breakMinutes}
              reason={focusSuggestion.reason}
            />
            <QuickTips />
            <div className="rounded-2xl border border-neon-purple/40 bg-slate-900/70 p-6 shadow-sm">
              <h3 className="text-sm font-semibold">Daily balance checklist</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {[
                  "Drink water",
                  "Move for 5 minutes",
                  "Take a screen break",
                  "Ask for help if stuck"
                ].map((item, index) => (
                  <li key={item} className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        index % 4 === 0
                          ? "bg-neon-blue"
                          : index % 4 === 1
                            ? "bg-neon-green"
                            : index % 4 === 2
                              ? "bg-neon-yellow"
                              : "bg-neon-pink"
                      }`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <Disclaimer />
        </section>
      </div>
    </main>
  );
}
