# 🏗️ Edify AI - System Architecture

## 📐 Simple Horizontal Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                         USER INTERFACE                                                          │
│                                                                                                                                │
│    🌐 Browser ─────────────────────▶ 📱 Next.js 14 Frontend ◀─────────────────────── 🔌 Chrome Extension                      │
│                                              │                                              (Skill Extraction)                  │
└──────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                      API GATEWAY LAYER                                                          │
│                                                                                                                                │
│    ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│    │                                              tRPC Router (Type-Safe API)                                             │    │
│    │                                                                                                                      │    │
│    │      agents ─────── meetings ─────── premium ─────── user                                                           │    │
│    └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                           │                                                                    │
└───────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┘
                                                            │
          ┌─────────────────────────────────────────────────┼─────────────────────────────────────────────────┐
          │                                                 │                                                 │
          ▼                                                 ▼                                                 ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐              ┌──────────────────────────────┐
│       SYNC SERVICES          │              │       ASYNC SERVICES         │              │       AI MICROSERVICE        │
│       (Next.js API)          │              │       (Inngest Queue)        │              │       (Cloud Run)            │
│                              │              │                              │              │                              │
│  ┌────────────────────────┐  │              │  ┌────────────────────────┐  │              │  ┌────────────────────────┐  │
│  │ Course Generation      │  │              │  │ Meeting Processing     │  │              │  │ LangGraph Orchestrator │  │
│  │ Resume Analysis        │  │              │  │ Transcript Summary     │  │              │  │                        │  │
│  │ Pathway Creation       │  │              │  │ PDF Generation         │  │              │  │  ┌──────┐ ┌──────┐    │  │
│  │ Forum & Events         │  │              │  │ Embedding Generation   │  │              │  │  │Skills│ │Exper.│    │  │
│  │ Math Solver            │  │   Inngest    │  │ Background Tasks       │  │   Docker     │  │  └──────┘ └──────┘    │  │
│  │ Code Runner            │  │◀────────────▶│  │                        │  │◀────────────▶│  │  ┌──────┐ ┌──────┐    │  │
│  │ Speech Transcribe      │  │   Events     │  │ Event: meetings/proc   │  │   HTTP       │  │  │Educat│ │Projec│    │  │
│  │ AI Generate            │  │              │  │ Event: resume/process  │  │              │  │  └──────┘ └──────┘    │  │
│  └────────────────────────┘  │              │  └────────────────────────┘  │              │  │      ┌──────┐         │  │
│                              │              │                              │              │  │      │ Meta │         │  │
└──────────────────────────────┘              └──────────────────────────────┘              │  │      └──────┘         │  │
          │                                                                                 │  │  5 Agents in Parallel  │  │
          │                                                                                 │  └────────────────────────┘  │
          │                                                                                 │                              │
          │                                                                                 └──────────────────────────────┘
          │                                                                                               │
          └───────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                   MCP PROTOCOL LAYER                                                            │
