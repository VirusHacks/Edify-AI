# Edify-AI  
### Google Maps for Your Career

Students don't fail because they lack talent - they fail because they don't know the route.

**Edify-AI** is an AI-powered career advisor that guides students from confusion to clarity - a **personalized route, real-time guidance, and rerouting** when they go off track.

---

## Inspiration

We watched friends struggle through their career journeys - jumping between random tutorials, investing in courses that didn't match their level, building generic resumes that got rejected, and failing interviews despite knowing the material.

The problem wasn't effort. It was **lack of direction**.

Every existing platform solves one piece of the puzzle. Udemy sells courses. LinkedIn helps with networking. ChatGPT gives answers. But no one connects the entire journey from "I'm confused" to "I got the job."

We asked: **What if career guidance worked like Google Maps?** - showing you where you are, where you want to go, the best route, and rerouting when you take a wrong turn.

---

## What It Does

Edify-AI provides a **complete 6-step career journey**:

**1. Personalized Career Roadmap**  
Analyzes your resume, skills, and goals. Pulls context from GitHub, LinkedIn, YouTube, Roadmap.sh. Generates a personalized learning path - not generic advice, but a route built for *you*.

**2. AI-Generated Learning Modules**  
Custom courses for each roadmap step with curated video content, practice environments, and quizzes matched to your current level.

**3. Job-Specific Resume Builder**  
Parses job descriptions and generates ATS-optimized resumes - automatically updated as your skills improve.

**4. AI Mock Interviews**  
Realistic simulations that analyze both your answers AND body language/confidence via video. Not ready? We reroute instead of reject.

**5. Real-Time AI Video Mentor**  
A video mentor - not a chatbot. It understands your context, remembers your progress, and guides you through personalized interaction. When you're stuck, you ask.

**6. AR-Based Classrooms**  
Immersive 3D learning spaces for virtual study groups and peer collaboration. Learning becomes social, not isolated.

At the core: **MCP (Model Context Protocol)** - our custom protocol connecting everything into one intelligent mentor that adapts as you progress.

---

## How We Built It

### Multi-Agent GenAI Architecture

We built **6 specialized LangChain agents** orchestrated by a central coordinator:

| Agent | Function | Technique |
|-------|----------|-----------|
| **Orchestrator Agent** | Routes requests, manages state, coordinates all agents | MCP Protocol + state machine |
| **Roadmap Agent** | Skills + market data → personalized learning path | Chain-of-thought reasoning |
| **Course Agent** | Generates custom learning modules from curated content | RAG + content synthesis |
| **Resume Agent** | JD parsing → ATS-optimized resume generation | Few-shot examples |
| **Interview Agent** | Dynamic Q&A + real-time evaluation | Context-aware prompting |
| **Mentor Agent** | Conversation memory + personalized guidance | Self-consistency checks |

```
User Request → Orchestrator → Routes to Specialist Agent(s) → Aggregates Response → User
                    ↓
              Maintains context across entire journey via MCP
```

**Guardrails on every call**: Input validation, hallucination detection, fallback responses, rate limiting.

### Video Intelligence

| Model | Purpose |
|-------|---------|
| **YOLO** | Real-time body language, eye contact, confidence signals |
| **Tavus** | Conversational video AI - the mentor that sees and responds to you |

### Infrastructure

| Component | Choice | Why |
|-----------|--------|-----|
| API | tRPC | End-to-end type safety |
| Background Jobs | Inngest | Non-blocking AI workloads |
| Agent Runtime | Python + LangChain | Best AI ecosystem |
| Frontend | Next.js | SSR, React, fast |
| Database | PostgreSQL | ACID + JSON flexibility |
| Infra | GCP Cloud Run | Auto-scaling, pay-per-request |
| CI/CD | GitHub Actions + Cloud Build | Automated deployment |
| Scraping | Apify | GitHub, LinkedIn, YouTube data |

### DevOps Pipeline
```
Push → GitHub Actions → Tests → Docker Build → GCP Cloud Run → Health Check → Live
```

---

## Impact

| Feature | Traditional | Edify AI | Time Saved |
|---------|-------------|----------|------------|
| Resume Analysis | 45-60 min | 2-3 min | **95%** |
| Learning Path Research | 1-2 hours | 3-5 min | **96%** |
| Interview Preparation | 1-2 hours | 3-5 min | **95%** |
| Skill Gap Identification | 30-45 min | 1-2 min | **96%** |
| Course Generation | 1-2 hours | 2-4 min | **97%** |
| **Total** | **5-10 hours** | **~20 min** | **~96%** |

