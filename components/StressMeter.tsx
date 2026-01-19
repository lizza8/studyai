type StressMeterProps = {
  score: number;
  level: "Low" | "Medium" | "High";
};

const levelStyles: Record<StressMeterProps["level"], string> = {
  Low: "bg-neon-green shadow-[0_0_14px_rgba(61,255,125,0.7)]",
  Medium: "bg-neon-yellow shadow-[0_0_14px_rgba(247,255,90,0.7)]",
  High: "bg-neon-pink shadow-[0_0_14px_rgba(255,79,216,0.7)]"
};

export default function StressMeter({ score, level }: StressMeterProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Burnout risk indicator</h3>
        <span className="text-sm font-semibold text-slate-300">{level}</span>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full ${levelStyles[level]} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Based on your check-in, self-reported stress, and study hours.
      </p>
    </div>
  );
}
