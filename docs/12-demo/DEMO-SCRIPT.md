# SBI Sentinel, 3-Minute Demo Script (Golden Path)

> **A rendered demo video is included: [`SBI-Sentinel-Demo.mp4`](SBI-Sentinel-Demo.mp4)**
> (1920×1080, 2:27, neural voice-over over the real product screens). This script below is
> the reference it was built from and a guide for a live walkthrough.
>
> SBI Hackathon @ GFF 2026 · Prototype demo video **hard-capped at 3:00**.
> Persona: **Rajesh Kumar**, 34, Pune, SBI salary account, home-loan EMI, 2 kids, under-insured.
> Golden path from `docs/00-MASTER-CONCEPT.md` §8. One take, one browser tab, no dead air.
> **Core line to land three times:** *the agents propose, the customer approves, the bank executes.*

---

## How to read this table
- **Time**: cumulative clock. Rehearse to land the last word at ~2:55, leaving a 5s hold on the closing frame.
- **On-screen action / every click**: exactly what the presenter does. Every click is scripted so the recording is repeatable.
- **Narration (word-for-word)**: say this verbatim. It is timed to the action. ~150 words/min, so ~450 words total; this script is deliberately under that so you never rush.
- **Judge-psychology note**: the point this beat scores and why. This is what separates a finalist from a demo.

---

## Segment 1, The Hook (0:00-0:15)

| Time | On-screen action / every click | Narration (word-for-word) | Judge-psychology note |
|---|---|---|---|
| 0:00-0:07 | Cold open on the **Sentinel dashboard** already loaded for Rajesh. Big **FWS gauge reads 612**, band label **"At-Risk"** in amber. Do NOT narrate a logo intro, start on the number. | "This is Rajesh. His salary hits on the 1st, his home-loan EMI leaves on the 5th. In nine days that EMI is going to **bounce**: and Rajesh has no idea." | Open on a person and a ticking clock, not a product. Judges decide in 15 seconds whether this is a toy or a business. A dated, specific threat ("nine days", "bounce") signals a real prediction, not a chatbot. |
| 0:07-0:15 | Camera holds on the gauge; a subtle **amber pulse** on the FWS ring. Presenter mouse rests, no click yet. | "Most banks would find out *after* the bounce, a ₹590 charge and a CIBIL hit. Sentinel finds out **before**. Let me show you the loop." | Frame the entire category: reactive banking vs. preventive banking. "Before vs. after" is the thesis of the whole product in one sentence. |

---

## Segment 2, Glass-box Score + Detection (0:15-0:50)

| Time | On-screen action / every click | Narration (word-for-word) | Judge-psychology note |
|---|---|---|---|
| 0:15-0:27 | **Click the FWS gauge** → the **6-pillar breakdown** slides in (Cashflow, Emergency Buffer, Debt Health, Protection, Wealth, Behavioural Hygiene). Hover **Emergency Buffer**: tooltip shows *"1.2 months of essential spend, target 6."* | "The score isn't a black box. It's six pillars, and **every point traces to a real transaction**. Rajesh's weak spot is his emergency buffer, barely one month of cover." | This is the RBI-explainability moat. Judges from a regulated bank are terrified of black-box AI; showing a *traceable* score defuses their #1 objection immediately. |
| 0:27-0:40 | An **amber toast** appears top-right: **"Risk & Early-Warning Agent"**. **Click it.** Panel opens: *"EMI bounce predicted, 71% probability, in 9 days."* Small waterfall shows **salary credit pattern vs. upcoming large debit**. | "Here's the Risk agent. It cross-read his salary-credit rhythm against an upcoming large debit and flagged it: **71% chance the EMI bounces, nine days out.** With the evidence." | Named agent + probability + horizon + evidence = a prediction, not a guess. The 71% (not 100%) reads as an honest model. This is the "predict" beat of the loop. |
| 0:40-0:50 | Sentinel auto-advances: a thin progress rail lights up **Detect → Plan**. | "So the supervisor wakes the **Planner**. And notice, Sentinel doesn't *do* anything yet. It's building options." | Plant the human-in-the-loop seed early: the AI is restraining itself. Sets up the trust payoff. |

---

## Segment 3, Plan, Simulate, Prove Compliance (0:50-1:55)

