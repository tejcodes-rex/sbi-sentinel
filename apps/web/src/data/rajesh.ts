// Synthetic customer dataset for the SBI Sentinel prototype.
// Fully offline so the live demo never depends on a network.
// Persona + golden path match docs/00-MASTER-CONCEPT.md.

export type Band = "Critical" | "At-Risk" | "Stable" | "Thriving";

export interface Pillar {
 key: string;
 name: string;
 weight: number; // 0..1
 score: number; // normalized 0..1 (pillar health)
 target: string;
 actual: string;
 status: "good" | "warn" | "bad";
 note: string;
}

export interface Txn {
 id: string;
 date: string;
 desc: string;
 category: string;
 amount: number; // +credit / -debit
 balance: number;
 flagged?: boolean;
}

export interface PlanOption {
 id: string;
 title: string;
 summary: string;
 steps: string[];
 fwsAfter: number;
 moneySaved: number;
 effort: "Low" | "Medium";
 successProb: number; // 0..1
 recommended?: boolean;
 tradeoff: string;
 action: string; // the reversible action the bank would execute
}

export interface AgentEvent {
 id: string;
 agent: string;
 color: string;
 icon: string;
 time: string;
 title: string;
 detail: string;
 confidence?: number;
 kind: "detect" | "plan" | "simulate" | "compliance" | "explain" | "propose" | "execute" | "audit";
}

export const customer = {
 name: "Rajesh Kumar",
 initials: "RK",
 age: 34,
 city: "Pune, MH",
 segment: "Salaried · Home-loan · 2 dependents",
 relationship: "SBI since 2016 · YONO active",
 maskedAcct: "XXXX XXXX 4821",
 monthlyIncome: 92000,
 monthlyEssential: 61000,
 liquid: 118000,
 emi: 38400,
};

export const fws = {
 score: 612,
 band: "At-Risk" as Band,
 delta: -18, // vs last month
 projected: 690, // after recommended plan
};

export const pillars: Pillar[] = [
 {
 key: "cashflow",
 name: "Cashflow Resilience",
 weight: 0.2,
 score: 0.64,
 target: "Savings rate ≥ 20%",
 actual: "Savings rate 12%",
 status: "warn",
 note: "Discretionary spend rose 18% over 3 months; salary credit is regular.",
 },
 {
 key: "buffer",
 name: "Emergency Buffer",
 weight: 0.2,
 score: 0.48,
 target: "≥ 6 months of essentials",
 actual: "1.9 months (₹1.18L)",
 status: "warn",
 note: "Liquid balance covers under 2 months of essential spend.",
 },
 {
 key: "debt",
 name: "Debt Health (FOIR)",
 weight: 0.2,
 score: 0.55,
 target: "FOIR ≤ 40%",
 actual: "FOIR 52%",
 status: "warn",
 note: "Home-loan EMI + card obligations are above the healthy income share.",
 },
 {
 key: "protection",
 name: "Protection / Insurance",
 weight: 0.15,
 score: 0.35,
 target: "Life cover ≥ 10× income",
 actual: "Life cover 3.2× income",
 status: "bad",
 note: "Family is materially under-insured given 2 dependents.",
 },
 {
 key: "wealth",
 name: "Wealth Growth",
 weight: 0.15,
 score: 0.58,
 target: "Invest rate ≥ 15%",
 actual: "Invest rate 9% · 1 SIP",
 status: "warn",
 note: "One equity SIP; asset mix skews to idle savings.",
 },
 {
 key: "behavior",
 name: "Behavioral Hygiene",
 weight: 0.1,
 score: 0.78,
 target: "0 penalties",
 actual: "1 late fee (90d)",
 status: "good",
 note: "Mostly clean; one late credit-card payment last quarter.",
 },
];

// The predicted risk that opens the golden path.
export const risk = {
 id: "RSK-EMI-0501",
 type: "EMI bounce",
 probability: 0.71,
 daysOut: 9,
 dueDate: "05 next month",
 amount: 38400,
 charge: 590,
 cibilImpact: "−22 to −40 pts",
 why: [
 "Salary credit lands 26th-28th; home-loan EMI auto-debits on the 5th.",
 "A large upcoming card bill (₹27,900) is scheduled for the 3rd.",
 "Projected balance on the 5th falls ₹9,400 short of the EMI.",
 ],
};

export const evidenceTxns: Txn[] = [
 { id: "T1", date: "01", desc: "Salary, Acme Systems Pvt Ltd", category: "Income", amount: 92000, balance: 121400 },
 { id: "T2", date: "02", desc: "SIP, SBI Bluechip Fund", category: "Investment", amount: -5000, balance: 116400 },
 { id: "T3", date: "03", desc: "Credit card bill, SBI Card", category: "Debt", amount: -27900, balance: 88500 },
 { id: "T4", date: "04", desc: "Groceries + fuel + utilities", category: "Essential", amount: -19100, balance: 69400 },
 { id: "T5", date: "04", desc: "School fees, term instalment", category: "Essential", amount: -40400, balance: 29000 },
 { id: "T6", date: "05", desc: "Home-loan EMI (scheduled)", category: "Debt", amount: -38400, balance: -9400, flagged: true },
];

