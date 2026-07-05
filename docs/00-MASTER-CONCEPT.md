# SBI Sentinel, Master Concept Spec (Source of Truth)

> Every deliverable in this repo MUST stay consistent with this file. If a detail is
> not here, choose the option that best survives an SBI risk/compliance review.

## 0. One-liner
**SBI Sentinel** is an always-on team of AI agents that watches each customer's financial
life, catches trouble *before* it happens, a bounced EMI, a shrinking emergency fund, a
fraud pattern, an under-insured family, and hands the customer a ready-to-approve plan.
**The agents propose; the customer approves; the bank executes.** The AI never moves money
on its own.

- **Name:** SBI Sentinel
- **Tagline:** Autonomous Financial Wellbeing Engine
- **Theme:** Agentic AI & Emerging Tech
- **Problem Statement:** Digital Engagement
- **Event:** SBI Hackathon @ Global Fintech Fest (GFF) 2026, Elimination (Idea) round
 closes **05 Jul 2026 23:59**; Top 15 shortlisted **15 Jul 2026**; then Prototype phase.

## 1. The reframe that makes us a finalist (vs. a demo)
1. **Human-in-the-loop by law and by design.** Agents detect → predict → plan → simulate →
 compliance-check → explain → **propose**. Money only moves on explicit customer consent
 via existing SBI rails (YONO / core banking / UPI). This is the #1 credibility move for a
 regulated bank.
2. **Glass-box Financial Wellbeing Score (FWS 0-1000).** Six weighted pillars, every point
 traceable to a transaction. No black box → satisfies RBI expectations on AI explainability.
3. **The moat = Compliance-Validated Plan + Explainability Ledger.** Any LLM can *suggest*.
 Sentinel *proves* each suggestion is RBI/DPDP-safe and shows the evidence + reasoning trail.
 That is what a bank can actually deploy.
4. **DPDP-native, consent-first, data-localized, on-prem/VPC.** Designed to pass an SBI risk
 review, not just wow a stage.
5. **Every agent tied to a P&L / risk metric**: ethical business value, not charity.

## 2. The differentiator in one sentence
> "Others build an AI that *talks* about your money. Sentinel builds an AI team that
> *watches, predicts, plans, proves it's compliant, explains itself, and waits for your
> yes*, turning SBI from a transaction utility into a financial guardian."

## 3. Financial Wellbeing Score (FWS), glass box
Score 0-1000, sum of 6 pillar sub-scores. Each pillar is deterministic + explainable.

| Pillar | Weight | Signal | Healthy target |
|---|---|---|---|
| Cashflow Resilience | 20% | (inflow−outflow)/inflow, volatility | savings rate ≥ 20% |
| Emergency Buffer | 20% | liquid balance ÷ avg monthly essential spend | ≥ 6 months |
| Debt Health | 20% | EMI+obligations ÷ net income (FOIR), credit util | FOIR ≤ 40% |
| Protection (Insurance) | 15% | life cover ÷ (10× income), health cover adequacy | life ≥ 10× income |
| Wealth Growth | 15% | invested assets ÷ net worth, SIP consistency | invest rate ≥ 15% |
| Behavioral Hygiene | 10% | overdrafts, late fees, discretionary spikes, fraud flags | 0 penalties |

`FWS = Σ (pillar_weight × pillar_normalized_score × 1000)`. Band: 0-400 Critical,
401-600 At-Risk, 601-800 Stable, 801-1000 Thriving. Full formula in `docs/04-financial-engine`.

## 4. The 8 agents (LangGraph supervisor + specialists)
1. **Orchestrator (Supervisor)**: routes events, owns the plan lifecycle, enforces HITL gate.
2. **Financial Health Agent**: computes FWS, explains pillar deltas.
3. **Risk & Early-Warning Agent**: predicts EMI bounce, overdraft, liquidity crunch, NPA slide.
4. **Fraud & Anomaly Agent**: transaction anomaly + scam-pattern detection, freezes on consent.
5. **Planner Agent**: generates 2-3 intervention plans (options, not one) per detected issue.
6. **Simulation Agent**: Monte-Carlo / what-if projects each plan's FWS + cashflow impact.
7. **Compliance & Guardrail Agent**: deterministic rule engine: RBI, DPDP, suitability,
 mis-selling checks; can VETO any plan. Produces the Compliance Certificate.
