# SBI Sentinel, API Specification

> **Status:** Design spec for the Elimination + Prototype rounds. Every route here is
> consistent with `docs/00-MASTER-CONCEPT.md`. The machine-readable contract lives in
> [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.0.3). Where the two disagree, `openapi.yaml`
> is authoritative for REST shapes and this document is authoritative for intent and the
> non-REST surfaces (internal, MCP, webhooks, GraphQL).

**Core invariant (from the Master Concept):** *The agents propose; the customer approves;
the bank executes.* No API in this surface can move money. The only route that changes the
real world is `POST /v1/plans/{id}/approve`, and even that only **enqueues** a bank-side
execution against existing SBI rails (YONO / core banking / UPI), it never debits directly.

---

## 1. API design principles

### 1.1 Surfaces
Sentinel exposes five distinct API surfaces, each with its own trust boundary:

| Surface | Consumers | Transport / Auth | Base |
|---|---|---|---|
| **Public REST** | YONO app, Sentinel web dashboard, RM console | HTTPS + OAuth2/OIDC (customer or staff token) | `https://api.sentinel.sbi/v1` |
| **Internal service** | Sentinel microservices (agent runtime, engine, compliance) | mTLS mesh + short-lived SPIFFE SVIDs | `https://<svc>.sentinel.svc.cluster.local` |
| **Agent / MCP tools** | LangGraph agents (via the LLM gateway) | MCP over stdio/HTTP inside the VPC, per-tool RBAC | MCP server registry |
| **Webhooks (outbound)** | SBI core-banking, YONO, fraud-ops, CRM | HTTPS POST + HMAC-SHA256 signature | subscriber-owned URLs |
| **GraphQL read-model** | Dashboard aggregate reads only (read-only) | HTTPS + OAuth2/OIDC (same tokens as REST) | `https://api.sentinel.sbi/graphql` |

### 1.2 Versioning
- URI-path versioning: `/v1/...`. Breaking changes ship under `/v2`; additive changes
 (new optional fields, new endpoints) stay in `/v1`.
- The current version and deprecation window are advertised on every response:
 `Sentinel-API-Version: 1`, and when relevant `Deprecation: true` + `Sunset: <HTTP-date>`.
- Internal service contracts are versioned by proto/JSON-schema semver, negotiated at the mesh.

### 1.3 Authentication & authorization
- **Customer-facing:** OAuth2 Authorization Code + PKCE via SBI's OIDC provider (YONO SSO).
 Access tokens are JWTs with `sub` = tokenized customer ref, `scope`, and `acr` (step-up
 when a plan approval requires re-auth). Tokens are short-lived (≤ 15 min) with refresh.
- **Staff-facing** (RM console, audit, admin): OIDC with enterprise IdP, RBAC roles
 `rm`, `compliance_officer`, `fraud_analyst`, `auditor`, `admin`. Sensitive routes
 (`/v1/audit`, `/v1/admin/*`) require `auditor`/`admin` **and** are themselves audited.
- **Service-to-service:** mTLS with SPIFFE identities; no bearer tokens cross the mesh
 unauthenticated. Each internal call carries a propagated `trace_id` and the originating
 `actor` (customer, agent, or staff) for the audit chain.
- **Scopes** map 1:1 to domains: `consent:read consent:write wellbeing:read risk:read
 fraud:read fraud:act plans:read plans:approve executions:read agents:read audit:read`.

### 1.4 Consent enforcement on every PII route
Every route that reads or derives customer PII (all `/v1/customers/{id}/*`, plans, executions)
passes through a **consent gate** middleware *before* business logic:
1. Resolve the active consent artifact for `(customer, purpose, data_categories)`.
2. If missing, expired, or revoked → `403 consent_required` with the exact missing purpose.
3. Attach the consent id to the request context; **every** downstream read and the audit
 record reference that consent id (DPDP purpose-limitation + traceability).

The purpose taxonomy (e.g. `wellbeing_scoring`, `risk_monitoring`, `fraud_detection`,
`plan_generation`, `execution`) is fixed and versioned; a token scope alone is **not**
sufficient, a valid DPDP consent artifact must also exist.

### 1.5 Idempotency
- All unsafe mutating routes (`POST`, and `DELETE /v1/consent/{id}`) accept an
 `Idempotency-Key: <uuid>` header. The server stores the first response for a key for 24h
 and replays it verbatim on retry, so a double-tapped **Approve** never double-executes.
- Idempotency keys are scoped per `(actor, route)`. A reused key with a *different* body →
 `422 idempotency_key_reused`.

