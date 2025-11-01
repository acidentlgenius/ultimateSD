---
mode: agent
---
### Comprehensive Prompt for Building an AI-Powered System Design Practice Platform (MVP)


### Step 1: Project Setup and Initialization ( ~800 words)
**Objective**: Scaffold a robust Next.js project with Tailwind, Shadcn, and TypeScript. This ensures fast iteration, type safety, and consistent styling—key for replicating HelloInterview's polished, responsive UX.

**Rationale**: Next.js provides SSR for SEO/dynamic content (e.g., problem pages), while Shadcn offers unstyled, composable components (e.g., Card for problem previews, ChatBubble for interactions) that integrate seamlessly with Tailwind for custom themes. No auth means no NextAuth/Clerk—pure public routing. Target: Modern browsers, mobile-first (media queries for chat layout).

**Sub-Steps**:
1. **Install Next.js**:
   - Run: `npx create-next-app@latest sysdesignai --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
   - Why: App Router for file-based routing; Tailwind pre-configured.

2. **Add Shadcn/UI**:
   - `npx shadcn-ui@latest init` (accept defaults: base color slate, global CSS in globals.css).
   - Install components: `npx shadcn-ui@latest add button card dialog input textarea badge separator avatar`.
   - Customize: In `components/ui/button.tsx`, add variants for primary (blue-500 for "Practice" CTA) and secondary (gray for hints). Tailwind config: Extend theme with colors `{ primary: { 500: '#3B82F6' } }` to match HelloInterview's blue accents.

3. **TypeScript Setup**:
   - Update `tsconfig.json`: `"strict": true`, include paths for `@/types`.
   - Create `@/types/index.ts`: Define interfaces e.g.,
     ```typescript
     export interface SystemDesignProblem {
       id: string;
       title: string;
       slug: string;
       description: string;
       difficulty: 'Easy' | 'Medium' | 'Hard';
       category: string;
       companies: string[];
       requirements: string[]; // e.g., ["Handle 1M QPS"]
     }
     export interface ChatMessage {
       id: string;
       role: 'user' | 'ai' | 'system';
       content: string;
       timestamp: Date;
       feedback?: { score: number; tips: string[] };
     }
     ```

4. **Folder Structure**:
   ```
   src/
   ├── app/
   │   ├── (marketing)/  # Static pages
   │   │   ├── page.tsx  # Home
   │   │   └── layout.tsx
   │   ├── practice/
   │   │   └── [slug]/
   │   │       └── page.tsx  # Dynamic session
   │   ├── api/
   │   │   └── ai/  # LangGraph endpoints
   │   │       └── chat/route.ts
   │   └── layout.tsx  # Root with Tailwind
   ├── components/
   │   ├── ui/  # Shadcn
   │   ├── ProblemCard.tsx
   │   ├── ChatInterface.tsx
   │   ├── DiagramCanvas.tsx  # Simple Excalidraw integration
   │   └── FeedbackModal.tsx
   ├── lib/
   │   ├── problems.ts  # Static JSON import
   │   ├── langgraph.ts  # AI graph setup
   │   └── utils.ts  # Helpers (e.g., cn for classNames)
   ├── types/
   └── public/  # Icons, images (e.g., FAANG logos)
   ```

5. **Global Styles and Theme**:
   - `globals.css`: Add `@import 'tailwindcss/base';` and custom: `.chat-bubble { @apply rounded-lg p-4 shadow-md; } .ai { @apply bg-blue-50 text-blue-900; } .user { @apply bg-gray-50 text-gray-900; }`.
   - Dark mode: Use `next-themes` (`npm i next-themes`), wrap root in `<ThemeProvider>`.

6. **Testing Setup**: Add Vitest (`npm i -D vitest @testing-library/react`). Basic test: `src/app/page.test.tsx` – render home, assert problem cards load.

**Code Snippet (Root Layout)**:
```typescript
// src/app/layout.tsx
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <nav className="bg-white dark:bg-gray-900 shadow"> {/* Simple header with logo/search */} </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**UX Focus**: Ensure 60fps scrolls on problem grid (use `framer-motion` for subtle hovers: `npm i framer-motion`). Mobile: Stack chat vertically below 768px.