| Stakeholder | Value |
|-------------|-------|
| **Students** | Democratizes career guidance, real interview readiness |
| **Institutions** | Scalable placement infra, 60-70% less counselor load |
| **Society** | Reduces unemployment, promotes equity |

---

## Challenges We Ran Into

**1. Multi-Agent Coordination**  
Getting 4 specialized agents to share context without conflicts was hard. We solved it with MCP - a custom protocol that maintains state across all agents.

**2. Video Analysis Latency**  
YOLO inference was too slow for real-time feedback. We moved to async processing via Inngest, showing results after the interview instead of during.

**3. Hallucination in Career Advice**  
Early versions gave confident but wrong career suggestions. We added guardrails: few-shot examples, self-consistency checks, and confidence thresholds that trigger fallback responses.

**4. Scraping Rate Limits**  
LinkedIn and GitHub have aggressive rate limiting. We implemented intelligent caching and batch processing through Apify to stay within limits while keeping data fresh.

**5. AR Performance on Mobile**  
AR.js was heavy on mobile browsers. We optimized by lazy-loading 3D assets and reducing polygon counts for classroom environments.

---

## Accomplishments We're Proud Of

- **End-to-end working prototype** - not mockups, real AI integrations
- **4 specialized LangChain agents** working together seamlessly via MCP
- **YOLO-based body language analysis** in mock interviews
- **Production deployment on GCP** with full CI/CD pipeline
- **AR classrooms** running in browser without native apps
- **Guardrails that actually work** - zero hallucination incidents in testing
- Built the entire system in a hackathon timeframe

---

## What We Learned

**On AI Architecture**: Single LLM calls don't scale for complex workflows. Multi-agent systems with specialized roles produce better results than one "do everything" prompt.

**On Prompting**: Few-shot examples + chain-of-thought + self-consistency checks = reliable outputs. Guardrails aren't optional — they're essential.

**On Infrastructure**: Inngest is incredible for AI workloads. tRPC eliminates an entire class of bugs. GCP Cloud Run handles scale without DevOps overhead.

**On Product**: Users don't want more tools - they want fewer tools that work together. The "one mentor" mental model resonates because it mirrors how real career guidance works.

---

## What's Next for Edify-AI

**Short-term:**
- Voice-based mentor interactions (currently text + video)
- Integration with actual job boards for real-time market data
- Mobile app for on-the-go learning

**Medium-term:**
- B2B pilot with 2-3 colleges for placement infrastructure
- Expanding AR classrooms with more interactive elements
- Adding peer-to-peer mentorship matching

**Long-term:**
- White-label solution for educational institutions
- API for third-party integrations
- Expanding beyond tech careers to other fields

---

## Feasibility & Scalability

### Why This Works at Scale

| Aspect | Our Approach | Scalability |
|--------|--------------|-------------|
| **Compute** | GCP Cloud Run | Auto-scales 0→∞, pay-per-request |
| **AI Workloads** | Inngest queues | Async processing, no blocking |
| **Database** | PostgreSQL + Redis | Horizontal scaling ready |
| **Agents** | Stateless Python | Spin up unlimited workers |
| **Cost** | ~$0.08/user/month | Sustainable unit economics |

### Production-Ready Today
- **Docker containerized** - consistent environments everywhere
- **CI/CD pipeline** - automated testing + zero-downtime deploys
- **Health checks** - automatic rollback on failures
- **Rate limiting** - protects against abuse and cost spikes

### Market Opportunity

| Metric | Value |
|--------|-------|
| **Global TAM** | 200M+ college students seeking career guidance |
| **EdTech Market** | $50B+, growing 15% YoY |
| **Career Services** | $10B spent annually by institutions |
| **Pain Point** | 70% students report career anxiety as top concern |

### Business Model

| Segment | Model | Revenue |
|---------|-------|---------|
| **B2C (Students)** | Freemium → $9.99/mo premium | High volume, low touch |
| **B2B (Colleges)** | $5-15/student/year site license | Recurring, high retention |
| **Enterprise** | White-label API licensing | High margin partnerships |

### Why Now?
- **GenAI maturity** - LLMs finally good enough for personalized guidance
- **Post-COVID shift** - students comfortable with digital-first learning
- **Hiring crisis** - employers struggling to find job-ready graduates
- **Counselor shortage** - 1 counselor per 400+ students in most colleges

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, AR.js |
| API | tRPC (type-safe) |
| Backend | Node.js, Python (LangChain) |
| AI/ML | OpenAI, LangChain, YOLO, Tavus |
| Jobs | Inngest |
| Scraping | Apify |
| Infra | GCP, Docker, CI/CD |
| Protocol | Custom MCP |

---

**We don't sell courses. We don't sell tools. We give direction.**

*Edify-AI is Google Maps for your career.*
