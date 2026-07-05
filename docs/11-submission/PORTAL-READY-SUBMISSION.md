# HackCulture Portal, Paste-Ready Submission

> SBI Hackathon @ GFF 2026 · Elimination (Idea) Round · Deadline **05 Jul 2026 23:59**
> Copy each block directly into the matching portal field. Character-conscious: portals
> often cap fields, so a tighter alternate is provided where it matters.

---

## Theme *(dropdown)*
`Agentic AI & Emerging Tech`

## Problem Statement *(select)*
`Digital Engagement`
> ⚠️ The dropdown defaults to **Customer Acquisition**. Change it to **Digital Engagement**.
> Sentinel is a bullseye for the Digital Engagement pillar (proactive interaction based on
> behaviours, financial patterns, and life events), while the brief and business model below
> also show how it drives Digital Adoption and Customer Acquisition.

---

## Project Title *
```
SBI Sentinel: Autonomous Financial Wellbeing Engine
```

---

## Team details (Name & Organization, up to 4) *
> Individual participation.
```
Tejas Mane, National Forensic Sciences University (NFSU), Gandhinagar. Sole builder covering product, full-stack engineering, and AI/ML.
```

---

## Brief description of the idea *
```
Banks today react, customers only get help after they ask for it, usually once damage
is done: a bounced EMI, a CIBIL hit, an under-insured family, an undetected scam.

SBI Sentinel flips this. It is an always-on team of AI agents that continuously watches
each customer's financial life and acts BEFORE trouble strikes. A supervisor agent
orchestrates specialists that (1) compute a glass-box Financial Wellbeing Score across
six pillars, cashflow, emergency buffer, debt, protection, wealth, behaviour; (2) predict
risks such as an EMI bounce or liquidity crunch days in advance; (3) detect fraud and
anomalies; (4) generate 2-3 personalised intervention plans; (5) simulate each plan's
future impact; (6) validate every plan against RBI and DPDP rules through a deterministic
compliance engine that can veto unsafe advice; and (7) explain each recommendation in plain
language with the exact transactions as evidence.

Crucially, the AI never moves money on its own. Agents PROPOSE, the customer APPROVES, and
the bank EXECUTES through existing SBI rails (YONO / core banking / UPI). Every action is
consent-gated, reversible, and written to an immutable audit ledger.

The result: SBI shifts from selling products to protecting financial wellbeing. Every plan
also nudges the customer to actually use SBI digital products (payments, investments,
insurance, YONO), so Sentinel serves all three of SBI's goals at once: it drives digital
ENGAGEMENT on behaviour and life events, accelerates digital ADOPTION through each
suitability-checked action, and opens ACQUISITION at the household level, all while lowering
NPAs, cutting fraud losses, and staying fully audit-ready and regulator-friendly.
```
*Tighter alternate (≈600 chars) if the field is short:*
```
SBI Sentinel is an always-on team of AI agents that watches each customer's financial life
and acts before trouble hits. It scores wellbeing on six glass-box pillars, predicts risks
(EMI bounce, liquidity crunch), detects fraud, generates and simulates personalised plans,
validates each against RBI/DPDP rules, and explains every recommendation with transaction
evidence. The AI only proposes, the customer approves and the bank executes on existing
rails. Consent-gated, reversible, fully audited. SBI moves from selling products to
protecting wellbeing: deeper engagement, lower NPAs, less fraud, regulator-ready.
```

---

## Proposed solution / Business model / commercial potential *
```
SOLUTION
An agentic AI layer inside YONO and SBI channels. Eight LangGraph-orchestrated agents run a
closed loop that detects the signal, plans two or three options, simulates each one, runs a
deterministic compliance check, explains the choice, and proposes it. Once the customer
approves, the bank executes on existing rails and writes an audit record. A compliance and
guardrail engine certifies or vetoes every plan, and an explainability ledger records the
reasoning for both the customer and the regulator. Data lives on a sovereign-cloud or on-prem
VPC, localized in India, and gated by DPDP consent.

WHY IT WINS FOR SBI (business model, SBI monetizes outcomes, not ad-selling)
1. Lower NPAs: pre-delinquency early-warning nudges reduce EMI bounces and slippage.
 Even a small basis-point improvement on SBI's ~₹40 lakh-crore loan book is large value.
2. Fraud loss avoided: real-time anomaly + scam-pattern detection with consent-based freeze.
3. Ethical, suitability-checked cross-sell: when a genuine insurance or investment GAP is
 found, Sentinel proposes SBI Life / SBI MF products ONLY after a mis-selling and
 suitability check, higher conversion, zero mis-sell risk, fee/commission income.
4. Cost-to-serve down: agentic self-service deflects routine advisory load from branches
 and call centres.
5. CASA + engagement up: a guardian that saves customers money drives loyalty, deposits,
 and YONO daily-active usage, directly serving the Digital Engagement theme.

COMMERCIAL POTENTIAL
- Primary: internal SBI deployment across 50cr+ customers, retention, NPA, fraud, cross-sell.
- B2B2C / SaaS: license the Sentinel engine to regional/cooperative banks and NBFCs
 (per-active-customer or per-plan-executed pricing).
- Premium tier: "SBI Sentinel+" advisory for HNI/affluent with tax and wealth optimisation.
- The compliance-validated-plan engine is defensible IP that few fintechs can replicate
 because it requires banking-grade regulatory grounding, not just an LLM.
```

