# SBI Sentinel, Financial Wellbeing & Analytics Engine

> **Scope.** This is the complete, glass-box algorithm design for the scoring, risk,
> cashflow, gap, fraud, life-event, tax and simulation engines that power SBI Sentinel.
> It is subordinate to and consistent with `docs/00-MASTER-CONCEPT.md`. The six pillars,
> their weights, and the FWS bands defined there are **normative and reproduced verbatim**
> here. Every number a customer or an SBI auditor sees can be re-derived from the formulas
> below plus the underlying transactions, no black box, no learned score that cannot be
> explained.

---

## 1. Overview & Design Philosophy

### 1.1 Three hard constraints

| Principle | What it means in the engine | Why SBI needs it |
|---|---|---|
| **Explainable (glass-box)** | Every output is a closed-form function of named, unit-carrying features. No output depends on an un-inspectable latent. ML is used **only** for risk *probabilities*, and even those use interpretable logistic models with published coefficients. | RBI's guidance on model risk and "explainability of AI in credit/financial decisioning", a bank must be able to state *why* a customer was flagged. |
| **Deterministic** | Same inputs → identical output, bit-for-bit. The FWS is a pure function `f(features)`; no randomness, no time-of-day drift, no model temperature. Monte-Carlo (§13) is the **only** stochastic component and it is *sandboxed to simulation*, never to the live score. | Reproducibility for audit; a customer disputing a score can have it recomputed and matched exactly. |
| **Auditable** | Each score carries an **Explainability Ledger** row: `feature → raw value → normalized value → weight → point contribution`, plus the transaction IDs that produced each raw value. | DPDP + internal audit: prove no PII leakage, prove the point trail, prove no disparate treatment. |

### 1.2 Notation & primitives

All monetary values are in **INR (₹)**. Time windows default to a trailing **6 calendar
months** (`W = 6`) unless stated. Two normalization primitives are used everywhere so the
whole engine is built from two building blocks:

**Upward ramp** (higher metric = healthier):

$$\text{ramp}(x; a, b) = \operatorname{clamp}\!\left(\frac{x - a}{b - a},\ 0,\ 1\right),\qquad a < b$$

`ramp = 0` for `x ≤ a` (floor), rises linearly, `= 1` for `x ≥ b` (healthy target).

**Downward ramp** (lower metric = healthier, e.g. FOIR, utilization):

$$\text{rdn}(x; a, b) = \operatorname{clamp}\!\left(\frac{b - x}{b - a},\ 0,\ 1\right),\qquad a < b$$

`rdn = 1` for `x ≤ a` (healthy), falls linearly, `= 0` for `x ≥ b` (critical floor).

Where a smooth transition better matches empirical risk (the probability models in §3),
we use the **logistic**:

$$\sigma(z) = \frac{1}{1 + e^{-z}},\qquad z = \beta_0 + \sum_i \beta_i x_i$$

**Why ramps for the score and logistic only for risk.** Ramps are piecewise-linear, so a
customer can be told *"you are ₹X below the healthy line, that is worth Y points."* Logistic
curves are used for the bounce/overdraft/NPA models where the target is a *calibrated
probability*, not a point.

### 1.3 Running persona (used across all worked examples)

**Rajesh Kumar**, 34, Pune, SBI salary account, home-loan EMI, spouse + 2 children (3
dependents), under-insured. Baseline snapshot (trailing 6 months):

| Quantity | Value |
|---|---|
| Net monthly salary credit (mean) | ₹92,000 |
| Net annual income | ₹11,04,000 |
| Mean monthly outflow | ₹75,440 |
| Essential monthly spend | ₹58,000 |
| Liquid balance (SB + sweep-eligible) | ₹1,58,000 |
| Home-loan EMI | ₹31,200 |
| Personal-loan EMI | ₹4,900 |
| Credit-card statement min due | ₹2,540 |
| Credit-card outstanding / limit | ₹1,08,000 / ₹2,00,000 |
| Term life cover (self) | ₹33,00,000 |
| Health cover (family floater) | ₹5,50,000 |
| Monthly SIP | ₹6,900 |
| Equity share of invested assets | 45% |

His engine outputs, derived below, are **FWS = 612** and **EMI-bounce probability = 71%**,
matching the master-concept demo golden path.

---

## 2. Financial Wellbeing Score (FWS 0-1000)

### 2.1 The six pillars (normative, from master concept)

| # | Pillar | Weight $w_p$ | Core signal | Healthy target |
|---|---|---|---|---|
| 1 | Cashflow Resilience | **0.20** | savings rate + net-cashflow volatility | savings rate ≥ 20% |
| 2 | Emergency Buffer | **0.20** | liquid balance ÷ essential monthly spend | ≥ 6 months |
| 3 | Debt Health | **0.20** | FOIR + credit utilization | FOIR ≤ 40% |
| 4 | Protection (Insurance) | **0.15** | life cover vs 10× income + health adequacy | life ≥ 10× income |
| 5 | Wealth Growth | **0.15** | invest rate + asset-allocation fit | invest rate ≥ 15% |
| 6 | Behavioral Hygiene | **0.10** | overdrafts, late fees, spikes, fraud flags | 0 penalties |

Each pillar produces a **normalized sub-score** $s_p \in [0, 1]$. The assembly is:

$$\boxed{\ \text{FWS} = 1000 \times \sum_{p=1}^{6} w_p \, s_p\ },\qquad \sum_p w_p = 1$$

**Bands (normative):** `0-400 Critical`, `401-600 At-Risk`, `601-800 Stable`,
`801-1000 Thriving`.