| Time | On-screen action / every click | Narration (word-for-word) | Judge-psychology note |
|---|---|---|---|
| 0:50-1:05 | **Planner panel** shows **3 cards side-by-side**: **A** Defer via partial prepay · **B** One-time sweep from FD · **C** Shift SIP debit date. Each card shows cost, effort, reversibility. | "Three options, not one. **A**: restructure a prepayment. **B**: a one-time sweep from his fixed deposit. **C**: move his SIP date. A real advisor gives choices, so Sentinel gives choices." | "Options, not one answer" signals judgment and respect for customer agency, and dodges the mis-selling trap of a single pushed product. |
| 1:05-1:25 | **Click Plan B.** The **Simulation Agent** runs, a short Monte-Carlo animation, then the **FWS gauge animates 612 → 690** and a callout reads **"Avoids ₹590 bounce charge + CIBIL impact."** | "Tap a plan and the Simulation agent projects it forward. Plan B lifts his Wellbeing Score from **612 to 690**, avoids the ₹590 charge, and protects his credit score. That's the *future*, quantified, before he commits." | Simulation = "we model the outcome, not just assert it." The moving number is the single most memorable visual, judges remember 612→690. Ties advice to a rupee value and a CIBIL point. |
| 1:25-1:50 | **Compliance & Guardrail Agent** panel opens automatically. A **green "Compliance Certificate"** stamps in: checks listed, *RBI suitability ✓ · DPDP consent ✓ · No mis-sell ✓ · Reversible ✓*. **Click "View rules fired"**: shows the deterministic rules (e.g. `FD-sweep within own-funds`, `no new credit product sold`). | "Now the part a bank actually cares about. Before Rajesh sees anything, the **Compliance agent** runs a *deterministic* rule engine, RBI, DPDP, suitability, mis-selling. It **certifies** Plan B. And it can **veto**. Any LLM can suggest; Sentinel **proves the suggestion is safe.**" | THE moat beat. Deterministic (not LLM) compliance + a certificate + veto power is what makes this deployable in SBI rather than a hackathon slide. Say the word "deterministic" clearly, it's the credibility keyword. |
| 1:50-1:55 | Certificate holds on screen; presenter hovers the **VETO** toggle to imply it's real, does not click. | "If it fails, the plan never reaches the customer, it escalates to a human RM." | Shows the guardrail has teeth. Reassures that the failure path is designed, not an afterthought. |

---

## Segment 4, Explain, Approve, Execute, Audit (1:55-2:35)

| Time | On-screen action / every click | Narration (word-for-word) | Judge-psychology note |
|---|---|---|---|
| 1:55-2:08 | **Explainability panel** opens: plain-language paragraph *"We suggest sweeping ₹18,000 from your FD on the 4th so your EMI clears on the 5th…"* with **two evidence transactions** linked (salary credit, EMI mandate). | "Then it **explains itself**: plain language, plus the exact transactions as evidence. No jargon, no black box. Rajesh sees *why*." | Closes the explainability loop for the *customer* (vs. the regulator earlier). Trust is built on both audiences. |
| 2:08-2:22 | The big **"Approve"** button. Presenter pauses deliberately, then **clicks Approve**. A confirmation ripple; status changes **Proposed → Approved**. | "And here's the whole philosophy in one button. The AI has done everything, except **decide**. **Rajesh approves.**" *(click)* | The emotional peak. The pause before the click dramatizes consent. This is the "agent proposes / customer approves" made physical. |
| 2:22-2:35 | Status animates **Approved → Executing → Done**. A line reads **"Bank executed FD sweep via core-banking rail."** Then an **Audit ledger row** writes itself: timestamp, plan hash, certificate ID, consent artifact. | "*Now* the bank executes, the FD sweep runs on existing SBI rails, and every step writes to an **immutable audit ledger**: what was proposed, who approved, which rules passed. Fully reversible, fully accountable." | "Bank executes, not the AI" + audit ledger = the deployability story. Judges now see an auditable, regulator-ready system, not a demo. |

---

## Segment 5, Fraud Cameo + Close (2:35-3:00)

