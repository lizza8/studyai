import type { StudyPlanResponse } from "@/lib/ai";

type StudyPlanProps = {
  plan: StudyPlanResponse;
  completion: Record<string, boolean>;
  onToggle: (item: string) => void;
  onRebalance: () => void;
};

export default function StudyPlan({ plan, completion, onToggle, onRebalance }: StudyPlanProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Daily study plan</h3>
        {plan.overloadDetected ? (
          <span className="rounded-full bg-neon-pink px-3 py-1 text-xs font-semibold text-slate-900 shadow-[0_0_10px_rgba(255,79,216,0.6)]">
            Overload detected
          </span>
        ) : null}
      </div>
      {plan.overloadDetected && plan.overloadNotes.length ? (
        <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          <ul className="list-disc space-y-1 pl-4">
            {plan.overloadNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <button
            className="mt-3 rounded-lg bg-neon-yellow px-3 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_10px_rgba(247,255,90,0.6)]"
            onClick={onRebalance}
            type="button"
          >
            Rebalance plan
          </button>
        </div>
      ) : null}
      <div>
        <h3 className="text-sm font-semibold">Plan details</h3>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-200">
          {plan.dailyPlan.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold">Break reminders</h3>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-200">
          {plan.breakReminders.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      {plan.workloadWarning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {plan.workloadWarning}
        </div>
      ) : null}
      <div>
        <h3 className="text-sm font-semibold">Plan checklist</h3>
        <div className="mt-3 space-y-2">
          {plan.dailyPlan.map((item) => (
            <label
              key={`check-${item}`}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-200"
            >
              <input
                type="checkbox"
                checked={Boolean(completion[item])}
                onChange={() => onToggle(item)}
                className="h-4 w-4 rounded border-slate-500 bg-slate-950"
              />
              <span className={completion[item] ? "line-through text-slate-400" : undefined}>
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
