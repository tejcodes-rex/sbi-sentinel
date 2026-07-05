# SBI Sentinel, Architecture Decision Records (ADRs)

> Companion to `docs/00-MASTER-CONCEPT.md` (source of truth). These ADRs record the
> **why** behind each load-bearing architectural choice, written for an SBI risk,
> compliance, and technology review, not for a demo stage. Every decision is judged
> against three constraints that never move: **(1) a regulated bank at ~50 crore-customer
> scale, (2) RBI + DPDP auditability and explainability, (3) the non-negotiable that the AI
> proposes but never moves money on its own.**

**ADR format:** Title · Status · Context · Decision · Consequences · Alternatives considered.
**Status legend:** `Accepted` = committed for the prototype + reference architecture.

---

## Index

| # | Decision | Status |
|---|---|---|
| ADR-001 | LangGraph for agent orchestration | Accepted |
| ADR-002 | Model Context Protocol (MCP) for tool access | Accepted |
| ADR-003 | Vector database (pgvector → Qdrant) for semantic retrieval | Accepted |
| ADR-004 | Graph database (Neo4j) for Customer 360 | Accepted |
| ADR-005 | Event-driven architecture (Kafka + Temporal) | Accepted |
| ADR-006 | RAG for regulatory grounding | Accepted |
| ADR-007 | Hybrid search (BM25 + dense + rerank) | Accepted |
| ADR-008 | Guardrails + deterministic compliance engine | Accepted |
| ADR-009 | Human-in-the-loop approval gate | Accepted |
| ADR-010 | a frontier-class LLM behind a provider-abstracted LLM gateway | Accepted |
| ADR-011 | On-prem / sovereign-cloud VPC with India data localization | Accepted |

---

## ADR-001, Use LangGraph for multi-agent orchestration

**Status:** Accepted

### Context
Sentinel is not a single chatbot. It is a fixed, auditable pipeline of eight cooperating
agents (Orchestrator, Financial Health, Risk & Early-Warning, Fraud & Anomaly, Planner,
Simulation, Compliance & Guardrail, Explainability) running a defined loop:
`Detect → Plan → Simulate → Compliance-check → Explain → Propose → (approve) → Execute → Audit`.
For a bank, three properties are mandatory:

1. **Deterministic control flow.** A regulator must be able to see that the Compliance gate
 *always* runs before a plan is proposed, and that a veto *always* halts the flow. Control
 flow cannot be an emergent property of models chatting freely.
2. **Durable, inspectable state.** The plan lifecycle spans days (an EMI-bounce warning fires
 9 days out) and pauses for human approval. The orchestration state must be persistable,
 resumable, and replayable for audit.
3. **Explicit human-in-the-loop interrupts.** The graph must be able to stop, wait for the
 customer's `Approve`, and continue, as a first-class feature, not a hack.

### Decision
Adopt **LangGraph** as the agent orchestration framework. Model Sentinel as a **stateful
directed graph** with a **supervisor (Orchestrator) node** routing to specialist nodes.
Use LangGraph's typed shared state, conditional edges for routing (e.g. Compliance `veto`
edge → escalate-to-RM node), and its native **checkpointing + interrupt** primitives to
persist state to Postgres and pause at the HITL approval gate.

### Consequences
**Positive**
- Control flow is **code, reviewable and testable**: the compliance gate is a mandatory
 edge, not a suggestion in a prompt. This is directly defensible in an RBI model-governance review.
- Checkpointing gives us **free durability and time-travel replay** of any agent run for the
 Explainability Ledger and audit.
- `interrupt()` maps one-to-one onto the "wait for customer approval" non-negotiable.
- Graph nodes are independently unit-testable and swappable; the Compliance node can be a
 deterministic Python function, not an LLM, inside the same graph.

**Negative / cost**
- LangGraph is younger than classical workflow engines; we mitigate by keeping node logic
 framework-agnostic (plain Python) so a node can be lifted out if needed.
