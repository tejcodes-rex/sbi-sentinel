import { Card, SectionTitle, Chip } from "../components/ui";
import type { AgentEvent } from "../data/rajesh";

const events: AgentEvent[] = [
 { id: "e1", agent: "Orchestrator", color: "#1E50E6", icon: "🧠", time: "02:14:02", kind: "detect", title: "Event received, scheduled EMI vs projected balance", detail: "Routed the salary/EMI cashflow signal to the Risk, Health and Fraud agents." },
 { id: "e2", agent: "Financial Health", color: "#17C3B2", icon: "💚", time: "02:14:03", kind: "detect", title: "Wellbeing Score recomputed → 612 (At-Risk)", detail: "Emergency Buffer and Debt Health pillars dropped this cycle.", confidence: 0.99 },
 { id: "e3", agent: "Risk & Early-Warning", color: "#FFB020", icon: "📉", time: "02:14:03", kind: "detect", title: "Predicted EMI bounce, 71% in 9 days", detail: "Projected balance on the 5th falls ₹9,400 short of the ₹38,400 EMI.", confidence: 0.71 },
 { id: "e4", agent: "Fraud & Anomaly", color: "#FF5A5F", icon: "🕵", time: "02:14:04", kind: "detect", title: "Anomaly flagged, ₹49,999 to unknown payee", detail: "Structuring + new-payee + off-hours + new-device pattern. Held for confirmation.", confidence: 0.88 },
 { id: "e5", agent: "Planner", color: "#7C5CFF", icon: "🧭", time: "02:14:05", kind: "plan", title: "Generated 3 intervention options", detail: "SIP defer · 6-day FD sweep · EMI date change. Grounded on SBI product rules via RAG." },
 { id: "e6", agent: "Simulation", color: "#2ED47A", icon: "🔮", time: "02:14:06", kind: "simulate", title: "Monte-Carlo projected each plan", detail: "Plan B (FD sweep): 93% success, lifts score 612 → 690. Selected as recommended.", confidence: 0.93 },
 { id: "e7", agent: "Compliance & Guardrail", color: "#FFB020", icon: "⚖", time: "02:14:06", kind: "compliance", title: "Plan B CERTIFIED · certificate CC-2026-0714-B", detail: "5/5 deterministic checks passed, RBI, DPDP, suitability, reversibility, affordability." },
 { id: "e8", agent: "Explainability", color: "#17C3B2", icon: "💬", time: "02:14:07", kind: "explain", title: "Plain-language explanation + 3 evidence transactions", detail: "Confidence 0.86. Built the customer story and the audit record." },
 { id: "e9", agent: "Orchestrator", color: "#1E50E6", icon: "🧠", time: "02:14:07", kind: "propose", title: "Proposed Plan B to customer, awaiting approval", detail: "No money moves until Rajesh approves. Below veto/low-confidence would route to a human RM." },
];

const kindTone: Record<string, "brand" | "ok" | "warn" | "bad" | "mute"> = {
 detect: "warn", plan: "brand", simulate: "ok", compliance: "warn", explain: "brand", propose: "mute", execute: "ok", audit: "mute",
};

export default function Timeline() {
 return (
 <div className="space-y-5">
 <Card>
 <SectionTitle kicker="Real-time · one intervention" title="Agent Timeline"
 right={<div className="flex gap-2"><Chip tone="ok">9 steps</Chip><Chip>~5s end-to-end</Chip></div>} />
 <p className="text-sm text-mute -mt-2 mb-5">
 Every step is logged to the immutable audit ledger. This is the exact trace for the EMI-bounce
 intervention, from signal to a compliance-certified proposal, with the human-approval gate at the end.
 </p>

 <ol className="relative border-l-2 border-[#e6ebf5] ml-3 space-y-5">
 {events.map((e) => (
 <li key={e.id} className="ml-6 relative animate-fade-up">
 <span className="absolute -left-[34px] top-0 w-8 h-8 rounded-full grid place-items-center text-sm ring-4 ring-white" style={{ background: e.color + "22" }}>
 <span>{e.icon}</span>
 </span>
 <div className="rounded-xl border border-[rgba(11,27,63,.07)] p-4 hover:shadow-card transition">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <span className="font-bold text-sm" style={{ color: e.color }}>{e.agent}</span>
 <Chip tone={kindTone[e.kind]}>{e.kind}</Chip>
 </div>
 <div className="flex items-center gap-3">
 {e.confidence != null && <span className="text-xs text-mute">confidence <b className="text-ink">{e.confidence.toFixed(2)}</b></span>}
 <span className="text-xs font-mono text-mute">{e.time}</span>
 </div>
 </div>
 <div className="font-semibold text-ink mt-1.5">{e.title}</div>
 <div className="text-sm text-mute mt-0.5">{e.detail}</div>
 </div>
 </li>
 ))}
 <li className="ml-6 relative">
 <span className="absolute -left-[34px] top-0 w-8 h-8 rounded-full grid place-items-center text-sm ring-4 ring-white bg-[#e7fbf0]">⏸</span>
 <div className="rounded-xl border-2 border-dashed border-[#bff0d3] bg-[#f3fdf7] p-4">
 <div className="font-bold text-[#127a44]">Awaiting customer approval, the loop pauses here by design.</div>
 <div className="text-sm text-mute mt-0.5">On approval: bank executes the FD sweep → an <b>execute</b> and <b>audit</b> event are appended. The AI never acts alone.</div>
 </div>
 </li>
 </ol>
 </Card>
 </div>
 );
}
