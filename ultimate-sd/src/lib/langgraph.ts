import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { SystemDesignProblem, ChatMessage } from '@/types';

const llm = process.env.GOOGLE_API_KEY ? new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash-lite',
  apiKey: process.env.GOOGLE_API_KEY,
}) : null;

// Simple AI response function for MVP
export async function getAIResponse(problem: SystemDesignProblem, userInput: string, phase: string, messages: ChatMessage[]): Promise<ChatMessage> {
  if (!llm) {
    return {
      role: 'ai',
      content: 'AI interviewer is not available. Please set GOOGLE_API_KEY environment variable.',
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
    // Log the underlying error for debugging
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

// Feedback function
export async function getFeedback(problem: SystemDesignProblem, messages: ChatMessage[]): Promise<{ score: number; tips: string[] }> {
  if (!llm) {
    return {
      score: 0,
      tips: ['AI feedback not available. Please set GOOGLE_API_KEY environment variable.']
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