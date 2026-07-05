# SBI Sentinel, Prototype Build Plan

> SBI Hackathon @ GFF 2026. Two horizons in this document:
> 1. **§A, WIN THE ELIMINATION ROUND NOW** (~27 hours, deadline **05 Jul 2026 23:59**).
> 2. **§B, PROTOTYPE PHASE** (only if shortlisted; announced 15 Jul). The main plan.
>
> Team assumption: **2-4 people**. Roles referenced below: **L** = Lead/full-stack,
> **AI** = agents/LLM, **FE** = frontend/UX, **BIZ** = domain/compliance/deck (may double up
> on a 2-person team). Source of truth: `docs/00-MASTER-CONCEPT.md`. Golden path: §8 there.
>
> **Guiding principle:** build the *demo golden path as a thin vertical slice first*, the whole
> loop working for one persona (Rajesh) end-to-end, then widen. A working narrow loop beats a
> broad set of disconnected stubs every single time in a judged demo.

---

# §A, The ~27-hour sprint to WIN the elimination round (NOW)

The elimination round is **idea + deck**, not a working system. Do **not** start building the
app yet, spend these hours making the *submission* undeniable. Optional demo video + GitHub are
credibility multipliers, not requirements.

### Hour-by-hour (compress/expand to your actual remaining window)

| Block | Hours | Owner | Deliverable | Done when |
|---|---|---|---|---|
| A1 | 0-1 | ALL | Kickoff: read `00-MASTER-CONCEPT.md` together; lock the 7 golden-path beats; assign owners. | Everyone can recite the loop and the trust line. |
| A2 | 1-3 | BIZ + L | Finalize portal copy in `docs/11-submission/PORTAL-READY-SUBMISSION.md`: **fill team details**, tighten Brief/Business/Tech/Flow to the field limits, sanity-check every claim against the master concept. | All fields paste-ready; no bracketed placeholders left. |
| A3 | 3-5 | BIZ | Deck skeleton, 10-12 slides (outline below). Write headlines first (the story), bodies second. | Slide titles tell the whole story with no body text. |
| A4 | 5-11 | FE + BIZ | Build the deck in Figma/Slides/PPT. The golden path is a **7-frame visual storyboard** (one slide per beat). Add the FWS-612 mock, 3-plan mock, compliance certificate mock, audit row mock. | Deck reads cleanly on a projector; storyboard is self-explanatory. |
| A5 | 11-14 | AI + FE | *(Optional, high value)* Stand up a **static clickable mock** of the dashboard (no backend), just enough to screenshot the 7 frames for the deck and, if time allows, screen-record. Hardcode Rajesh's data. | 7 hero screenshots exist for the deck. |
| A6 | 14-15 | ALL | Design polish pass: consistent color system (SBI navy + amber/green risk states), one type scale, aligned charts, remove clutter. See `frontend-design` skill for direction. | No slide looks templated; risk states are color-coded consistently. |
| A7 | 15-19 | AI + FE | *(Optional)* Record the **3-min demo video** from the mock following `docs/12-demo/DEMO-SCRIPT.md`. Voice-over over a clean take. Upload unlisted. | Video ≤ 3:00, lands the trust line by 2:55. |
| A8 | 19-22 | L | *(Optional)* Make the repo presentable: this docs tree, a strong `README.md` (problem → solution → architecture diagram → run instructions), `LICENSE`, `.gitignore`. Push public. | `README` alone convinces a judge the team can deliver. |
| A9 | 22-25 | BIZ + L | Compliance/claims QA: every number and regulatory claim (RBI, DPDP, FOIR, 10× cover, ₹590, 612→690) is internally consistent and defensible. Kill anything you can't defend if asked. | No unsupported claim survives. |
| A10 | 25-27 | ALL | **Submit early** (portals lag near deadline). Paste all fields, upload deck PDF, add video + GitHub links, tick the checklist, save. Then re-open and re-verify each field rendered. | Submission saved & re-verified well before 23:59. |