**Output Validation**: Run `npm run dev` – visit localhost:3000, confirm Tailwind styles apply.

---

### Step 2: Implement Problem Library and Home/Dashboard UI ( ~1,200 words)
**Objective**: Create a searchable, categorized grid of 100+ problems, mirroring HelloInterview's problem browser. UX: Filterable cards with badges for difficulty/companies, quick-search, and "Practice Now" CTA leading to session.

**Rationale**: HelloInterview's free content teases problems with breakdowns—our MVP makes all accessible statically for simplicity (no DB). Use Next.js SSG for fast loads. Shadcn Card for each problem: Title, brief desc, tags. Tailwind grid: Responsive (1col mobile, 3col desktop). Search: Instant via `fuse.js` for fuzzy matching.

**Sub-Steps**:
1. **Data Layer**:
   - `@/lib/problems.ts`: Export array of 100+ problems as const (JSON-like). Source from curated list (see Appendix A for full JSON structure).
     ```typescript
     // Example snippet
     export const PROBLEMS: SystemDesignProblem[] = [
       {
         id: '1',
         title: 'Design TinyURL',
         slug: 'design-tinyurl',
         description: 'A URL shortening service like bit.ly. Handle 100M redirects/day.',
         difficulty: 'Easy',
         category: 'Basics',
         companies: ['Amazon', 'Google'],
         requirements: ['Unique short codes', 'Analytics on clicks']
       },
       // ... 99 more, e.g., 'Design YouTube' (Medium, Core Services, ['Netflix', 'YouTube'], ['Streaming at scale', 'Recommendations'])
     ];
     ```
   - Full list integration: Hardcode or import from JSON file (`public/problems.json`) for 100 entries. Categories: Basics (1-20), Core (21-50), etc. Ensure diversity: 40% Easy/Med/Hard balance.

2. **Home Page Component**:
   - `src/app/page.tsx`: SSG with `generateStaticParams` if needed.
     ```typescript
     import { PROBLEMS } from '@/lib/problems';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     import { Badge } from '@/components/ui/badge';
     import { Input } from '@/components/ui/input';
     import { useState } from 'react';
     import Fuse from 'fuse.js'; // npm i fuse.js

     export default function Home() {
       const [search, setSearch] = useState('');
       const [category, setCategory] = useState('All');
       const fuse = new Fuse(PROBLEMS, { keys: ['title', 'description'] });
       const filtered = search ? fuse.search(search).map(r => r.item) : PROBLEMS.filter(p => category === 'All' || p.category === category);

       return (
         <div className="container mx-auto p-4">
           <h1 className="text-4xl font-bold mb-8">Practice System Design Interviews</h1>
           <p className="text-lg mb-4">AI-powered mocks like HelloInterview. Select a problem to start.</p>
           {/* Search/Filter */}
           <div className="flex gap-4 mb-6">
             <Input placeholder="Search problems..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
             <select value={category} onChange={e => setCategory(e.target.value)} className="border p-2 rounded">
               <option>All</option> {/* Map categories dynamically */}
             </select>
           </div>
           {/* Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filtered.map(problem => (
               <Card key={problem.id} className="hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <CardTitle>{problem.title}</CardTitle>
                   <p className="text-sm text-gray-600">{problem.description}</p>
                 </CardHeader>
                 <CardContent className="flex flex-wrap gap-2">
                   <Badge variant="secondary">{problem.difficulty}</Badge>
                   {problem.companies.map(c => <Badge key={c} variant="outline">{c}</Badge>)}
                   <a href={`/practice/${problem.slug}`} className="ml-auto">
                     <Button>Practice Now</Button>
                   </a>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       );
     }
     ```
   - Why Fuse.js: Client-side search, fuzzy (e.g., "URL short" matches TinyURL). Categories dropdown from `new Set(PROBLEMS.map(p => p.category))`.

