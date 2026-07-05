import { useState } from "react";
import { Card, SectionTitle, Chip, fmtINR } from "../components/ui";
import { fraudAlert } from "../data/rajesh";

export default function Fraud() {
 const [decision, setDecision] = useState<null | "frozen" | "allowed">(null);

 return (
 <div className="space-y-5">
 <Card className="!p-0 overflow-hidden">
 <div className="p-5 bg-gradient-to-r from-[#fff1f1] to-white border-b border-[#ffcfd0] flex items-center justify-between flex-wrap gap-3">
 <div>
 <div className="flex items-center gap-2 text-[13px] font-bold text-[#b3363a]">🕵 Fraud &amp; Anomaly agent · risk {Math.round(fraudAlert.riskScore * 100)}%</div>
 <div className="text-xl font-extrabold text-ink mt-1">{fmtINR(fraudAlert.amount)} transfer held for your confirmation</div>
 <div className="text-sm text-mute mt-0.5">{fraudAlert.merchant} · {fraudAlert.time}</div>
 </div>
 <div className="relative w-20 h-20">
 <svg width="80" height="80" className="-rotate-90">
 <circle cx="40" cy="40" r="32" fill="none" stroke="#ffe0e0" strokeWidth="9" />
 <circle cx="40" cy="40" r="32" fill="none" stroke="#FF5A5F" strokeWidth="9" strokeLinecap="round"
 strokeDasharray={2 * Math.PI * 32} strokeDashoffset={2 * Math.PI * 32 * (1 - fraudAlert.riskScore)} />
 </svg>
 <div className="absolute inset-0 grid place-items-center font-black text-danger">{Math.round(fraudAlert.riskScore * 100)}%</div>
 </div>
 </div>

 <div className="p-5">
 <div className="text-[11px] font-bold tracking-[.14em] uppercase text-mute mb-2">Why the agent flagged this</div>
 <div className="grid sm:grid-cols-2 gap-2">
 {fraudAlert.reasons.map((r, i) => (
 <div key={i} className="flex gap-2 text-sm rounded-lg bg-[#fff6f6] border border-[#ffdede] px-3 py-2">
 <span className="text-danger">●</span><span className="text-ink/90">{r}</span>
 </div>
 ))}
 </div>

 {!decision ? (
 <div className="flex flex-col sm:flex-row gap-3 mt-5">
 <button onClick={() => setDecision("frozen")} className="btn-primary flex-1 !bg-danger hover:!bg-[#e64146]">🧊 Freeze &amp; block this transfer</button>
 <button onClick={() => setDecision("allowed")} className="btn-line flex-1">This was me, allow it</button>
 </div>
 ) : (
 <div className={`mt-5 rounded-xl p-4 border ${decision === "frozen" ? "bg-[#f3fdf7] border-[#bff0d3]" : "bg-[#f4f7fc] border-[#e6ebf5]"}`}>
 <div className="font-bold text-ink">{decision === "frozen" ? "✅ Transfer frozen on your consent." : "✔ Marked as trusted, the agent will learn this payee."}</div>
 <div className="text-sm text-mute mt-1">
 {decision === "frozen"
 ? "The bank has blocked the payment and opened a dispute case. The action is consent-based, the agent only froze it because you confirmed. An audit entry (AUD-20714-F) was written."
 : "No block applied. Your confirmation is recorded so future transfers to this payee won't be re-flagged."}
 </div>
 <button onClick={() => setDecision(null)} className="btn-ghost text-sm mt-3">Reset</button>
 </div>
 )}
 </div>
 </Card>

 <Card>
 <SectionTitle kicker="How detection works" title="Anomaly signals monitored continuously"
 right={<Chip tone="mute">consent-gated · never auto-debits</Chip>} />
 <div className="grid sm:grid-cols-3 gap-3 text-sm">
 {[
 ["Amount z-score", "Deviation from your usual transaction size"],
 ["Payee novelty", "First-time vs known beneficiaries"],
 ["Velocity", "Rapid successive transfers"],
 ["Time-of-day", "Activity outside your normal window"],
 ["Device / geo", "New device fingerprint or location"],
 ["Structuring", "Amounts just under review thresholds"],
 ].map(([t, d]) => (
 <div key={t} className="rounded-xl border border-[#eef1f8] p-3">
 <div className="font-semibold text-ink">{t}</div>
 <div className="text-xs text-mute mt-0.5">{d}</div>
 </div>
 ))}
 </div>
 </Card>
 </div>
 );
}