### Deck outline (10-12 slides)
1. **Title**: SBI Sentinel · Autonomous Financial Wellbeing Engine · team.
2. **The problem**: banks react *after* damage (bounce, CIBIL hit, fraud, under-insurance).
3. **The reframe**: from transaction utility to financial guardian; the one-sentence differentiator.
4. **How it works**: the agent loop diagram (Detect→Plan→Simulate→Comply→Explain→Propose→Approve→Execute→Audit).
5. **The 8 agents**: one line each, grouped (Supervisor / Detect / Plan+Sim / Compliance+Explain).
6. **Glass-box FWS**: the 6 pillars, banded 0-1000; "every point traces to a transaction."
7-9. **Golden-path storyboard**: Rajesh: FWS 612 → risk detected → 3 plans → sim 690 → certificate → approve → execute+audit → fraud cameo (3 slides).
10. **Why SBI funds this**: business-value map (NPA↓, fraud↓, CASA↑, cross-sell, cost-to-serve↓).
11. **Compliance & trust moat**: deterministic gate + explainability ledger + DPDP-native + on-prem VPC.
12. **Tech stack + roadmap**: headline stack; "prototype-ready" ask.

> **Priority within §A:** A1→A2→A3→A4 are P0 (the submission itself). A5-A8 (mock, polish,
> video, repo) are P1, do them if the deck is safely done. Never let an optional artifact
> jeopardize the mandatory copy + deck.

---

# §B, Prototype phase build plan (post-shortlist)

**Assumed window:** ~10 build days between shortlist (15 Jul) and a prototype review. Adjust the
day grid to your actual window; the *ordering and de-risking logic* is the durable part.

## B.0 Architecture we're building toward (recap from master concept)
- **Frontend:** `apps/web`: React 18 + TS + Vite + Tailwind + shadcn/ui + Recharts + Framer Motion.
- **Backend:** Python 3.12 FastAPI microservices in `services/*` (gateway, agent-orchestrator,
 financial-engine, compliance, consent, audit, ingestion). Kafka/Redpanda event bus. Temporal
 for the durable HITL plan lifecycle.
- **AI:** `ai/*`: LangGraph supervisor + specialists, MCP tool servers, a frontier-class LLM via a
 provider-abstracted LLM gateway, RAG over RBI/DPDP/product corpus.
- **Data:** Postgres (state/events/append-only audit), Neo4j (customer-360 graph), pgvector/Qdrant
 (RAG), Redis (cache/features).

> **For the prototype, we deliberately narrow this:** in-process LangGraph instead of a full Kafka
> topology, Postgres + pgvector (skip Neo4j unless a graph beat is on screen), Temporal optional
> (a durable-enough Postgres-backed plan state machine is acceptable for a demo). Ship the *story*,
> not the full production topology. Every cut is listed in "Explicit scope cuts" below.

---

## B.1 Milestone timeline

| Milestone | Target day | Definition |
|---|---|---|
| **M0, Skeleton up** | Day 1 | Repo runs: `docker compose up` brings Postgres + one FastAPI service + web dev server; healthchecks green. |
| **M1, Compliance gate + FWS live** | Day 3 | Deterministic compliance engine certifies/vetoes a hardcoded plan; FWS engine computes Rajesh's 612 from seed data with pillar breakdown. |
| **M2, One agent loop end-to-end** | Day 5 | Risk detects → Planner proposes 1 plan → Simulate → Compliance certify → Explain → API returns it. Headless (curl) passes. |
| **M3, Golden path in the UI** | Day 7 | The whole loop is clickable in `apps/web` for Rajesh: 612 gauge → risk toast → 3 plans → sim 612→690 → certificate → Approve → execute+audit. |
| **M4, Breadth + fraud cameo + polish** | Day 9 | Fraud agent cameo, 2nd/3rd plan variety, explainability evidence links, audit ledger view, visual polish, captions-ready. |
| **M5, Demo-locked** | Day 10 | `DEMO_MODE` seeded + cached run is byte-identical; 3-min recording captured; fallback assets staged; freeze. |

---

## B.2 De-risking order (WHY this sequence)

Build the pieces most likely to sink the demo **first**, while there's time to recover:

1. **Compliance gate first.** It's the moat *and* the biggest unknown (deterministic rules + veto).
 If it can't certify/veto convincingly, the whole thesis is hollow. De-risk it Day 1-3.