### 1.6 Pagination
- Cursor-based (opaque, stable under inserts). Query params: `?limit=<1..100>&cursor=<opaque>`.
- Response envelope carries `page`: `{ "next_cursor": "...|null", "limit": 50 }`.
- List routes also accept `?sort=` (whitelisted fields) and domain filters (e.g.
 `?severity=high`, `?status=proposed`).

### 1.7 Error envelope
Every 4xx/5xx returns the same shape (RFC-7807-inspired, extended for our audit needs):

```json
{
 "error": {
 "code": "consent_required",
 "message": "No active consent for purpose 'plan_generation'.",
 "status": 403,
 "trace_id": "01J8Z7Q3M6R7F0K2V9A1B3C4D5",
 "details": [
 { "field": "purpose", "issue": "missing", "value": "plan_generation" }
 ],
 "doc_url": "https://api.sentinel.sbi/docs/errors/consent_required"
 }
}
```

Stable machine codes: `validation_failed`, `unauthenticated`, `forbidden`,
`consent_required`, `not_found`, `conflict`, `idempotency_key_reused`,
`plan_not_approvable`, `compliance_veto`, `rate_limited`, `internal_error`,
`upstream_unavailable`. `trace_id` matches the OpenTelemetry trace and the audit log.

### 1.8 Rate limits
- Per-token token-bucket: **120 req/min** default customer, **600 req/min** staff console,
 burst 2×. Approval routes: **10 req/min** per customer (defence against automation abuse).
- Headers on every response: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
- `429 rate_limited` includes `Retry-After` (seconds).

### 1.9 Cross-cutting conventions
- All timestamps ISO-8601 UTC (`2026-07-04T09:15:00Z`). Money as integer **paise** plus
 an ISO-4217 `currency` (`INR`) to avoid float drift, e.g. `{ "amount": 59000, "currency": "INR" }`
 is ₹590.00. Money is never a bare float.
- Customer identifiers in the public API are **tokenized refs** (`cust_...`), never PAN /
 Aadhaar / account numbers. Account handles are opaque (`acct_...`).
- `Content-Type: application/json; charset=utf-8`. Localization via `Accept-Language`
 (`en-IN`, `hi-IN`) for human-readable strings and explanations.

---

## 2. Public REST endpoints

Base path `/v1`. `{id}` for a customer is the tokenized `cust_*` ref; the caller may use
`me` as a shortcut resolving to the authenticated customer.

### 2.1 Auth & Consent

| Method | Path | Purpose | Scope |
|---|---|---|---|
| `POST` | `/v1/consent` | Grant a DPDP consent for one or more purposes/data categories | `consent:write` |
| `GET` | `/v1/consent` | List the caller's active + historical consent artifacts | `consent:read` |
| `GET` | `/v1/consent/{id}` | Fetch one consent artifact | `consent:read` |
| `DELETE` | `/v1/consent/{id}` | Revoke a consent (soft, tombstoned, never hard-deleted) | `consent:write` |

- `POST /v1/consent`: body: purposes, data categories, retention, channel. Returns the
 signed consent artifact (`201`) with a hash that is anchored in the audit ledger.
- `DELETE /v1/consent/{id}`: revocation is immediate for future processing and emits a
 `consent.revoked` webhook; already-completed processing is not retroactively undone but is
 flagged. Returns `200` with the tombstoned artifact.

Status codes: `201`, `200`, `400 validation_failed`, `401`, `404 not_found`,
`409 conflict` (duplicate active consent for same purpose set).

### 2.2 Financial Health (FWS)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/customers/{id}/wellbeing-score` | Current FWS (0-1000), band, computed-at, evidence pointer |
| `GET` | `/v1/customers/{id}/wellbeing-score/pillars` | The six pillar sub-scores with weights + signals |
| `GET` | `/v1/customers/{id}/wellbeing-score/history` | Time series of FWS (paginated, `?from`/`?to`/`?interval`) |

Consent gate: purpose `wellbeing_scoring`. Every pillar value carries the underlying signal
and a pointer to the evidence transactions (glass-box requirement).

### 2.3 Risk & Fraud

| Method | Path | Purpose | Scope |
|---|---|---|---|
| `GET` | `/v1/customers/{id}/risks` | Active early-warning risk signals (EMI bounce, overdraft, liquidity, NPA-slide) | `risk:read` |
| `GET` | `/v1/customers/{id}/fraud-alerts` | Open fraud/anomaly alerts | `fraud:read` |
| `POST` | `/v1/customers/{id}/fraud-alerts/{alertId}/freeze` | Customer-consented freeze of an instrument/txn on a fraud alert | `fraud:act` |

