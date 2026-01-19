import { NextResponse } from "next/server";
import { analyzeStress } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; mode?: "Normal Week" | "Exam Week" | "Recovery Mode" };
    const text = body.text?.trim() ?? "";

    const result = await analyzeStress({ text, mode: body.mode });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to analyze stress." },
      { status: 500 }
    );
  }
}