2. **FWS engine second.** It's deterministic, testable, and it's the first thing on screen. A
 wrong or hand-wavy score is caught instantly by a bank judge.
3. **One agent loop (Risk→Plan→Sim→Comply→Explain) third.** Prove the *shape* of the loop with a
 single vertical slice before adding any second agent. This is the thin slice that de-risks
 LangGraph orchestration, the LLM gateway, and the HITL gate together.
4. **UI wiring fourth.** Only wire the front end once the loop returns a real object; don't build
 UI against a spec that might change.
5. **Breadth last (Fraud, extra plans, graph, RAG depth).** Additive; each is independently
 droppable if a day is lost. Nothing on the critical path depends on them.

> Rule: **never** start a P1 item while a P0 item on the golden path is red.

---

## B.3 Priority-ordered backlog

### P0, the golden path must work (no demo without these)
- [ ] **Seed dataset** `db/seed/rajesh_kumar.sql`: accounts, 6 months of transactions, salary
 credits, EMI mandate, FD, SIP, insurance record, engineered so FWS = **612** and the EMI
 genuinely looks like it bounces in 9 days. *This fixture is the spine of the whole demo.*
- [ ] **FWS engine** (`services/financial-engine`), 6 pillars per master-concept §3, normalized,
 banded, with per-pillar evidence. Deterministic, unit-tested against the seed.
- [ ] **Compliance engine** (`services/compliance`), deterministic rule set (Python + optional
 OPA/Rego) that runs RBI-suitability / DPDP-consent / no-mis-sell / reversibility checks and
 emits a **Compliance Certificate** object (id, checks[], verdict CERTIFY|VETO, rules_fired[]).
- [ ] **Risk agent**: predicts EMI bounce from the salary/debit pattern; outputs probability (71%),
 horizon (9 days), and evidence transaction ids.
- [ ] **Planner agent**: returns **3** plan options (defer prepay / FD sweep / shift SIP) with
 cost, reversibility, and required action.
- [ ] **Simulation agent**: projects each plan's FWS delta + rupee impact (612→690, avoids ₹590).
 Monte-Carlo optional; a deterministic projection is acceptable for the demo if labeled honestly.
- [ ] **Explainability agent**: plain-language rationale + linked evidence transactions.
- [ ] **Orchestrator** (`services/agent-orchestrator`, LangGraph), runs Detect→Plan→Simulate→
 Comply→Explain→Propose; **enforces the HITL gate** (no execution before Approve); escalates on
 veto/low-confidence.
- [ ] **Consent + Approve** (`services/consent`), customer approval flips plan Proposed→Approved and
 records a consent artifact.
- [ ] **Execution stub + Audit** (`services/audit`), on Approve, "bank executes" (mock rail) and
 writes an **append-only audit row** (plan hash, certificate id, consent id, timestamp).
- [ ] **`apps/web` golden path**: dashboard (612 gauge + pillar breakdown), risk toast, 3-plan
 panel, sim animation, certificate card, explainability panel, Approve button, audit view.
- [ ] **`DEMO_MODE`**: seeded + cached LLM responses so the demo is deterministic and offline-safe.

### P1, breadth that makes it feel complete (do after P0 is green)
- [ ] **Fraud & Anomaly agent**: the ₹49,999 new-payee cameo with a consent-gated freeze prompt.
- [ ] **Financial Health agent narrative**: pillar-delta explanations ("why 612, not 700").
- [ ] **RAG grounding** (`ai/rag`), retrieve RBI/DPDP/product snippets to ground explanations +
 compliance rationale (pgvector; small curated corpus is fine).
- [ ] **Audit ledger view** in the UI, a readable timeline of the whole loop.
- [ ] **LLM gateway abstraction** (`services/gateway`) + Langfuse tracing for evals.
- [ ] **Auth**: OIDC login gating the dashboard (even a single seeded user with a real session).

### P2, production-credibility signals (only if ahead of schedule)
- [ ] Neo4j customer-360 graph + one graph-powered insight on screen.
- [ ] Temporal durable workflow for the plan lifecycle (replaces the Postgres state machine).
- [ ] Kafka/Redpanda real event bus (replaces in-process events).
- [ ] Field-level encryption + PII tokenization + `no-log-PII` middleware.
- [ ] k8s manifests (`infra/k8s`) / Terraform (`infra/terraform`) beyond docker-compose.
- [ ] Multilingual (Bhashini/Indic ASR) + OCR ingestion.

