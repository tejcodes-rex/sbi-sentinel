import { Card, SectionTitle, Chip, fmtINR } from "../components/ui";
import { explanation, evidenceTxns, compliance } from "../data/rajesh";

const trail = [
 { agent: "Risk & Early-Warning", claim: "EMI bounce likely (71%)", basis: "Projected balance ₹−9,400 on the 5th vs ₹38,400 EMI" },
 { agent: "Planner", claim: "6-day FD sweep is the safest fix", basis: "Uses idle owned funds, no new credit, minimal cost" },
 { agent: "Simulation", claim: "Score 612 → 690, 93% success", basis: "Monte-Carlo over 10,000 cashflow paths" },
 { agent: "Compliance", claim: "Certified, safe to propose", basis: "5/5 rule checks passed (RBI, DPDP, suitability…)" },
];

export default function Explainability() {
 const evTx = evidenceTxns.filter((t) => explanation.evidence.includes(t.id));
 return (
 <div className="space-y-5">
 <Card>
 <SectionTitle kicker="Explainability ledger · glass-box AI" title="Why did Sentinel recommend this?"
 right={<Chip tone="ok">confidence {explanation.confidence.toFixed(2)}</Chip>} />
 <div className="rounded-xl bg-[#f4f7fc] p-4">
 <div className="font-bold text-ink mb-1">{explanation.headline}</div>
 <p className="text-sm text-ink/85 leading-relaxed">{explanation.plain}</p>
 </div>
 </Card>

 <div className="grid lg:grid-cols-2 gap-5">
 <Card>
 <SectionTitle kicker="Reasoning trail" title="How each agent reached this" />
 <ol className="space-y-3">
 {trail.map((s, i) => (
 <li key={i} className="flex gap-3">
 <span className="w-6 h-6 rounded-full bg-brand/10 text-brand grid place-items-center text-xs font-bold shrink-0">{i + 1}</span>
 <div>
 <div className="text-sm font-semibold text-ink">{s.agent}: <span className="font-normal">{s.claim}</span></div>
 <div className="text-xs text-mute">↳ {s.basis}</div>
 </div>
 </li>
 ))}
 </ol>
 </Card>

 <Card>
 <SectionTitle kicker="Grounding" title="The evidence it stands on" />
 <div className="space-y-1.5">
 {evTx.map((t) => (
 <div key={t.id} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2.5 ${t.flagged ? "bg-[#fff1f1] border border-[#ffcfd0]" : "bg-[#f4f7fc]"}`}>
 <span className="text-mute">{t.date} · {t.desc}</span>
 <span className={`font-mono font-semibold ${t.amount < 0 ? "text-danger" : "text-ok"}`}>{fmtINR(t.amount)}</span>
 </div>
 ))}
 </div>
 <div className="mt-4 rounded-xl border border-[#dbe6ff] bg-[#eef3ff] p-3 text-sm">
 <div className="font-semibold text-brand">Compliance certificate {compliance.certificate}</div>
 <div className="text-xs text-mute mt-0.5">Attached to this recommendation, the customer and any auditor see the same proof. Nothing is a black box.</div>
 </div>
 </Card>
 </div>

 <Card className="!bg-navy !border-navy text-white">
 <div className="grid sm:grid-cols-3 gap-4">
 {[
 ["What it will NOT do", "Recommend a product without a suitability + mis-selling check, or move money without your approval."],
 ["Reversible by default", "Every proposed action can be undone; the FD sweep auto-reverses on the 28th."],
 ["Audited forever", "The full reasoning trail is hash-chained into the immutable audit ledger."],
 ].map(([t, d]) => (
 <div key={t}><div className="text-teal font-bold text-sm">{t}</div><div className="text-sm text-white/75 mt-1">{d}</div></div>
 ))}
 </div>
 </Card>
 </div>
 );
}