- The freeze route is the one exception where an action is customer-initiated on a fraud
 alert. It still does **not** move money, it requests a *hold* via core banking, requires
 step-up auth, is idempotent, and emits `fraud.detected` follow-up + audit.

Status: `200`, `202 Accepted` (freeze enqueued), `403 consent_required`, `404`, `409`.

### 2.4 Plans & Recommendations

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/customers/{id}/recommendations` | Ranked open recommendations (each links to a Plan) |
| `GET` | `/v1/plans/{id}` | A full plan: 2-3 options, detected issue, confidence, status |
| `GET` | `/v1/plans/{id}/simulation` | Monte-Carlo / what-if projection of each option's FWS + cashflow |
| `GET` | `/v1/plans/{id}/compliance-certificate` | The Compliance Agent's certificate (certify / veto + rule evidence) |
| `GET` | `/v1/plans/{id}/explanation` | Plain-language why + evidence transactions + reasoning trail |

Consent gate: purpose `plan_generation`. A plan is immutable once proposed; a new
assessment produces a new plan version, so the customer always approves exactly what they saw.

### 2.5 Approvals & Execution

| Method | Path | Purpose | Scope |
|---|---|---|---|
| `POST` | `/v1/plans/{id}/approve` | Customer approves one option → enqueues bank execution | `plans:approve` |
| `POST` | `/v1/plans/{id}/reject` | Customer rejects the plan (with optional reason) | `plans:approve` |
| `GET` | `/v1/executions/{id}` | Status of a bank-side execution kicked off by an approval | `executions:read` |

- `approve` **requires**: a valid `plan_generation` **and** `execution` consent, a
 non-vetoed compliance certificate, step-up auth (`acr` in token), an `Idempotency-Key`,
 and the `selected_option_id` + the `certificate_hash` the customer saw (optimistic lock).
 If the certificate changed since it was shown → `409 conflict`. If the plan is vetoed or
 expired → `422 plan_not_approvable`.
- Response is `202 Accepted` with an `execution` resource in `pending`: the bank rail
 executes asynchronously; the client polls `GET /v1/executions/{id}` or subscribes to the
 `execution.completed` webhook.

### 2.6 Agents (transparency / trace)

| Method | Path | Purpose | Scope |
|---|---|---|---|
| `GET` | `/v1/agent-runs` | List agent runs (filter by `customer`, `type`, `status`) | `agents:read` |
| `GET` | `/v1/agent-runs/{id}/trace` | The step-by-step LangGraph trace: which agent, tool calls, decisions | `agents:read` |

Trace exposes the reasoning graph (nodes = agents/tools, edges = handoffs) with **no PII in
the trace payload**: evidence is referenced by tokenized pointers. This backs the
Explainability Ledger and Langfuse traces.

### 2.7 Audit (staff-only)

| Method | Path | Purpose | Scope |
|---|---|---|---|
| `GET` | `/v1/audit` | Query the append-only audit ledger (staff-only, itself audited) | `audit:read` |

Filters: `?actor`, `?customer`, `?action`, `?from`, `?to`, `?resource_type`. Every record is
hash-chained (`prev_hash` → `hash`) so tampering is detectable. Requires `auditor` or `admin`.

### 2.8 Notifications

| Method | Path | Purpose | Scope |
|---|---|---|---|
| `GET` | `/v1/notifications` | Caller's in-app notifications (new plan, fraud alert, execution done) | `wellbeing:read` |
| `POST` | `/v1/notifications/{id}/ack` | Mark a notification acknowledged/read | `wellbeing:read` |
| `GET` | `/v1/notifications/preferences` | Channel preferences (push / SMS / email / none) | `wellbeing:read` |
| `PUT` | `/v1/notifications/preferences` | Update channel preferences | `wellbeing:read` |

### 2.9 Admin (staff-only)

| Method | Path | Purpose | Scope / Role |
|---|---|---|---|
| `GET` | `/v1/admin/customers` | Search / list customers (tokenized, RM/admin) | `admin`, `rm` |
| `GET` | `/v1/admin/rules` | List active compliance rules + versions | `admin`, `compliance_officer` |
| `POST` | `/v1/admin/rules/{ruleId}/toggle` | Enable/disable a compliance rule (audited, 4-eyes) | `admin`, `compliance_officer` |
| `GET` | `/v1/admin/health` | Service health / SLO dashboard feed | `admin` |
| `POST` | `/v1/admin/escalations/{id}/assign` | Assign a human-RM escalation (compliance veto / low confidence) | `admin`, `rm` |

Admin mutations require 4-eyes (a second approver) for rule changes and are all audited.

---

## 3. Full worked examples (realistic Indian data)

Persona: **Rajesh Kumar** (`cust_8Kd2Rj`), 34, Pune, SBI salary account, home-loan EMI.

### 3.1 Example, Grant consent

**Request**
```http
POST /v1/consent HTTP/1.1
Host: api.sentinel.sbi
Authorization: Bearer <customer_jwt>
Idempotency-Key: 6f0b8f2e-2f4a-4b7a-9c3d-1a2b3c4d5e6f
Content-Type: application/json

