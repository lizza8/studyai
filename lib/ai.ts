const SYSTEM_PROMPT = `You are StudySafe AI, a supportive study and wellbeing assistant for students.
You prioritize balance, safety, and encouragement.
You never diagnose or replace professional help.
You slow down productivity advice when stress is high.`;

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

export type StudyPlanResponse = {
  dailyPlan: string[];
  breakReminders: string[];
  workloadWarning: string | null;
  coachMessage: string;
  overloadDetected: boolean;
  overloadNotes: string[];
  rebalancePlan?: string[];
};

export type StressCheckResponse = {
  stressLevel: "Low" | "Medium" | "High";
  supportiveMessage: string;
  practicalAdvice: string[];
  sentimentScore: number;
  coachMessage: string;
  redFlag?: boolean;
  redFlagMessage?: string;
};

export type FocusModeResponse = {
  focusMinutes: number;
  breakMinutes: number;
  reason: string;
};

export type WeeklySummaryResponse = {
  insight: string;
};

export type ReflectionResponse = {
  supportiveReply: string;
};

type StudyPlanInput = {
  subjects: string[];
  deadlines: string;
  hoursPerDay: number;
  selfStressLevel: number;
  mode?: "Normal Week" | "Exam Week" | "Recovery Mode";
};

type StressCheckInput = {
  text: string;
  mode?: "Normal Week" | "Exam Week" | "Recovery Mode";
};

type FocusModeInput = {
  stressLevel: "Low" | "Medium" | "High";
  selfStressLevel: number;
  mode?: "Normal Week" | "Exam Week" | "Recovery Mode";
};

type WeeklySummaryInput = {
  stressTrend: "Up" | "Down" | "Flat";
  consistencyScore: number;
  burnoutLevel: "Low" | "Medium" | "High";
};

type ReflectionInput = {
  prompt: string;
  response: string;
  mode?: "Normal Week" | "Exam Week" | "Recovery Mode";
};

function getHeaders() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };
}

async function callAI(userPrompt: string) {
  const headers = getHeaders();
  if (!headers) return null;

  const baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content ?? null;
}

