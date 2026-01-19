import { NextResponse } from "next/server";
import { generateStudyPlan } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      subjects?: string;
      deadlines?: string;
      hoursPerDay?: number;
      selfStressLevel?: number;
      mode?: "Normal Week" | "Exam Week" | "Recovery Mode";
      rebalance?: boolean;
    };

    const subjects = body.subjects
      ? body.subjects.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const hoursPerDay = Number(body.hoursPerDay ?? 0);
    const selfStressLevel = Number(body.selfStressLevel ?? 1);

    const result = await generateStudyPlan({
      subjects,
      deadlines: body.deadlines ?? "",
      hoursPerDay: Number.isFinite(hoursPerDay) ? hoursPerDay : 0,
      selfStressLevel: Number.isFinite(selfStressLevel) ? selfStressLevel : 1,
      mode: body.mode ?? "Normal Week"
    });

    if (body.rebalance && result.rebalancePlan?.length) {
      return NextResponse.json({
        ...result,
        dailyPlan: result.rebalancePlan
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate study plan." },
      { status: 500 }
    );
  }
}