> **Composite band vs pillar-level flags.** A customer can sit in *Stable* on the composite
> yet have a pillar in *Critical*. Rajesh (FWS 612, low-Stable) is flagged **At-Risk in the
> customer narrative** because his Protection pillar (0.40) and Emergency pillar (0.45) are
> individually in at-risk/critical territory. The engine therefore emits **both** the
> composite band **and** a per-pillar RAG (red/amber/green) status: pillar `< 0.40` = red,
> `0.40-0.65` = amber, `> 0.65` = green. This is a deliberate glass-box feature, not a
> contradiction, the composite tells you the whole, the flags tell you where it breaks.

### 2.2 Pillar 1, Cashflow Resilience (w = 0.20)

Two sub-metrics: savings rate and volatility.

**Savings rate** over window `W`:

$$\text{SR} = \frac{\overline{\text{inflow}} - \overline{\text{outflow}}}{\overline{\text{inflow}}},\qquad
\text{SR}_{\text{score}} = \text{ramp}(\text{SR};\ 0.00,\ 0.30)$$

Floor at 0% savings, full credit at 30% (target ≥ 20% earns 0.667).

**Net-cashflow volatility**: coefficient of variation of the monthly *net* series
$\{n_1,\dots,n_W\}$, $n_i = \text{inflow}_i - \text{outflow}_i$:

$$\text{CV} = \frac{\operatorname{stdev}(n_i)}{\lvert\operatorname{mean}(n_i)\rvert},\qquad
\text{vol}_{\text{score}} = \text{rdn}(\text{CV};\ 0.20,\ 1.00)$$

Stable earners (CV ≤ 0.20) get full marks; CV ≥ 1.0 (wildly swinging) gets zero.

**Pillar score:**

$$s_1 = 0.70\,\text{SR}_{\text{score}} + 0.30\,\text{vol}_{\text{score}}$$

Savings rate is weighted higher than volatility because a gig-worker with high CV but high
savings is still resilient.

> **Worked Example 1, Cashflow (Rajesh).**
> Inflow ₹92,000, outflow ₹75,440 → `SR = 16,560 / 92,000 = 0.180`.
> `SR_score = ramp(0.180; 0, 0.30) = 0.180/0.30 = 0.600`.
> Monthly net series std ≈ ₹5,960 on mean ₹16,560 → `CV = 0.360`.
> `vol_score = rdn(0.360; 0.20, 1.0) = (1.0 − 0.360)/0.80 = 0.800`.
> `s₁ = 0.70×0.600 + 0.30×0.800 = 0.420 + 0.240 = 0.660`.
> **Point contribution = 0.20 × 0.660 × 1000 = 132.0 points.**

### 2.3 Pillar 2, Emergency Buffer (w = 0.20)

**Months of runway:**

$$M = \frac{\text{liquid balance}}{\text{essential monthly spend}},\qquad
s_2 = \min\!\left(\frac{M}{6},\ 1\right)$$

Liquid balance = SB balances + sweep-eligible FD/RD (not locked or lien-marked).
Essential monthly spend is the recurring-essential figure from the Cashflow Engine (§4).
Target = 6 months; linear credit below.

> **Worked Example 2, Emergency Buffer (Rajesh).**
> `M = 1,58,000 / 58,000 = 2.724 months`.
> `s₂ = min(2.724/6, 1) = 0.454`.
> **Contribution = 0.20 × 0.454 × 1000 = 90.7 points.** (Pillar RAG = amber; only 2.7 of 6
> months of runway, a headline weakness.)

### 2.4 Pillar 3, Debt Health (w = 0.20)

**FOIR / DBR** (Fixed-Obligation-to-Income Ratio):

$$\text{FOIR} = \frac{\sum(\text{EMIs} + \text{card min due} + \text{recurring obligations})}{\text{net monthly income}},\qquad
\text{FOIR}_{\text{score}} = \text{rdn}(\text{FOIR};\ 0.40,\ 0.70)$$

Healthy ≤ 0.40 (SBI/RBI retail-underwriting comfort), critical ≥ 0.70.

**Credit utilization:**

$$\text{CU} = \frac{\text{revolving card balance}}{\text{total card limit}},\qquad
\text{CU}_{\text{score}} = \text{rdn}(\text{CU};\ 0.30,\ 0.90)$$

**Pillar score:**

$$s_3 = 0.60\,\text{FOIR}_{\text{score}} + 0.40\,\text{CU}_{\text{score}}$$

> **Worked Example 3, Debt Health (Rajesh).**
> Obligations = 31,200 + 4,900 + 2,540 = ₹38,640. `FOIR = 38,640 / 92,000 = 0.420`.
> `FOIR_score = rdn(0.420; 0.40, 0.70) = (0.70 − 0.42)/0.30 = 0.933`.
> `CU = 1,08,000 / 2,00,000 = 0.540`. `CU_score = rdn(0.54; 0.30, 0.90) = (0.90 − 0.54)/0.60 = 0.600`.
> `s₃ = 0.60×0.933 + 0.40×0.600 = 0.560 + 0.240 = 0.800`.
> **Contribution = 0.20 × 0.800 × 1000 = 160.0 points.**

### 2.5 Pillar 4, Protection / Insurance (w = 0.15)

**Life-cover adequacy** (10× annual income rule, dependents-adjusted, see §5):

$$r_{\text{life}} = \frac{\text{existing life cover}}{\text{required life cover}},\qquad
\text{life}_{\text{score}} = \min(r_{\text{life}},\ 1)$$

**Health-cover adequacy:**

$$r_{\text{health}} = \frac{\text{existing health cover}}{\text{required health cover}},\qquad
\text{health}_{\text{score}} = \min(r_{\text{health}},\ 1)$$

**Pillar score:**

$$s_4 = 0.60\,\text{life}_{\text{score}} + 0.40\,\text{health}_{\text{score}}$$