{
 "customer_id": "cust_8Kd2Rj",
 "purposes": ["wellbeing_scoring", "risk_monitoring", "plan_generation", "execution"],
 "data_categories": ["account_balances", "transactions", "loans", "insurance_policies"],
 "retention_days": 365,
 "channel": "yono_app",
 "granted_via": "explicit_toggle"
}
```

**Response** `201 Created`
```json
{
 "id": "cnsnt_Qop71a",
 "customer_id": "cust_8Kd2Rj",
 "purposes": ["wellbeing_scoring", "risk_monitoring", "plan_generation", "execution"],
 "data_categories": ["account_balances", "transactions", "loans", "insurance_policies"],
 "status": "active",
 "retention_days": 365,
 "channel": "yono_app",
 "granted_at": "2026-07-04T09:15:00Z",
 "expires_at": "2027-07-04T09:15:00Z",
 "artifact_hash": "sha256:8f2c1b9d4e7a6c0f5b3a2d1e9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
 "audit_ref": "aud_01J8Z7Q3M6R7F0K2V9A1B3C4D5"
}
```

### 3.2 Example, Get the Wellbeing Score

**Request**
```http
GET /v1/customers/cust_8Kd2Rj/wellbeing-score HTTP/1.1
Host: api.sentinel.sbi
Authorization: Bearer <customer_jwt>
```

**Response** `200 OK`
```json
{
 "customer_id": "cust_8Kd2Rj",
 "score": 612,
 "band": "at_risk",
 "delta_30d": -18,
 "computed_at": "2026-07-04T06:00:12Z",
 "model_version": "fws-1.4.0",
 "pillars": [
 { "key": "cashflow_resilience", "weight": 0.20, "normalized": 0.61, "points": 122,
 "signal": { "savings_rate": 0.11, "volatility": "medium" }, "band": "at_risk" },
 { "key": "emergency_buffer", "weight": 0.20, "normalized": 0.45, "points": 90,
 "signal": { "months_of_essential_spend": 2.7, "target_months": 6 }, "band": "critical" },
 { "key": "debt_health", "weight": 0.20, "normalized": 0.58, "points": 116,
 "signal": { "foir": 0.46, "credit_utilization": 0.39 }, "band": "at_risk" },
 { "key": "protection", "weight": 0.15, "normalized": 0.40, "points": 60,
 "signal": { "life_cover_multiple": 4.0, "target_multiple": 10 }, "band": "critical" },
 { "key": "wealth_growth", "weight": 0.15, "normalized": 0.72, "points": 108,
 "signal": { "invest_rate": 0.14, "sip_consistency": 0.9 }, "band": "stable" },
 { "key": "behavioral_hygiene", "weight": 0.10, "normalized": 0.80, "points": 80,
 "signal": { "overdrafts_90d": 0, "late_fees_90d": 1, "fraud_flags": 0 }, "band": "stable" }
 ],
 "evidence_ref": "ev_wb_cust_8Kd2Rj_20260704",
 "consent_id": "cnsnt_Qop71a"
}
```
(Points sum to 576 of the six pillars in this illustrative snapshot; the engine reconciles
rounding so the published `score` is authoritative. See `docs/04-financial-engine`.)

### 3.3 Example, Approve a plan (the one action that touches the bank)

**Request**
```http
POST /v1/plans/plan_5tRk9c/approve HTTP/1.1
Host: api.sentinel.sbi
Authorization: Bearer <customer_jwt_with_step_up_acr>
Idempotency-Key: b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e
Content-Type: application/json

