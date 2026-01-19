"use client";

import { useState } from "react";
import type { StressCheckResponse } from "@/lib/ai";

type StressInputProps = {
  onStressChecked: (result: StressCheckResponse) => void;
  mode: "Normal Week" | "Exam Week" | "Recovery Mode";
};

export default function StressInput({ onStressChecked, mode }: StressInputProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stress-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze stress");
      }

      const data = (await response.json()) as StressCheckResponse;
      onStressChecked(data);
    } catch (err) {
      setError("We couldn’t check stress right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <div>
        <label className="text-sm font-semibold">Stress & mood check-in</label>
        <textarea
          className="mt-2 h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 placeholder:text-slate-500"
          placeholder="How are you feeling about school today?"
          value={text}
          onChange={(event) => setText(event.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-lg bg-neon-pink px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_0_18px_rgba(255,79,216,0.55)] transition hover:bg-neon-yellow disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? "Checking..." : "Check in"}
      </button>
    </form>
  );
}
