import { NextResponse } from "next/server";
import { getFocusModeSuggestion } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      stressLevel?: "Low" | "Medium" | "High";
      selfStressLevel?: number;
      mode?: "Normal Week" | "Exam Week" | "Recovery Mode";
    };

    const result = await getFocusModeSuggestion({
      stressLevel: body.stressLevel ?? "Low",
      selfStressLevel: Number(body.selfStressLevel ?? 1),
      mode: body.mode ?? "Normal Week"
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get focus mode suggestion." },
      { status: 500 }
    );
  }
}