{
 "selected_option_id": "opt_B",
 "certificate_hash": "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
 "consent_id": "cnsnt_Qop71a",
 "customer_acknowledgement": "I approve executing the FD sweep as described."
}
```

**Response** `202 Accepted`
```json
{
 "execution_id": "exec_Zn3Qp8",
 "plan_id": "plan_5tRk9c",
 "selected_option_id": "opt_B",
 "status": "pending",
 "rail": "core_banking_fd_sweep",
 "estimated_settlement": "2026-07-04T12:30:00Z",
 "reversible": true,
 "actions": [
 { "type": "fd_partial_liquidation", "account": "acct_FD_11a2", "amount": { "amount": 4500000, "currency": "INR" } },
 { "type": "credit_to_savings", "account": "acct_SB_77c9", "amount": { "amount": 4500000, "currency": "INR" } }
 ],
 "compliance_certificate_id": "cert_9Yh2Lm",
 "audit_ref": "aud_01J8ZB4K7N9Q2S5U8W1Y4A7C0E",
 "poll_url": "/v1/executions/exec_Zn3Qp8"
}
```

Avoids the ₹590.00 (`{ "amount": 59000 }`) EMI-bounce charge and the CIBIL hit, matching
the Master Concept golden path (plan B lifts FWS 612 → ~690).

### 3.4 Example, Consent-gate rejection (PII route without consent)

**Response** `403 Forbidden`
```json
{
 "error": {
 "code": "consent_required",
 "message": "No active DPDP consent for purpose 'plan_generation'.",
 "status": 403,
 "trace_id": "01J8ZC0P4R7T0V3X6Z9B2D5G8J1",
 "details": [{ "field": "purpose", "issue": "missing", "value": "plan_generation" }],
 "doc_url": "https://api.sentinel.sbi/docs/errors/consent_required"
 }
}
```

---

## 4. Internal service APIs (service-to-service)

Internal calls run over the mTLS mesh. They are **not** exposed publicly. Each carries the
propagated `trace_id`, the originating `actor`, and the governing `consent_id`. Contracts are
JSON over HTTP/2 (gRPC-equivalent shapes shown as JSON for readability).

### 4.1 `financial-engine.compute_fws`
Deterministic FWS computation over a customer's financial state snapshot.

- **Endpoint:** `POST https://financial-engine.sentinel.svc/internal/v1/compute-fws`
- **Request**
 ```json
 {
 "customer_id": "cust_8Kd2Rj",
 "as_of": "2026-07-04T06:00:00Z",
 "snapshot_ref": "snap_20260704_cust_8Kd2Rj",
 "consent_id": "cnsnt_Qop71a",
 "trace_id": "01J8Z7Q3M6R7F0K2V9A1B3C4D5"
 }
 ```
- **Response**
 ```json
 {
 "score": 612,
 "band": "at_risk",
 "model_version": "fws-1.4.0",
 "pillars": [ { "key": "emergency_buffer", "normalized": 0.45, "points": 90, "signal": { "months_of_essential_spend": 2.7 } } ],
 "evidence_ref": "ev_wb_cust_8Kd2Rj_20260704",
 "deterministic": true
 }
 ```
- **Guarantees:** pure function of `(snapshot, model_version)`; same inputs → same output
 (glass-box, reproducible for audit). No side effects, no writes.

### 4.2 `compliance.evaluate_plan`
Deterministic rule engine (OPA/Rego + Python rules). Can **veto**.

- **Endpoint:** `POST https://compliance.sentinel.svc/internal/v1/evaluate-plan`
- **Request**
 ```json
 {
 "plan_id": "plan_5tRk9c",
 "customer_id": "cust_8Kd2Rj",
 "options": [ { "option_id": "opt_B", "actions": [ { "type": "fd_partial_liquidation", "amount": { "amount": 4500000, "currency": "INR" } } ] } ],
 "customer_profile_ref": "prof_cust_8Kd2Rj",
 "ruleset_version": "rbi-dpdp-2026.02",
 "trace_id": "01J8Z7Q3M6R7F0K2V9A1B3C4D5"
 }
 ```
- **Response**
 ```json
 {
 "decision": "certify",
 "certificate_id": "cert_9Yh2Lm",
 "certificate_hash": "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
 "ruleset_version": "rbi-dpdp-2026.02",
 "checks": [
 { "rule": "suitability.risk_profile_match", "result": "pass" },
 { "rule": "misselling.no_unsuitable_cross_sell", "result": "pass" },
 { "rule": "dpdp.purpose_limitation", "result": "pass" },
 { "rule": "rbi.no_autonomous_debit", "result": "pass" }
 ],
 "vetoed_options": [],
 "evaluated_at": "2026-07-04T06:01:00Z"
 }
 ```
- **Veto path:** `decision: "veto"` with the failing `checks[]` → Orchestrator escalates to
 human RM; the plan is marked `vetoed` and cannot be approved.

### 4.3 `consent.check`
The consent gate's authority. Called by the API gateway middleware and by any internal
service before touching PII.

- **Endpoint:** `POST https://consent.sentinel.svc/internal/v1/check`
- **Request**
 ```json
 {
 "customer_id": "cust_8Kd2Rj",
 "purpose": "plan_generation",
 "data_categories": ["transactions", "loans"],
 "trace_id": "01J8Z7Q3M6R7F0K2V9A1B3C4D5"
 }
 ```
