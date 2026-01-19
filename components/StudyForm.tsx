"use client";

import { useState } from "react";
import type { StudyPlanResponse } from "@/lib/ai";

const defaultForm = {
  subjects: "Math, Science, English",
  deadlines: "Math test Friday, English essay next week",
  hoursPerDay: 2,
  selfStressLevel: 3
};

type StudyFormProps = {
  mode: "Normal Week" | "Exam Week" | "Recovery Mode";
  onModeChange: (mode: "Normal Week" | "Exam Week" | "Recovery Mode") => void;
  onPlanGenerated: (
    plan: StudyPlanResponse,
    meta: { hoursPerDay: number; selfStressLevel: number; mode: "Normal Week" | "Exam Week" | "Recovery Mode" },
    input: {
      subjects: string;
      deadlines: string;
      hoursPerDay: number;
      selfStressLevel: number;
      mode: "Normal Week" | "Exam Week" | "Recovery Mode";
    }
  ) => void;
};

export default function StudyForm({ mode, onModeChange, onPlanGenerated }: StudyFormProps) {
  const [subjects, setSubjects] = useState(defaultForm.subjects);
  const [deadlines, setDeadlines] = useState(defaultForm.deadlines);
  const [hoursPerDay, setHoursPerDay] = useState(defaultForm.hoursPerDay);
  const [selfStressLevel, setSelfStressLevel] = useState(defaultForm.selfStressLevel);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          deadlines,
          hoursPerDay,
          selfStressLevel,
          mode
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = (await response.json()) as StudyPlanResponse;
      onPlanGenerated(
        data,
        { hoursPerDay, selfStressLevel, mode },
        { subjects, deadlines, hoursPerDay, selfStressLevel, mode }
      );
    } catch (err) {
      setError("We couldn’t generate a plan right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <div>
        <label className="text-sm font-semibold">Subjects (comma separated)</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 placeholder:text-slate-500"
          value={subjects}
          onChange={(event) => setSubjects(event.target.value)}
          placeholder="Math, Science, English"
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Upcoming deadlines</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 placeholder:text-slate-500"
          value={deadlines}
          onChange={(event) => setDeadlines(event.target.value)}
          placeholder="Math test Friday, English essay next week"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Study hours per day</label>
          <input
            type="number"
            min={0}
            max={8}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100"
            value={hoursPerDay}
            onChange={(event) => setHoursPerDay(Number(event.target.value))}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Stress level (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100"
            value={selfStressLevel}
            onChange={(event) => setSelfStressLevel(Number(event.target.value))}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Student mode</label>
        <select
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as typeof mode)}
        >
          <option value="Normal Week">Normal Week</option>
          <option value="Exam Week">Exam Week</option>
          <option value="Recovery Mode">Recovery Mode</option>
        </select>
        <p className="mt-2 text-xs text-slate-400">
          Modes adjust study intensity and AI tone.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-lg bg-neon-blue px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_0_18px_rgba(79,155,255,0.6)] transition hover:bg-neon-green disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? "Creating plan..." : "Generate study plan"}
      </button>
    </form>
  );
}
