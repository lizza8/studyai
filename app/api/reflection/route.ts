import { NextResponse } from "next/server";
import { respondToReflection } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      response?: string;
      mode?: "Normal Week" | "Exam Week" | "Recovery Mode";
    };

    const result = await respondToReflection({
      prompt: body.prompt ?? "",
      response: body.response ?? "",
      mode: body.mode ?? "Normal Week"
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to respond to reflection." },
      { status: 500 }
    );
  }
}