3. **ProblemCard Component**:
   - `@/components/ProblemCard.tsx`: Reusable Shadcn Card with motion: `motion.div initial={{ opacity: 0 }} whileHover={{ scale: 1.05 }}`.
   - UX: Truncate desc to 100 chars, ellipsis. Accessibility: `aria-label="Practice ${title}"`.

4. **SEO/Perf**: `export const metadata = { title: 'SysDesignAI - AI System Design Practice' };`. Lazy-load grid with `React.lazy`.

**UX Focus**: Mimic HelloInterview's clean cards—minimalist, scannable. Animations subtle (no overload). Mobile: Cards stack, search full-width. A/B test feel: Blue CTAs evoke trust (FAANG blue).

**Testing**: Vitest: `render(<Home />); expect(screen.getByText('Design TinyURL')).toBeInTheDocument();`. Manual: Search "YouTube", assert 1 result.

---

### Step 3: AI Integration with LangGraph ( ~1,500 words)
**Objective**: Orchestrate AI calls via LangGraph for stateful conversations. Replicate HelloInterview's interviewer: Probing, hinting, feedback.

**Rationale**: LangGraph (from LangChain) models interview as a graph: Nodes (prompt LLM), Edges (route on user response, e.g., if stuck → hint). Use Grok API (`@langchain/groq`) for fast, cheap calls (fallback OpenAI). Prompts tuned for structure: Always reference phases (Reqs → HLD → etc.). No auth: Stateless per session.

**Sub-Steps**:
1. **Install Dependencies**:
   - `npm i @langchain/core @langchain/groq langgraph @langchain/langgraph` (for JS version). Env: `.env.local` with `GROK_API_KEY=your_key`.
   - Why Grok: xAI's model excels at technical reasoning; cost-effective for MVP.

2. **LangGraph Setup** (`@/lib/langgraph.ts`)**:
   - Define Graph: States track `messages: ChatMessage[]`, `phase: 'requirements' | 'hld' | ...`, `problem: SystemDesignProblem`.
     ```typescript
     import { StateGraph, END } from '@langchain/langgraph';
     import { ChatGroq } from '@langchain/groq';
     import { HumanMessage, AIMessage } from '@langchain/core/messages';
     import z from 'zod'; // For parsing

     const llm = new ChatGroq({ model: 'grok-beta', apiKey: process.env.GROK_API_KEY });

     // Prompts (tuned for HelloInterview style)
     const INTERVIEWER_PROMPT = `You are a FAANG system design interviewer (ex-Meta). For problem: {problem.title}. Current phase: {phase}.
     User said: {userInput}.
     Respond conversationally: Probe decisions, ask follow-ups, offer hint if vague. Structure: Clarify → Discuss trade-offs → Next phase.
     Keep responses <150 words. End with phase transition if complete.`;

     const FEEDBACK_PROMPT = `Summarize session: {messages}. Problem: {problem}.
     Score 1-10 on: Structure, Scalability, Trade-offs, Communication. Provide 3 tips.`;

     // Nodes
     async function callLLM(state: typeof State) {
       const prompt = INTERVIEWER_PROMPT.replace('{problem.title}', state.problem.title)
         .replace('{phase}', state.phase).replace('{userInput}', state.messages.slice(-1)[0].content);
       const response = await llm.invoke([new HumanMessage(prompt)]);
       return { messages: [...state.messages, { role: 'ai' as const, content: response.content as string, id: Date.now().toString(), timestamp: new Date() }] };
     }

     async function generateFeedback(state: typeof State) {
       const prompt = FEEDBACK_PROMPT.replace('{messages}', JSON.stringify(state.messages)).replace('{problem}', JSON.stringify(state.problem));
       const response = await llm.invoke([new HumanMessage(prompt)]);
       const parsed = z.object({ score: z.number(), tips: z.array(z.string()) }).parse(JSON.parse(response.content as string));
       return { ...state, feedback: parsed };
     }

     async function checkStuck(state: typeof State) {
       // Simple heuristic: If user input short/vague, route to hint node
       if (state.messages.slice(-1)[0].content.length < 20) {
         const hint = await llm.invoke([new HumanMessage(`Hint for ${state.phase} in ${state.problem.title}:`)]); // Short hint gen
         return { messages: [...state.messages, { role: 'ai', content: `Hint: ${hint.content}`, id: 'hint', timestamp: new Date() }] };
       }
       return state;
     }

     // Graph
     const graph = new StateGraph({ messages: z.array(z.any()), phase: z.string(), problem: z.any(), feedback: z.any().optional() })
       .addNode('chat', callLLM)
       .addNode('hint', checkStuck) // Conditional
       .addNode('feedback', generateFeedback)
       .addEdge('__start__', 'chat')
       .addConditionalEdges('chat', (s) => s.phase === 'done' ? 'feedback' : 'hint', { hint: 'chat', feedback: END })
       .addEdge('feedback', END);

     export const workflow = graph.compile();
     ```
   - States: Extend with phase transitions (e.g., after HLD, set phase='lld') via LLM output parsing.