│                                            (Model Context Protocol - 20+ Tools)                                                 │
│                                                                                                                                │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│   │course.list  │ │resume.      │ │pathway.     │ │forum.       │ │events.      │ │math.        │ │code.        │              │
│   │course.create│ │  analyze    │ │  create     │ │  topics     │ │  list       │ │  solve      │ │  run        │              │
│   │course.gen   │ │resume.report│ │pathway.prog │ │forum.reply  │ │             │ │             │ │             │              │
│   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                    AI PROVIDER LAYER                                                            │
│                                                                                                                                │
│   ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐ │
│   │   🔷 Vertex AI Gemini    │    │   🌐 Perplexity AI       │    │   🎬 Tavus               │    │   🤖 OpenAI              │ │
│   │                          │    │                          │    │                          │    │                          │ │
│   │   • Gemini 2.5 Flash     │    │   • Live Market Data     │    │   • Video Agents         │    │   • GPT-4 Fallback       │ │
│   │   • Course Generation    │    │   • Career Insights      │    │   • Body Language        │    │   • Meeting Summary      │ │
│   │   • Resume Parsing       │    │   • Salary Data          │    │   • Mock Interviews      │    │   • Embeddings           │ │
│   │   • Generative UI        │    │   • Cited Sources        │    │   • Career Advisor       │    │                          │ │
│   └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘ │
│                                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                    DATA & STORAGE LAYER                                                         │
│                                                                                                                                │
│   ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐ │
│   │   🗄️ PostgreSQL          │    │   🔥 Firebase Storage    │    │   📺 YouTube Data API    │    │   🔐 Kinde Auth          │ │
│   │   (Drizzle ORM)          │    │                          │    │                          │    │                          │ │
│   │                          │    │   • Resume PDFs          │    │   • Video Curation       │    │   • User Auth            │ │
│   │   • Users, Courses       │    │   • User Uploads         │    │   • Per Chapter Videos   │    │   • Session Mgmt         │ │
│   │   • Resumes, Pathways    │    │   • Generated Files      │    │   • Free Content         │    │   • OAuth                │ │
│   │   • Forum, Events        │    │                          │    │                          │    │                          │ │
│   └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘ │
│                                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Module Use Cases (2 Words Each)

| Module | Use Case | Service |
|--------|----------|---------|
| **Courses** | Learn Skills | `courseGeneration.ts` |
| **Resume** | ATS Score | `resumeAnalysis.ts` |
| **Pathway** | Career Roadmap | `pathway.ts` |
| **Interview** | Mock Practice | Tavus API |
| **Forum** | Peer Help | `forum.ts` |
| **Events** | Tech Events | `events.ts` |
| **Internships** | Job Hunt | `internships.ts` |
| **Math Solver** | Homework Help | `mathSolveImage.ts` |
| **Code Runner** | Code Practice | `codeRun.ts` |
| **AI Chat** | Career Advisor | `aiGenerate.ts` |

---

## 🔄 Data Flow: Simple Version

```
User Request ──▶ tRPC ──▶ Service ──▶ Gemini ──▶ Database ──▶ Response
                  │
                  ├──▶ Inngest (if async) ──▶ Background Processing
                  │
                  └──▶ MCP (if AI tool) ──▶ Tool Execution
```

---

