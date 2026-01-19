import { NextResponse } from "next/server";
import { getWeeklyInsight } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      stressTrend?: "Up" | "Down" | "Flat";
      consistencyScore?: number;
      burnoutLevel?: "Low" | "Medium" | "High";
    };

    const result = await getWeeklyInsight({
      stressTrend: body.stressTrend ?? "Flat",
      consistencyScore: Number(body.consistencyScore ?? 0),
      burnoutLevel: body.burnoutLevel ?? "Low"
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get weekly summary." },
      { status: 500 }
    );
  }
}