### Explicit scope cuts for the prototype (say these out loud in the review)
- Real core-banking/UPI integration → **mocked rail** behind an interface (production-swappable).
- Kafka, Temporal, Neo4j → **optional/P2**; in-process + Postgres for the demo.
- Full RBI corpus → **curated slice** sufficient for the golden-path explanations.
- Real customer PII → **synthetic persona only** (Rajesh); DPDP by construction.

---

## B.4 Day-by-day plan (10 days; crunch days are hour-by-hour)

### Day 1, Skeleton + de-risk starts *(M0)*
- **L:** `docker-compose` (Postgres, Redis, one FastAPI service, web). Repo conventions, `.env.example`, CI lint/test stub. Health endpoints.
- **AI:** Stand up LLM gateway + LangGraph "hello loop" (one node in, one out) so the plumbing is proven.
- **FE:** `apps/web` boots; layout shell, design tokens (SBI navy + amber/green risk states), FWS gauge component (static).
- **BIZ:** Draft `db/seed/rajesh_kumar.sql` v1 and hand-verify the numbers produce FWS≈612 and a plausible bounce.
- ✅ **Checkpoint:** `docker compose up` → all healthchecks green; web renders a static gauge.

### Day 2, FWS engine
- **AI/L:** Implement all 6 pillars per §3; per-pillar evidence; band logic; `/fws/{customer}` endpoint.
- **BIZ:** Finalize seed so pillars land where the story needs them (weak Emergency Buffer).
- **FE:** Wire the live FWS + pillar breakdown into the dashboard (real data, not mock).
- ✅ **Checkpoint:** `GET /fws/rajesh` returns **612** with 6 pillar sub-scores + evidence; UI shows it.

### Day 3, Compliance gate *(M1)*, hour-by-hour (crunch)
| Hour | Owner | Task |
|---|---|---|
| 0-2 | AI | Define the Compliance Certificate schema (id, checks[], verdict, rules_fired[], evidence). |
| 2-5 | AI | Implement deterministic rules: suitability, DPDP-consent-present, no-new-credit-sold, reversibility, own-funds-only. |
| 5-7 | AI | Add a **VETO path** with a rule that fails a bad plan, and the escalate-to-RM branch. |
| 7-8 | L | `/compliance/certify` endpoint; wire into orchestrator as a hard gate. |
| 8-9 | BIZ | Write compliance rule docs + test cases (a plan that certifies, a plan that vetoes). |
| 9-10 | ALL | Unit tests for both verdicts; review. |
- ✅ **Checkpoint:** a good plan **certifies**, a deliberately bad plan (sells a new product) **vetoes**: both proven by test.

### Day 4, Risk agent + Planner
- **AI:** Risk agent → EMI-bounce probability + horizon + evidence from the salary/debit pattern.
- **AI:** Planner agent → 3 concrete options with cost/reversibility/action.
- **L:** Orchestrator wires Detect→Plan; plan objects persisted with lifecycle state.
- ✅ **Checkpoint:** `POST /orchestrate` on a risk event returns 3 plans, each ready for simulation.

### Day 5, Simulate + Explain → loop closes *(M2)*, hour-by-hour (crunch)
| Hour | Owner | Task |
|---|---|---|
| 0-3 | AI | Simulation agent: per-plan FWS delta + rupee impact; Plan B → 612→690, avoids ₹590. |
| 3-5 | AI | Explainability agent: plain-language rationale + linked evidence tx ids. |
| 5-7 | L | Orchestrator runs the **full** Detect→Plan→Simulate→Comply→Explain→Propose chain. |
| 7-8 | L | Consent/Approve endpoint (Proposed→Approved) + execution stub + audit write. |
| 8-10 | ALL | End-to-end **headless** test via curl through the whole loop, including audit row. |
- ✅ **Checkpoint:** one curl script drives the entire golden path headless and prints the audit row. **This is the make-or-break checkpoint.**