## 🏗️ Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                 │
│  FRONTEND          BACKEND           AI/ML              INFRA              DATA               AUTH              │
│  ─────────         ───────           ─────              ─────              ────               ────              │
│                                                                                                                 │
│  Next.js 14        tRPC              Gemini 2.5         Cloud Run          PostgreSQL         Kinde            │
│  React 19          Inngest           Perplexity         Docker             Firebase           OAuth            │
│  TailwindCSS       FastAPI           Tavus              GCR                Drizzle ORM                         │
│  Shadcn/ui         LangGraph         OpenAI             Vercel             YouTube API                         │
│                    MCP Protocol                                                                                 │
│                                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔷 Google Cloud Services

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           GOOGLE CLOUD PLATFORM                                                  │
│                                                                                                                 │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐                   │
│   │   Cloud Run     │     │   Vertex AI     │     │   Firebase      │     │   YouTube API   │                   │
│   │                 │     │                 │     │                 │     │                 │                   │
│   │   Python        │     │   Gemini 2.5    │     │   Storage       │     │   Video         │                   │
│   │   Backend       │     │   Flash         │     │   Bucket        │     │   Search        │                   │
│   │                 │     │                 │     │                 │     │                 │                   │
│   │   2 vCPU        │     │   JSON Mode     │     │   Resume PDFs   │     │   Auto-curate   │                   │
│   │   2 GB RAM      │     │   Generative UI │     │   User Files    │     │   Per chapter   │                   │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘                   │
│           │                       │                       │                       │                             │
│           └───────────────────────┴───────────────────────┴───────────────────────┘                             │
│                                               │                                                                  │
│                                        All Google APIs                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 LangGraph Multi-Agent (Cloud Run Microservice)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    LANGGRAPH ORCHESTRATOR (Docker → Cloud Run)                                   │
│                                                                                                                  │
│                                          Resume + Job Description                                                │
│                                                   │                                                              │
│                                                   ▼                                                              │
│                                    ┌──────────────────────────────┐                                              │
│                                    │     Resume Extractor         │◀── Vertex AI Gemini (Structured Output)     │
│                                    └──────────────────────────────┘                                              │
│                                                   │                                                              │
│                    ┌──────────────────────────────┼──────────────────────────────┐                               │
│                    │              │               │               │              │                               │
│                    ▼              ▼               ▼               ▼              ▼                               │
│              ┌──────────┐  ┌──────────┐    ┌──────────┐    ┌──────────┐  ┌──────────┐                            │
│              │ Skills   │  │Experience│    │Education │    │ Projects │  │   Meta   │                            │
│              │ Agent    │  │  Agent   │    │  Agent   │    │  Agent   │  │  Agent   │                            │
│              │          │  │          │    │          │    │          │  │          │                            │
│              │ 35%      │  │   35%    │    │   15%    │    │   10%    │  │   5%     │                            │
│              └──────────┘  └──────────┘    └──────────┘    └──────────┘  └──────────┘                            │
│                    │              │               │               │              │                               │
│                    └──────────────┴───────────────┴───────────────┴──────────────┘                               │
│                                                   │                                                              │
│                                                   ▼                                                              │
│                                    ┌──────────────────────────────┐                                              │
│                                    │    Weighted Score Aggregator │                                              │
│                                    │    Final ATS Score: 0-100    │                                              │
│                                    └──────────────────────────────┘                                              │
│                                                                                                                  │
│   ⚡ ALL 5 AGENTS RUN IN PARALLEL = 5x FASTER                                                                    │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 MCP Protocol (20+ Tools)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     MODEL CONTEXT PROTOCOL (MCP) SERVER                                          │
│                                                                                                                  │
│   External AI agents (Claude, GPT, etc.) can call these tools:                                                   │
│                                                                                                                  │
│   COURSES              RESUME               PATHWAY              FORUM                MISC                       │
│   ────────             ──────               ───────              ─────                ────                       │
│   course.list          resume.analyze       pathway.create       forum.topics         math.solve                 │
│   course.create        resume.report        pathway.get          forum.reply          code.run                   │
│   course.get           resume.listAll       pathway.progress     events.list          speech.transcribe          │
│   course.update                                                  internships.list     ai.generate                │
│   course.delete                                                                                                  │
│   course.generate                                                                                                │
│   course.chat                                                                                                    │
│                                                                                                                  │
│   Total: 20+ MCP Tools exposed via @modelcontextprotocol/sdk                                                     │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 tRPC + Inngest Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           REQUEST LIFECYCLE                                                      │
│                                                                                                                  │
│                                                                                                                  │
│   SYNC (tRPC) ──────────────────────────────────────────────────────────────────▶ INSTANT RESPONSE              │
│   ───────────                                                                     ────────────────              │
│                                                                                                                  │
│   User ──▶ tRPC Router ──▶ Service Function ──▶ Gemini AI ──▶ Database ──▶ Response                            │
│                │                                                                                                 │
│                │                                                                                                 │
│   ASYNC (Inngest) ────────────────────────────────────────────────────────────▶ BACKGROUND PROCESSING           │
│   ───────────────                                                               ─────────────────────           │
│                │                                                                                                 │
│                └──▶ inngest.send() ──▶ Event Queue ──▶ Inngest Function ──▶ Heavy Processing                   │
│                                                              │                                                   │
│                                                              ├──▶ Meeting transcript → Summary                   │
│                                                              ├──▶ Resume → PDF generation                        │
│                                                              └──▶ Course → Embedding generation                  │
│                                                                                                                  │
│                                                                                                                  │
│   tRPC ROUTERS:                    INNGEST FUNCTIONS:                                                            │
│   ─────────────                    ──────────────────                                                            │
│   • agents                         • meetings/processing                                                         │
│   • meetings                       • resume/process                                                              │
│   • premium                        • embeddings/generate                                                         │
│   • user                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete Module Map

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              EDIFY AI MODULES                                                    │
│                                                                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│   │   📚 COURSES    │  │   📄 RESUME     │  │   🗺️ PATHWAY    │  │   🎤 INTERVIEW  │  │   💬 FORUM      │       │
│   │                 │  │                 │  │                 │  │                 │  │                 │       │
│   │   Learn Skills  │  │   ATS Score     │  │   Career Map    │  │   Mock Practice │  │   Peer Help     │       │
│   │                 │  │                 │  │                 │  │                 │  │                 │       │
│   │   Gemini Gen    │  │   5 AI Agents   │  │   Perplexity    │  │   Tavus Video   │  │   PostgreSQL    │       │
│   │   + YouTube     │  │   LangGraph     │  │   Live Data     │  │   Body Language │  │   Drizzle       │       │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│   │   📅 EVENTS     │  │   💼 INTERNSHIP │  │   🧮 MATH       │  │   💻 CODE       │  │   🤖 AI CHAT    │       │
│   │                 │  │                 │  │                 │  │                 │  │                 │       │
│   │   Tech Events   │  │   Job Hunt      │  │   Homework Help │  │   Code Practice │  │   Career Advice │       │
│   │                 │  │                 │  │                 │  │                 │  │                 │       │
│   │   PostgreSQL    │  │   PostgreSQL    │  │   Gemini Vision │  │   Sandbox Exec  │  │   Gemini Chat   │       │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                                                                  │
│                                            ALL MODULES CONNECTED VIA:                                            │
│                                                                                                                  │
│                            tRPC (type-safe) ←──→ MCP (AI tools) ←──→ Inngest (async)                            │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 One-Page Architecture Summary

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                  │
│    USER                  FRONTEND              API                 SERVICES              AI                      │
│    ────                  ────────              ───                 ────────              ──                      │
│                                                                                                                  │
│    Browser ────────────▶ Next.js 14 ────────▶ tRPC ──────────────▶ 18 Services ────────▶ Gemini 2.5            │
│         │                     │                  │                      │                    │                   │
│         │                     │                  │                      │                    ├──▶ Perplexity     │
│    Extension ─────────────────┘                  │                      │                    │                   │
│                                                  │                      │                    └──▶ Tavus         │
│                                             Inngest ◀────────────── Background                                   │
│                                              Queue                    Tasks                                      │
│                                                                                                                  │
│                                                MCP ◀──────────────── 20+ Tools                                  │
│                                             Protocol                 Exposed                                     │
│                                                                                                                  │
│    ─────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│                                                                                                                  │
│    CLOUD RUN           FIREBASE              POSTGRESQL            YOUTUBE API           KINDE AUTH             │
│    (Python Backend)    (File Storage)        (Drizzle ORM)         (Video Curation)      (User Auth)            │
│                                                                                                                  │
│    Docker ──────────▶ Resume PDFs ────────▶ All Data ──────────▶ Course Videos ────────▶ OAuth                 │
│    LangGraph           User Uploads          Users, Courses         Per Chapter           Sessions              │
│    5 AI Agents         Generated Files       Pathways, Forum        Free Content          Secure                │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💬 Pitch-Ready Architecture Quotes

> **"18 microservices, 20+ MCP tools, 5 parallel AI agents - all connected through tRPC and Inngest."**

> **"Built on Google Cloud: Gemini 2.5 for AI, Cloud Run for compute, Firebase for storage, YouTube for content."**

> **"Every module talks to every other module - that's what makes us different from Udemy, Coursera, and LinkedIn combined."**

> **"LangGraph orchestrates 5 specialized agents in parallel on Cloud Run - delivering ATS scores in under 5 seconds."**

---

*One Platform. 10 Modules. 20+ AI Tools. Everything Connected.*
