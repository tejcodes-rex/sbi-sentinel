import { Card, ScoreGauge, Sparkline, PillarBar, SectionTitle, Chip, fmtINR, statusColor } from "../components/ui";
import { fws, pillars, customer, risk, scoreHistory, fraudAlert } from "../data/rajesh";

export default function Dashboard({ go }: { go: (k: any) => void }) {
 return (
 <div className="space-y-5">
 {/* Hero row */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
 <Card className="lg:col-span-1 flex flex-col items-center text-center">
 <div className="text-[11px] font-bold tracking-[.16em] uppercase text-brand mb-3">Financial Wellbeing Score</div>
 <ScoreGauge score={fws.score} band={fws.band} />
 <div className="mt-3 text-sm text-mute">
 {fws.delta < 0 ? "▼" : "▲"} {Math.abs(fws.delta)} pts vs last month
 </div>
 <div className="mt-3 w-full rounded-xl bg-[#f4f7fc] p-3 text-sm">
 With the recommended plan, projected{" "}
 <span className="font-extrabold text-ok">{fws.projected}</span> · Stable
 </div>
 </Card>

 <Card className="lg:col-span-2">
 <SectionTitle kicker="Sentinel is watching" title={`Good evening, ${customer.name.split(" ")[0]}`} right={<Chip tone="warn">1 action needs you</Chip>} />
 <div className="grid sm:grid-cols-2 gap-3">
 <div className="rounded-xl border border-[#ffe2ad] bg-[#fff9ef] p-4">
 <div className="flex items-center gap-2 text-[13px] font-bold text-[#8a5b00]">⚠ Predicted risk · {risk.daysOut} days out</div>
 <div className="mt-1 font-extrabold text-ink">Your EMI may bounce on the {risk.dueDate}</div>
 <div className="text-sm text-mute mt-1">{Math.round(risk.probability * 100)}% likely · avoid {fmtINR(risk.charge)} charge + CIBIL dip</div>
 <button onClick={() => go("planner")} className="btn-primary mt-3 text-sm w-full">See 3 ready plans →</button>
 </div>
 <div className="rounded-xl border border-[#ffcfd0] bg-[#fff1f1] p-4">
 <div className="flex items-center gap-2 text-[13px] font-bold text-[#b3363a]">🕵 Fraud alert · needs confirmation</div>
 <div className="mt-1 font-extrabold text-ink">{fmtINR(fraudAlert.amount)} to an unknown payee</div>
 <div className="text-sm text-mute mt-1">Risk {Math.round(fraudAlert.riskScore * 100)}% · {fraudAlert.time}</div>
 <button onClick={() => go("fraud")} className="btn-line mt-3 text-sm w-full">Review &amp; decide →</button>
 </div>
 </div>
 <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
 <div>
 <div className="text-[11px] font-bold tracking-[.16em] uppercase text-mute mb-1">Score trend</div>
 <Sparkline points={scoreHistory} />
 </div>
 <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center shrink-0">
 <Kpi label="Monthly income" value={fmtINR(customer.monthlyIncome)} />
 <Kpi label="Liquid buffer" value={fmtINR(customer.liquid)} />
 <Kpi label="Home-loan EMI" value={fmtINR(customer.emi)} />
 </div>
 </div>
 </Card>
 </div>

 {/* Pillars */}
 <Card>
 <SectionTitle kicker="Glass-box · every point is traceable" title="Six wellbeing pillars" right={<button onClick={() => go("wellbeing")} className="text-sm font-semibold text-brand">Full breakdown →</button>} />
 <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
 {pillars.map((p) => (
 <div key={p.key}>
 <div className="flex items-center justify-between mb-1.5">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full" style={{ background: statusColor[p.status] }} />
 <span className="font-semibold text-sm text-ink">{p.name}</span>
 </div>
 <span className="text-xs text-mute">{Math.round(p.weight * 100)}% · {Math.round(p.score * 100)}/100</span>
 </div>
 <PillarBar score={p.score} color={statusColor[p.status]} />
 <div className="text-xs text-mute mt-1.5">{p.actual} <span className="text-[#c3ccdc]">· target {p.target}</span></div>
 </div>
 ))}
 </div>
 </Card>
 </div>
 );
}

function Kpi({ label, value }: { label: string; value: string }) {
 return (
 <div>
 <div className="text-base font-extrabold text-ink">{value}</div>
 <div className="text-[11px] text-mute font-medium">{label}</div>
 </div>
 );
}
