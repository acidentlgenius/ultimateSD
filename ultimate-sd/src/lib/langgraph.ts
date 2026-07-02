import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { SystemDesignProblem, ChatMessage } from '@/types';

function getDefaultLLM(): BaseChatModel | null {
  if (!process.env.GOOGLE_API_KEY) {
    return null;
  }
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash-lite',
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

export async function getAIResponse(
  problem: SystemDesignProblem,
  userInput: string,
  phase: string,
  messages: ChatMessage[],
  llmOverride?: BaseChatModel | null
): Promise<ChatMessage> {
  const llm = llmOverride ?? getDefaultLLM();
  if (!llm) {
    return {
      role: 'ai',
      content: 'AI interviewer is not available. Upgrade to Platform or AI plan to continue.',
      id: Date.now().toString(),
      timestamp: new Date()
    };
  }

  const prompt = `You are a FAANG system design interviewer (ex-Meta). For problem: ${problem.title}. Current phase: ${phase}.
User said: ${userInput}.
Respond conversationally: Probe decisions, ask follow-ups, offer hint if vague. Structure: Clarify → Discuss trade-offs → Next phase.
Keep responses <150 words.`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return {
      role: 'ai',
      content: response.content as string,
      id: Date.now().toString(),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('getAIResponse error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      role: 'ai',
      content: `Error communicating with AI service: ${errMsg}`,
      id: Date.now().toString(),
      timestamp: new Date()
    };
  }
}

export async function getFeedback(
  problem: SystemDesignProblem,
  messages: ChatMessage[],
  llmOverride?: BaseChatModel | null
): Promise<{ score: number; tips: string[] }> {
  const llm = llmOverride ?? getDefaultLLM();
  if (!llm) {
    return {
      score: 0,
      tips: ['AI feedback not available. Upgrade to Platform or AI plan to continue.']
    };
  }

  const prompt = `Summarize session: ${JSON.stringify(messages)}. Problem: ${JSON.stringify(problem)}.
Score 1-10 on: Structure, Scalability, Trade-offs, Communication. Provide 3 tips. Respond in JSON format: { "score": number, "tips": ["tip1", "tip2", "tip3"] }`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const parsed = JSON.parse(response.content as string);
    return { score: parsed.score, tips: parsed.tips };
  } catch (error) {
    console.error('getFeedback error:', error);
    return {
      score: 0,
      tips: ['Error generating feedback. Please check your API key.']
    };
  }
}

export interface InterviewSummaryInput {
  phase: string;
  title: string;
  answer: string;
  passed: boolean;
}

export interface InterviewSummary {
  overallScore: number; // 1-10
  verdict: string; // 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire'
  strengths: string[];
  improvements: string[];
  phaseNotes: { phase: string; comment: string }[];
}

/** End-of-interview hiring-committee-style debrief. Returns null when unavailable. */
export async function getInterviewSummary(
  problem: SystemDesignProblem,
  answers: InterviewSummaryInput[],
  llmOverride?: BaseChatModel | null
): Promise<InterviewSummary | null> {
  const llm = llmOverride !== undefined ? llmOverride : getDefaultLLM();
  if (!llm) {
    return null;
  }

  const transcript = answers
    .map(
      (a) =>
        `### ${a.phase} — ${a.title} (${a.passed ? 'passed evaluation' : 'not passed'})\n${a.answer}`
    )
    .join('\n\n');

  const prompt = `You are a FAANG system design interviewer (ex-Meta) writing the post-interview debrief for a TIMED mock interview.
Problem: "${problem.title}" — ${problem.description}

Candidate transcript, step by step:
${transcript}

Write an honest hiring-committee-style summary. Weigh unattempted steps as time-management signal, not zero knowledge.
Respond with VALID JSON only (no markdown, no extra text):
{
  "overallScore": <number 1-10>,
  "verdict": "<Strong Hire | Hire | Lean Hire | No Hire>",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "phaseNotes": [{ "phase": "<phase name>", "comment": "<one-sentence note>" }]
}`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = (response.content as string)
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(content);
    if (
      typeof parsed.overallScore !== 'number' ||
      typeof parsed.verdict !== 'string' ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.improvements) ||
      !Array.isArray(parsed.phaseNotes)
    ) {
      return null;
    }
    return parsed as InterviewSummary;
  } catch (error) {
    console.error('getInterviewSummary error:', error);
    return null;
  }
}
