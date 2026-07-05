import React, { useState, useEffect } from "react";
import { Avatar } from "./components/ui";
import { customer } from "./data/rajesh";
import Dashboard from "./pages/Dashboard";
import Wellbeing from "./pages/Wellbeing";
import Timeline from "./pages/Timeline";
import Planner from "./pages/Planner";
import Fraud from "./pages/Fraud";
import Explainability from "./pages/Explainability";
import Consent from "./pages/Consent";
import { Notifications, Settings, Admin } from "./pages/Misc";

type Key =
  | "dashboard" | "wellbeing" | "timeline" | "planner"
  | "fraud" | "explain" | "consent" | "notifications" | "settings" | "admin";

const NAV: { key: Key; label: string; icon: string; group?: string; badge?: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "▚", group: "Overview" },
  { key: "wellbeing", label: "Financial Health", icon: "❤" },
  { key: "timeline", label: "Agent Timeline", icon: "◷" },
  { key: "planner", label: "Financial Planner", icon: "◈", group: "Act", badge: "3" },
  { key: "fraud", label: "Fraud Center", icon: "⚠", badge: "1" },
  { key: "explain", label: "Explainability", icon: "◍" },
  { key: "consent", label: "Consent", icon: "⛊", group: "Trust" },
  { key: "notifications", label: "Notifications", icon: "◔" },
  { key: "settings", label: "Settings", icon: "⚙" },
  { key: "admin", label: "Admin (Bank)", icon: "▤", group: "Staff" },
];

const KEYS: Key[] = ["dashboard", "wellbeing", "timeline", "planner", "fraud", "explain", "consent", "notifications", "settings", "admin"];
const fromHash = (): Key => {
  const h = window.location.hash.replace("#", "") as Key;
  return KEYS.includes(h) ? h : "dashboard";
};

const titleOf: Record<Key, string> = {
  dashboard: "Dashboard", wellbeing: "Financial Health", timeline: "Agent Timeline",
  planner: "Financial Planner", fraud: "Fraud Center", explain: "Explainability",
  consent: "Consent", notifications: "Notifications", settings: "Settings", admin: "Operations Console",
};

export default function App() {
  const [active, setActiveState] = useState<Key>(fromHash);
  const [navOpen, setNavOpen] = useState(false);

  const setActive = (k: Key) => {
    setActiveState(k);
    window.location.hash = k;
    setNavOpen(false);
  };

  useEffect(() => {
    const onHash = () => setActiveState(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
  }, [navOpen]);

  const render = () => {
    switch (active) {
      case "dashboard": return <Dashboard go={setActive} />;
      case "wellbeing": return <Wellbeing />;
      case "timeline": return <Timeline />;
      case "planner": return <Planner />;
      case "fraud": return <Fraud />;
      case "explain": return <Explainability />;
      case "consent": return <Consent />;
      case "notifications": return <Notifications />;
      case "settings": return <Settings />;
      case "admin": return <Admin />;
    }
  };

  const SidebarInner = (
    <>
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl grid place-items-center shadow-[0_8px_24px_rgba(23,195,178,.4)]" style={{ background: "linear-gradient(135deg,#17C3B2,#1E50E6)" }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" fill="#fff" /><path d="M9 12l2 2 4-4.5" stroke="#1E50E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div>
          <div className="font-extrabold leading-tight">SBI Sentinel</div>
          <div className="text-[10px] tracking-[.14em] uppercase text-teal/90">Wellbeing Engine</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map((n) => (
          <React.Fragment key={n.key}>
            {n.group && <div className="text-[10px] font-bold tracking-[.18em] uppercase text-white/35 px-3 pt-4 pb-1.5">{n.group}</div>}
            <button
              onClick={() => setActive(n.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                active === n.key ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/[.06] hover:text-white"
              }`}
            >
              <span className={`w-5 text-center ${active === n.key ? "text-teal" : "text-white/50"}`}>{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge && <span className="text-[10px] font-bold bg-teal text-navy rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{n.badge}</span>}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 text-[11px] text-white/45">
        Human-in-the-loop · RBI + DPDP ready
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-[248px] shrink-0 bg-navy text-white flex-col sticky top-0 h-screen">
        {SidebarInner}
      </aside>

      {/* Sidebar drawer (mobile / tablet) */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[268px] bg-navy text-white flex flex-col shadow-pop animate-fade-up">
            {SidebarInner}
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-[rgba(11,27,63,.07)] px-4 sm:px-6 lg:px-7 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setNavOpen(true)} className="lg:hidden w-9 h-9 rounded-lg grid place-items-center text-ink hover:bg-[#eef1f8]" aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="hidden sm:inline text-sm text-mute">Customer 360</span>
            <span className="hidden sm:inline text-mute">·</span>
            <span className="text-sm font-semibold text-ink truncate">{titleOf[active]}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-mute">
              <span className="w-2 h-2 rounded-full bg-ok animate-pulse-ring" /> Agents online
            </div>
            <div className="flex items-center gap-2.5">
              <Avatar initials={customer.initials} size={36} />
              <div className="hidden md:block leading-tight">
                <div className="text-sm font-bold text-ink">{customer.name}</div>
                <div className="text-[11px] text-mute">{customer.maskedAcct}</div>
              </div>
            </div>
          </div>
        </header>

        <div key={active} className="p-4 sm:p-6 lg:p-7 w-full max-w-[1180px] mx-auto animate-fade-up">{render()}</div>
      </main>
    </div>
  );
}
