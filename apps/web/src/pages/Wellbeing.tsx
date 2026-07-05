import { Card, ScoreGauge, PillarBar, SectionTitle, Chip, statusColor } from "../components/ui";
import { fws, pillars } from "../data/rajesh";

export default function Wellbeing() {
 return (
 <div className="space-y-5">
 <div className="grid lg:grid-cols-3 gap-5">
 <Card className="flex flex-col items-center text-center">
 <ScoreGauge score={fws.score} band={fws.band} size={210} />
 <div className="mt-4 text-sm text-mute max-w-[240px]">
 The score is the weighted sum of six pillar sub-scores. Nothing here is a black box, each pillar shows the exact metric, your value, and the healthy target.
 </div>
 </Card>

 <Card className="lg:col-span-2">
 <SectionTitle kicker="How the score is built" title="Pillar-by-pillar breakdown" />
 <div className="space-y-4">
 {pillars.map((p) => (
 <div key={p.key} className="rounded-xl border border-[rgba(11,27,63,.07)] p-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor[p.status] }} />
 <span className="font-bold text-ink">{p.name}</span>
 <Chip tone={p.status === "good" ? "ok" : p.status === "warn" ? "warn" : "bad"}>
 {p.status === "good" ? "Healthy" : p.status === "warn" ? "Watch" : "Needs action"}
 </Chip>
 </div>
 <div className="text-sm text-mute mt-1.5">{p.note}</div>
 </div>
 <div className="text-right shrink-0">
 <div className="text-2xl font-black text-ink">{Math.round(p.score * 100)}<span className="text-sm text-mute font-semibold">/100</span></div>
 <div className="text-[11px] text-mute">weight {Math.round(p.weight * 100)}%</div>
 </div>
 </div>
 <div className="mt-3"><PillarBar score={p.score} color={statusColor[p.status]} /></div>
 <div className="flex justify-between text-xs mt-2">
 <span className="text-mute">You: <span className="text-ink font-semibold">{p.actual}</span></span>
 <span className="text-mute">Target: {p.target}</span>
 </div>
 </div>
 ))}
 </div>
 </Card>
 </div>

 <Card>
 <SectionTitle kicker="Weighted contribution" title="Where your 612 comes from" />
 <div className="flex items-end gap-2 h-40">
 {pillars.map((p) => {
 const contrib = p.weight * p.score * 1000;
 return (
 <div key={p.key} className="flex-1 flex flex-col items-center justify-end gap-2">
 <span className="text-xs font-bold text-ink">{Math.round(contrib)}</span>
 <div className="w-full rounded-t-lg" style={{ height: `${(contrib / 200) * 100}%`, background: statusColor[p.status], minHeight: 8 }} />
 <span className="text-[10px] text-mute text-center leading-tight h-7">{p.name.split(" ")[0]}</span>
 </div>
 );
 })}
 </div>
 <div className="text-xs text-mute mt-2">Each bar = weight × pillar-score × 1000. Summed = your Financial Wellbeing Score.</div>
 </Card>
 </div>
 );
}