- **Response**
 ```json
 {
 "allowed": true,
 "consent_id": "cnsnt_Qop71a",
 "expires_at": "2027-07-04T09:15:00Z",
 "matched_purposes": ["plan_generation"],
 "matched_categories": ["transactions", "loans"]
 }
 ```
- **Deny:** `{ "allowed": false, "reason": "revoked", "consent_id": "cnsnt_Qop71a" }` →
 caller returns `403 consent_required`.

### 4.4 `audit.append`
Append-only, hash-chained ledger writer. **Every** state change in Sentinel calls this.

- **Endpoint:** `POST https://audit.sentinel.svc/internal/v1/append`
- **Request**
 ```json
 {
 "actor": { "type": "customer", "id": "cust_8Kd2Rj" },
 "action": "plan.approved",
 "resource": { "type": "plan", "id": "plan_5tRk9c" },
 "consent_id": "cnsnt_Qop71a",
 "metadata": { "selected_option_id": "opt_B", "certificate_hash": "sha256:1a2b..." },
 "trace_id": "01J8ZB4K7N9Q2S5U8W1Y4A7C0E",
 "occurred_at": "2026-07-04T09:20:00Z"
 }
 ```
- **Response**
 ```json
 {
 "audit_ref": "aud_01J8ZB4K7N9Q2S5U8W1Y4A7C0E",
 "seq": 480213,
 "prev_hash": "sha256:00ab...",
 "hash": "sha256:9f3c...",
 "committed": true
 }
 ```
- **Guarantees:** append-only (no update/delete), `hash = H(prev_hash || record)` so the
 chain is tamper-evident; PII stored only as tokenized refs.

---

## 5. Agent APIs / MCP tool contracts

Agents never call the public REST API and never touch the database directly. They reach the
world **only** through MCP tools registered in the Sentinel MCP server, each with a JSON
schema, per-tool RBAC, and consent enforcement inside the tool. Tools are **read/compute or
propose**: no tool can move money. Full JSON Schemas below (draft-2020-12).

### 5.1 Tool registry

| MCP tool | Purpose | Mutates? |
|---|---|---|
| `get_financial_snapshot` | Read a customer's current financial state (consent-gated) | no |
| `compute_wellbeing_score` | Call financial-engine to compute FWS | no |
| `predict_risk` | Run early-warning models (EMI bounce, overdraft, NPA-slide) | no |
| `detect_anomaly` | Fraud/anomaly scoring on recent transactions | no |
| `search_knowledge` | Hybrid RAG over RBI circulars / SBI product docs / customer memory | no |
| `simulate_plan` | Monte-Carlo / what-if projection for candidate options | no |
| `evaluate_compliance` | Deterministic compliance check (can veto) | no |
| `propose_plan` | Persist a proposed plan for customer approval (never executes) | proposes only |

### 5.2 Selected JSON schemas

`predict_risk`:
```json
{
 "name": "predict_risk",
 "description": "Predict near-term financial risk events for a customer. Read-only.",
 "input_schema": {
 "type": "object",
 "additionalProperties": false,
 "required": ["customer_id", "horizon_days", "consent_id"],
 "properties": {
 "customer_id": { "type": "string", "pattern": "^cust_[A-Za-z0-9]+$" },
 "horizon_days": { "type": "integer", "minimum": 1, "maximum": 90 },
 "risk_types": {
 "type": "array",
 "items": { "enum": ["emi_bounce", "overdraft", "liquidity_crunch", "npa_slide"] }
 },
 "consent_id": { "type": "string", "pattern": "^cnsnt_[A-Za-z0-9]+$" }
 }
 },
 "output_schema": {
 "type": "object",
 "required": ["signals"],
 "properties": {
 "signals": {
 "type": "array",
 "items": {
 "type": "object",
 "required": ["type", "probability", "eta_days", "evidence_ref"],
 "properties": {
 "type": { "type": "string" },
 "probability": { "type": "number", "minimum": 0, "maximum": 1 },
 "eta_days": { "type": "integer" },
 "severity": { "enum": ["low", "medium", "high", "critical"] },
 "evidence_ref": { "type": "string" }
 }
 }
 }
 }
 }
}
```