- We deliberately push *durable, multi-day, retry-heavy* execution down to **Temporal**
 (ADR-005) and keep LangGraph focused on the *reasoning graph within a single decision cycle*.
 The two are complementary, not redundant.

### Alternatives considered
- **Raw prompting / a single mega-prompt "do everything" agent**: Rejected. No enforceable
 ordering, no guaranteed compliance gate, no durable state, opaque to audit. Fatal for a bank.
- **AutoGen (conversational multi-agent)**: Rejected. Its strength is free-form agent
 conversation; control flow is emergent and non-deterministic. We need the opposite: a fixed,
 provable pipeline. Hard to guarantee "Compliance always runs before Propose."
- **CrewAI (role/task crews)**: Rejected for the core loop. Good ergonomics for linear task
 delegation, but weaker on cyclic graphs, typed durable state, and native human-interrupt
 checkpointing at the maturity we need for a resumable multi-day HITL lifecycle.
- **Fully custom orchestration (hand-rolled state machine)**: Rejected as the default. We
 would rebuild checkpointing, interrupts, streaming, and tracing that LangGraph already
 provides. We keep the *option* open by isolating node logic, but building from scratch is
 cost without differentiation.

---

## ADR-002, Use Model Context Protocol (MCP) for tool access

**Status:** Accepted

### Context
Sentinel agents must reach many privileged systems: core-banking read APIs, the FWS scoring
engine, the deterministic compliance rulebook, market/NAV data, SBI product catalogues, and
the RAG corpus. Each is a different team, protocol, and trust boundary. Naively, every agent
would embed bespoke function-calling glue for every system, a combinatorial mess that is hard
to secure, audit, and evolve. In a bank, **who is allowed to call what** is itself a
compliance artifact.

### Decision
Expose every capability to the agents as **MCP servers** behind a standard protocol.
Concretely: a `core-banking` MCP server (read-only account/transaction tools), a `compliance`
MCP server (rule-check / certificate tools), a `market-data` MCP server, and a `retrieval` MCP
server (hybrid search over the RBI/DPDP/product corpus). Agents discover and call tools through
MCP; they never hold raw credentials to downstream systems.

### Consequences
**Positive**
- **One uniform tool contract** (discovery + typed schemas) instead of N bespoke integrations, new tools are added by standing up an MCP server, not by editing every agent.
- **Security choke point:** MCP servers are the enforcement boundary for authЗ, scoping, PII
 tokenization, and rate-limiting. Core-banking tools can be made **read-only by construction**,
 reinforcing "the AI never moves money."
- **Auditable tool inventory:** the exact set of tools an agent can invoke is declarative and
 reviewable, a direct answer to "what can this AI touch?" in a risk review.
- **Model/vendor portability:** because tools are decoupled from the model, swapping the LLM
 (ADR-010) does not touch integrations.

**Negative / cost**
- An extra protocol layer and a small number of MCP server processes to operate. Justified by
 the security and maintainability payoff at bank scale.
- MCP is a young standard; we pin versions and keep servers thin so the surface stays stable.

### Alternatives considered
- **Bespoke per-agent function-calling glue**: Rejected. O(agents × systems) integrations,
 duplicated auth logic, no uniform audit of tool access, painful to evolve, and every model
 swap risks rewriting integrations.
- **A single monolithic internal "tools API"**: Partially viable but rejected as the primary
 pattern: it collapses distinct trust boundaries (core-banking vs. market data) into one
 service and loses per-capability scoping and independent ownership. MCP gives us the same
 standardization *with* boundary isolation.
- **Direct DB/API access from agents**: Rejected outright. Hands models raw credentials and
 write paths; unacceptable for a regulated core-banking environment.

---

## ADR-003, Use a vector database (pgvector in dev → Qdrant at scale)

**Status:** Accepted

### Context
Every customer-facing explanation must be **grounded in source documents**: RBI circulars,
DPDP text, SBI product terms, and the system must recall relevant "customer memory" (past
plans, prior context). This requires semantic retrieval over unstructured text, at low latency,
for tens of millions of customers, alongside the structured financial data in Postgres.