function safeJsonParse<T>(content: string | null): T | null {
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

const COACH_MESSAGES = [
  "Consistency beats cramming.",
  "Small steps add up. You got this!",
  "Take a breath and keep going.",
  "You’re doing more than you think.",
  "Plan, pace, and pause."
];

function pickCoachMessage(seed: number) {
  return COACH_MESSAGES[Math.abs(seed) % COACH_MESSAGES.length];
}

function detectRedFlag(text: string) {
  const signals = ["suicide", "kill myself", "self harm", "self-harm", "end it", "hurt myself", "no reason to live"];
  return signals.some((signal) => text.includes(signal));
}

function detectOverload(input: StudyPlanInput) {
  const notes: string[] = [];
  const subjectCount = input.subjects.length;
  const deadlinesDensity = input.deadlines.length;
  const hoursPerDay = input.hoursPerDay;

  if (subjectCount >= 5) {
    notes.push("That’s a lot of subjects. Consider rotating focus each day.");
  }
  if (deadlinesDensity >= 60) {
    notes.push("You have many deadlines listed. Spreading tasks across days can help.");
  }
  if (hoursPerDay >= 4) {
    notes.push("More than 4 hours a day can be tiring. Try shorter sessions.");
  }

  const overloadDetected = notes.length >= 2 || hoursPerDay >= 5 || subjectCount >= 6;
  return { overloadDetected, overloadNotes: notes };
}

function buildRebalancePlan(input: StudyPlanInput) {
  const basePlan = input.subjects.length ? input.subjects : ["Math", "Science", "Reading"];
  const maxHours = input.mode === "Recovery Mode" ? 1 : 2;
  return basePlan.slice(0, 5).map((subject, index) => {
    return `Day ${index + 1}: ${subject} for ${maxHours} hour(s)`;
  });
}

export async function generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanResponse> {
  const { overloadDetected, overloadNotes } = detectOverload(input);
  const prompt = `Create a friendly study plan in JSON only.\n\nInput:\n${JSON.stringify({
    ...input,
    overloadDetected,
    overloadNotes
  })}\n\nRules:\n- Never encourage over-studying\n- Always recommend breaks\n- If overloadDetected is true, suggest a rebalanced plan\n- Keep language simple and friendly\n\nReturn JSON with keys: dailyPlan (array of strings), breakReminders (array), workloadWarning (string or null), coachMessage (short sentence), overloadDetected (boolean), overloadNotes (array), rebalancePlan (array, optional).`;

  const aiContent = await callAI(prompt);
  const aiJson = safeJsonParse<StudyPlanResponse>(aiContent);
  if (aiJson && aiJson.dailyPlan?.length) {
    return {
      ...aiJson,
      overloadDetected: aiJson.overloadDetected ?? overloadDetected,
      overloadNotes: aiJson.overloadNotes ?? overloadNotes
    };
  }

  const basePlan = input.subjects.length ? input.subjects : ["Math", "Science", "Reading"];
  const maxHours = input.mode === "Recovery Mode" ? 1 : Math.min(input.hoursPerDay, 2);
  const dailyPlan = basePlan.slice(0, 3).map((subject, index) => {
    return `Day ${index + 1}: ${subject} for ${maxHours} hour(s)`;
  });

  const workloadWarning = input.hoursPerDay > 4
    ? "That’s a lot for one day. Consider splitting work across more days."
    : null;

  return {
    dailyPlan,
    breakReminders: [
      "Take a 5–10 minute break every hour.",
      "Stretch, hydrate, and rest your eyes."
    ],
    workloadWarning,
    coachMessage: pickCoachMessage(input.hoursPerDay + input.selfStressLevel),
    overloadDetected,
    overloadNotes,
    rebalancePlan: overloadDetected ? buildRebalancePlan(input) : undefined
  };
}

export async function analyzeStress(input: StressCheckInput): Promise<StressCheckResponse> {
  const prompt = `Analyze student stress in JSON only.\n\nInput:\n${JSON.stringify(input)}\n\nReturn JSON with keys: stressLevel (Low/Medium/High), supportiveMessage (string), practicalAdvice (array), sentimentScore (0-100), coachMessage (short sentence), redFlag (boolean), redFlagMessage (string).`;

  const aiContent = await callAI(prompt);
  const aiJson = safeJsonParse<StressCheckResponse>(aiContent);
  if (aiJson && aiJson.stressLevel) {
    return aiJson;
  }

  const text = input.text.toLowerCase();
  const redFlag = detectRedFlag(text);
  if (redFlag) {
    return {
      stressLevel: "High",
      supportiveMessage: "I’m really glad you shared this. You don’t have to handle it alone.",
      practicalAdvice: [],
      sentimentScore: 90,
      coachMessage: "You matter. It’s okay to ask for support.",
      redFlag: true,
      redFlagMessage: "Please reach out to a trusted adult, teacher, or counselor who can support you."
    };
  }

  const highSignals = ["overwhelmed", "panic", "exhausted", "burnout", "hopeless", "stressed"];
  const mediumSignals = ["worried", "tired", "nervous", "pressure", "anxious"];

  const hasHigh = highSignals.some((word) => text.includes(word));
  const hasMedium = mediumSignals.some((word) => text.includes(word));

  const stressLevel: StressCheckResponse["stressLevel"] = hasHigh
    ? "High"
    : hasMedium
      ? "Medium"
      : "Low";

  const sentimentScore = stressLevel === "High" ? 85 : stressLevel === "Medium" ? 55 : 25;

  return {
    stressLevel,
    supportiveMessage: stressLevel === "High"
      ? "I’m really glad you shared this. You don’t have to handle it alone."
      : stressLevel === "Medium"
        ? "Thanks for checking in. It’s okay to feel a bit stressed sometimes."
        : "You’re doing well. Keep taking care of yourself.",
    practicalAdvice: stressLevel === "High"
      ? [
          "Take a short break and breathe slowly.",
          "Pick just one small task to start.",
          "Consider talking to a trusted adult or counselor."
        ]
      : stressLevel === "Medium"
        ? [
            "Try a quick walk or stretch.",
            "Break tasks into smaller steps.",
            "Ask a friend or teacher if you need help."
          ]
        : [
            "Keep a steady routine.",
            "Celebrate small wins.",
            "Make time for rest."
          ],
    sentimentScore,
    coachMessage: pickCoachMessage(text.length),
    redFlag: false
  };
}

export async function getFocusModeSuggestion(input: FocusModeInput): Promise<FocusModeResponse> {
  const prompt = `Suggest focus and break minutes in JSON only.\n\nInput:\n${JSON.stringify(input)}\n\nRules:\n- Default focus 25 / break 5\n- Shorter focus and longer breaks if stress is High or Recovery Mode\n- Keep it simple\n\nReturn JSON with keys: focusMinutes (number), breakMinutes (number), reason (string).`;

  const aiContent = await callAI(prompt);
  const aiJson = safeJsonParse<FocusModeResponse>(aiContent);
  if (aiJson && aiJson.focusMinutes) {
    return aiJson;
  }

  const isHigh = input.stressLevel === "High" || input.mode === "Recovery Mode" || input.selfStressLevel >= 4;
  const focusMinutes = isHigh ? 15 : input.mode === "Exam Week" ? 30 : 25;
  const breakMinutes = isHigh ? 7 : 5;

  return {
    focusMinutes,
    breakMinutes,
    reason: isHigh
      ? "Shorter focus blocks can feel gentler when stress is high."
      : "A steady focus rhythm helps build consistency."
  };
}

export async function getWeeklyInsight(input: WeeklySummaryInput): Promise<WeeklySummaryResponse> {
  const prompt = `Write one short, supportive insight sentence in JSON only.\n\nInput:\n${JSON.stringify(input)}\n\nRules:\n- One sentence
- Keep it encouraging
- No medical claims
\nReturn JSON with key: insight (string).`;

  const aiContent = await callAI(prompt);
  const aiJson = safeJsonParse<WeeklySummaryResponse>(aiContent);
  if (aiJson?.insight) {
    return aiJson;
  }

  const trendText = input.stressTrend === "Up"
    ? "Stress looks a bit higher this week"
    : input.stressTrend === "Down"
      ? "Stress seems to be easing"
      : "Stress looks steady";

  return {
    insight: `${trendText} — keep balancing focus with breaks.`
  };
}

export async function respondToReflection(input: ReflectionInput): Promise<ReflectionResponse> {
  const prompt = `Reply to a student reflection in JSON only.\n\nInput:\n${JSON.stringify(input)}\n\nRules:\n- Be supportive and calm
- No medical claims
- Keep it to 1-2 sentences
\nReturn JSON with key: supportiveReply (string).`;

  const aiContent = await callAI(prompt);
  const aiJson = safeJsonParse<ReflectionResponse>(aiContent);
  if (aiJson?.supportiveReply) {
    return aiJson;
  }

  return {
    supportiveReply: "Thanks for sharing. That sounds meaningful — keep going at a steady pace."
  };
}