### Day 6, UI wiring, part 1
- **FE:** Risk toast, 3-plan panel, plan selection → live sim result (612→690 animation).
- **L/AI:** Fix any contract mismatches surfaced by real UI consumption.
- ✅ **Checkpoint:** Clicking a plan in the UI shows the real simulated score change.

### Day 7, UI wiring, part 2 → golden path clickable *(M3)*
- **FE:** Compliance certificate card, explainability panel with evidence links, **Approve** button, executing→done states, audit view.
- **ALL:** First full **click-through rehearsal** against `DEMO_MODE`.
- ✅ **Checkpoint:** the entire golden path is clickable end-to-end in the browser.

### Day 8, Breadth
- **AI:** Fraud & Anomaly cameo (₹49,999 new-payee, consent-gated freeze prompt).
- **AI/L:** RAG grounding for explanations (P1) if the loop is stable; else skip.
- **FE:** Plan-variety polish, empty/error states, loading skeletons.
- ✅ **Checkpoint:** Fraud toast fires and asks before acting; nothing auto-executes.

### Day 9, Polish + hardening *(M4)*
- **FE:** Visual pass (spacing, motion timing on the 612→690, color-coded risk bands, captions/subtitles-ready, projector legibility).
- **L:** Basic auth (OIDC) gating the dashboard; `no-log-PII` middleware; input validation on all endpoints.
- **ALL:** Full dry run × 2; log every rough edge; triage fixes.
- ✅ **Checkpoint:** two clean back-to-back run-throughs with no console errors.

### Day 10, Demo lock *(M5)*
- **ALL:** Freeze features. Finalize `DEMO_MODE` seeded+cached run (byte-identical, offline).
- **FE/AI:** Record the 3-min video per `docs/12-demo/DEMO-SCRIPT.md`; stage all fallback assets (MP4 local + phone + Drive; storyboard screenshots).
- **BIZ:** Update the deck with real prototype screenshots; rehearse Q&A on compliance/architecture.
- ✅ **Checkpoint:** Definition of Done (below) fully satisfied; tag `v-demo`.

---

## B.5 Test / verification checkpoints (running through the build)
- **Unit:** FWS pillars (every pillar has a test with a known input→score), compliance CERTIFY and
 VETO paths, risk-probability calc. Deterministic engines must be fully covered.
- **Contract:** OpenAPI schemas for each service; a contract test the UI runs against so FE/BE
 don't drift.
- **Golden-path integration:** the Day-5 curl script becomes a CI smoke test, it must pass on
 every commit thereafter. **If it goes red, the demo is broken; fix before anything else.**
- **HITL invariant test:** an automated assertion that **no execution or audit-write can happen
 without an Approve**: this protects the entire product thesis. Treat a failure as P0-blocker.
- **Determinism test:** run `DEMO_MODE` twice; diff the outputs, must be identical.
- **Eval (`ai/eval`):** a small Langfuse/eval suite on agent outputs (plan sanity, no
 hallucinated products, explanation grounded in evidence).

---

## B.6 Definition of Done, prototype demo
The prototype is demo-ready when **all** are true:
1. The **entire golden path** (FWS 612 → risk → 3 plans → sim 612→690 → certificate → explain →
 Approve → execute → audit → fraud cameo) runs **clickable in `apps/web`** for Rajesh.
2. It runs in **`DEMO_MODE`**: seeded data, cached LLM responses, **no network dependency**, and
 **byte-identical on repeat**.
3. The **compliance gate is real**: it demonstrably **certifies** a good plan and **vetoes** a bad
 one, and the loop **cannot execute without customer Approve** (HITL invariant test green).
4. Every recommendation on screen carries **confidence + evidence + compliance certificate +
 reversible action** (master-concept non-negotiable).
5. Every executed action writes an **append-only audit row** visible in the UI.
6. A **3-minute recording** exists and matches `DEMO-SCRIPT.md`; **fallback assets staged** (MP4
 local+cloud, storyboard screenshots).
7. **No PII in logs/prompts**; only the synthetic persona is used.
8. `README` lets a judge clone and run the demo in one command; the golden-path smoke test is green in CI.
9. Two consecutive clean dry runs completed within the 3:00 cap.
