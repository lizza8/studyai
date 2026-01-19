# StudySafe AI

StudySafe AI is an AI-powered study and wellbeing assistant for middle- and high-school students. It helps students create balanced study plans, check in on stress, and get supportive, non-medical guidance. Built for a weekend hackathon demo with clarity, safety, and friendliness in mind.

## Team Members
- liza mamitashvili

## Date
- January 20, 2026

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI/Grok-compatible LLM API
- localStorage (no database)

## v2.0 Features
- AI Study Load Balancer with overload warnings and rebalance button
- Focus Mode (AI Pomodoro) with stress-adjusted timing
- Weekly wellbeing summary with trend chart and AI insight
- Safety Red Flag mode that pauses productivity advice
- Student mode profiles (Normal, Exam, Recovery)
- Daily reflection prompt with supportive AI reply

##slides: 
An Ai powered study % wellbeing pdf

## How to Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Add an API key for real AI responses:
   ```bash
   export OPENAI_API_KEY="your_key_here"
   export OPENAI_MODEL="gpt-4o-mini"
   export OPENAI_BASE_URL="https://api.openai.com/v1"
   ```
   The app also runs with safe fallback responses if no key is provided.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

## Safety Note
StudySafe AI is not a medical tool. If a student feels overwhelmed or unsafe, the app encourages them to talk to a trusted adult, teacher, or counselor.

## 
- Clear, student-safe UX with visible disclaimers and gentle tone
- Demo-ready intelligence (planner, stress insights, weekly summary)
- Ethical safety guardrails for high-stress language
- Local-only storage for privacy and fast setup
- Simple, modern neon UI that stands out for judges