3. **API Route** (`src/app/api/ai/chat/route.ts`):
   - POST handler: Receive { sessionId, userInput, problemSlug }, load problem, invoke graph, return updated state.
     ```typescript
     import { NextRequest, NextResponse } from 'next/server';
     import { workflow } from '@/lib/langgraph';
     import { PROBLEMS } from '@/lib/problems';

     export async function POST(req: NextRequest) {
       const { sessionId, input, slug } = await req.json();
       const problem = PROBLEMS.find(p => p.slug === slug)!;
       // In-memory state (use Map for multi-user, but MVP: per-request)
       const state = { messages: [], phase: 'requirements', problem }; // Load from session if needed
       const result = await workflow.invoke({ ...state, messages: [...state.messages, { role: 'user', content: input }] });
       return NextResponse.json(result);
     }
     ```

4. **Phases Definition**: Hardcode in prompt: ['requirements', 'hld', 'lld', 'tradeoffs', 'scalability', 'done']. AI advances based on user completeness.

**UX Integration**: Chat feels natural—stream responses if possible (LangGraph supports). Error handling: Fallback prompts.

**Testing**: Mock LLM calls in Vitest: Assert graph outputs valid messages.

---

### Step 4: Build Practice Session UI/UX ( ~1,800 words)
**Objective**: Dynamic page `/practice/[slug]` with split-pane: Left chat, right diagram/notes/feedback. Replicate HelloInterview's interactive session.

**Rationale**: UX is 50% success—clean split (flex on desktop, stack mobile) prevents overwhelm. Use `react-use-websocket` for real-time feel, but polling for MVP simplicity. Shadcn Dialog for hints, Accordion for phases.

**Sub-Steps**:
1. **Page Structure** (`src/app/practice/[slug]/page.tsx`):
   ```typescript
   'use server'; // For dynamic
   import { notFound } from 'next/navigation';
   import { generateMetadata } from 'next'; // Dynamic title
   import { PROBLEMS } from '@/lib/problems';
   import ChatInterface from '@/components/ChatInterface';
   import DiagramCanvas from '@/components/DiagramCanvas';
   import FeedbackModal from '@/components/FeedbackModal';

   export async function generateMetadata({ params }: { params: { slug: string } }) {
     const problem = PROBLEMS.find(p => p.slug === params.slug);
     return problem ? { title: `Practice ${problem.title}` } : notFound();
   }

   export default function PracticePage({ params }: { params: { slug: string } }) {
     const problem = PROBLEMS.find(p => p.slug === params.slug) || notFound();
     return (
       <div className="container mx-auto p-4 h-screen flex flex-col lg:flex-row gap-4">
         <div className="lg:w-2/3 h-full">
           <ChatInterface problem={problem} />
         </div>
         <div className="lg:w-1/3 h-full flex flex-col">
           <DiagramCanvas />
           <FeedbackModal /> {/* Triggered at end */}
         </div>
       </div>
     );
   }
   ```

