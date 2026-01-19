"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReflectionResponse } from "@/lib/ai";

const PROMPTS = [
  "What is one small win you had today?",
  "What felt hardest today, and why?",
  "Who helped you this week, even in a small way?",
  "What is one thing you can do to feel calmer tomorrow?",
  "What subject felt the best today, and what helped?",
  "What do you want to remember before bed tonight?"
];

type ReflectionPromptProps = {
  mode: "Normal Week" | "Exam Week" | "Recovery Mode";
};

const STORAGE_KEY = "studysafe:reflection";

export default function ReflectionPrompt({ mode }: ReflectionPromptProps) {
  const [response, setResponse] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompt = useMemo(() => {
    const today = new Date();
    const index = today.getDate() % PROMPTS.length;
    return PROMPTS[index];
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { prompt: string; response: string; reply: string };
      if (parsed.prompt === prompt) {
        setResponse(parsed.response);
        setReply(parsed.reply);
      }
    } catch {
      // Ignore bad localStorage data
    }
  }, [prompt]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, response, mode })
      });

      if (!res.ok) {
        throw new Error("Failed to get reflection reply");
      }

      const data = (await res.json()) as ReflectionResponse;
      setReply(data.supportiveReply);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prompt, response, reply: data.supportiveReply })
      );
    } catch {
      setError("We couldn’t respond right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <h3 className="text-sm font-semibold">Daily reflection</h3>
      <p className="mt-2 text-sm text-slate-200">{prompt}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          className="h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-500"
          placeholder="Share a quick thought..."
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          required
        />
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-neon-blue px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_0_14px_rgba(79,155,255,0.6)]"
          disabled={isLoading}
        >
          {isLoading ? "Thinking..." : "Get supportive reply"}
        </button>
      </form>
      {reply ? (
        <div className="mt-4 rounded-lg border border-neon-blue/30 bg-slate-950/70 p-3 text-sm text-slate-200">
          {reply}
        </div>
      ) : null}
    </div>
  );
}