export const plans: PlanOption[] = [
 {
 id: "PLAN-A",
 title: "Defer this month's ₹5,000 SIP",
 summary: "Skip one SIP instalment to free liquidity for the EMI.",
 steps: ["Pause SBI Bluechip SIP for 1 cycle", "Resume automatically next month"],
 fwsAfter: 648,
 moneySaved: 590,
 effort: "Low",
 successProb: 0.74,
 tradeoff: "Loses one month of compounding; only partially closes the ₹9,400 gap.",
 action: "Pause 1 SIP instalment (auto-resume)",
 },
 {
 id: "PLAN-B",
 title: "6-day sweep from your Fixed Deposit",
 summary: "Move ₹12,000 from your idle FD for 6 days, repay after salary credit.",
 steps: [
 "Sweep ₹12,000 from FD #FD-2290 on the 4th",
 "EMI clears on the 5th, no bounce, no CIBIL hit",
 "Auto-repay FD on the 28th after salary credit",
 ],
 fwsAfter: 690,
 moneySaved: 590,
 effort: "Low",
 successProb: 0.93,
 recommended: true,
 tradeoff: "Negligible: ~₹18 of FD interest foregone for 6 days.",
 action: "6-day FD sweep of ₹12,000 (auto-reversing)",
 },
 {
 id: "PLAN-C",
 title: "Shift EMI auto-debit date to the 28th",
 summary: "Align the EMI with your salary credit for good.",
 steps: ["Request EMI date change to 28th", "Bank confirms with lender in 1 cycle"],
 fwsAfter: 672,
 moneySaved: 590,
 effort: "Medium",
 successProb: 0.81,
 tradeoff: "Structural fix but takes one cycle to take effect; won't help THIS month.",
 action: "EMI date-change request to lender",
 },
];

export const compliance = {
 plan: "PLAN-B",
 certificate: "CC-2026-0714-B",
 status: "CERTIFIED" as "CERTIFIED" | "VETOED",
 checks: [
 { rule: "RBI Fair Practices, no coercive/mis-sold product", result: "pass", note: "Liquidity action, no product sale." },
 { rule: "DPDP, valid, in-scope consent for account + FD data", result: "pass", note: "Consent CNS-441 active, scope covers deposits." },
 { rule: "Suitability, action fits risk profile & goals", result: "pass", note: "Reversible, low-risk, customer-owned funds." },
 { rule: "Reversibility, action can be unwound", result: "pass", note: "FD sweep auto-reverses on the 28th." },
 { rule: "Affordability, does not create new hardship", result: "pass", note: "Uses idle FD, not new credit." },
 ],
};

export const explanation = {
 headline: "Your EMI on the 5th is likely to bounce, here's the safest fix.",
 plain:
 "Your salary lands around the 27th, but your home-loan EMI of ₹38,400 auto-debits on the 5th. " +
 "After your card bill and school fees, your balance on the 5th is projected to fall about ₹9,400 short. " +
 "Moving ₹12,000 from your Fixed Deposit for just 6 days covers the gap, the EMI clears, you avoid a " +
 "₹590 bounce charge and a credit-score dip, and the FD is automatically repaid after your salary arrives.",
 confidence: 0.86,
 evidence: ["T3", "T5", "T6"],
};

export const fraudAlert = {
 id: "FRD-99213",
 status: "Awaiting your confirmation",
 amount: 49999,
 merchant: "QUICKPAY-UPI / unknown VPA",
 time: "Today 02:14",
 reasons: [
 "Amount just under the ₹50,000 review threshold (structuring pattern).",
 "New payee never transacted with before.",
 "2:14 AM, outside your normal activity window.",
 "Device fingerprint differs from your usual handset.",
 ],
 riskScore: 0.88,
};

export const consents = [
 { id: "CNS-441", scope: "Accounts & deposits", purpose: "Wellbeing scoring & liquidity plans", status: "Active", granted: "12 Jun 2026", expiry: "12 Jun 2027" },
 { id: "CNS-442", scope: "Cards & loans", purpose: "Debt health & EMI risk", status: "Active", granted: "12 Jun 2026", expiry: "12 Jun 2027" },
 { id: "CNS-443", scope: "Investments (MF/SIP)", purpose: "Wealth-gap analysis", status: "Active", granted: "12 Jun 2026", expiry: "12 Jun 2027" },
 { id: "CNS-460", scope: "Cross-sell offers", purpose: "Suitability-checked product suggestions", status: "Paused", granted: "-", expiry: "-" },
];

export const scoreHistory = [
 { m: "Feb", v: 588 },
 { m: "Mar", v: 601 },
 { m: "Apr", v: 618 },
 { m: "May", v: 630 },
 { m: "Jun", v: 612 },
];

export const bandOf = (score: number): Band =>
 score <= 400 ? "Critical" : score <= 600 ? "At-Risk" : score <= 800 ? "Stable" : "Thriving";