`propose_plan` (the only "write", and it only proposes):
```json
{
 "name": "propose_plan",
 "description": "Persist a compliance-certified plan (2-3 options) for the customer to approve. Does NOT execute or move money.",
 "input_schema": {
 "type": "object",
 "additionalProperties": false,
 "required": ["customer_id", "issue", "options", "compliance_certificate_id", "consent_id"],
 "properties": {
 "customer_id": { "type": "string", "pattern": "^cust_[A-Za-z0-9]+$" },
 "issue": {
 "type": "object",
 "required": ["type", "confidence"],
 "properties": {
 "type": { "type": "string" },
 "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
 "evidence_ref": { "type": "string" }
 }
 },
 "options": {
 "type": "array",
 "minItems": 2,
 "maxItems": 3,
 "items": {
 "type": "object",
 "required": ["option_id", "summary", "actions"],
 "properties": {
 "option_id": { "type": "string" },
 "summary": { "type": "string" },
 "actions": { "type": "array", "items": { "type": "object" } }
 }
 }
 },
 "compliance_certificate_id": { "type": "string", "pattern": "^cert_[A-Za-z0-9]+$" },
 "consent_id": { "type": "string", "pattern": "^cnsnt_[A-Za-z0-9]+$" }
 }
 },
 "output_schema": {
 "type": "object",
 "required": ["plan_id", "status"],
 "properties": {
 "plan_id": { "type": "string" },
 "status": { "enum": ["proposed"] }
 }
 }
}
```

`search_knowledge` (RAG grounding for every explanation):
```json
{
 "name": "search_knowledge",
 "description": "Hybrid (BM25 + dense) retrieval over RBI/DPDP circulars, SBI product docs, and consented customer memory, with reranking.",
 "input_schema": {
 "type": "object",
 "additionalProperties": false,
 "required": ["query", "corpus"],
 "properties": {
 "query": { "type": "string", "minLength": 3, "maxLength": 512 },
 "corpus": { "type": "array", "items": { "enum": ["rbi_circulars", "dpdp", "sbi_products", "customer_memory"] } },
 "top_k": { "type": "integer", "minimum": 1, "maximum": 20, "default": 6 },
 "customer_id": { "type": "string", "pattern": "^cust_[A-Za-z0-9]+$" },
 "consent_id": { "type": "string" }
 }
 },
 "output_schema": {
 "type": "object",
 "required": ["chunks"],
 "properties": {
 "chunks": {
 "type": "array",
 "items": {
 "type": "object",
 "required": ["doc_id", "text", "score"],
 "properties": {
 "doc_id": { "type": "string" },
 "text": { "type": "string" },
 "score": { "type": "number" },
 "citation": { "type": "string" }
 }
 }
 }
 }
 }
}
```

**Agent-runtime guardrails:** `customer_memory` corpus and any customer-scoped tool require a
valid `consent_id`; the MCP server re-checks `consent.check` inside the tool (defence in
depth, a compromised prompt cannot bypass consent). Tool inputs/outputs carry no raw PII;
outputs are traced to Langfuse for the Explainability Ledger.

---

## 6. Webhook APIs (outbound events)

SBI systems subscribe to Sentinel events. Delivery is at-least-once with exponential backoff;
consumers must be idempotent on `event_id`.

### 6.1 Envelope & signatures
Every webhook POST carries:
```
Sentinel-Event-Id: evt_01J8ZB...
Sentinel-Event-Type: plan.approved
Sentinel-Signature: t=1751619600,v1=hex(HMAC_SHA256(secret, t + "." + rawBody))
Sentinel-Delivery-Attempt: 1
```
Consumers **must** verify `v1` against the shared per-subscriber secret and reject if the
timestamp skew > 5 min (replay defence). Common envelope:
```json
{
 "event_id": "evt_01J8ZB4K7N9Q2S5U8W1Y4A7C0E",
 "type": "plan.approved",
 "created_at": "2026-07-04T09:20:00Z",
 "api_version": "1",
 "data": { }
}
```

### 6.2 Events & payloads

| Event type | When | Key `data` fields |
|---|---|---|
| `plan.proposed` | Planner + Compliance certified a plan | `plan_id`, `customer_id`, `issue.type`, `option_count`, `certificate_id` |
| `plan.approved` | Customer approved an option | `plan_id`, `selected_option_id`, `execution_id`, `consent_id` |
| `execution.completed` | Bank rail finished executing | `execution_id`, `plan_id`, `status`, `settled_at`, `reversible` |
| `fraud.detected` | Fraud/Anomaly agent raised/updated an alert | `alert_id`, `customer_id`, `severity`, `pattern`, `recommended_action` |
| `consent.revoked` | Customer revoked a consent | `consent_id`, `customer_id`, `revoked_purposes`, `revoked_at` |

