"use client";

import { useEffect, useState } from "react";

type FocusTimerProps = {
  focusMinutes: number;
  breakMinutes: number;
  reason: string;
  disabled?: boolean;
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function FocusTimer({
  focusMinutes,
  breakMinutes,
  reason,
  disabled
}: FocusTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === "focus") {
            setSessionsCompleted((count) => count + 1);
            setPhase("break");
            setNotification("Time for a short break.");
            return breakMinutes * 60;
          }
          setPhase("focus");
          setNotification("Back to focus time.");
          return focusMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(phase === "focus" ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, phase, isRunning]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleReset = () => {
    setIsRunning(false);
    setPhase("focus");
    setSecondsLeft(focusMinutes * 60);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Focus timer</h3>
        <span className="text-xs font-semibold text-slate-400">{sessionsCompleted} sessions</span>
      </div>
      <div className="mt-4 rounded-xl bg-slate-950 p-6 text-center text-3xl font-semibold text-neon-green shadow-[0_0_22px_rgba(61,255,125,0.5)]">
        {formatTime(secondsLeft)}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {phase === "focus" ? "Focus session" : "Break session"} · {reason}
      </p>
      {notification ? (
        <div className="mt-3 rounded-lg border border-neon-blue/40 bg-slate-950/70 p-2 text-xs text-neon-blue">
          {notification}
        </div>
      ) : null}
      <div className="mt-4 flex gap-3">
        <button
          className="flex-1 rounded-lg bg-neon-green px-3 py-2 text-sm font-semibold text-slate-900 shadow-[0_0_16px_rgba(61,255,125,0.5)]"
          onClick={() => setIsRunning((prev) => !prev)}
          disabled={disabled}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200"
          onClick={handleReset}
          disabled={disabled}
        >
          Reset
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Default rhythm is {focusMinutes}/{breakMinutes} minutes.
      </p>
    </div>
  );
}
