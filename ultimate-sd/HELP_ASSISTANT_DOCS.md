# Help Assistant Feature Implementation

## Overview
A context-aware help assistant that appears as a floating button (like support chat widgets on websites) to help users understand system design problems without revealing solutions.

## Features Implemented

### 1. **HelpAssistant Component** (`src/components/HelpAssistant.tsx`)
- Floating circular button with gradient styling (blue to purple)
- Three states:
  - **Closed**: Floating button in bottom-right corner
  - **Minimized**: Compact bar showing message count
  - **Open**: Full chat interface (396px x 600px)
- Real-time chat interface with message bubbles
- Typing indicator during AI response
- Beautiful gradient UI matching the app's design system

### 2. **Context-Aware Help System** (`src/lib/help-langgraph.ts`)
The help assistant is **fully aware** of:
- **Current Phase**: Knows which phase the user is in (Requirements, HLD, LLD, etc.)
- **Completed Steps**: Tracks which steps the user has finished
- **Saved Work**: Has access to user's previous answers and feedback scores
- **Weaknesses**: References areas where the user struggled in previous steps
- **Progress History**: Understands what the user has already accomplished

### 3. **LangGraph Integration**
Uses Google Gemini 2.0 Flash with structured prompts:
```typescript
{
  problem: SystemDesignProblem,
  currentPhase: string,
  completedSteps: string[],
  savedStepData: Map<string, any>,
  conversationHistory: Message[]
}
```

### 4. **Smart Guidance System**
The assistant provides:
- **Clarification**: Explains requirements and constraints
- **Concept Explanation**: Defines technical terms (e.g., "What is sharding?")
- **Socratic Questions**: Guides thinking (e.g., "Have you considered caching?")
- **Contextual Hints**: References user's current phase and past work
- **Trade-off Analysis**: Explains pros/cons of different approaches

### 5. **Strict Solution Prevention**
The assistant will **NOT**:
- Provide complete system designs
- Give implementation code
- Draw diagrams or layouts
- Solve the problem directly
- Allow copying solutions

### 6. **Progress-Aware Responses**
Example context the assistant receives:
```
CURRENT PHASE: HLD
COMPLETED STEPS: 3 steps completed
WORK HISTORY:
- requirements step 0: COMPLETED (score: 8/10)
- requirements step 1: COMPLETED (score: 7/10)
- hld step 0: In progress (last score: 6/10)
  Areas to improve: Missing API versioning; Incomplete error handling
```

The assistant will then reference these details:
> "I see you're working on HLD and previously had some feedback about API design. Let me help you think about API versioning..."

## Integration Points

### PracticeUI Component
Updated to track and pass context:
```typescript
<HelpAssistant 
  problem={problem}
  currentPhase={phase}
  completedSteps={completedSteps}
  savedStepData={savedStepData}
/>
```

### StepByStepChat Component
Emits progress events:
```typescript
window.dispatchEvent(new CustomEvent('sd-progress-update', {
  detail: {
    phase: currentStep.phase,
    completedSteps: Array.from(completedSteps),
    savedStepData: savedStepData
  }
}));
```

## API Endpoint
**POST** `/api/ai/help`

Request body:
```json
{
  "problem": { /* SystemDesignProblem */ },
  "messages": [ /* conversation history */ ],
  "currentPhase": "HLD",
  "completedSteps": ["requirements-0", "requirements-1"],
  "savedStepData": [ /* work history with feedback */ ]
}
```

Response:
```json
{
  "message": "AI response text"
}
```

## User Experience

1. **User starts practice session** → Help button appears
2. **User clicks help button** → Chat opens with contextual greeting
3. **User asks question** → AI responds based on current phase and progress
4. **User can minimize** → Chat minimizes to compact bar
5. **Message history persists** → Within the session only

## Example Interactions

### Early in Requirements Phase
**User**: "What should I focus on in functional requirements?"
**Assistant**: "Great question! Since you're just starting the requirements phase, think about the core user actions. For designing TinyURL, what are the main things users need to do? Try listing 3-5 key operations."

### During HLD with Struggles
**User**: "I'm confused about database choice"
**Assistant**: "I noticed you scored 6/10 on your API design with feedback about error handling. For the database, let's think systematically: What's your read/write ratio for TinyURL? That's often the key factor. High reads suggest one type, balanced suggests another."

### When Stuck
**User**: "I don't know how to approach caching"
**Assistant**: "You've done well on requirements (8/10)! For caching in your HLD phase, ask yourself: What data gets accessed most frequently? Where in your system does caching make the biggest impact? Think about the redirect flow."

## Technical Architecture

```
User Interface (HelpAssistant.tsx)
        ↓
   API Route (/api/ai/help)
        ↓
   LangGraph Helper (help-langgraph.ts)
        ↓
   Google Gemini 2.0 Flash (via LangChain)
```

## Environment Requirements
- `GOOGLE_API_KEY` must be set
- Uses same Gemini model as main interview AI

## Styling
- Follows existing design tokens
- Gradient: `from-blue-500 to-purple-600`
- Matches glassmorphism style of main UI
- Responsive and mobile-friendly (within 396px width)

## Future Enhancements (Optional)
- Multi-agent system with specialized agents:
  - Concept Explanation Agent
  - Hint Provider Agent
  - Trade-off Analyst Agent
  - Progress Coach Agent
- Voice input/output
- Quick action buttons (e.g., "Explain this concept", "Give me a hint")
- Session persistence across page reloads
- Export chat transcript

## Files Modified/Created

### Created:
- `src/components/HelpAssistant.tsx` - Main component
- `src/lib/help-langgraph.ts` - LangGraph logic
- `src/app/api/ai/help/route.ts` - API endpoint

### Modified:
- `src/components/PracticeUI.tsx` - Integration and state management
- `src/components/StepByStepChat.tsx` - Progress event emission

## Testing Checklist
- [ ] Help button appears on practice page
- [ ] Opens/closes smoothly
- [ ] Minimizes to compact bar
- [ ] Sends messages successfully
- [ ] Receives AI responses
- [ ] Shows typing indicator
- [ ] Context awareness works (references current phase)
- [ ] Doesn't reveal solutions
- [ ] Error handling works (network failures)
- [ ] Mobile responsive

## Summary
The help assistant is fully integrated with the existing LangGraph architecture using Google Gemini 2.0 Flash. It's context-aware of the user's progress, provides intelligent guidance without revealing solutions, and offers a professional chat interface that matches the app's design language.
