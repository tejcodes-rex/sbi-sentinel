import { Card, SectionTitle, Chip, Avatar, fmtINR } from "../components/ui";
import { customer } from "../data/rajesh";

export function Notifications() {
 const items = [
 { icon: "⚠", tone: "warn", t: "EMI bounce predicted", d: "3 plans ready, a 6-day FD sweep avoids a ₹590 charge.", time: "2m ago" },
 { icon: "🕵", tone: "bad", t: "Fraud alert needs you", d: "₹49,999 to an unknown payee held for confirmation.", time: "8m ago" },
 { icon: "🛡", tone: "warn", t: "Protection gap found", d: "Your family is insured 3.2× income vs a 10× healthy target.", time: "1d ago" },
 { icon: "✅", tone: "ok", t: "SIP resumed", d: "Your paused SBI Bluechip SIP restarted automatically.", time: "2d ago" },
 { icon: "📈", tone: "brand", t: "Score improved", d: "Behavioral hygiene up, no late fees for 60 days.", time: "5d ago" },
 ] as const;
 const map: any = { warn: "bg-[#fff6e6]", bad: "bg-[#ffecec]", ok: "bg-[#e7fbf0]", brand: "bg-[#eef3ff]" };
 return (
 <Card>
 <SectionTitle kicker="Nudges, not spam" title="Notifications" right={<Chip>5 recent</Chip>} />
 <div className="divide-y divide-[#f0f3f9]">
 {items.map((n, i) => (
 <div key={i} className="flex items-center gap-3 py-3">
 <span className={`w-10 h-10 rounded-xl grid place-items-center text-lg ${map[n.tone]}`}>{n.icon}</span>
 <div className="flex-1"><div className="font-semibold text-ink text-sm">{n.t}</div><div className="text-sm text-mute">{n.d}</div></div>
 <span className="text-xs text-mute">{n.time}</span>
 </div>
 ))}
 </div>
 </Card>
 );
}

export function Settings() {
 const toggles = [
 ["Predictive risk alerts", true],
 ["Fraud confirmations", true],
 ["Proactive plans (propose-only)", true],
 ["Suitability-checked product suggestions", false],
 ["Voice assistant (Bhashini · Hindi/Marathi)", false],
 ] as const;
 return (
 <div className="space-y-5 max-w-2xl">
 <Card>
 <SectionTitle kicker="Your profile" title="Profile & preferences" />
 <div className="flex items-center gap-4">
 <Avatar initials={customer.initials} size={56} />
 <div>
 <div className="font-extrabold text-ink text-lg">{customer.name}</div>
 <div className="text-sm text-mute">{customer.age} · {customer.city} · {customer.relationship}</div>
 <div className="text-xs font-mono text-mute mt-0.5">{customer.maskedAcct}</div>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-3 mt-4">
 {[["Income", customer.monthlyIncome], ["Essentials", customer.monthlyEssential], ["EMI", customer.emi]].map(([l, v]) => (
 <div key={l as string} className="rounded-xl bg-[#f4f7fc] p-3"><div className="font-extrabold text-ink">{fmtINR(v as number)}</div><div className="text-[11px] text-mute">{l as string}/mo</div></div>
 ))}
 </div>
 </Card>
 <Card>
 <SectionTitle kicker="What Sentinel may do" title="Agent permissions" />
 <div className="space-y-1">
 {toggles.map(([t, on]) => (
 <div key={t} className="flex items-center justify-between py-2.5 border-b border-[#f0f3f9] last:border-0">
 <span className="text-sm text-ink">{t}</span>
 <span className={`w-11 h-6 rounded-full relative transition ${on ? "bg-brand" : "bg-[#d7deea]"}`}>
 <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
 </span>
 </div>
 ))}
 </div>
 <div className="text-xs text-mute mt-3">Even with everything on, no money moves without your explicit per-action approval.</div>
 </Card>
 </div>
 );
}

export function Admin() {
 const kpis = [
 ["Customers monitored", "2.4 Cr", "in pilot cohort"],
 ["EMI bounces prevented", "18,240", "this month"],
 ["Fraud loss avoided", "₹6.1 Cr", "this quarter"],
 ["Plans proposed", "94,120", "78% certified"],
 ["Avg. FWS uplift", "+41 pts", "post-intervention"],
 ["Human-RM escalations", "3.2%", "of interventions"],
 ];
 const queue = [
 ["Compliance VETO, proposed prepay breaches affordability", "Blocked", "bad"],
 ["Low-confidence risk call escalated to RM (branch 0421)", "With RM", "warn"],
 ["Model drift check, Risk agent precision 0.91", "Healthy", "ok"],
 ["DPDP erasure request completed across 5 stores", "Done", "ok"],
 ] as const;
 return (
 <div className="space-y-5">
 <SectionTitle kicker="Bank-side · role-gated" title="Sentinel Operations Console" />
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {kpis.map(([v, l, s]) => (
 <Card key={l}><div className="text-2xl font-black text-ink">{v}</div><div className="text-sm font-semibold text-brand">{l}</div><div className="text-xs text-mute">{s}</div></Card>
 ))}
 </div>
 <Card>
 <SectionTitle kicker="Governance queue" title="Compliance & oversight" />
 <div className="space-y-2">
 {queue.map(([t, s, tone], i) => (
 <div key={i} className="flex items-center justify-between rounded-xl border border-[#eef1f8] px-4 py-3">
 <span className="text-sm text-ink">{t}</span>
 <Chip tone={tone as any}>{s}</Chip>
 </div>
 ))}
 </div>
 <div className="text-xs text-mute mt-3">Full audit trail is immutable and exportable for RBI inspection. Every agent decision is traceable to inputs, rules, and the human who approved.</div>
 </Card>
 </div>
 );
}
