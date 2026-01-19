"use client";

import { useState } from "react";

const TIPS = [
  "Start with the easiest task to build momentum.",
  "Keep your phone out of reach during focus time.",
  "Study in 25-minute blocks with short breaks.",
  "Teach the topic out loud to test yourself.",
  "Write a 2-sentence summary after each session.",
  "Stop 30 minutes before bed to wind down."
];

export default function QuickTips() {
  const [index, setIndex] = useState(0);

  const handleShuffle = () => {
    setIndex((prev) => (prev + 1) % TIPS.length);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Quick tip</h3>
        <button
          onClick={handleShuffle}
          className="text-xs font-semibold text-neon-purple"
        >
          New tip
        </button>
      </div>
      <p className="mt-4 text-sm text-slate-200">{TIPS[index]}</p>
    </div>
  );
}
