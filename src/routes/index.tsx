import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Phone, Play, RotateCcw, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  COMPANIES,
  CONTACTS,
  QUICK,
  SCRIPT,
  eur,
  opener,
  type AgentReply,
  type AgentStatus,
  type Lead,
} from "@/lib/solarwake-data";
import { reactivationReply } from "@/lib/solarwake.functions";

const title = "SolarWake — AI Lead Reactivation for Solar Installers";
const description =
  "SolarWake is an AI agent that reactivates dormant solar leads over WhatsApp and books appointments — no new ad spend.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SolarWake,
});

type ChatMessage = { role: "agent" | "customer"; text: string; time: string };

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");

const STATUS_META: Record<
  AgentStatus,
  { label: string; className: string }
> = {
  cold: { label: "Cold · dormant", className: "bg-panel-2 text-sub" },
  contacting: { label: "Contacting…", className: "bg-gold/15 text-gold-soft" },
  warm: { label: "Warm · engaged", className: "bg-gold/15 text-gold" },
  booked: {
    label: "Appointment booked",
    className: "bg-success/20 text-success-soft",
  },
};

function SolarWake() {
  const callAgent = useServerFn(reactivationReply);

  const [leads, setLeads] = useState<Lead[]>(CONTACTS);
  const [companyId, setCompanyId] = useState("SW-001");
  const [leadId, setLeadId] = useState("C-1001");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<AgentStatus>("cold");
  const [appointment, setAppointment] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const company = COMPANIES.find((c) => c.id === companyId)!;
  const lead = leads.find((l) => l.id === leadId) ?? leads.find((l) => l.co === companyId);
  const companyLeads = leads.filter((l) => l.co === companyId);

  const stats = useMemo(() => {
    const dormant = companyLeads.filter((l) => l.status !== "Booked");
    return {
      dormant: dormant.length,
      atRisk: dormant.reduce((s, l) => s + l.quote, 0),
      booked: companyLeads.filter((l) => l.status === "Booked").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, companyId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  function pickLead(id: string) {
    setLeadId(id);
    setStarted(false);
    setMessages([]);
    setStatus("cold");
    setAppointment(null);
    setTyping(false);
    setInput("");
  }

  function pickCompany(id: string) {
    setCompanyId(id);
    const first = leads
      .filter((l) => l.co === id)
      .sort((a) => (a.status === "Cold" ? -1 : 1))[0];
    setLeads(CONTACTS);
    pickLead(first ? first.id : "");
  }

  function start() {
    if (started || !lead) return;
    setStarted(true);
    setStatus("contacting");
    setMessages([{ role: "agent", text: opener(lead, company), time: nowTime() }]);
  }

  async function send(text: string) {
    const clean = (text || "").trim();
    if (!clean || typing || !started || !lead) return;
    setInput("");
    const history: ChatMessage[] = [
      ...messages,
      { role: "customer", text: clean, time: nowTime() },
    ];
    setMessages(history);
    setTyping(true);
    const turn = history.filter((m) => m.role === "customer").length;
    const scripted = SCRIPT[Math.min(turn - 1, SCRIPT.length - 1)] ?? SCRIPT[SCRIPT.length - 1]!;

    let reply: AgentReply;
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 750));
        reply = scripted;
      } else {
        reply = await callAgent({
          data: {
            leadId: lead.id,
            companyId,
            history: history.map((m) => ({ role: m.role, text: m.text })),
          },
        });
      }
    } catch {
      // Auto-fallback to the script if the live call fails — the demo keeps going.
      reply = scripted;
    }

    setTyping(false);
    setMessages((m) => [...m, { role: "agent", text: reply.message, time: nowTime() }]);
    if (reply.status) setStatus(reply.status);
    if (reply.status === "booked" && reply.appointment) {
      setAppointment(reply.appointment);
      setLeads((ls) =>
        ls.map((l) => (l.id === lead.id ? { ...l, status: "Booked" as const } : l)),
      );
      setToast(true);
      setTimeout(() => setToast(false), 4500);
    }
  }

  const sMeta = STATUS_META[status];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1160px] px-[18px] pb-9 pt-5">
        {/* Header */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-[42px] place-items-center rounded-xl bg-gold text-[22px] shadow-glow-gold">
              ☀️
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold -tracking-[0.4px]">
                Solar<span className="text-gold">Wake</span>
              </h1>
              <p className="-mt-0.5 text-[12.5px] text-sub">
                We don't find new leads. We close the ones you already paid for.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setDemoMode((d) => !d)}
              title="Toggle scripted demo mode (no network needed)"
              className={`inline-flex items-center gap-[7px] rounded-full border px-3 py-[7px] text-xs font-bold ${
                demoMode
                  ? "border-gold bg-gold text-background"
                  : "border-line bg-panel text-sub"
              }`}
            >
              <span
                className={`size-[7px] rounded-full ${demoMode ? "bg-background" : "bg-success"}`}
              />
              {demoMode ? "Demo Mode (scripted)" : "Live AI"}
            </button>
            <div className="flex items-center gap-[7px] rounded-full border border-line bg-panel px-3 py-[7px] text-xs text-sub">
              <span className="size-[7px] rounded-full bg-gold shadow-glow-gold" />
              Powered by Lovable AI
            </div>
          </div>
        </header>

        <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT — CRM */}
          <section className="rounded-[18px] border border-line bg-panel p-[18px]">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs font-bold uppercase tracking-widest text-sub">
                {company.name} · {company.city}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-success-soft">
                <span className="size-[7px] rounded-full bg-success shadow-glow-green" />
                CRM {company.api}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2.5">
              {[
                { k: "Dormant leads", v: String(stats.dormant), sub: "in this pipeline" },
                { k: "Pipeline at risk", v: eur(stats.atRisk), sub: "already-paid leads" },
                {
                  k: "Appointments booked",
                  v: String(stats.booked),
                  sub: "no new ad spend",
                  hot: true,
                },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-xl border border-line bg-panel-2 p-3"
                >
                  <div
                    className={`font-extrabold ${s.v.length > 7 ? "text-lg" : "text-2xl"} ${s.hot ? "text-gold" : "text-foreground"}`}
                  >
                    {s.v}
                  </div>
                  <div className="mt-0.5 text-[11.5px] font-semibold leading-tight">
                    {s.k}
                  </div>
                  <div className="text-[10.5px] text-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {lead && (
              <div
                className={`mb-3.5 rounded-[14px] border-[1.5px] bg-gradient-to-b from-panel-2 to-panel p-4 transition-all duration-500 ${
                  status === "booked"
                    ? "border-success shadow-glow-green"
                    : status === "cold"
                      ? "border-line"
                      : "border-gold shadow-glow-gold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-panel-2 text-[13px] font-bold text-gold-soft">
                    {lead.seg === "Commercial" ? "🏢" : initials(lead.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">{lead.name}</div>
                    <div className="text-xs text-sub">
                      {lead.seg} · {lead.kw} kW · quoted {eur(lead.quote)} · {lead.days}d ago
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-[11px] py-[5px] text-xs font-bold transition-all ${sMeta.className}`}
                  >
                    {status === "booked" ? "✅ " : ""}
                    {sMeta.label}
                  </span>
                  {appointment && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-[11px] py-[5px] text-xs font-bold text-success-soft">
                      📅 {appointment}
                    </span>
                  )}
                  {status === "booked" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sub">
                      ✓ synced to CRM
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mb-2 text-[11.5px] tracking-wide text-sub">
              DORMANT LEADS — {company.name} · click one to work it
            </div>
            <div className="sw-scroll flex max-h-[250px] flex-col gap-2 overflow-y-auto pr-0.5">
              {companyLeads.map((l) => {
                const active = l.id === leadId;
                return (
                  <button
                    key={l.id}
                    onClick={() => pickLead(l.id)}
                    className={`flex w-full items-center gap-[11px] rounded-[11px] border px-3 py-2.5 text-left ${
                      active ? "border-gold bg-panel-2" : "border-line bg-background"
                    }`}
                  >
                    <div className="grid size-[30px] shrink-0 place-items-center rounded-full bg-panel-2 text-sm">
                      {l.seg === "Commercial" ? "🏢" : "🏠"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{l.name}</div>
                      <div className="text-[11px] text-sub">
                        quoted {eur(l.quote)} · {l.days}d ago
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] font-bold ${
                        l.status === "Booked"
                          ? "text-success-soft"
                          : l.status === "Warm"
                            ? "text-gold"
                            : l.status === "Contacting"
                              ? "text-gold-soft"
                              : "text-sub"
                      }`}
                    >
                      {l.status === "Booked" ? "✅ " : ""}
                      {l.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* RIGHT — WhatsApp */}
          <section className="rounded-[26px] bg-black p-2 shadow-phone">
            <div className="flex h-[620px] flex-col overflow-hidden rounded-[20px] bg-wa-wall">
              <div className="flex items-center gap-[11px] bg-wa-header px-3.5 py-3 text-white">
                <div className="grid size-[38px] shrink-0 place-items-center rounded-full bg-success text-[13px] font-bold text-wa-header">
                  {lead && (lead.seg === "Commercial" ? "🏢" : initials(lead.name))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">
                    {lead ? lead.name : "—"}
                  </div>
                  <div className="text-[11.5px] opacity-85">
                    {typing ? "typing…" : "online"}
                  </div>
                </div>
                <Phone size={18} />
              </div>

              <div
                ref={scrollRef}
                className="sw-scroll flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3.5"
              >
                {!started && (
                  <div className="m-auto max-w-[250px] text-center text-wa-bubble-text/60">
                    <p className="mb-3.5 text-[13px] leading-relaxed">
                      {lead
                        ? `This ${lead.seg.toLowerCase()} lead went cold ${lead.days} days ago after a ${eur(lead.quote)} quote. Press start to watch SolarWake win them back.`
                        : "Select a lead to begin."}
                    </p>
                    {lead && (
                      <button
                        onClick={start}
                        className="inline-flex items-center gap-2 rounded-full bg-wa-header px-5 py-2.5 text-sm font-bold text-white"
                      >
                        <Play size={14} /> Start reactivation
                      </button>
                    )}
                  </div>
                )}
                {messages.map((m, i) => {
                  const mine = m.role === "customer";
                  return (
                    <div
                      key={i}
                      className={`max-w-[82%] ${mine ? "self-end" : "self-start"}`}
                    >
                      <div
                        className={`rounded-[9px] px-2.5 pb-[5px] pt-[7px] text-sm leading-snug text-wa-bubble-text shadow-sm ${
                          mine
                            ? "rounded-tr-[2px] bg-wa-out"
                            : "rounded-tl-[2px] bg-wa-in"
                        }`}
                      >
                        {m.text}
                        <span className="float-right ml-2 mt-1 text-[10px] text-wa-bubble-text/45">
                          {m.time}
                          {mine ? " ✓✓" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="self-start rounded-[9px] rounded-tl-[2px] bg-wa-in px-3.5 py-2.5 shadow-sm">
                    <span className="sw-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                )}
              </div>

              {started && status !== "booked" && (
                <div className="sw-scroll flex gap-1.5 overflow-x-auto px-2.5 pt-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      disabled={typing}
                      className="whitespace-nowrap rounded-full border border-wa-header/25 bg-wa-in px-[11px] py-1.5 text-xs font-semibold text-wa-header disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 bg-wa-wall p-2.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void send(input);
                  }}
                  disabled={!started || typing}
                  placeholder={started ? "Reply as the customer…" : "Press start first"}
                  className="flex-1 rounded-full bg-wa-in px-3.5 py-2.5 text-sm text-wa-bubble-text outline-none placeholder:text-wa-bubble-text/40"
                />
                <button
                  onClick={() => void send(input)}
                  disabled={!started || typing}
                  aria-label="Send message"
                  className="grid size-[42px] shrink-0 place-items-center rounded-full bg-wa-header text-white disabled:opacity-60"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
          <p className="text-xs text-sub">
            ⚡ The agent runs live on Lovable AI. Same lead volume → more booked
            appointments.
          </p>
          <button
            onClick={() => pickCompany(companyId)}
            className="inline-flex items-center gap-[7px] rounded-full border border-line bg-panel px-3.5 py-2 text-[13px] font-semibold text-sub"
          >
            <RotateCcw size={14} /> Reset demo
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[14px] bg-success px-[22px] py-3.5 text-[15px] font-bold text-white shadow-phone">
          ✓ Appointment booked{appointment ? ` — ${appointment}` : ""} 🎉
        </div>
      )}
    </main>
  );
}
