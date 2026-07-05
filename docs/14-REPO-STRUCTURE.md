# Repository Structure, SBI Sentinel Monorepo

> A single, coherent monorepo so a judge can clone once, read the docs, and run the
> prototype. Consistent with `docs/00-MASTER-CONCEPT.md`.

```text
sbi-sentinel/
├── README.md # Front door: what it is, why it wins, how to run
├── docs/ # ★ All 15 deliverables live here (enterprise docs)
│ ├── 00-MASTER-CONCEPT.md # Single source of truth, every doc obeys this
│ ├── 01-prd/PRD.md # D1 Product Requirements Document
│ ├── 02-architecture/ # D2 Technical architecture (+ Mermaid diagrams)
│ ├── 03-ai-agents/ # D3 8 agent specs (prompts, tools, eval, failure modes)
│ ├── 04-financial-engine/ # D4 Financial Wellbeing algorithm (glass-box math)
│ ├── 05-adr/ # D5 Architecture Decision Records (why LangGraph/MCP/…)
│ ├── 06-tech-stack/ # D6 Complete tech stack + rationale
│ ├── 07-database/ # D7 ER + graph schema, DDL, indexes, audit design
│ ├── 08-api/ # D8 API spec (Markdown) + openapi.yaml (OpenAPI 3.0)
│ ├── 09-ui/ # D9 Screen-by-screen UI spec (mirrors apps/web)
│ ├── 10-deck/ # D10 Pitch deck: deck.html → SBI-Sentinel-Deck.pdf
│ ├── 11-submission/ # D11 Paste-ready HackCulture portal copy
│ ├── 12-demo/ # D12 3-minute demo script (timed, word-for-word)
│ ├── 13-build-plan/ # D13 Day/hour prototype build plan
│ └── 14-REPO-STRUCTURE.md # D14 This file
│
├── apps/
│ └── web/ # ★ D9+D15 High-fidelity React prototype (Vite+TS+Tailwind)
│ ├── index.html
│ ├── package.json
│ ├── vite.config.ts
│ ├── tailwind.config.js
│ └── src/
│ ├── main.tsx # App bootstrap
│ ├── App.tsx # Shell + routing (sidebar → screens)
│ ├── components/ # Reusable UI (ScoreGauge, PillarBar, AgentEvent, PlanCard…)
│ ├── pages/ # Dashboard, Health, Timeline, Planner, Fraud,
│ │ # Explainability, Consent, Notifications, Settings, Admin
│ ├── data/ # Synthetic Rajesh Kumar dataset (drives the golden path)
│ ├── lib/ # FWS compute, formatters, plan simulator (mirrors backend)
│ └── styles/ # Tailwind + design tokens (SBI navy/teal system)
│
├── services/ # Python 3.12 FastAPI microservices (prototype backend)
│ ├── gateway/ # API gateway: authN/Z, consent enforcement, rate-limit
│ ├── agent-orchestrator/ # LangGraph supervisor + 8 agents + HITL plan lifecycle
│ ├── financial-engine/ # Glass-box FWS, risk models, cashflow, simulation
│ ├── compliance/ # Deterministic rule engine (OPA/Rego + Python) → certify/veto
│ ├── consent/ # DPDP consent ledger service
│ ├── audit/ # Append-only, hash-chained audit ledger service
│ └── ingestion/ # Event ingestion → Kafka; normalizers, OCR hooks
│
├── ai/ # Agent + LLM assets (imported by agent-orchestrator)
│ ├── agents/ # One module per agent (node definitions)
│ ├── prompts/ # Versioned system prompts (match docs/03-ai-agents)
│ ├── graphs/ # LangGraph graph wiring + shared state schema
│ ├── rag/ # Hybrid retrieval, corpus loaders (RBI/DPDP/SBI docs)
│ └── eval/ # Offline eval sets, LLM-as-judge, red-team suites
│
├── db/
│ ├── migrations/ # PostgreSQL migrations (Alembic), matches docs/07
│ ├── graph/ # Neo4j constraints + seed Cypher
│ └── seed/ # Synthetic seed data (Rajesh + cohort)
│
├── infra/
│ ├── docker/ # Dockerfiles + docker-compose (local full-stack)
│ ├── k8s/ # Helm charts / manifests (sovereign-cloud VPC)
│ └── terraform/ # IaC for the VPC, managed data stores
│
└── tests/ # Cross-service integration + golden-path smoke test
```

## Conventions

- **Language split.** Frontend = React 18 + TypeScript. Backend/AI = Python 3.12. Each
 service is independently deployable; contracts live in `docs/08-api/openapi.yaml`.
- **Source of truth.** Any doc or code detail must not contradict `docs/00-MASTER-CONCEPT.md`.
- **Frontend ↔ backend.** The web app talks to `services/gateway` over the REST contract in
 `openapi.yaml`. In the prototype, `apps/web/src/data` + `apps/web/src/lib` mirror the backend
 so the UI runs fully offline for a reliable live demo (no network flakiness on stage).
- **Agent registration.** A new agent = a module in `ai/agents/`, a prompt in `ai/prompts/`,
 and a node wired into `ai/graphs/`. Its spec must exist in `docs/03-ai-agents` first.
- **Compliance is code, not prose.** Rules live in `services/compliance` as deterministic
 Rego/Python; the LLM never self-certifies.
- **Config via env.** No secrets in the repo; each service reads `.env` (see `.env.example`).
- **Testing.** Unit tests beside each service; `tests/` holds the golden-path smoke test that
 drives Detect→…→Approve→Execute→Audit and must stay green in CI.
- **Naming.** kebab-case dirs, PascalCase React components, snake_case Python modules.
```
```
