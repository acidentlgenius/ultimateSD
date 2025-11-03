# SysDesignAI - Ultimate System Design Practice Platform

An AI-powered system design interview practice platform replicating HelloInterview.com's Guided Practice experience, with enhanced features and **automatic session persistence**.

## 🚀 Features

### Core Functionality

- **100+ System Design Problems**: Comprehensive library covering FAANG-level questions
- **AI-Powered Interview Simulation**: Real-time conversational practice with intelligent feedback
- **Step-by-Step Guidance**: Structured progression through Requirements → HLD → LLD → Trade-offs → Scalability
- **Interactive Diagramming**: Built-in canvas for architecture diagrams
- **Instant Feedback**: Scores, strengths, weaknesses, and missed points for each step
- **PDF Export**: Complete revision guides with all your answers and feedback

### 🆕 Session Persistence

**Never lose your progress!** Your practice sessions are automatically saved and restored:

- ✅ **Auto-Save**: Every step completion is saved to browser localStorage
- ✅ **Auto-Restore**: Return exactly where you left off after refresh/close
- ✅ **Multi-Problem Support**: Save progress across multiple problems simultaneously
- ✅ **Visual Confirmation**: Restoration banner and progress indicators
- ✅ **Easy Management**: Clear sessions anytime with one click

[📖 Read Full Session Persistence Guide](./SESSION_PERSISTENCE.md)

### Additional Features

- **Dark Mode**: Full theme support with smooth transitions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Help Assistant**: AI-powered hints and guidance when stuck
- **Schema Builder**: Visual database design tool
- **Progress Tracking**: See completed steps and overall progress

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ultimate-sd

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Grok API key or OpenAI key to .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file with:

```env
# Required: AI Provider API Key
XAI_API_KEY=your_grok_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Customize behavior
NEXT_PUBLIC_APP_NAME=SysDesignAI
```

## 🎯 How to Use

1. **Browse Problems**: Explore 100+ system design problems on the home page
2. **Start Practice**: Click any problem to begin guided practice
3. **Follow Steps**: Complete each phase step-by-step with AI guidance
4. **Get Feedback**: Receive instant scores and actionable tips
5. **Draw Diagrams**: Use the canvas for HLD and LLD visualizations
6. **Export Results**: Download a PDF revision guide anytime

**Your progress is automatically saved!** Close the tab, refresh, or come back later—your work is protected.

## 📁 Project Structure

```
ultimate-sd/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Home page with problem grid
│   │   ├── practice/[slug]/   # Practice session page
│   │   └── api/               # API routes for AI
│   ├── components/            # React components
│   │   ├── PracticeUI.tsx     # Main practice layout
│   │   ├── StepByStepChat.tsx # Step-by-step interview flow
│   │   ├── DiagramCanvas.tsx  # Interactive diagram tool
│   │   ├── ChatInterface.tsx  # Chat UI components
│   │   └── ui/                # shadcn/ui primitives
│   ├── lib/                   # Utilities and helpers
│   │   ├── langgraph.ts       # AI orchestration logic
│   │   ├── session-storage.ts # 🆕 Session persistence
│   │   ├── problems.ts        # Problem definitions
│   │   └── pdf-export-compact.ts # PDF generation
│   ├── styles/                # CSS and design tokens
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── docs/                      # Documentation
    ├── SESSION_PERSISTENCE.md # 🆕 Persistence guide
    ├── PDF_EXPORT_GUIDE.md    # PDF feature docs
    └── UI_UX_IMPROVEMENTS.md  # UI design docs
```

## 🧪 Testing

```bash
# Run type checking
pnpm run build

# Run linting
pnpm run lint

# Run unit tests (if configured)
pnpm test
```

## 🛠️ Technologies

- **Framework**: Next.js 14+ (App Router, Server Components)
- **Language**: TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **AI**: LangGraph + Grok/OpenAI
- **Persistence**: Browser localStorage
- **PDF**: jsPDF + jspdf-autotable
- **Diagrams**: HTML Canvas API
- **Deployment**: Vercel

## 📚 Documentation

- [Session Persistence Guide](./SESSION_PERSISTENCE.md) - How auto-save works
- [PDF Export Guide](./PDF_EXPORT_GUIDE.md) - Creating revision guides
- [UI/UX Improvements](./UI_UX_IMPROVEMENTS.md) - Design decisions
- [Help Assistant Docs](./HELP_ASSISTANT_DOCS.md) - AI help system

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [HelloInterview.com](https://hellointerview.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- AI orchestration with [LangGraph](https://github.com/langchain-ai/langgraphjs)

## 📧 Support

For issues, questions, or suggestions:
- Open a GitHub issue
- Check existing documentation
- Review troubleshooting guides

---

**Built with ❤️ for aspiring system design engineers** 🚀

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