| Time | On-screen action / every click | Narration (word-for-word) | Judge-psychology note |
|---|---|---|---|
| 2:35-2:47 | A **red toast** slides in: **"Fraud & Anomaly Agent, unusual ₹49,999 transfer to a new payee."** It shows a **"Freeze on your approval?"** prompt (does not auto-freeze). Presenter does **not** click, lets it sit. | "And it never sleeps. Same instant, the **Fraud agent** catches a ₹49,999 transfer to a brand-new payee, and asks Rajesh before freezing. Same rule: **it proposes, he approves.**" | Shows breadth (a second agent, a second SBI metric, fraud loss) in 12 seconds without derailing the main story. Reinforces the consent principle applies *everywhere*, even to fraud. |
| 2:47-3:00 | Cut to a **clean closing frame**: FWS **690 · Stable-track**, and a one-line strip: **"NPA ↓ · Fraud loss ↓ · CASA & engagement ↑ · Audit-ready."** Logo bottom-right. Hold. | "One customer, one loop, minutes of work, a bounce avoided, a fraud caught, a family better protected. Multiply that across 50 crore customers and it moves SBI's real numbers: **fewer NPAs, less fraud, deeper engagement, and every rupee decision is audit-ready.** The agents propose. The customer approves. The bank executes. **That's SBI Sentinel.**" | Zoom out from one persona to portfolio-scale P&L, the "why SBI funds this" beat. End on the trust line verbatim so it's the last thing in the judge's ear. Business value + trust, together. |

---

## 🎯 Coaching box, what to emphasize / what to avoid

**Emphasize (these win points):**
- Say **"deterministic compliance"**, **"certificate / veto"**, **"immutable audit"**, and **"the agents propose, the customer approves, the bank executes"**: these are the phrases that separate a deployable bank system from a chatbot demo.
- Keep the **FWS 612 → 690** movement on screen long enough to register (~2s). It's your most memorable visual.
- Speak to **two audiences**: the customer (explainability panel) *and* the regulator/bank (compliance certificate + audit). Judges are the bank.
- Every number is specific: 71%, 9 days, ₹590, ₹18,000, 612→690. Specificity reads as "real system."

**Avoid (these lose points):**
- **No logo intro, no team montage, no "our inspiration" preamble.** You have 180 seconds; open on the number.
- **Don't let the AI move money.** If any narration implies the agent acted before Approve, you've killed the entire thesis. Watch this in every take.
- **Don't read the UI aloud** ("here I click the blue button"). Narrate meaning, let the clicks show themselves.
- **Don't over-explain the 8 agents.** Show 4 in action (Risk, Planner, Compliance, Explainability) + Fraud cameo. Naming all eight burns time and confuses.
- **No jargon dumps** (Monte-Carlo, LangGraph, Temporal) in the *spoken* track, those belong in the deck. Say "projects it forward," not "runs a Monte-Carlo over the durable Temporal workflow."
- Don't exceed 3:00. If a portal auto-truncates at 3:00, your close gets cut, land the trust line by **2:55**.

---

## 🛟 Fallback plan, if the live demo fails

**Golden rule: never demo live off a hope.** Record first, present the recording.

1. **Primary: pre-recorded screen capture (MP4).** Record the full golden path in one clean take at 1080p using OBS / the browser's built-in recorder, with a rehearsed voice-over laid on top (or narrate live *over* the muted clip, safest of all). This is the submission artifact and the fallback simultaneously. Keep it in `docs/12-demo/` and mirror to the video link.
2. **Seeded, offline demo build.** The demo must run against **`db/seed/rajesh_kumar.sql`** (deterministic fixture) with the LLM calls **cached/stubbed** (`ai/eval/fixtures/`) so the run is byte-for-byte identical every time and needs **no network**. Set `DEMO_MODE=true` to force cached agent responses. A live model call mid-demo is the #1 failure risk, eliminate it.
3. **If screen-share/video breaks entirely:** fall back to the **deck's golden-path storyboard slides** (`docs/10-deck/`), the same 7 frames as static screenshots, and narrate the same script over them. The deck screenshots are captured from the real prototype so the story is unbroken.
4. **Local backup + cloud backup.** Keep the MP4 on the presenting laptop **and** on a phone **and** on Drive/YouTube (unlisted). Test playback on the venue setup before the slot.
5. **Timing safety:** rehearse to **2:50**. A 10s buffer absorbs a slow animation or a fumbled click without blowing the 3:00 cap.

---

## Shot list / recording checklist (for the editor)
- [ ] One browser tab, 1920×1080, cursor visible, zoom set so text is legible on a projector.
- [ ] `DEMO_MODE=true`, seeded DB loaded, agent responses cached, do a full dry run first.
- [ ] FWS gauge starts at exactly **612 / At-Risk (amber)**.
- [ ] 612→690 animation tuned to ~2s.
- [ ] Compliance certificate stamps green with the 4 checks + "View rules fired".
- [ ] Approve → Executing → Done + audit row writes visibly.
- [ ] Fraud red toast appears at ~2:35 and does **not** auto-act.
- [ ] Closing frame shows 690 + the business-value strip + trust line.
- [ ] Total runtime ≤ 3:00; final word by 2:55.
- [ ] Captions/subtitles burned in (some judges watch muted).