---

## Technology stack details *
```
FRONTEND: React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui, Recharts (financial charts),
Framer Motion. Accessible, responsive, YONO-aligned design language.

BACKEND: Python 3.12 FastAPI microservices (API gateway, agent-orchestrator, financial-engine,
compliance, consent, audit, ingestion). Event-driven via Apache Kafka (Redpanda in dev).
Temporal for durable, resumable Human-in-the-Loop plan workflows.

AGENTIC AI: LangGraph (stateful multi-agent orchestration, supervisor + specialists) with
Model Context Protocol (MCP) servers standardising tool access to core-banking, market data,
and the compliance rulebook. A frontier-class LLM serves as the reasoning model behind a
provider-abstracted gateway. Guardrails + a DETERMINISTIC compliance rule engine
(OPA/Rego + Python) that certifies or vetoes every plan.

DATA & RETRIEVAL: PostgreSQL (financial state, events, append-only audit, partitioned),
Neo4j knowledge graph (customer-360: accounts, merchants, entities, life events),
pgvector/Qdrant vector store, Redis (cache, feature store, rate-limit). Hybrid retrieval
(BM25 + dense + rerank) for RAG grounded on RBI circulars, DPDP, and SBI product docs.

ANALYTICS/ML: Financial Wellbeing scoring engine (glass-box), risk models (EMI-bounce /
liquidity), anomaly detection, Monte-Carlo simulation for plan projections.

PLATFORM: Docker + Kubernetes on on-prem / sovereign-cloud VPC (India data localization).
Security: OAuth2/OIDC, mTLS, RBAC, field-level encryption, PII tokenization, consent ledger.
Observability: OpenTelemetry + Prometheus + Grafana + Langfuse (LLM tracing & evals).
Extras: Speech (Bhashini/Indic ASR) and OCR (document ingestion) ready for multilingual reach.
```

---

## Process flow / architecture *
```
CORE LOOP (Human-in-the-Loop, agent proposes / customer approves / bank executes):

 Signals (transactions, salary credits, bills, market, life events)
 │ event bus (Kafka)
 ▼
 ORCHESTRATOR AGENT (LangGraph supervisor) routes the event
 ▼
 DETECT: Financial-Health Agent (updates 6-pillar Wellbeing Score)
 Risk & Early-Warning Agent (predicts EMI bounce, liquidity crunch)
 Fraud & Anomaly Agent (scam / anomaly patterns)
 ▼
 PLAN: Planner Agent generates 2-3 personalised options (uses insurance-gap,
 investment-gap, debt, tax tools + RAG on SBI/RBI corpus)
 ▼
 SIMULATE: Simulation Agent projects each plan's future Wellbeing Score & cashflow (Monte-Carlo)
 ▼
 COMPLIANCE GATE: deterministic rule engine checks RBI + DPDP + suitability +
 mis-selling → CERTIFY or VETO (produces a Compliance Certificate)
 ▼
 EXPLAIN: Explainability Agent → plain-language rationale + evidence transactions
 ▼
 PROPOSE to customer in YONO/Sentinel UI
 ▼
 [ CUSTOMER APPROVES ] ── if veto or low confidence → escalate to human RM, never auto-act
 ▼
 BANK EXECUTES via existing rails (core banking / UPI) → AUDIT LEDGER (immutable) → agents learn

Full Mermaid architecture, ER diagram, agent specs and OpenAPI spec are in the linked GitHub
repository (docs/ folder). Data stays on-prem/VPC, India-localized, DPDP-consent-gated,
with every recommendation carrying confidence + evidence + compliance certificate + a
reversible action.
```

---

## Upload your idea deck *(file)*
Upload `docs/10-deck/SBI-Sentinel-Deck.pdf` (build script + source in `docs/10-deck/`).

## Demo video link *(≤3 min, optional but high value)*
Script ready in `docs/12-demo/DEMO-SCRIPT.md`. Record a screen-capture walkthrough of the
prototype following the golden path and paste the YouTube/Drive link.

## GitHub repository link *(optional, credibility boost)*
Push this repo public and paste the URL. A clean, documented monorepo signals a team that
can actually deliver the prototype phase.

---

### ✅ Pre-submit checklist
- [ ] Team details filled (all members, name + organization)
- [ ] Title, Brief, Business model, Tech stack, Process flow pasted
- [ ] Idea deck PDF uploaded
- [ ] (Optional) 3-min demo video link added
- [ ] (Optional) Public GitHub link added
- [ ] Saved before 05 Jul 23:59, save early, you can keep editing until deadline
