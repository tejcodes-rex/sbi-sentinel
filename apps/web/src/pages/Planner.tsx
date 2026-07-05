import { useState } from "react";
import { Card, SectionTitle, Chip, fmtINR, bandColor } from "../components/ui";
import { risk, plans, compliance, explanation, evidenceTxns, fws, bandOf } from "../data/rajesh";

type Stage = "choose" | "approved";

export default function Planner() {
 const [selected, setSelected] = useState(plans.find((p) => p.recommended)!.id);
 const initialStage: Stage =
   new URLSearchParams(window.location.search).get("stage") === "approved" ? "approved" : "choose";
 const [stage, setStage] = useState<Stage>(initialStage);
 const plan = plans.find((p) => p.id === selected)!;
 const evTx = evidenceTxns.filter((t) => explanation.evidence.includes(t.id));

 if (stage === "approved") return <Approved plan={plan} onReset={() => setStage("choose")} />;

 return (
 <div className="space-y-5">
 {/* Risk banner */}
 <Card className="!p-0 overflow-hidden">
 <div className="p-5 bg-gradient-to-r from-[#fff9ef] to-white border-b border-[#ffe2ad]">
 <div className="flex items-center gap-2 text-[13px] font-bold text-[#8a5b00]">⚠ Predicted risk · {risk.daysOut} days out · {Math.round(risk.probability * 100)}% likely</div>
 <div className="text-xl font-extrabold text-ink mt-1">Your ₹{risk.amount.toLocaleString("en-IN")} home-loan EMI is likely to bounce on the {risk.dueDate}</div>
 <div className="flex flex-wrap gap-4 mt-2 text-sm text-mute">
 <span>Avoids <b className="text-ink">{fmtINR(risk.charge)}</b> bounce charge</span>
 <span>Protects CIBIL <b className="text-ink">({risk.cibilImpact})</b></span>
 <span>Detected by the Risk &amp; Early-Warning agent</span>
 </div>
 </div>
 <div className="p-5 grid sm:grid-cols-3 gap-3">
 {risk.why.map((w, i) => (
 <div key={i} className="text-sm text-mute flex gap-2"><span className="text-brand font-bold">{i + 1}</span>{w}</div>
 ))}
 </div>
 </Card>

 {/* Plan options */}
 <div>
 <SectionTitle kicker="Planner agent · you choose, never just one option" title="Three ready-to-approve plans" />
 <div className="grid md:grid-cols-3 gap-4">
 {plans.map((p) => {
 const on = p.id === selected;
 return (
 <button key={p.id} onClick={() => setSelected(p.id)}
 className={`text-left rounded-2xl border-2 p-4 transition bg-white ${on ? "border-brand shadow-pop" : "border-[rgba(11,27,63,.08)] hover:border-[#c9d6f5]"}`}>
 <div className="flex items-center justify-between">
 {p.recommended ? <Chip tone="ok">★ Recommended</Chip> : <Chip tone="mute">Option</Chip>}
 {on && <span className="text-brand text-lg">◉</span>}
 </div>
 <div className="font-extrabold text-ink mt-2">{p.title}</div>
 <div className="text-sm text-mute mt-1">{p.summary}</div>
 <div className="grid grid-cols-2 gap-2 mt-3">
 <Stat label="Score after" value={`${p.fwsAfter}`} sub={bandOf(p.fwsAfter)} col={bandColor[bandOf(p.fwsAfter)]} />
 <Stat label="Success" value={`${Math.round(p.successProb * 100)}%`} />
 </div>
 <div className="text-xs text-mute mt-3 border-t border-[#eef1f8] pt-2">{p.tradeoff}</div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Simulation + compliance + explanation for the selected plan */}
 <div className="grid lg:grid-cols-3 gap-5">
 {/* Simulation */}
 <Card>
 <SectionTitle kicker="Simulation agent" title="Projected impact" />
 <div className="flex items-end justify-center gap-6 py-2">
 <ScoreBlock value={fws.score} band={fws.band} label="Now" />
 <div className="text-2xl text-mute pb-6">→</div>
 <ScoreBlock value={plan.fwsAfter} band={bandOf(plan.fwsAfter)} label="After plan" />
 </div>
 <div className="rounded-xl bg-[#f4f7fc] p-3 text-sm text-mute mt-2">
 Monte-Carlo over 10,000 cashflow paths · <b className="text-ink">{Math.round(plan.successProb * 100)}%</b> avoid the bounce ·
 saves <b className="text-ink">{fmtINR(plan.moneySaved)}</b>.
 </div>
 </Card>

 {/* Compliance certificate */}
 <Card>
 <SectionTitle kicker="Compliance agent · deterministic" title="Compliance certificate"
 right={plan.id === compliance.plan ? <Chip tone="ok">✔ Certified</Chip> : <Chip tone="warn">Re-checking…</Chip>} />
 {plan.id === compliance.plan ? (
 <div className="space-y-2">
 {compliance.checks.map((c, i) => (
 <div key={i} className="flex items-start gap-2 text-sm">
 <span className="text-ok mt-0.5">✔</span>
 <div><span className="text-ink font-medium">{c.rule}</span><div className="text-xs text-mute">{c.note}</div></div>
 </div>
 ))}
 <div className="text-[11px] font-mono text-mute pt-2 border-t border-[#eef1f8]">Certificate {compliance.certificate}</div>
 </div>
 ) : (
 <div className="text-sm text-mute">Each option is independently checked. The recommended plan (B) is certified 5/5. Selecting another re-runs the deterministic engine before it can be approved.</div>
 )}
 </Card>

 {/* Explanation */}
 <Card>
 <SectionTitle kicker="Explainability agent" title="Why this, in plain words"
 right={<Chip>conf {explanation.confidence.toFixed(2)}</Chip>} />
 <p className="text-sm text-ink/90 leading-relaxed">{explanation.plain}</p>
 <div className="text-[11px] font-bold tracking-[.14em] uppercase text-mute mt-4 mb-2">Evidence transactions</div>
 <div className="space-y-1.5">
 {evTx.map((t) => (
 <div key={t.id} className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 ${t.flagged ? "bg-[#fff1f1]" : "bg-[#f4f7fc]"}`}>
 <span className="text-mute">{t.date} · {t.desc}</span>
 <span className={`font-mono font-semibold ${t.amount < 0 ? "text-danger" : "text-ok"}`}>{fmtINR(t.amount)}</span>
 </div>
 ))}
 </div>
 </Card>
 </div>

 {/* Approve bar */}
 <Card className="!bg-navy !border-navy text-white sticky bottom-4 shadow-pop">
 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
 <div>
 <div className="text-xs tracking-[.14em] uppercase text-teal font-bold">The agents propose · you approve · the bank executes</div>
 <div className="font-extrabold text-lg mt-0.5">{plan.title}</div>
 <div className="text-sm text-white/70">Bank action on approval: {plan.action} · fully reversible · audited</div>
 </div>
 <div className="flex gap-3">
 <button className="btn-line !border-white/25 !text-white hover:!bg-white/10">Ask a human RM</button>
 <button onClick={() => setStage("approved")} disabled={plan.id !== compliance.plan}
 className={`btn-primary ${plan.id !== compliance.plan ? "opacity-40 cursor-not-allowed" : ""}`}>
 ✔ Approve &amp; execute
 </button>
 </div>
 </div>
 {plan.id !== compliance.plan && <div className="text-xs text-amber mt-2">This option must finish its compliance check before it can be approved. (Plan B is pre-certified for the demo.)</div>}
 </Card>
 </div>
 );
}

function Approved({ plan, onReset }: { plan: any; onReset: () => void }) {
 const steps = [
 { t: "Approval captured", d: "Consent + timestamp recorded", done: true },
 { t: "Compliance re-verified", d: `Certificate ${compliance.certificate}`, done: true },
 { t: "Bank executed on SBI rails", d: plan.action, done: true },
 { t: "Audit ledger appended", d: "Immutable, hash-chained entry AUD-20714-9", done: true },
 ];
 return (
 <div className="max-w-2xl mx-auto">
 <Card className="text-center">
 <div className="w-16 h-16 rounded-full bg-[#e7fbf0] grid place-items-center text-3xl mx-auto animate-pulse-ring">✅</div>
 <h2 className="text-2xl font-black text-ink mt-4">Done, and your EMI is safe</h2>
 <p className="text-mute mt-1 max-w-md mx-auto">You approved <b className="text-ink">{plan.title}</b>. The bank executed it and it's fully audited. Your projected wellbeing score is now <b className="text-ok">{plan.fwsAfter} · Stable</b>.</p>
 <div className="text-left mt-6 space-y-3">
 {steps.map((s, i) => (
 <div key={i} className="flex items-center gap-3 rounded-xl border border-[#e6ebf5] p-3 animate-fade-up" style={{ animationDelay: `${i * 120}ms` }}>
 <span className="w-7 h-7 rounded-full bg-ok/15 text-ok grid place-items-center">✔</span>
 <div className="flex-1"><div className="font-semibold text-ink text-sm">{s.t}</div><div className="text-xs text-mute">{s.d}</div></div>
 <span className="text-xs font-mono text-mute">just now</span>
 </div>
 ))}
 </div>
 <div className="flex gap-3 justify-center mt-6">
 <button onClick={onReset} className="btn-ghost">Replay the flow</button>
 <button className="btn-primary">Back to dashboard</button>
 </div>
 <div className="text-xs text-mute mt-4">A reversible action, you can undo the FD sweep any time before the 28th. Nothing was sold to you.</div>
 </Card>
 </div>
 );
}

function Stat({ label, value, sub, col }: { label: string; value: string; sub?: string; col?: string }) {
 return (
 <div className="rounded-lg bg-[#f4f7fc] px-3 py-2">
 <div className="text-lg font-extrabold" style={{ color: col ?? "#0B1B3F" }}>{value}</div>
 <div className="text-[10px] text-mute font-semibold uppercase tracking-wide">{label}{sub ? ` · ${sub}` : ""}</div>
 </div>
 );
}

function ScoreBlock({ value, band, label }: { value: number; band: string; label: string }) {
 return (
 <div className="text-center">
 <div className="text-4xl font-black" style={{ color: bandColor[band] }}>{value}</div>
 <div className="text-xs font-semibold" style={{ color: bandColor[band] }}>{band}</div>
 <div className="text-[11px] text-mute mt-1">{label}</div>
 </div>
 );
}
