import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { SystemDesignProblem } from '@/types';

const llm = process.env.GOOGLE_API_KEY ? new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash-lite',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
  maxOutputTokens: 500,
}) : null;

interface HelpContext {
  problem: SystemDesignProblem;
  currentPhase?: string;
  completedSteps: string[];
  savedStepData: Array<[string, any]>;
  conversationHistory: Array<{ role: string; content: string }>;
}

const HELP_SYSTEM_PROMPT = `You are a helpful system design interview assistant. Your role is to help users understand problems better WITHOUT revealing the complete solution.

YOUR RESPONSIBILITIES:
1. Clarify requirements and constraints when asked
2. Explain technical concepts (e.g., "What is sharding?", "What's the CAP theorem?")
3. Guide thinking with Socratic questions (e.g., "Have you considered how to handle high read traffic?")
4. Point out overlooked aspects (e.g., "What about data consistency?")
5. Provide hints when users are stuck (e.g., "Think about caching strategies")
6. Explain trade-offs between different approaches
7. Reference their current progress to provide contextual guidance

STRICT RULES (NEVER VIOLATE):
1. DON'T provide complete system designs or architectures
2. DON'T give specific implementation code
3. DON'T draw diagrams or provide exact component layouts
4. DON'T solve the problem for them
5. DON'T give answers that can be copied directly into their solution

YOUR APPROACH:
- Be encouraging and supportive
- Use Socratic method - ask guiding questions
- Explain concepts when needed
- Be professional but friendly
- Reference what they've already completed
- Guide them to discover answers themselves

If a user asks for the complete solution, politely decline and instead guide them to think through the problem themselves.`;

function buildProgressContext(context: HelpContext): string {
  const { currentPhase, completedSteps, savedStepData } = context;
  
  let progressContext = '';
  
  if (currentPhase) {
    progressContext += `\nCURRENT PHASE: ${currentPhase}`;
  }
  
  if (completedSteps.length > 0) {
    progressContext += `\n\nCOMPLETED STEPS: ${completedSteps.length} steps completed`;
    progressContext += `\nSteps: ${completedSteps.join(', ')}`;
  } else {
    progressContext += `\n\nJust starting - no steps completed yet.`;
  }
  
  // Add details about what they've worked on
  if (savedStepData && savedStepData.length > 0) {
    progressContext += `\n\nWORK HISTORY:`;
    savedStepData.forEach(([key, data]) => {
      const [phase, stepIdx] = key.split('-');
      if (data.completed) {
        progressContext += `\n- ${phase} step ${stepIdx}: COMPLETED (score: ${data.feedback?.score || 'N/A'}/10)`;
      } else if (data.feedback) {
        progressContext += `\n- ${phase} step ${stepIdx}: In progress (last score: ${data.feedback.score}/10)`;
      }
      
      // Add specific feedback if available
      if (data.feedback?.weaknesses && data.feedback.weaknesses.length > 0) {
        progressContext += `\n  Areas to improve: ${data.feedback.weaknesses.slice(0, 2).join('; ')}`;
      }
    });
  }
  
  return progressContext;
}

function buildProblemContext(problem: SystemDesignProblem): string {
  return `
PROBLEM: ${problem.title}
Description: ${problem.description}
Difficulty: ${problem.difficulty}
Category: ${problem.category}
Key Requirements: ${problem.requirements?.join(', ') || 'Not specified'}
Companies: ${problem.companies?.join(', ') || 'Not specified'}`;
}

export async function getHelpResponse(context: HelpContext): Promise<string> {
  if (!llm) {
    return 'Help assistant is not available. Please set GOOGLE_API_KEY environment variable.';
  }

  const problemContext = buildProblemContext(context.problem);
  const progressContext = buildProgressContext(context);
  
  // Build conversation history (last 6 messages for context)
  const recentMessages = context.conversationHistory.slice(-6);
  const conversationHistory = recentMessages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  // Create the full system prompt with context
  const systemPrompt = `${HELP_SYSTEM_PROMPT}

${problemContext}

${progressContext}

CONVERSATION SO FAR:
${conversationHistory}

IMPORTANT CONTEXT AWARENESS:
- The user is currently in the "${context.currentPhase || 'starting'}" phase
- They have completed ${context.completedSteps.length} steps
- Use this context to provide relevant, timely guidance
- Reference their progress naturally in your responses
- If they're stuck on something they already tried, acknowledge it and suggest a different angle

Respond to the user's latest question helpfully while following all guidelines above. Keep responses concise (under 150 words).`;

  try {
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(recentMessages[recentMessages.length - 1]?.content || 'Help me understand this problem.')
    ];

    const response = await llm.invoke(messages);
    return response.content as string;
  } catch (error) {
    console.error('Help LangGraph error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get help response: ${errMsg}`);
  }
}

// Optional: Create a more sophisticated multi-agent setup with LangGraph
// This could include separate agents for:
// 1. Concept Explanation Agent (explains technical concepts)
// 2. Hint Provider Agent (gives contextual hints)
// 3. Trade-off Analyst Agent (explains trade-offs)
// 4. Progress Coach Agent (motivates and guides based on progress)

export async function getConceptExplanation(concept: string, problem: SystemDesignProblem): Promise<string> {
  if (!llm) {
    return 'Concept explanation not available. Please set GOOGLE_API_KEY environment variable.';
  }

  const prompt = `You are a technical concept explainer for system design interviews.

The user is working on: ${problem.title}

They want to understand: ${concept}

Explain this concept clearly and concisely:
1. What it is
2. Why it's relevant to system design
3. When to use it vs alternatives
4. A simple example in context of their problem

Keep it under 120 words and avoid giving away the solution.`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  } catch (error) {
    console.error('Concept explanation error:', error);
    throw new Error('Failed to get concept explanation');
  }
}

export async function getHint(context: HelpContext, stuckOn: string): Promise<string> {
  if (!llm) {
    return 'Hints not available. Please set GOOGLE_API_KEY environment variable.';
  }

  const progressContext = buildProgressContext(context);
  
  const prompt = `You are a hint provider for system design interviews.

Problem: ${context.problem.title}
User is stuck on: ${stuckOn}

${progressContext}

Provide a gentle hint that guides their thinking without giving away the answer:
1. Ask a probing question that leads them in the right direction
2. Mention a relevant concept they should consider
3. Reference something similar they might know

Keep it brief (under 80 words) and Socratic.`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  } catch (error) {
    console.error('Hint generation error:', error);
    throw new Error('Failed to generate hint');
  }
}