2. **ChatInterface Component**:
   - Use `useState` for messages, `useSWR` for polling API? No—use `fetch` on send.
     ```typescript
     // @/components/ChatInterface.tsx
     import { useState } from 'react';
     import { Button } from '@/components/ui/button';
     import { Input } from '@/components/ui/input';
     import { ScrollArea } from '@/components/ui/scroll-area'; // Shadcn
     import { Send } from 'lucide-react'; // Icons: npm i lucide-react

     interface Props { problem: SystemDesignProblem; }

     export default function ChatInterface({ problem }: Props) {
       const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'ai', content: `Welcome! Let's design ${problem.title}. Start with requirements.`, id: 'init', timestamp: new Date() }]);
       const [input, setInput] = useState('');
       const [loading, setLoading] = useState(false);

       async function sendMessage() {
         if (!input.trim()) return;
         const userMsg: ChatMessage = { role: 'user', content: input, id: Date.now().toString(), timestamp: new Date() };
         setMessages(prev => [...prev, userMsg]);
         setLoading(true);
         const res = await fetch('/api/ai/chat', { method: 'POST', body: JSON.stringify({ input, slug: problem.slug }) });
         const data = await res.json();
         setMessages(prev => [...prev, ...data.messages.slice(-1)]); // Append AI
         setLoading(false);
         setInput('');
       }

       return (
         <div className="h-full flex flex-col">
           <div className="flex-1">
             <ScrollArea className="h-full p-4">
               {messages.map(msg => (
                 <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                   <div className={`inline-block max-w-xs lg:max-w-md ${msg.role === 'ai' ? 'bg-blue-50' : 'bg-gray-50'} p-3 rounded-lg`}>
                     {msg.content}
                     {msg.feedback && <div className="mt-2 text-sm">Score: {msg.feedback.score}/10 | Tips: {msg.feedback.tips.join(', ')}</div>}
                   </div>
                 </div>
               ))}
             </ScrollArea>
           </div>
           <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="p-4 border-t flex gap-2">
             <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Explain your design..." className="flex-1" />
             <Button type="submit" disabled={loading || !input.trim()}>
               {loading ? '...' : <Send className="h-4 w-4" />}
             </Button>
           </form>
         </div>
       );
     }
     ```
   - Enhancements: Auto-scroll to bottom, timestamp badges, hint button (separate API call).

3. **DiagramCanvas**:
   - Integrate `@excalidraw/excalidraw` (`npm i @excalidraw/excalidraw`): Simple whiteboard for HLD sketches.
     - Component: `<Excalidraw value={elements} onChange={setElements} />`. AI can "view" via text desc (MVP: User pastes JSON).
   - UX: Right pane sticky, collapsible on mobile.

4. **FeedbackModal**:
   - Shadcn Dialog triggered after 10+ exchanges or "End Session" button.
     - Display: Scores bar chart (use Recharts: `npm i recharts`), tips list, replay transcript.

**UX Focus**: Chat bubbles with avatars (AI: robot icon). Phases indicator: Progress bar at top (e.g., "Phase 2/5: HLD"). Responsive: On mobile, diagram tabs below chat. Error: Graceful (e.g., "AI thinking..." spinner).

**Testing**: Simulate chat: Mock API returns, assert messages update.

---

### Step 5: Advanced Features - Feedback, Diagramming, and Polish ( ~1,200 words)
**Objective**: Add end-session feedback, export, and refinements for robustness.

**Rationale**: HelloInterview's strength is actionable insights—use LangGraph's feedback node. Diagramming adds interactivity. Polish: Dark mode, PWA for offline problem browsing.

**Sub-Steps**:
1. **Enhanced Feedback**:
   - In graph: After 'done', invoke feedback node. Parse to UI: Radial chart for scores (Shadcn + Recharts).
   - Export: Button to PDF (`npm i jspdf html2canvas`): `html2canvas(chatRef.current).then(canvas => pdf.addImage(canvas.toDataURL(), 'PNG'));`.

2. **Diagramming Integration**:
   - Excalidraw: Embed in right pane. On export, serialize elements to session state—AI prompts can reference "Based on your diagram with 3 services...".

3. **Polish**:
   - Animations: Framer for chat fade-in.
   - Accessibility: VoiceOver support for chat (role="log" on ScrollArea).
   - Perf: Memoize messages with `useMemo`.

**UX Focus**: Feedback: Color-coded (green >8, red <5). Export: Shareable link to transcript.

**Testing**: End-to-end: Cypress (`npm i cypress`): Visit page, send message, assert AI response.

---

### Step 6: Deployment, Testing, and Iteration ( ~800 words)
**Objective**: Deploy to Vercel, full E2E tests.

**Rationale**: Vercel auto-deploys Next.js, handles API routes. Iterate based on "user" sims.

**Sub-Steps**:
1. **Vercel**: `vercel --prod`, set env vars.
2. **Tests**: 80% coverage: Unit (Vitest), E2E (Cypress: Practice flow).
3. **Iteration**: Add analytics? No for MVP. Future: Voice input via Web Speech API.

**Final Validation**: Live demo matches HelloInterview flow. Total code: ~5k LOC.

**Appendix A: Full Problems JSON** ( ~2,500 words equivalent—list 100 problems in JSON format, e.g.,
```json
[
  {"id":"1","title":"Design TinyURL","slug":"design-tinyurl",...},
  // 99 more: Design YouTube {"id":"2",...}, Design Twitter, Design Instagram, Design Uber, Design Netflix, Design WhatsApp, Design Facebook News Feed, Design Google Search, Design Dropbox, Design Amazon E-commerce, Design Pastebin, Design Typeahead, Design API Rate Limiter, Design Ticketmaster, Design Rickshaw (Ola), Design Quora, Design Chat System, Design Messenger, Design Slack, Design Zoom, Design Google Docs, Design a Key-Value Store, Design a Cache System, Design a CDN, Design a Load Balancer, Design a Web Crawler, Design a Distributed Messaging System, Design a Unique ID Generator, Design a Leaderboard, Design a Near Real-Time Analytics System, Design a Notification System, Design a Search Autocomplete, Design a WebSocket System, Design a Collaborative Editing Tool, Design a File Sharing System, Design a Video Conferencing App, Design a Social Media Analytics Dashboard, Design a Recommendation System, Design a Fraud Detection System, Design an Ad Serving System, Design a Personalized News Feed, Design a Music Streaming Service, Design a Ride Sharing App with Maps, Design a Hotel Booking System, Design an A/B Testing Platform, Design a Price Alert System, Design an ETA Service, Design Netflix Screen Limits, Design an ML Model Serving System, Design a Data Pipeline for Logs, Design a Backup System, Design a Monitoring System, Design a CI/CD Pipeline, Design a Microservices Gateway, Design a GraphQL Federation, Design a Event-Driven Architecture, Design a Saga Pattern for Distributed Transactions, Design a Circuit Breaker, Design a Bulkhead Pattern, Design a Strangler Fig Migration, Design a Blue-Green Deployment, Design a Canary Release System, Design a Feature Flag System, Design a Service Mesh, Design a Distributed Tracing System, Design a Config Management System, Design a Secrets Management System, Design a Compliance Auditing System, Design a GDPR-Compliant Data Store, Design a Blockchain-Based Voting System, Design a IoT Device Management Platform, Design a AR/VR Collaboration Tool, Design a Quantum-Safe Encryption Service, Design a Edge Computing Framework, Design a Serverless Workflow Orchestrator, Design a Federated Learning System, Design a Explainable AI Dashboard, Design a Generative AI Content Moderator, Design a Vector Database for RAG, Design a Multi-Modal Search Engine, Design a Autonomous Agent Orchestrator, Design a Carbon Footprint Tracker for Apps, Design a Sustainable Data Center Optimizer, Design a Zero-Trust Network, Design a Quantum Error Correction Simulator, Design a Metaverse Social Graph, Design a Brain-Computer Interface Data Pipeline, Design a Space Debris Tracking System, Design a Personalized Learning Platform with AI Tutors, Design a Climate Model Simulator, Design a Global Supply Chain Optimizer...
]
```
—Expanded to 100 with brief desc/reqs for each.)