Example `execution.completed`:
```json
{
 "event_id": "evt_01J8ZD9M3P6R9T2V5X8Z1B4D7G",
 "type": "execution.completed",
 "created_at": "2026-07-04T12:30:05Z",
 "api_version": "1",
 "data": {
 "execution_id": "exec_Zn3Qp8",
 "plan_id": "plan_5tRk9c",
 "status": "completed",
 "rail": "core_banking_fd_sweep",
 "settled_at": "2026-07-04T12:30:00Z",
 "amount": { "amount": 4500000, "currency": "INR" },
 "reversible": true,
 "audit_ref": "aud_01J8ZD9M3P6R9T2V5X8Z1B4D7G"
 }
}
```

Subscriber management (register URL, rotate secret, replay) is under `POST /v1/admin/webhooks`
(admin-only, out of scope for the public spec but present in the internal admin surface).

---

## 7. GraphQL read-model (dashboard aggregate reads)

### 7.1 Why offer GraphQL *in addition to* REST
The Sentinel dashboard renders one screen that needs the FWS, its six pillars, open risks,
open fraud alerts, and the top recommendation **together**. Over REST that is 4-5 round trips
with over-fetching. A **read-only** GraphQL endpoint lets the dashboard ask for exactly that
aggregate in one request, lower latency on mobile (YONO), no over-fetch, and a typed schema
the frontend generates hooks from. It is deliberately **read-only**: all writes (consent,
approve, reject, freeze) stay on REST where idempotency, step-up auth, and the audit/consent
gates are enforced uniformly. GraphQL reuses the same OAuth2 tokens and the same consent gate
(enforced per resolver), and is depth/complexity-limited to prevent abusive queries.

### 7.2 Example schema (SDL excerpt)
```graphql
type Query {
 "The authenticated customer, or a tokenized ref for staff with authorization."
 customer(id: ID!): Customer
}

type Customer {
 id: ID!
 displayName: String!
 wellbeingScore: WellbeingScore!
 pillars: [Pillar!]!
 risks(severity: Severity): [RiskSignal!]!
 fraudAlerts(status: AlertStatus = OPEN): [FraudAlert!]!
 recommendations(limit: Int = 5): [Recommendation!]!
}

type WellbeingScore {
 score: Int! # 0..1000
 band: Band! # CRITICAL | AT_RISK | STABLE | THRIVING
 delta30d: Int!
 computedAt: String!
 modelVersion: String!
}

type Pillar {
 key: PillarKey!
 weight: Float!
 normalized: Float! # 0..1
 points: Int!
 band: Band!
 signal: JSON!
}

type Recommendation {
 id: ID!
 title: String!
 issueType: String!
 confidence: Float!
 plan: Plan!
}

type Plan {
 id: ID!
 status: PlanStatus! # PROPOSED | APPROVED | REJECTED | VETOED | EXPIRED
 optionCount: Int!
 complianceCertified: Boolean!
 expiresAt: String
}

enum Band { CRITICAL AT_RISK STABLE THRIVING }
enum Severity { LOW MEDIUM HIGH CRITICAL }
enum AlertStatus { OPEN ACKNOWLEDGED FROZEN RESOLVED }
enum PlanStatus { PROPOSED APPROVED REJECTED VETOED EXPIRED }
enum PillarKey { CASHFLOW_RESILIENCE EMERGENCY_BUFFER DEBT_HEALTH PROTECTION WEALTH_GROWTH BEHAVIORAL_HYGIENE }
scalar JSON
```

### 7.3 Example query (the whole dashboard in one call)
```graphql
query Dashboard {
 customer(id: "cust_8Kd2Rj") {
 displayName
 wellbeingScore { score band delta30d computedAt }
 pillars { key weight normalized points band }
 risks(severity: HIGH) { } # RiskSignal fields
 fraudAlerts(status: OPEN) { } # FraudAlert fields
 recommendations(limit: 3) {
 title
 confidence
 plan { id status optionCount complianceCertified }
 }
 }
}
```
Response mirrors the shape, e.g. `data.customer.wellbeingScore.score = 612`,
`band = "AT_RISK"`. Consent is enforced per field-resolver: if `plan_generation` consent is
missing, `recommendations` resolves to a GraphQL error with `extensions.code = "consent_required"`
while the rest of the payload still returns.

---

## 8. Compliance & security summary (API-level)
- **No autonomous money movement:** the entire public surface is read/propose except
 `approve` (enqueue), `reject`, and the consented `freeze` (hold request). Confirmed against
 the Master Concept non-negotiables.
- **Consent-first:** every PII route passes the consent gate; scope alone is insufficient.
- **Auditable:** every mutation calls `audit.append`; `trace_id` ties API → agent trace →
 audit → webhook.
- **PII discipline:** tokenized refs only in the public API, MCP tools, traces, and webhooks;
 no PAN/Aadhaar/account numbers, no PII in logs or prompts.
- **Data localization:** all endpoints served from the India sovereign-cloud VPC.
