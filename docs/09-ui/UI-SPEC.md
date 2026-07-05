# UI Specification, SBI Sentinel Prototype

> The high-fidelity implementation of every screen below lives in [`apps/web`](../../apps/web)
> (React 18 + TypeScript + Tailwind). This doc is the design spec that mirrors it. Preview
> images are in [`docs/screenshots`](../screenshots). Screens are deep-linkable via URL hash
> (e.g. `#planner`).

## Design language
- **Palette:** SBI navy `#0B1B3F` (shell), brand blue `#1E50E6`, teal `#17C3B2` (accent),
 amber `#FFB020` (warn), red `#FF5A5F` (risk/fraud), green `#2ED47A` (healthy/success).
- **Type:** Inter. Heavy weights (800-900) for scores and headlines; generous whitespace.
- **Components:** custom SVG `ScoreGauge`, `Sparkline`, `PillarBar` (no chart-lib dependency →
 bulletproof `npm install`), `Card`, `Chip`, `SectionTitle`, `Avatar`.
- **Motion:** subtle `fade-up` on route change, animated gauge sweep, `pulse-ring` on live status.
- **Layout:** fixed left nav (grouped Overview / Act / Trust / Staff) + sticky Customer-360 topbar.

## Screens

| # | Screen | Route | Purpose | Key elements |
|---|--------|-------|---------|--------------|
| 1 | **Dashboard** | `#dashboard` | The at-a-glance guardian view | FWS gauge (612 · At-Risk), "Sentinel is watching" risk + fraud action cards, score-trend sparkline, income/buffer/EMI KPIs, six-pillar strip |
| 2 | **Financial Health** | `#wellbeing` | Glass-box score breakdown | Large gauge, per-pillar cards (metric, your value, target, status), weighted-contribution bar chart summing to 612 |
| 3 | **Agent Timeline** | `#timeline` | Prove the agents actually reason | Vertical timeline of the 9-step intervention (Orchestrator→…→Propose), per-step agent, confidence, timestamp; ends at the human-approval pause |
| 4 | **Financial Planner** | `#planner` | ★ The golden path | Risk banner → 3 plan options (recommended highlighted) → Simulation (612→690) → Compliance certificate (5/5) → Explanation + evidence → sticky Approve bar → executed + audited success state |
| 5 | **Fraud Center** | `#fraud` | Consent-based fraud response | Risk-score dial, "why flagged" signals, Freeze / Allow decision with audited outcome, monitored-signals grid |
| 6 | **Explainability** | `#explain` | Regulatory-grade transparency | Plain-language rationale, per-agent reasoning trail, grounding evidence, attached compliance certificate, "what it will NOT do" guarantees |
| 7 | **Consent** | `#consent` | DPDP control centre | Consent ledger table (scope, purpose, status), instant grant/revoke toggles, purpose-bound / erasure-ready notes |
| 8 | **Notifications** | `#notifications` | Nudges, not spam | Prioritised alert feed (risk, fraud, protection gap, wins) |
| 9 | **Settings / Profile** | `#settings` | Profile + agent permissions | Customer profile, income KPIs, permission toggles (with the "no money moves without approval" guarantee) |
| 10 | **Admin (Bank)** | `#admin` | Staff operations console | Portfolio KPIs (bounces prevented, fraud avoided, FWS uplift, RM-escalation rate), governance queue (vetoes, drift checks, DPDP erasures) |

## Accessibility & responsiveness
- Colour is never the only signal (icons + text labels accompany status colours).
- Grid layouts collapse to single column on narrow viewports; the shell nav is fixed-width.
- All interactive controls are real `<button>`s; focus/active states via Tailwind.

## Run it
```bash
cd apps/web && npm install && npm run dev # http://localhost:5173
```