### Decision
Use a **vector store for dense semantic retrieval**. **Start with `pgvector`** (Postgres
extension) so retrieval lives next to relational data with zero new infrastructure during
prototype and low-volume rollout. **Graduate to Qdrant** as a dedicated vector engine when
corpus size, filtered-search throughput, and recall-at-scale exceed what a shared Postgres
comfortably serves. Vectors carry rich metadata (jurisdiction, doc type, effective date,
customer scope) for filtered hybrid search (ADR-007).

### Consequences
**Positive**
- Explanations cite **retrievable, versioned evidence**, satisfying RBI explainability
 expectations and feeding the Explainability Ledger.
- `pgvector`-first keeps the prototype footprint small and transactionally consistent with
 the rest of the data; **Qdrant** later gives us HNSW performance, payload filtering, and
 horizontal scale without changing the retrieval contract (the `retrieval` MCP server hides
 the swap, ADR-002).
- Metadata filtering lets us enforce **temporal correctness** ("use the circular in force on
 this date") and **data-scope isolation** (a customer's memory is never retrievable for another).

**Negative / cost**
- Two engines across the lifecycle (dev vs. scale) means an abstraction to maintain; contained
 behind the retrieval MCP interface.
- Vector recall is probabilistic; we never let it stand alone for compliance decisions, those
 are deterministic (ADR-008). Retrieval only *grounds explanation*, it does not *decide*.

### Alternatives considered
- **Keyword-only search (Elasticsearch/BM25 alone)**: Rejected as sole method. Misses
 paraphrase and semantic matches ("liquidity crunch" vs. "cash shortfall"). We keep BM25 but
 as one leg of hybrid search (ADR-007), not the whole answer.
- **Fine-tuning the model on the corpus instead of retrieval**: Rejected (see ADR-006).
 Regulations change; a fine-tuned model cannot cite a source, cannot be updated same-day when
 a circular is amended, and hallucinates confidently. Retrieval keeps knowledge external,
 current, and citable.
- **Pinecone / other managed SaaS vector DBs**: Rejected due to **India data-localization and
 on-prem/VPC requirements** (ADR-011). Qdrant is self-hostable inside the sovereign VPC.

---

## ADR-004, Use a graph database (Neo4j) for Customer 360

**Status:** Accepted

### Context
Sentinel's intelligence depends on **relationships**: a customer connects to accounts, cards,
loans, EMIs, merchants, beneficiaries, employer (salary-credit pattern), family/dependents,
insurance policies, and inferred life events. Fraud and anomaly detection is inherently
relational (shared devices, beneficiary rings, merchant clusters). Risk prediction needs
multi-hop context (salary → account → upcoming large debit → EMI due date). Expressing these as
deep relational JOINs is slow, brittle, and unreadable.

### Decision
Model the **Customer 360 as a knowledge graph in Neo4j**: nodes for customers, accounts,
merchants, entities, policies, and life events; typed relationships for ownership, payment
flows, and inferred connections. Agents (via the core-banking / retrieval MCP servers) traverse
the graph for context; the **system of record for money and audit remains PostgreSQL** (ADR-005).
Neo4j is a **derived, read-optimized 360 view**, not the ledger.

### Consequences
**Positive**
- **Multi-hop questions become cheap traversals** instead of many-way JOINs: "which upcoming
 debits threaten the account that receives this salary credit?" or "is this beneficiary linked
 to a known scam cluster?"
- Fraud/anomaly and life-event inference get a **natural relational substrate**, improving
 early-warning quality (directly tied to the NPA and fraud-loss business metrics).
- Graph context makes agent reasoning **explainable as paths**: "we flagged this because A→B→C", which strengthens the Explainability Ledger.

**Negative / cost**
- A second data store to keep in sync with Postgres; handled by projecting from the Kafka event
 stream (ADR-005), so the graph is an eventually-consistent read model with a clear source of truth.
- Team must know Cypher; contained to the 360 service.

### Alternatives considered
- **Relational-only (Postgres with recursive CTEs / join tables)**: Rejected for Customer 360.
 Works for shallow relations but degrades badly on variable-depth traversals and relationship
 analytics (fraud rings, multi-hop exposure); queries become unmaintainable and slow at scale.
 We still use Postgres for state, events, and audit, the right tool for *those* jobs.
- **A document store shaped as nested 360 objects**: Rejected. Denormalized blobs can't answer
 cross-customer relational questions (merchant clusters, beneficiary networks) without
 effectively reimplementing a graph engine.
- **Graph database as the system of record**: Rejected. The money/audit ledger must be
 ACID, partitioned, append-only, and time-tested → Postgres. Neo4j is the 360 *view*, not the truth.

---

## ADR-005, Event-driven architecture: Kafka (event bus) + Temporal (durable workflow)

**Status:** Accepted

### Context
Sentinel is "always-on" and reacts to a firehose of signals, transactions, salary credits,
bill due-dates, market moves, life-event triggers, across ~50 crore customers. Two very
different needs coexist:
(a) **High-throughput, decoupled ingestion and fan-out** of signals to many agents/consumers;
(b) **Durable, long-running, resumable orchestration** of a single customer's plan lifecycle
that may span days and *pause for human approval*, with guaranteed exactly-once side effects
(no double FD-sweep) and full retry semantics.

### Decision
Adopt an **event-driven architecture** with a clear split of responsibilities:
- **Apache Kafka** as the **event backbone**: signal ingestion, decoupling producers from the
 agent consumers, replayable event log, and the projection source for Neo4j and read models.
 **Redpanda** (Kafka-API-compatible) in **dev** for a lightweight footprint; **Apache Kafka**
 in **prod**.
- **Temporal** as the **durable workflow engine** for the **HITL plan lifecycle**: it owns the
 long-lived, resumable state machine ("propose → wait (days) for approval → execute → audit"),
 provides exactly-once activity execution, timeouts, retries, and human-signal waits.

LangGraph (ADR-001) runs the *reasoning* within a decision cycle; Temporal runs the *durable
business process* around it; Kafka moves the *events* between everything.

### Consequences
**Positive**
- **Elastic, decoupled ingestion:** producers never block on agents; consumers scale
 independently; the event log is replayable for audit and for rebuilding read models/graph.
- **Correct money-adjacent execution:** Temporal guarantees the approval-then-execute step is
 **durable and exactly-once**: the customer's `Approve` can arrive days after the proposal and
 the workflow resumes exactly where it paused. Idempotency prevents duplicate rail actions.
- Natural fit for the non-negotiable HITL gate: the workflow simply *waits on a human signal*.

**Negative / cost**
- More infrastructure (brokers + Temporal cluster) and operational skill. Justified: this is the
 spine of a reliable, auditable, bank-grade system. Redpanda-in-dev keeps the inner loop light.

### Alternatives considered
- **Synchronous request/response only**: Rejected. Cannot model an always-on watcher; couldn't
 survive a multi-day approval wait; a downstream outage would cascade into user-facing failures;
 no replay for audit.
- **Cron / scheduled batch jobs**: Rejected as the primary model. Too coarse and too late for
 "9 days before an EMI bounce" early warning; no per-event reactivity; no durable per-customer
 workflow state. (Batch remains fine for offline model retraining, not for the live loop.)
- **A message queue alone (e.g. RabbitMG/SQS) without Temporal**: Rejected. Queues move
 messages but don't give durable, inspectable, resumable *workflow state* with human-wait,
 timers, and exactly-once activities. We'd end up hand-building Temporal, badly.
- **Kafka-only, no Temporal**: Rejected. Kafka is a log, not a workflow engine; orchestrating a
 pausing, retrying, human-gated saga purely on topics is fragile and hard to audit.

---

## ADR-006, Use RAG for regulatory and product grounding (not fine-tuning, not closed-book)

**Status:** Accepted

### Context
Every recommendation Sentinel shows a customer must be **grounded in current RBI/DPDP rules and
exact SBI product terms**, and must be able to **cite the source**. Regulations and product
terms change frequently and without notice. A wrong or stale citation in a customer-facing
financial recommendation is a **regulatory and reputational liability**, not a cosmetic bug.

### Decision
Use **Retrieval-Augmented Generation (RAG)**: keep the authoritative knowledge in an external,
versioned corpus (RBI circulars, DPDP, SBI product docs), retrieve the relevant passages at
inference time via hybrid search (ADR-007), and require the model to generate **only from the
retrieved, cited context** for any regulatory/product claim. Knowledge lives **outside** the
model weights.

### Consequences
**Positive**
- **Same-day updatability:** when a circular changes, we update the corpus, no retraining, no
 redeploy of a model. The system is current by construction.
- **Citations, not vibes:** every explanation points at a retrievable source passage, feeding
 the Explainability Ledger and satisfying RBI explainability expectations.
- **Reduced hallucination on facts that matter,** because the model is constrained to grounded
 context and can be made to abstain when retrieval finds nothing relevant.
- Clean separation of concerns: the LLM does *reasoning and phrasing*; the corpus owns *truth*.

**Negative / cost**
- Retrieval quality becomes a first-class concern (addressed by ADR-007), bad retrieval =
 bad grounding. We invest in hybrid search + rerank and evaluate retrieval with Langfuse evals.
- Corpus curation and versioning is ongoing operational work; owned, not optional.

### Alternatives considered
- **Fine-tuning the model on the regulatory corpus**: Rejected as the grounding mechanism.
 Bakes knowledge into weights that go stale immediately, cannot cite a source, is expensive to
 update on every circular change, and still hallucinates confidently. (We may fine-tune later
 for *style/format*, never as the source of regulatory *truth*.)
- **Closed-book LLM (rely on the model's parametric knowledge)**: Rejected outright.
 Unverifiable, non-citable, and dangerously wrong on India-specific, recently-changed
 regulation. Unacceptable for customer-facing financial advice at a bank.
- **Hard-coded rules only, no LLM for explanation**: We *do* use deterministic rules for the
 compliance *decision* (ADR-008), but customers need plain-language, personalized explanation;
 RAG grounds that explanation in real sources without inventing facts.

---

## ADR-007, Hybrid search (BM25 + dense + rerank), not dense-only

**Status:** Accepted

### Context
The RAG corpus is full of **regulatory identifiers, exact terminology, and numbers**: circular
numbers, section references, product codes, FOIR/CRAR-style acronyms, precise figures. Pure
dense (embedding) retrieval is strong on paraphrase and meaning but **weak on exact-token
matches** (an embedding may miss "RBI/2023-24/107" or a specific product code). Missing the
*right* clause in a compliance-grounded explanation is unacceptable.

### Decision
Use **hybrid retrieval**: run **BM25/lexical** and **dense/semantic** retrieval in parallel,
fuse the candidate sets, and apply a **cross-encoder reranker** to order the fused candidates by
true relevance before passing the top-k to the model. Apply metadata filters (jurisdiction,
effective date, doc type, customer scope) throughout.

### Consequences
**Positive**
- **Best of both:** lexical recall catches exact identifiers/acronyms/numbers; dense recall
 catches paraphrase and intent; the reranker maximizes precision of the final context window.
- Materially **higher grounding quality** → fewer wrong/irrelevant citations → stronger
 Explainability Ledger and compliance posture.
- Reranking lets us keep the top-k small and precise, controlling prompt cost and latency.

**Negative / cost**
- More moving parts (two retrievers + a reranker) and slightly higher per-query latency and
 compute. Mitigated by caching (Redis), small top-k after rerank, and running retrievers in
 parallel. Worth it for correctness on regulated content.

### Alternatives considered
- **Dense-only (embeddings + ANN)**: Rejected as sole method. Silently misses exact-token and
 numeric matches critical in legal/regulatory text; produces plausible-but-wrong neighbours.
- **BM25-only (lexical)**: Rejected as sole method. Misses semantic/paraphrase matches and
 synonymy that customers and circulars both use.
- **No reranking (just fuse and take top-k)**: Rejected. Fusion without a cross-encoder leaves
 relevance noisy; the reranker is the cheapest large win in precision for grounded generation.

---

## ADR-008, Guardrails + a deterministic compliance engine (never trust the LLM to be compliant)

**Status:** Accepted

### Context
The single most important credibility claim in the master concept is the **moat**: *any LLM can
suggest; Sentinel proves each suggestion is RBI/DPDP-safe.* Compliance, suitability, and
mis-selling checks are **pass/fail obligations** with legal consequences. An LLM is a
probabilistic text generator; it can be prompted to "check compliance," but its output is
non-deterministic, non-reproducible, and cannot be signed off by a bank's risk function.
"The model said it was fine" is not an audit answer.

### Decision
Make compliance a **deterministic gate**, not an LLM judgment. The **Compliance & Guardrail
Agent is a rule engine**: **OPA/Rego policies + explicit Python rules**: that evaluates every
generated plan against RBI rules, DPDP consent constraints, suitability, and mis-selling checks,
and emits a **CERTIFY or VETO** decision with a machine-readable **Compliance Certificate**. A
veto *hard-halts* the LangGraph flow (ADR-001) and escalates to a human RM. Additionally, apply
**guardrails** at the LLM boundary (input/output validation, PII tokenization, schema
enforcement, jailbreak/injection defense). The LLM never has authority to self-certify.

### Consequences
**Positive**
- **Reproducible, testable, versioned compliance:** the same plan + same rules → the same
 verdict, every time. Rules are code-reviewed, unit-tested, and diffable, exactly what a bank's
 risk/audit function requires.
- The **Compliance Certificate is a first-class artifact** attached to every proposal and stored
 in the audit ledger, the concrete evidence behind "we proved it's compliant."
- Deterministic veto power is what makes the whole agentic system **deployable in a regulated
 environment**: the moat in the master concept, made real.
- Guardrails contain the LLM's failure modes (prompt injection, PII leakage, malformed output)
 at the boundary.

**Negative / cost**
- Compliance rules must be authored and maintained by domain/compliance experts, ongoing,
 deliberate work. This is a feature: it forces regulatory logic to be explicit and owned, not
 hidden in a prompt.

### Alternatives considered
- **Trust the LLM to self-check compliance (LLM-as-judge on its own output)**: Rejected.
 Non-deterministic, non-reproducible, unauditable, and manipulable via the same prompt that
 produced the plan. No bank risk committee will accept "the model checked itself."
- **LLM checks, human rubber-stamps everything**: Rejected as primary control (too slow, and
 humans over-trust confident AI). We keep humans for *approval of the action* (ADR-009) and for
 *veto/low-confidence escalation*, but the *compliance verdict itself* is deterministic.
- **Guardrails library alone, no rule engine**: Rejected. Guardrails handle format/PII/injection
 at the boundary but do not encode domain regulatory logic (RBI/DPDP/suitability). We need both
 layers; they solve different problems.

---

## ADR-009, Human-in-the-loop approval gate (agents propose; the customer approves; the bank executes)

**Status:** Accepted

### Context
This is the master concept's #1 credibility move and a hard legal/ethical boundary: **the AI
never moves money on its own.** Autonomous financial action by an AI for 50 crore customers is
unacceptable under RBI expectations, exposes the bank to unbounded liability, and would destroy
customer trust the first time it acted wrongly. DPDP further requires that data use and
consequential actions be **consent-based** and **purpose-bound**.

### Decision
Enforce a **mandatory human-in-the-loop approval gate** in the workflow. Agents run the full
loop up to **Propose**; the flow then **pauses** (LangGraph `interrupt` + Temporal human-signal
wait, ADRs 001/005) until the customer gives **explicit consent** in the Sentinel/YONO UI. Only
then does the bank **execute via existing SBI rails** (core banking / UPI). Every recommendation
carries **confidence, evidence, a compliance certificate, and a reversible action**. If the
Compliance engine vetoes or confidence < threshold → **escalate to a human RM, never auto-act.**
The action itself is captured as a DPDP consent artifact and written to the immutable audit ledger.

### Consequences
**Positive**
- **Regulatory alignment:** satisfies RBI's expectation of human oversight for consequential AI
 actions and DPDP's consent-first, purpose-bound requirements, the difference between a
 deployable bank system and a stage demo.
- **Bounded liability & trust:** the customer is always the decision-maker for money movement;
 the AI is an advisor. A wrong suggestion is a rejected suggestion, not a wrong transaction.
- The consent event + certificate + evidence together form a **complete, auditable record** for
 every action.
- Architecturally clean: the durable-wait is a native workflow feature (ADR-005), not a bolt-on.

**Negative / cost**
- Not "fully autonomous," so no instant unattended action. This is **by design and by law**: it
 is the product's core promise, not a limitation to remove.
- Requires excellent proposal UX (clear evidence, one-tap approve) so the gate is a delight, not
 friction. Owned by the frontend workstream.

### Alternatives considered
- **Full autonomy (AI executes money movement itself)**: Rejected on legal, regulatory (RBI),
 liability, and trust grounds. Non-starter for a regulated bank; contradicts the master concept's
 non-negotiables.
- **Human approval only for "large" actions, autonomy for "small" ones**: Rejected for the
 prototype/reference architecture. Any threshold is an arbitrary, contestable line and a
 liability surface; the clean, defensible rule is *approval for every money movement*. (A future
 policy-gated, consent-pre-authorized "auto-sweep within limits I set" mode could be evaluated
 later, still customer-authorized, still audited, but it is out of scope for the trust baseline.)
- **RM/branch approves instead of the customer**: Rejected as the default: it's the customer's
 money and consent under DPDP. RM approval is the *escalation* path for veto/low-confidence cases,
 not the normal path.

---

## ADR-010, a frontier-class LLM behind a provider-abstracted LLM gateway

**Status:** Accepted

### Context
Sentinel needs a **strong reasoning model** for planning, simulation narration, and
explanation, quality directly affects plan usefulness and explanation clarity. But a bank
cannot **lock its core intelligence to a single vendor**: pricing, availability, model
deprecations, procurement policy, data-handling terms, and regulatory guidance all change.
Different tasks also have different cost/latency profiles (deep planning vs. short classification).

### Decision
Use **a frontier-class LLM: a higher-capability tier for the hardest reasoning (planning, complex explanation), and a faster tier for
high-volume/lower-latency steps (routing, classification, drafting)**: as the reasoning LLM,
accessed **exclusively through an internal, provider-abstracted LLM gateway**. The gateway owns
model selection/routing, prompt/response logging (PII-tokenized, no-train), cost and rate
controls, retries/fallbacks, and a **stable internal interface** so the underlying model or
provider can change without touching agent code.

### Consequences
**Positive**
- **Best-in-class reasoning today** (a frontier-class LLM's strength on nuanced, safety-sensitive,
 instruction-following tasks fits regulated financial advice) **without vendor lock-in tomorrow**: swap or add a provider by reconfiguring the gateway, not rewriting agents.
- **Tiered model use** (a higher-capability tier vs. a faster tier) optimizes cost/latency per task without leaking model
 choices into business logic.
- The gateway is the **single control point** for the no-log/no-train-on-PII policy, tokenization,
 auditing of every prompt/response, and enforcement of data-handling terms, a security and
 compliance requirement, centralized.
- Combined with MCP (ADR-002), tools are model-agnostic, so the swap is genuinely low-cost.

**Negative / cost**
- An internal gateway to build and operate. Justified: it is also where we enforce PII policy,
 cost governance, and observability, value beyond portability.

### Alternatives considered
- **Hard-code a single provider's SDK throughout the agents**: Rejected. Vendor lock-in,
 scattered PII-handling, no central cost/rate control, and a painful migration if terms/pricing/
 availability change or procurement mandates a change.
- **Self-hosted open-weights model only (e.g. inside the VPC)**: Rejected as the *sole* choice
 today on reasoning-quality grounds for safety-critical financial advice, but the gateway
 **keeps this option open**: an on-prem/open-weights model can be added as a provider (or a
 fallback / PII-sensitive-path model) without agent changes. Deliberately future-proof.
- **Multiple providers wired directly (no gateway)**: Rejected. Multi-provider *without*
 abstraction multiplies integration and policy-enforcement points instead of centralizing them.

---

## ADR-011, On-prem / sovereign-cloud VPC with India data localization

**Status:** Accepted

### Context
Sentinel processes the most sensitive data a person has, full financial history and PII, for
an Indian public-sector bank. **RBI's data-localization directive** requires payment/financial
data to be stored in India; **DPDP** governs processing, consent, and cross-border transfer of
personal data. Sending this data to an arbitrary public multi-tenant SaaS region is both a
regulatory violation and an unacceptable risk-review outcome.

### Decision
Deploy the entire Sentinel platform on **on-premises infrastructure or a sovereign-cloud VPC
located in India**, with **all customer data localized in India** and never leaving the
sovereign boundary. Run everything self-hostable inside this boundary, Postgres, Neo4j, Kafka,
Temporal, Qdrant, Redis, the LLM gateway, MCP servers, and observability, on **Docker +
Kubernetes**. Any external model call (ADR-010) goes through the gateway under contractual
no-train/no-retention terms with PII tokenized before it ever leaves the boundary; where required,
route PII-sensitive paths to an in-VPC model.

### Consequences
**Positive**
- **Compliant by construction** with RBI data-localization and DPDP, the baseline for passing an
 SBI risk review, which the master concept names as the whole point ("designed to pass a risk
 review, not just wow a stage").
- **Full control** over the security perimeter: mTLS, RBAC, field-level encryption, PII
 tokenization, consent ledger, and no-log/no-train on PII are all enforced within owned infra.
- Choosing self-hostable components throughout (Qdrant over managed Pinecone, self-run Kafka,
 etc.) is a **direct consequence** of this ADR and was applied in ADRs 003-005.

**Negative / cost**
- Higher operational burden than public managed SaaS (we run more ourselves). This is the
 non-negotiable cost of banking-grade data sovereignty, not an avoidable inefficiency.
- Some cutting-edge managed services are off the table; we accept self-hosted equivalents.

### Alternatives considered
- **Public multi-tenant SaaS in a foreign/default region**: Rejected. Violates RBI
 data-localization and DPDP cross-border rules; fails risk review immediately.
- **Hybrid: PII in India, "anonymized" data abroad**: Rejected for the baseline. De-anonymization
 risk on financial data is real, cross-border processing complicates DPDP consent, and it weakens
 the clean "data never leaves the sovereign boundary" claim that makes the system deployable.
- **Managed cloud in an Indian region (public cloud, in-country)**: A viable *variant* of the
 sovereign-VPC decision and acceptable where the provider offers an India-localized, contractually
 compliant, isolated VPC. The decision is **India-localized + sovereign-controlled VPC**; whether
 that VPC is on-prem or an in-country cloud region is a deployment detail chosen per SBI's own
 policy, the localization and control guarantees are the non-negotiable part.

---

## Cross-cutting note, how the decisions reinforce each other

These ADRs are not independent; they compose into the master concept's moat:

- **LangGraph (001)** gives a provable pipeline; **Temporal + Kafka (005)** make it durable and
 event-driven; together they enforce the **HITL gate (009)** as a native pause-for-consent.
- **MCP (002)** decouples tools from the model, which makes the **frontier-LLM-behind-a-gateway (010)**
 swap cheap and the **sovereign VPC (011)** security boundary clean.
- **RAG (006)** + **hybrid search (007)** over a **vector DB (003)**, plus **Neo4j 360 (004)**,
 supply *grounded, relational context*, but the **deterministic compliance engine (008)** owns
 the *verdict*, never the LLM.
- The output of the whole chain, grounded explanation + deterministic Compliance Certificate +
 human consent, is exactly the **Compliance-Validated Plan + Explainability Ledger** that makes
 Sentinel deployable in a bank, which is the entire thesis of the master concept.
