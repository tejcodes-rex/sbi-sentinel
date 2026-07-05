import { useState } from "react";
import { Card, SectionTitle, Chip } from "../components/ui";
import { consents } from "../data/rajesh";

export default function Consent() {
 const [items, setItems] = useState(consents);
 const toggle = (id: string) =>
 setItems((xs) => xs.map((c) => (c.id === id ? { ...c, status: c.status === "Active" ? "Paused" : "Active" } : c)));

 return (
 <div className="space-y-5">
 <Card>
 <SectionTitle kicker="DPDP-native · you are in control" title="Consent ledger"
 right={<Chip tone="ok">DPDP Act 2023 compliant</Chip>} />
 <p className="text-sm text-mute -mt-2 mb-4">
 Sentinel only uses data you've consented to, for the purpose you agreed to. Revoke any scope
 instantly, dependent agents stop using that data on the spot, and the change is logged.
 </p>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="text-[11px] uppercase tracking-wider text-mute border-b-2 border-[#eef1f8]">
 <th className="text-left py-2 font-semibold">Scope</th>
 <th className="text-left py-2 font-semibold">Purpose</th>
 <th className="text-left py-2 font-semibold">Granted</th>
 <th className="text-left py-2 font-semibold">Status</th>
 <th className="text-right py-2 font-semibold">Control</th>
 </tr>
 </thead>
 <tbody>
 {items.map((c) => (
 <tr key={c.id} className="border-b border-[#f0f3f9]">
 <td className="py-3"><div className="font-semibold text-ink">{c.scope}</div><div className="text-[11px] font-mono text-mute">{c.id}</div></td>
 <td className="py-3 text-mute">{c.purpose}</td>
 <td className="py-3 text-mute">{c.granted}</td>
 <td className="py-3">
 <Chip tone={c.status === "Active" ? "ok" : "mute"}>{c.status}</Chip>
 </td>
 <td className="py-3 text-right">
 <button onClick={() => toggle(c.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${c.status === "Active" ? "text-danger bg-[#ffecec]" : "text-ok bg-[#e7fbf0]"}`}>
 {c.status === "Active" ? "Revoke" : "Grant"}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>

 <div className="grid sm:grid-cols-3 gap-4">
 {[
 ["Purpose-bound", "Each consent maps to one purpose. Data can't be reused for anything else."],
 ["Instantly revocable", "Revoking a scope halts the agents that depend on it immediately."],
 ["Erasure-ready", "Right-to-erasure requests cascade across all stores, with proof."],
 ].map(([t, d]) => (
 <Card key={t}><div className="text-brand font-bold text-sm">⛊ {t}</div><div className="text-sm text-mute mt-1">{d}</div></Card>
 ))}
 </div>
 </div>
 );
}