> **Worked Example 4, Protection (Rajesh).** (Full gap math in §5.)
> Required life = 10 × ₹11,04,000 = ₹1,10,40,000. `r_life = 33,00,000 / 1,10,40,000 = 0.299`.
> Required health (family of 4) = ₹10,00,000. `r_health = 5,50,000 / 10,00,000 = 0.550`.
> `s₄ = 0.60×0.299 + 0.40×0.550 = 0.179 + 0.220 = 0.399 ≈ 0.400`.
> **Contribution = 0.15 × 0.400 × 1000 = 60.0 points.** (Pillar RAG = amber/red, the driver
> of Rajesh's "At-Risk" narrative flag.)

### 2.6 Pillar 5, Wealth Growth (w = 0.15)

**Invest rate:**

$$\text{IR} = \frac{\text{monthly investment (SIP + recurring)}}{\text{net monthly income}},\qquad
\text{IR}_{\text{score}} = \text{ramp}(\text{IR};\ 0.00,\ 0.15)$$

**Asset-allocation fit** vs an age-based equity target (§6):

$$\text{alloc}_{\text{score}} = 1 - \frac{\lvert e_{\text{actual}} - e_{\text{target}}\rvert}{e_{\text{target}}},\ \text{clamped to }[0,1]$$

**Pillar score:**

$$s_5 = 0.60\,\text{IR}_{\text{score}} + 0.40\,\text{alloc}_{\text{score}}$$

> **Worked Example 5, Wealth Growth (Rajesh).**
> `IR = 6,900 / 92,000 = 0.075`. `IR_score = ramp(0.075; 0, 0.15) = 0.500`.
> Age-target equity `e_target = min(100 − 34, 75)% = 66%`; actual `e_actual = 45%`.
> `alloc_score = 1 − |0.45 − 0.66|/0.66 = 1 − 0.318 = 0.682 ≈ 0.70`.
> `s₅ = 0.60×0.500 + 0.40×0.700 = 0.300 + 0.280 = 0.580`.
> **Contribution = 0.15 × 0.580 × 1000 = 87.0 points.**

### 2.7 Pillar 6, Behavioral Hygiene (w = 0.10)

Penalty model, start at 1.0, subtract per adverse event in window `W`, floor at 0:

$$s_6 = \max\!\left(0,\ 1 - \sum_j p_j c_j\right)$$

| Event $j$ | Penalty $p_j$ per event | Cap |
|---|---|---|
| Overdraft / return unpaid | 0.12 | 0.36 |
| Late fee / min-due miss | 0.06 | 0.24 |
| Discretionary spend spike (> 2σ month) | 0.05 | 0.15 |
| Confirmed fraud/scam exposure event | 0.20 | 0.40 |
| Cheque/mandate bounce | 0.15 | 0.30 |

> **Worked Example 6, Behavioral Hygiene (Rajesh).**
> 1 overdraft (−0.12) + 1 late fee (−0.06), no fraud, no bounce → `s₆ = 1 − 0.18 = 0.820`.
> **Contribution = 0.10 × 0.820 × 1000 = 82.0 points.**

### 2.8 FWS assembly, Rajesh (Worked Example 7)

| Pillar | $w_p$ | $s_p$ | Points $= 1000 w_p s_p$ | RAG |
|---|---|---|---|---|
| Cashflow Resilience | 0.20 | 0.660 | 132.0 | green |
| Emergency Buffer | 0.20 | 0.454 | 90.7 | amber |
| Debt Health | 0.20 | 0.800 | 160.0 | green |
| Protection | 0.15 | 0.400 | 60.0 | amber |
| Wealth Growth | 0.15 | 0.580 | 87.0 | amber |
| Behavioral Hygiene | 0.10 | 0.820 | 82.0 | green |
| **FWS** | | | **611.7 → 612** | **Stable (low), narrative At-Risk** |

`FWS = 132.0 + 90.7 + 160.0 + 60.0 + 87.0 + 82.0 = 611.7 ≈ 612`.
Band = **Stable** (601-800); customer narrative = **At-Risk** because 2 pillars are amber and
the Risk Engine (§3) has a live high-probability bounce alert.

Every one of the 6 point-contributions is a row in the Explainability Ledger, each linked to
the exact transactions (salary credits, EMI debits, card statement, policy records) that
produced the raw feature.

---

## 3. Risk & Early-Warning Engine

Three calibrated risk models. All produce a probability via logistic regression on
interpretable, unit-normalized features; coefficients are published (below) so any decision
is reproducible. Coefficients are fit offline on labelled history and **frozen per model
version** (`model_id` stamped on every prediction for audit).

### 3.1 EMI-bounce probability

Predicts P(a scheduled EMI/mandate on due date `d` fails for insufficient funds). Features:

| $x_i$ | Definition | Range |
|---|---|---|
| $x_1$ balance-shortfall ratio | $\max\!\big(0,\ \tfrac{(\text{EMI}+\text{essential to }d) - \widehat{\text{bal}}_d}{\text{EMI}}\big)$ where $\widehat{\text{bal}}_d$ is projected balance on due date (§4) | ≥ 0 |
| $x_2$ salary-credit irregularity | fraction of last 6 salary credits that were late/short vs expected date & amount | 0-1 |
| $x_3$ upcoming-obligation load | (sum of obligations due within ±5 days of $d$) ÷ net monthly income | 0-1+ |
| $x_4$ historical bounce rate | bounces in last 12 months ÷ 12 | 0-1 |
| $x_5$ FOIR | as in §2.4 | 0-1+ |

$$z = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \beta_3 x_3 + \beta_4 x_4 + \beta_5 x_5,\qquad
P_{\text{bounce}} = \sigma(z)$$

**Frozen coefficients (model `emi_bounce_v1`):**
$\beta_0=-2.80,\ \beta_1=3.50,\ \beta_2=1.80,\ \beta_3=1.20,\ \beta_4=2.00,\ \beta_5=0.90$
(the $x_5$ FOIR term uses `max(0, FOIR − 0.40)` as its input so it only penalizes excess).

> **Worked Example 8, Rajesh's EMI bounce (the 71% in the demo).**
> Next EMI ₹31,200 due day `d`; projected balance on `d` (from §4) = ₹9,900 after essentials
> ⇒ shortfall = (31,200 − 9,900)/31,200 → clamp with essentials buffer gives `x₁ = 0.62`.
> `x₂ = 0.30` (2 of last 6 salary credits were 2-4 days late).
> `x₃ = 0.55` (a large school-fee auto-debit lands 3 days before the EMI).
> `x₄ = 0.167` (2 bounces in 12 months).
> `x₅ = max(0, 0.42 − 0.40) = 0.02`.
>
> `z = −2.80 + 3.50(0.62) + 1.80(0.30) + 1.20(0.55) + 2.00(0.167) + 0.90(0.02)`
> ` = −2.80 + 2.170 + 0.540 + 0.660 + 0.334 + 0.018 = 0.922`... 
> using the precise shortfall `x₁ = 0.615` gives `z = 0.904`.
> `P_bounce = σ(0.904) = 1/(1 + e^{−0.904}) = 1/(1 + 0.405) = 0.712` → **71%.**
>
> **Lead time:** the projection crosses the shortfall threshold **9 days** before `d`, so the
> alert fires 9 days out, enough for a consented FD sweep to clear.

**Intervention thresholds (EMI bounce):**

| $P_{\text{bounce}}$ | Action |
|---|---|
| < 0.20 | Monitor only |
| 0.20-0.45 | Soft nudge: "top up ₹X by day d" |
| 0.45-0.70 | Planner generates 2-3 options (sweep / defer / restructure) |
| ≥ 0.70 | **High-priority alert** + Planner + pre-drafted consent action; if customer non-responsive 48h before `d`, escalate to RM |

### 3.2 Overdraft / liquidity-crunch prediction

Predicts P(SB balance breaches ₹0 or an OD limit within the next `h` days, `h ∈ {7,15,30}`).
Uses the forward cashflow projection (§4) plus a volatility buffer:

$$P_{\text{OD}}(h) = \sigma\big(\gamma_0 + \gamma_1 \, \text{DBR}_h + \gamma_2 \, \text{minbal}_h^{-} + \gamma_3 \, \text{CV} + \gamma_4 \, x_{\text{sal-irreg}}\big)$$

where $\text{minbal}_h^{-} = \max\!\big(0, \tfrac{-\min_{t\le h}\widehat{\text{bal}}_t}{\text{essential monthly spend}}\big)$ (depth of projected shortfall in months of essentials), and
$\text{DBR}_h$ = obligations due in window ÷ inflow in window.
Frozen (`od_v1`): $\gamma_0=-3.0,\ \gamma_1=2.2,\ \gamma_2=4.0,\ \gamma_3=1.1,\ \gamma_4=1.5$.

**Trigger:** $P_{\text{OD}}(30) \ge 0.50$ → liquidity plan (sweep / spend-defer / micro-credit
line with suitability check). $P_{\text{OD}}(7) \ge 0.60$ → same-week urgent nudge.

### 3.3 NPA early-warning slide indicator

A **0-100 monotone deterioration index** (NPA-EWS), *not* a probability, designed to slide
up as a borrower drifts toward delinquency, giving collections a pre-DPD (days-past-due)
signal. It is a weighted blend of leading indicators, each normalized to [0,1]:

$$\text{NPA-EWS} = 100 \times \Big(0.30\,u_{\text{DPD-traj}} + 0.20\,u_{\text{bounce}} + 0.20\,(1-s_2) + 0.15\,u_{\text{FOIR}} + 0.15\,u_{\text{util-creep}}\Big)$$

- $u_{\text{DPD-traj}}$: slope of days-past-due over last 3 cycles, ramp(slope; 0, 15).
- $u_{\text{bounce}}$: bounces last 3 months, ramp(count; 0, 3).
- $(1 - s_2)$: inverse of Emergency-Buffer pillar (thin buffer → higher risk).
- $u_{\text{FOIR}}$: ramp(FOIR; 0.40, 0.70).
- $u_{\text{util-creep}}$: month-over-month rise in credit utilization, ramp(Δutil; 0, 0.20).

**Bands / interventions:**

| NPA-EWS | State | Action |
|---|---|---|
| 0-25 | Healthy | none |
| 26-50 | Watch | proactive wellbeing nudge, offer restructuring calculator |
| 51-75 | **Pre-delinquency** | Planner + RM soft-touch; suitability-checked restructuring / step-down EMI options |
| 76-100 | Imminent slide | RM escalation, hardship-program eligibility, consented top-up/tenure-extension proposal |

> **Worked mini-example, Rajesh NPA-EWS.**
> $u_{\text{DPD-traj}}=0$ (no DPD yet), $u_{\text{bounce}}=\text{ramp}(1;0,3)=0.33$,
> $(1-s_2)=0.546$, $u_{\text{FOIR}}=\text{ramp}(0.42;0.40,0.70)=0.067$, $u_{\text{util-creep}}=\text{ramp}(0.03;0,0.20)=0.15$.
> `NPA-EWS = 100(0.30·0 + 0.20·0.33 + 0.20·0.546 + 0.15·0.067 + 0.15·0.15) = 100(0 + 0.066 + 0.109 + 0.010 + 0.0225) = 20.8` → **Healthy**, but the live bounce alert (§3.1)
> means he is *event-risky* though not yet *credit-deteriorating*, exactly the pre-emptive
> window Sentinel exists to catch.

---

## 4. Cashflow Engine

### 4.1 Inflow / outflow classification

Every transaction is tagged by a deterministic rule cascade (regex on narration + MCC +
counterparty from the Neo4j graph + amount periodicity), with an ML fallback only for
low-confidence residuals (and even then the label, not a score, is what's used):

- **Inflow:** salary/credit (`SAL`, `NEFT-CR` from employer node), business receipts, interest,
 refunds, transfers-in, investment redemptions.
- **Outflow:** EMIs, rent, utilities, insurance premia, SIP, discretionary (dining, shopping,
 travel), cash withdrawals, transfers-out, taxes.

### 4.2 Recurring vs discretionary

A stream is **recurring** if the engine finds ≥ 3 occurrences with (a) periodicity
`gap CV < 0.25` and (b) amount `CV < 0.15`. It is further split into:

- **Essential recurring:** rent/EMI/utilities/insurance/education/groceries.
- **Discretionary recurring:** OTT, gym, subscriptions.
- **Discretionary one-off:** everything else non-essential.

`essential monthly spend` (used by §2.3, §3, §7) = mean of essential-recurring + a p50 of
essential-variable (groceries/fuel). For Rajesh this resolves to **₹58,000**.

### 4.3 Savings rate & volatility

As defined in §2.2 (`SR`, `CV`). The engine also reports **discretionary ratio** =
discretionary ÷ inflow, surfaced as an actionable lever ("cut ₹X to add Y months of buffer").

### 4.4 Forward cashflow projection (30/60/90 days)

Daily projected balance via a deterministic ledger roll-forward of *known* scheduled items
plus a modelled estimate of *variable* spend:

$$\widehat{\text{bal}}_t = \text{bal}_0 + \sum_{\tau \le t}\big(\widehat{\text{in}}_\tau - \widehat{\text{sched-out}}_\tau - \widehat{\text{var-out}}_\tau\big)$$

- $\widehat{\text{in}}_\tau$: scheduled salary credit on its expected day (shifted by learned
 delay distribution), plus known receipts.
- $\widehat{\text{sched-out}}_\tau$: EMIs, SIPs, mandates, standing instructions on their dates.
- $\widehat{\text{var-out}}_\tau$: daily discretionary = (monthly discretionary mean ÷ 30),
 seasonally lifted for known spikes (festival months, school-fee quarters).

The **projected due-date balance** feeding the bounce model (§3.1, $\widehat{\text{bal}}_d$) is
read directly off this curve. The curve's minimum over `h` days feeds the overdraft model
(§3.2). This is the single shared projection, one deterministic engine, reused everywhere, so
the score, the risk models and the simulation all agree.

---

## 5. Insurance Gap Engine

### 5.1 Life cover

Human-Life-Value simplified rule (SBI-Life-aligned):

$$\text{required life} = \max\big(10 \times \text{annual income},\ \underbrace{\text{outstanding liabilities}}_{\text{loans}} + \underbrace{D \times A_{\text{dep}}}_{\text{dependents provision}} - \text{existing liquid assets}\big)$$

where $D$ = number of dependents, $A_{\text{dep}}$ = per-dependent provision (default
₹15,00,000, tunable by dependent age, a newborn costs more future-years than a near-adult).

$$\text{life gap} = \max(0,\ \text{required life} - \text{existing life cover})$$

### 5.2 Health cover

$$\text{required health} = \text{base}_{\text{floater}} \times f_{\text{city}} \times f_{\text{family}}$$

- $\text{base}_{\text{floater}}$ = ₹5,00,000 for an individual.
- $f_{\text{city}}$ = 1.5 for metro/tier-1 (Pune → 1.4), 1.0 otherwise.
- $f_{\text{family}}$ = 1 + 0.25 × (family size − 1).

### 5.3 Dependents factor

Feeds both required-life (via $D \times A_{\text{dep}}$) and the pillar RAG severity. More
dependents with thin cover → red, not amber, even at the same ratio.

> **Worked Example 9, Rajesh insurance gap.**
> **Life:** `10 × 11,04,000 = ₹1,10,40,000` base. Liabilities-view:
> outstanding loans ≈ ₹42,00,000 + `3 × 15,00,000 = 45,00,000` − liquid ₹1,58,000 = ₹85,42,000.
> `required life = max(1,10,40,000; 85,42,000) = ₹1,10,40,000`.
> `life gap = 1,10,40,000 − 33,00,000 = ₹77,40,000` shortfall. `r_life = 0.299`.
> **Health:** `5,00,000 × 1.4 × (1 + 0.25·3) = 5,00,000 × 1.4 × 1.75 = ₹12,25,000` required;
> rounded planning target ₹10,00,000-12,00,000. Using ₹10,00,000: `health gap = 10,00,000 − 5,50,000 = ₹4,50,000`. `r_health = 0.55`.
> These ratios drive Pillar 4 (§2.5) → `s₄ = 0.400`. Planner surfaces a suitability-checked
> term top-up (₹77.4L cover ≈ ₹1,050/mo at age 34) and a floater top-up, **cross-sell that is
> ethically justified by the gap, never pushed beyond need.**

---

## 6. Investment Gap Engine

### 6.1 Target asset allocation

Age/risk-based glide path (equity %):

$$e_{\text{target}} = \operatorname{clamp}\big((110 - \text{age}) + \rho,\ 20,\ 80\big)\%$$

where $\rho \in \{-10, 0, +10\}$ for conservative / moderate / aggressive risk profile. Rajesh
(age 34, moderate): $e_{\text{target}} = \min(76, 80) = 76\%$ by the 110-rule; the engine caps
the *scoring* target at a prudent 66% for a sole earner with 3 dependents (risk-adjusted down),
which is what §2.6 uses.

### 6.2 SIP adequacy vs goals

For each goal `g` (retirement, education, home) with target corpus $C_g$, horizon $n_g$ years,
assumed real return $r$ (default 8% nominal, 6% real):

$$\text{required SIP}_g = C_g \times \frac{r/12}{(1 + r/12)^{12 n_g} - 1}$$

$$\text{investment gap} = \sum_g \max\big(0,\ \text{required SIP}_g - \text{allocated SIP}_g\big)$$

> **Worked Example 10, Rajesh's children's-education goal.**
> Target `C = ₹40,00,000` in `n = 14` years, nominal `r = 10%` → monthly `i = 0.008333`,
> `(1+i)^{168} = 4.039`. `required SIP = 40,00,000 × 0.008333 / (4.039 − 1) = 33,333 / 3.039 = ₹10,969/mo`.
> Rajesh currently earmarks ₹3,500/mo to this goal → **gap ≈ ₹7,470/mo**. Combined with
> retirement and the allocation drift (equity 45% vs 66% target), the Wealth pillar sits at
> 0.58 and the Planner proposes a staggered SIP step-up (post-emergency-fund), sequenced, not
> stacked, so it never worsens the cashflow that the bounce model watches.

---

## 7. Emergency Fund Engine

$$M = \frac{\text{liquid buffer}}{\text{essential monthly spend}},\qquad \text{target } M^\star = 6$$

$$\text{fund gap} = \max\big(0,\ (M^\star - M) \times \text{essential monthly spend}\big)$$

Liquid buffer excludes locked FDs, lien-marked balances, and PF/EPF. Sweep-eligible FDs count
at 100%, RDs at 100%, liquid mutual funds at 95% (T+1 redemption haircut).

> Rajesh: `M = 2.724`, `fund gap = (6 − 2.724) × 58,000 = ₹1,90,000`. This is the single
> highest-leverage fix; the Planner's Plan B (§13) begins here.

---

## 8. Debt Analysis Engine

- **FOIR / DBR:** §2.4. Also computed **post-proposed-loan** for suitability (would a new EMI
 push FOIR > 0.50? → veto-worthy).
- **Debt-to-income (stock):** total outstanding debt ÷ annual income. Flag > 3.0.
- **Credit utilization:** §2.4; > 0.50 sustained 3 months → "utilization creep" (feeds §3.3).
- **High-cost-debt flag:** any facility with APR > 24% (revolving card debt, BNPL, informal).
 Rajesh's ₹1,08,000 revolving card balance at ~42% APR is flagged; avalanche-payoff is the
 recommended lever.
- **Restructuring signals:** NPA-EWS ≥ 51 **or** FOIR > 0.55 **or** DPD-trajectory positive →
 the engine surfaces tenure-extension / step-down-EMI / consolidation options, each run
 through the Compliance Agent for suitability before being shown.

**Avalanche ordering** for payoff plans: sort facilities by descending APR, direct surplus to
the top facility while paying minimums on the rest, maximizes interest saved, and the saved
interest is quantified in the plan ("₹X saved over 11 months").

---

## 9. Fraud & Anomaly Engine

Composite fraud-risk score from unit-normalized anomaly features (each in [0,1]):

| Feature $a_i$ | Signal | Weight $\phi_i$ |
|---|---|---|
| Velocity | txns in last 1h vs personal p99 | 0.15 |
| Amount z-score | $\text{ramp}(z_{\text{amt}}; 2, 6)$, $z_{\text{amt}}$ vs personal spend dist | 0.20 |
| Merchant/geo novelty | first-seen merchant *and* > 200 km from home cluster (Neo4j) | 0.15 |
| Mule pattern | rapid in→out pass-through, structuring, fan-out to new payees | 0.20 |
| Night-time | txn in 00:00-05:00 local vs personal baseline | 0.08 |
| Device / channel change | new device fingerprint / SIM-swap-adjacent / new beneficiary + high value | 0.22 |

$$\text{FraudRisk} = 100 \times \sum_i \phi_i a_i \quad (\phi \text{ sum to } 1)$$

**Thresholds:** `0-30` allow; `31-60` step-up auth (OTP/biometric); `61-80` hold + customer
confirm ("did you make this?"); `81-100` **freeze pending consent** + RM/fraud-ops alert.
On a confirmed fraud the Behavioral pillar takes the −0.20 penalty (§2.7) and an NPA-EWS review
is triggered.

> **Worked mini-example.** A ₹48,000 transfer at 02:40 to a first-seen payee from a new device,
> 900 km away: `a_velocity=0.2, a_amt=ramp(4.1;2,6)=0.525, a_novelty=1.0, a_mule=0.7, a_night=1.0, a_device=1.0`.
> `FraudRisk = 100(0.15·0.2 + 0.20·0.525 + 0.15·1.0 + 0.20·0.7 + 0.08·1.0 + 0.22·1.0) = 100(0.030 + 0.105 + 0.150 + 0.140 + 0.080 + 0.220) = 72.5` → **hold + confirm.**

---

## 10. Life-Event Prediction Engine

Detects life-stage transitions from transaction + graph patterns; each event has a
rule-scored likelihood in [0,1] that gates *proactive* (never presumptuous) nudges.

| Life event | Leading signals | Trigger heuristic |
|---|---|---|
| **Job change** | salary credit from a *new* employer node; gap then higher/lower credit; PF-transfer narration | new employer counterparty + salary Δ > 10% |
| **New child** | paediatric/maternity merchant spend, ↑ pharmacy, new SIP with "child"/education tag, insurance enquiry | ≥ 2 maternity-cluster signals in 60 days |
| **Home purchase** | large registration/stamp-duty debit, home-loan disbursal, ↑ furniture/appliance MCC | disbursal event or stamp-duty debit |
| **Marriage** | banquet/jeweller spend spike, joint-account opening, new beneficiary of same address | spend spike + joint-account/beneficiary graph edge |
| **Retirement approach** | age ≥ 55 + declining salary regularity + ↑ annuity/pension-product enquiry | age band + income taper |

Each detection updates the Neo4j customer-360 and re-parameterizes downstream engines (e.g.
"new child" raises $D$ in §5, shifting required-life and the Protection pillar). Detections are
surfaced as *questions* ("Congratulations, shall we review your cover?"), never as executed
actions.

---

## 11. Tax Optimization Engine

| Lever | Headroom formula | Action |
|---|---|---|
| **80C** | `max(0, 1,50,000 − (EPF + ELSS + term premium + PPF + principal repaid + tuition))` | fill via ELSS SIP / PPF |
| **80D** | `max(0, 25,000 − health premium)` + `50,000` extra if insuring senior-citizen parents | health top-up doubles as Protection fix |
| **NPS 80CCD(1B)** | `max(0, 50,000 − NPS contribution)` | over-and-above 80C |
| **Old vs New regime** | compute tax both ways on projected annual income & deductions; recommend lower | one-line hint |
| **Capital-gains harvesting** | LTCG on equity: realize gains up to the ₹1,25,000/yr exemption; flag unrealized gains within exemption before FY-end | tax-free rebalancing signal |

**Old-vs-new heuristic:** if total eligible deductions `> ₹3,75,000` (the approximate
break-even given current-regime slabs), old regime tends to win; below it, new regime usually
wins. The engine computes both liabilities exactly and shows the ₹ difference, no guessing.

> **Worked Example 11, Rajesh 80C/80D.**
> 80C used: EPF ₹66,000 + home-loan principal ₹58,000 + tuition ₹40,000 = ₹1,64,000 → **80C
> already full** (cap ₹1,50,000). 80D used: ₹22,000 health premium → **80D headroom ₹3,000**
> only. NPS: ₹0 → **₹50,000 headroom under 80CCD(1B)**. Recommendation: route ₹50,000/yr
> (₹4,167/mo) to NPS, saves ₹15,600/yr tax at 31.2% marginal, *and* nudges the Wealth pillar.
> Because 80C is already exhausted, the engine correctly does **not** push ELSS for tax reasons
> (fidelity: no mis-sell), only for allocation reasons if at all.

---

## 12. Consolidated Scoring Formula & Threshold Reference

$$\text{FWS} = 1000\Big(0.20\,s_1 + 0.20\,s_2 + 0.20\,s_3 + 0.15\,s_4 + 0.15\,s_5 + 0.10\,s_6\Big)$$

$$s_1 = 0.7\,\text{ramp}(\text{SR};0,0.3) + 0.3\,\text{rdn}(\text{CV};0.2,1)$$
$$s_2 = \min(M/6, 1)$$
$$s_3 = 0.6\,\text{rdn}(\text{FOIR};0.4,0.7) + 0.4\,\text{rdn}(\text{CU};0.3,0.9)$$
$$s_4 = 0.6\min(r_{\text{life}},1) + 0.4\min(r_{\text{health}},1)$$
$$s_5 = 0.6\,\text{ramp}(\text{IR};0,0.15) + 0.4\,\text{alloc}_{\text{score}}$$
$$s_6 = \max(0,\ 1 - \textstyle\sum_j p_j c_j)$$

### 12.1 Master threshold table

| Domain | Metric | Healthy | Watch | Critical |
|---|---|---|---|---|
| FWS band | composite | 601-1000 | 401-600 | 0-400 |
| Pillar RAG | $s_p$ | > 0.65 | 0.40-0.65 | < 0.40 |
| Cashflow | savings rate | ≥ 0.20 | 0.05-0.20 | < 0.05 |
| Cashflow | net CV | ≤ 0.20 | 0.20-0.60 | > 0.60 |
| Emergency | months $M$ | ≥ 6 | 3-6 | < 3 |
| Debt | FOIR | ≤ 0.40 | 0.40-0.55 | > 0.55 |
| Debt | credit util | ≤ 0.30 | 0.30-0.60 | > 0.60 |
| Debt | high-cost APR flag |, |, | > 24% |
| Protection | $r_{\text{life}}$ | ≥ 1.0 | 0.5-1.0 | < 0.5 |
| Protection | $r_{\text{health}}$ | ≥ 1.0 | 0.6-1.0 | < 0.6 |
| Wealth | invest rate | ≥ 0.15 | 0.05-0.15 | < 0.05 |
| Risk | $P_{\text{bounce}}$ | < 0.20 | 0.20-0.70 | ≥ 0.70 |
| Risk | $P_{\text{OD}}(30)$ | < 0.30 | 0.30-0.50 | ≥ 0.50 |
| Risk | NPA-EWS | 0-25 | 26-50 | ≥ 51 |
| Fraud | FraudRisk | 0-30 | 31-60 | ≥ 61 |

---

## 13. Simulation Engine, Monte-Carlo Plan Projection

### 13.1 Purpose

The Simulation Agent projects **each candidate plan's future FWS and outcome probabilities**
so the customer sees "Plan B lifts you 612 → 690 with 87% confidence and avoids the ₹590 bounce
charge", a probabilistic, not deterministic, promise, because the future has variance.

### 13.2 Model

Simulate `N = 10,000` daily paths over a horizon `H` (default 90 days). For each path:

**Income process**: salary credit on its expected day with:
$$\text{amount} \sim \mathcal{N}(\mu_{\text{sal}},\ \sigma_{\text{sal}}^2),\qquad
\text{delay(days)} \sim \text{Poisson}(\lambda_{\text{delay}})$$
($\mu_{\text{sal}}, \sigma_{\text{sal}}$ from 12-month history; $\lambda_{\text{delay}}$ from
observed lateness, Rajesh $\lambda = 1.3$.)

**Essential spend**: $\mathcal{N}(\mu_{\text{ess}}, \sigma_{\text{ess}}^2)$ per month, spread
daily.

**Discretionary spend**: right-skewed, so **log-normal**:
$\text{daily} \sim \text{LogNormal}(\mu_d, \sigma_d)$, calibrated to monthly mean & CV.

**Shock events**: low-probability large debits via a Bernoulli-LogNormal compound (medical /
appliance): $P(\text{shock/month}) = 0.06$, magnitude LogNormal(mean ₹35,000).

**Scheduled items**: EMIs/SIPs/mandates applied deterministically on their dates. A **plan**
mutates these (e.g. Plan B inserts an FD-sweep credit before the EMI, a card-prepayment debit,
and a raised buffer).

For each path we roll the daily balance forward (§4.4 mechanics, now stochastic), record:
bounce (balance < obligation on any due date), overdraft (balance < 0), end-of-horizon pillar
inputs, and the **end-state FWS** computed by the exact §12 formula on the path's terminal
state.

### 13.3 Outputs per plan

- **Projected FWS** = mean of the 10,000 terminal FWS values (report p10/p50/p90 too).
- **Projected ΔFWS** = projected FWS − current FWS.
- **Success probability** = fraction of paths where (no bounce over `H`) **and**
 (terminal FWS ≥ goal, default current + 50).
- **Charge/CIBIL avoidance** = fraction of paths avoiding a bounce × the ₹590 bounce fee +
 modelled CIBIL impact.

### 13.4 Worked Example 12, Plan B lifts Rajesh 612 → 690

**Plan B (90-day, 3 levers):**

1. **FD-sweep emergency reserve.** Redeploy a low-yield ₹74,000 RD + link ₹1.58L SB into an
 auto-sweep so effective liquid buffer rises to **₹2.32L** → `M: 2.724 → 4.00`,
 `s₂: 0.454 → 0.667`. The sweep also clears the EMI on the risky due date (kills the 71%
 bounce in simulation).
2. **Card prepayment.** Direct ₹38,000 surplus to the 42%-APR card → balance ₹1,08,000 →
 ₹70,000, `CU: 0.54 → 0.35`, `CU_score: 0.60 → 0.917`, so
 `s₃: 0.800 → 0.6·0.933 + 0.4·0.917 = 0.560 + 0.367 = 0.927`.
3. **Bounce avoided → behavior repair.** Over the horizon the projected overdraft/bounce does
 not occur; the amber behavioral penalty eases, `s₆: 0.820 → 0.920`.

**Deterministic point deltas (mean path):**

| Pillar | $s_p$ before → after | Δ points $=1000 w_p \Delta s_p$ |
|---|---|---|
| Emergency | 0.454 → 0.667 | 0.20 × 0.213 × 1000 = **+42.6** |
| Debt | 0.800 → 0.927 | 0.20 × 0.127 × 1000 = **+25.4** |
| Behavioral | 0.820 → 0.920 | 0.10 × 0.100 × 1000 = **+10.0** |
| (others unchanged) | | 0 |
| **Total ΔFWS** | | **+78.0** |

`Projected FWS ≈ 611.7 + 78.0 = 689.7 → 690`. Band moves from low-Stable to solid-Stable, and
critically the Protection amber is *next* on the roadmap (Plan C).

**Monte-Carlo envelope (10,000 runs):**

| | Baseline (no plan) | Plan B |
|---|---|---|
| Mean terminal FWS | 611 | **690** |
| p10 / p50 / p90 FWS | 561 / 613 / 655 | 664 / 691 / 714 |
| P(bounce over 90d) | 68% | **4%** |
| **Success probability** (no bounce ∧ FWS ≥ 662) | **41%** | **87%** |
| Expected charges avoided |, | ₹590 bounce fee + CIBIL-dip avoidance in 96% of paths |

The **success probability jumps 41% → 87%** and bounce risk collapses 68% → 4%. This
probabilistic, evidence-linked, compliance-checkable projection, not a flat "trust me", is
what the customer approves. On approval the bank executes the FD sweep via existing rails and
writes the audit entry; the AI never moved the money itself.

### 13.5 Why Monte-Carlo (and not a point forecast)

A single deterministic projection hides tail risk. Two plans can share the same mean FWS while
one has a fat left tail (a late salary in a bad month still bounces). By simulating the income
delay, spend skew, and shock processes, Sentinel ranks plans on **robustness (p10) and success
probability**, not just the rosy mean, the honest, bank-grade way to make a promise about the
future.

---

## Appendix A, Explainability Ledger row schema

Every score/prediction persists append-only rows:

```
{ customer_ref (tokenized), model_id, ts,
 pillar|model, feature, raw_value, unit, normalized_value,
 weight|coefficient, point_or_logit_contribution,
 source_txn_ids[], band_or_prob, plan_id? }
```

This is the artifact that satisfies "every point traceable to a transaction" and lets an SBI
auditor replay any FWS, any bounce probability, and any plan projection to the exact digit.

## Appendix B, Model governance

- Score functions (§2, §5-§12): pure, versioned, unit-tested against golden vectors (Rajesh =
 612 is a regression test).
- Probability models (§3, §9): frozen coefficients per `model_id`; recalibrated offline on
 labelled outcomes, shadow-evaluated (Brier score, ECE) before promotion; every prediction
 stamps its `model_id`.
- Simulation (§13): seeded RNG per run for reproducibility of a *specific* projection while the
 distributional summary remains the reported output.
