import React from "react";

export const fmtINR = (n: number) =>
 (n < 0 ? "−₹" : "₹") + Math.abs(n).toLocaleString("en-IN");

export const bandColor: Record<string, string> = {
 Critical: "#FF5A5F",
 "At-Risk": "#FFB020",
 Stable: "#2E6BFF",
 Thriving: "#2ED47A",
};

export const statusColor: Record<string, string> = {
 good: "#2ED47A",
 warn: "#FFB020",
 bad: "#FF5A5F",
};

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
 return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: React.ReactNode }) {
 return (
 <div className="flex items-end justify-between mb-4">
 <div>
 {kicker && <div className="text-[11px] font-bold tracking-[.16em] uppercase text-brand mb-1">{kicker}</div>}
 <h2 className="text-xl font-extrabold text-ink">{title}</h2>
 </div>
 {right}
 </div>
 );
}

export function Chip({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "ok" | "warn" | "bad" | "mute" }) {
 const map: Record<string, string> = {
 brand: "bg-[#eef3ff] text-brand border-[#dbe6ff]",
 ok: "bg-[#e7fbf0] text-[#127a44] border-[#bff0d3]",
 warn: "bg-[#fff6e6] text-[#8a5b00] border-[#ffe2ad]",
 bad: "bg-[#ffecec] text-[#b3363a] border-[#ffcfd0]",
 mute: "bg-[#eef1f7] text-mute border-[#dde3ee]",
 };
 return <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${map[tone]}`}>{children}</span>;
}

// Circular score gauge (SVG)
export function ScoreGauge({ score, band, size = 190 }: { score: number; band: string; size?: number }) {
 const r = size / 2 - 16;
 const c = 2 * Math.PI * r;
 const pct = Math.max(0, Math.min(1, score / 1000));
 const col = bandColor[band] ?? "#2E6BFF";
 return (
 <div className="relative" style={{ width: size, height: size }}>
 <svg width={size} height={size} className="-rotate-90">
 <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f8" strokeWidth={14} />
 <circle
 cx={size / 2}
 cy={size / 2}
 r={r}
 fill="none"
 stroke={col}
 strokeWidth={14}
 strokeLinecap="round"
 strokeDasharray={c}
 strokeDashoffset={c * (1 - pct)}
 style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)" }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <div className="text-4xl font-black text-ink leading-none">{score}</div>
 <div className="text-[11px] text-mute font-semibold mt-1">/ 1000</div>
 <div className="mt-2 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: col + "22", color: col }}>
 {band}
 </div>
 </div>
 </div>
 );
}

// Sparkline (SVG)
export function Sparkline({ points, width = 260, height = 72 }: { points: { m: string; v: number }[]; width?: number; height?: number }) {
 const vals = points.map((p) => p.v);
 const min = Math.min(...vals) - 8;
 const max = Math.max(...vals) + 8;
 const x = (i: number) => (i / (points.length - 1)) * (width - 12) + 6;
 const y = (v: number) => height - 10 - ((v - min) / (max - min)) * (height - 22);
 const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.v)}`).join(" ");
 const area = `${d} L ${x(points.length - 1)} ${height} L ${x(0)} ${height} Z`;
 return (
 <svg width={width} height={height}>
 <defs>
 <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#2E6BFF" stopOpacity=".28" />
 <stop offset="100%" stopColor="#2E6BFF" stopOpacity="0" />
 </linearGradient>
 </defs>
 <path d={area} fill="url(#spark)" />
 <path d={d} fill="none" stroke="#2E6BFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
 {points.map((p, i) => (
 <g key={i}>
 <circle cx={x(i)} cy={y(p.v)} r={i === points.length - 1 ? 4 : 2.5} fill="#2E6BFF" />
 <text x={x(i)} y={height - 1} textAnchor="middle" className="fill-mute" fontSize="9">{p.m}</text>
 </g>
 ))}
 </svg>
 );
}

export function PillarBar({ score, color }: { score: number; color: string }) {
 return (
 <div className="h-2.5 rounded-full bg-[#eef1f8] overflow-hidden">
 <div className="h-full rounded-full" style={{ width: `${score * 100}%`, background: color, transition: "width 1s ease" }} />
 </div>
 );
}

export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
 return (
 <div
 className="rounded-xl grid place-items-center text-white font-extrabold"
 style={{ width: size, height: size, background: "linear-gradient(135deg,#17C3B2,#1E50E6)", fontSize: size * 0.36 }}
 >
 {initials}
 </div>
 );
}
