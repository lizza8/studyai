type WeeklySummaryProps = {
  points: number[];
  labels: string[];
  insight: string;
  consistencyScore: number;
  burnoutLevel: "Low" | "Medium" | "High";
  stressTrend: "Up" | "Down" | "Flat";
};

function buildPolyline(points: number[]) {
  if (!points.length) return "";
  const max = 100;
  const min = 0;
  const width = 240;
  const height = 80;
  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const normalized = (value - min) / (max - min || 1);
      const y = height - normalized * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function WeeklySummary({
  points,
  labels,
  insight,
  consistencyScore,
  burnoutLevel,
  stressTrend
}: WeeklySummaryProps) {
  const polyline = buildPolyline(points);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Weekly wellbeing summary</h3>
        <span className="text-xs font-semibold text-slate-400">Trend: {stressTrend}</span>
      </div>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <svg viewBox="0 0 240 80" className="h-20 w-full">
          <polyline
            fill="none"
            stroke="url(#neonLine)"
            strokeWidth="3"
            points={polyline}
          />
          <defs>
            <linearGradient id="neonLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#4f9bff" />
              <stop offset="50%" stopColor="#3dff7d" />
              <stop offset="100%" stopColor="#ff4fd8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-xs md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-slate-400">Consistency</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{consistencyScore}%</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-slate-400">Burnout risk</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{burnoutLevel}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-slate-400">AI insight</p>
          <p className="mt-1 text-sm text-slate-100">{insight}</p>
        </div>
      </div>
    </div>
  );
}