8. **Explainability Agent**: turns the reasoning trail into plain-language + evidence for the
 customer and an audit record for the bank.

Life-Event Prediction, Insurance-Gap, Investment-Gap, Tax-Optimization, Debt-Analysis are
**capabilities/tools** invoked by Planner + Risk agents (not separate always-on agents) to
keep the architecture clean.

## 5. Agent loop (every intervention)
`Event → Detect (Risk/Fraud/Health) → Plan (2-3 options) → Simulate → Compliance-Check
(veto or certify) → Explain → Propose to customer → [Customer approves] → Bank executes via
rails → Audit + learn`. If Compliance vetoes or confidence < threshold → escalate to human RM,
never auto-act.

## 6. Business value map (why SBI funds this)
| Agent / capability | SBI metric moved |
|---|---|
| Risk & Early-Warning | Lower NPA via pre-delinquency nudges; collections cost ↓ |
| Fraud & Anomaly | Fraud loss avoided; RBI fraud-reporting SLA ↑ |
| Financial Health + Planner | CASA retention, deeper engagement (Digital Engagement theme) |
| Insurance/Investment gap (consented) | Ethical, suitability-checked cross-sell (SBI Life, MF) |
| Explainability + Compliance | Deployability, audit-readiness, regulatory trust |
| Whole system | Cost-to-serve ↓ (agentic self-service), YONO DAU/stickiness ↑ |

## 7. Tech stack (headline)
- **Frontend:** React 18 + TypeScript + Vite, Tailwind, shadcn/ui, Recharts, Framer Motion.
- **Backend:** Python 3.12 FastAPI microservices; Node BFF optional. Event bus: Kafka
 (Redpanda in dev). Workflow: Temporal for durable execution of the HITL plan lifecycle.
- **AI:** LangGraph (agent orchestration) + MCP (standardized tool access to core-banking,
 compliance, market data). A frontier-class LLM as the reasoning model via a provider-abstracted
 LLM gateway. Guardrails + deterministic compliance rule engine (OPA/Rego + Python rules).
- **Data:** PostgreSQL (financial state, events, audit, partitioned, append-only audit),
 Neo4j (customer 360 knowledge graph: accounts, entities, merchants, life events),
 pgvector / Qdrant (RAG over RBI circulars, product docs, customer memory), Redis (cache,
 rate-limit, feature store), Feast optional.
- **Retrieval:** Hybrid search (BM25 + dense) with reranking; RAG grounded on SBI product +
 RBI/DPDP corpus for every customer-facing explanation.
- **Infra:** Docker + Kubernetes, on-prem / sovereign-cloud VPC, data-localized in India.
- **Observability:** OpenTelemetry, Prometheus, Grafana, Langfuse (LLM tracing/evals),
 structured audit logs. **Security:** OAuth2/OIDC, mTLS, field-level encryption, RBAC,
 consent ledger, PII tokenization, no-log/no-train on PII.

## 8. Demo golden path (for deck + 3-min script)
Persona **Rajesh Kumar**, 34, Pune, SBI salary account, home-loan EMI, 2 kids, under-insured.
1. Sentinel dashboard shows FWS 612 (At-Risk), pillar breakdown.
2. Risk Agent detects: next month's EMI will bounce (salary credit pattern + upcoming
 large debit) → 71% probability, 9 days out.
3. Planner returns 3 plans (partial prepay defer, sweep from FD, restructure SIP date).
4. Simulation shows plan B lifts FWS to 690 and avoids ₹590 bounce charge + CIBIL hit.
5. Compliance Agent certifies plan B (no mis-sell, suitability OK), shows the certificate.
6. Explainability panel: plain-language why + evidence transactions.
7. Customer taps **Approve** → bank executes FD sweep → audit entry written. Fraud alert cameo.

## 9. Non-negotiables
- No autonomous money movement. No PII in logs/prompts beyond tokenized refs.
- Every recommendation carries: confidence, evidence, compliance certificate, reversible action.
- India data localization. DPDP consent artifact for every data use.
