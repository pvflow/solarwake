import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  Clock,
  MessageSquare,
  Phone,
  Play,
  Plug,
  RotateCcw,
  Send,
  Snowflake,
  Sparkles,
  TrendingDown,
  Wallet,
} from "lucide-react";
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
  "SolarWake reactivates your dormant solar leads over WhatsApp and books appointments automatically — no new ad spend.";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { onboarded?: boolean } =>
    search["onboarded"] === true || search["onboarded"] === "true"
      ? { onboarded: true }
      : {},


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

const STATUS_META: Record<AgentStatus, { label: string; className: string }> = {
  cold: { label: "Cold · dormant", className: "bg-muted text-muted-foreground" },
  contacting: { label: "Contacting…", className: "bg-brand-tint text-foreground" },
  warm: { label: "Warm · engaged", className: "bg-brand-tint text-foreground" },
  booked: { label: "Appointment booked", className: "bg-success-soft text-success" },
};

const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-brand transition-all duration-200 hover:scale-105 hover:brightness-105 active:brightness-95";

const GHOST_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:scale-105 hover:bg-muted";

const PAINS = [
  {
    icon: Wallet,
    title: "Paid leads, no revenue",
    body: "Every dormant quote is money you already spent on ads sitting untouched in the CRM.",
  },
  {
    icon: Clock,
    title: "Follow-up dies on day 3",
    body: "Sales teams chase the hot ones. Anything older than a week quietly disappears.",
  },
  {
    icon: Snowflake,
    title: "Cold isn't dead",
    body: "Most homeowners still want solar — they just went quiet while comparing options.",
  },
  {
    icon: TrendingDown,
    title: "Rising cost per lead",
    body: "Scaling ad spend to hit targets is the expensive answer to a pipeline you already own.",
  },
];

const SOLUTIONS = [
  {
    icon: MessageSquare,
    title: "WhatsApp reactivation",
    bullets: [
      "Personalised opener referencing their exact quote",
      "Natural, human-paced conversation — never a blast",
      "Handles objections on price, timing and roof questions",
    ],
    benefit: "Dormant quotes turn back into live conversations.",
  },
  {
    icon: CalendarCheck,
    title: "Autonomous booking",
    bullets: [
      "Offers real slots from your consultants' calendars",
      "Confirms, reminds and reschedules without a human",
      "Writes the appointment straight back into the CRM",
    ],
    benefit: "Appointments appear while your team sleeps.",
  },
  {
    icon: Plug,
    title: "Plugs into your CRM",
    bullets: [
      "Reads dormant pipeline directly from your system",
      "Syncs status, notes and transcripts in real time",
      "No migration, no new tool for your sales reps",
    ],
    benefit: "Zero workflow change for the people selling.",
  },
  {
    icon: BellRing,
    title: "Handover when it's hot",
    bullets: [
      "Flags warm intent the moment it appears",
      "Escalates complex commercial deals to a human",
      "Full conversation context handed to the rep",
    ],
    benefit: "Your closers only touch ready-to-buy leads.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "We link SolarWake to your CRM and WhatsApp number in a single onboarding call.",
  },
  {
    n: "02",
    title: "Reactivate",
    body: "The agent works your dormant list conversation by conversation, in your brand voice.",
  },
  {
    n: "03",
    title: "Book",
    body: "Qualified appointments land in your consultants' calendars, synced back to the CRM.",
  },
];

function SolarWake() {
  const callAgent = useServerFn(reactivationReply);

  const [leads, setLeads] = useState<Lead[]>(CONTACTS);
  const [companyId] = useState("SW-001");
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
  const lead =
    leads.find((l) => l.id === leadId) ?? leads.find((l) => l.co === companyId);
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
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    const scripted =
      SCRIPT[Math.min(turn - 1, SCRIPT.length - 1)] ?? SCRIPT[SCRIPT.length - 1]!;

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-base shadow-brand">
              ☀️
            </span>
            <span className="text-lg font-semibold tracking-tight">SolarWake</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#why" className="transition-colors hover:text-foreground">
              Why
            </a>
            <a href="#solutions" className="transition-colors hover:text-foreground">
              Solutions
            </a>
            <a href="#process" className="transition-colors hover:text-foreground">
              Process
            </a>
            <a href="#demo" className="transition-colors hover:text-foreground">
              Live demo
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#demo"
              className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              See it live
            </a>
            <Link to="/signup" className={CTA_CLASS}>
              Sign up <ArrowRight className="size-4" />
            </Link>
          </div>

        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 size-[620px] -translate-x-1/2 rounded-full bg-brand-gradient opacity-20 blur-[120px]"
          />
          <div className="container relative mx-auto max-w-6xl px-8 py-20 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="size-3.5" />
              AI lead reactivation for solar installers
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold md:text-5xl">
              We don't find new leads. We close the ones{" "}
              <span className="text-brand-gradient">you already paid for.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              SolarWake wakes up your dormant quotes over WhatsApp, handles the
              objections and books qualified appointments straight into your calendar —
              without a single euro of extra ad spend.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="#demo" className={CTA_CLASS}>
                Watch the live demo <ArrowRight className="size-4" />
              </a>
              <a href="#solutions" className={GHOST_CLASS}>
                How it works
              </a>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Works with your CRM · Live in under a week · Powered by Lovable AI
            </p>
          </div>
        </section>

        {/* Why */}
        <section id="why" className="border-t border-border bg-muted/40 py-20">
          <div className="container mx-auto max-w-6xl px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">
                Your pipeline is already full. It's just cold.
              </h2>
              <p className="mt-4 text-muted-foreground">
                The most expensive leads in your CRM are the ones you paid for and never
                closed.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PAINS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:scale-105"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-tint text-foreground">
                    <p.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <a href="#demo" className={CTA_CLASS}>
                See what reactivation looks like <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section id="solutions" className="py-20">
          <div className="container mx-auto max-w-6xl px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">One agent, the whole follow-up</h2>
              <p className="mt-4 text-muted-foreground">
                SolarWake handles every step between a forgotten quote and a booked
                appointment.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {SOLUTIONS.map((s) => (
                <div
                  key={s.title}
                  className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-brand">
                      <s.icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {s.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex gap-2.5 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-2" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 rounded-xl bg-muted p-3 text-sm font-medium">
                    {s.benefit}
                  </p>
                  <div className="mt-5 pt-1">
                    <a href="#demo" className={CTA_CLASS}>
                      Try it in the demo <ArrowRight className="size-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="border-y border-border bg-muted/40 py-20">
          <div className="container mx-auto max-w-6xl px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">Live in three steps</h2>
              <p className="mt-4 text-muted-foreground">
                No migration, no new software for your sales team to learn.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <span className="text-sm font-semibold text-brand-gradient">
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <a href="#demo" className={CTA_CLASS}>
                Start the reactivation demo <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Live demo — CRM + WhatsApp */}
        <section id="demo" className="py-20">
          <div className="container mx-auto max-w-6xl px-8">
            {onboarded && (
              <div className="mx-auto mb-10 flex max-w-2xl items-start gap-3 rounded-xl border border-border bg-success-soft/60 p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">
                    {onboardingName ?? company.name} is connected
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    CRM and WhatsApp keys verified. Your dormant leads were imported
                    automatically — pick one below and watch the assistant work.
                  </p>
                </div>
              </div>
            )}
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">See it work on a real pipeline</h2>
              <p className="mt-4 text-muted-foreground">
                Pick a dormant lead, start the reactivation, and reply as the customer.
                The agent runs live.
              </p>
            </div>


            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => setDemoMode((d) => !d)}
                title="Toggle scripted demo mode (no network needed)"
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  demoMode
                    ? "border-transparent bg-brand-gradient text-brand-foreground shadow-brand"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${demoMode ? "bg-brand-foreground" : "bg-success"}`}
                />
                {demoMode ? "Demo mode (scripted)" : "Live AI"}
              </button>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-brand-2" />
                Powered by Lovable AI
              </span>
            </div>

            <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              {/* CRM panel */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {company.name} · {company.city}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    CRM {company.api}
                  </span>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-3">
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
                      className={`rounded-xl border p-4 ${s.hot ? "border-transparent bg-brand-tint" : "border-border bg-muted/50"}`}
                    >
                      <div
                        className={`font-semibold tracking-tight ${s.v.length > 7 ? "text-xl" : "text-2xl"}`}
                      >
                        {s.v}
                      </div>
                      <div className="mt-1 text-sm font-medium">{s.k}</div>
                      <div className="text-xs text-muted-foreground">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {lead && (
                  <div
                    className={`mb-6 rounded-xl border bg-background p-5 transition-all duration-500 ${
                      status === "booked"
                        ? "border-success/40 shadow-sm"
                        : status === "cold"
                          ? "border-border"
                          : "border-brand-2/50 shadow-brand"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-tint text-sm font-semibold">
                        {lead.seg === "Commercial" ? "🏢" : initials(lead.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.seg} · {lead.kw} kW · quoted {eur(lead.quote)} ·{" "}
                          {lead.days}d ago
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${sMeta.className}`}
                      >
                        {status === "booked" ? "✅ " : ""}
                        {sMeta.label}
                      </span>
                      {appointment && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                          📅 {appointment}
                        </span>
                      )}
                      {status === "booked" && (
                        <span className="text-xs font-medium text-muted-foreground">
                          ✓ synced to CRM
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Dormant leads — click one to work it
                </div>
                <div className="sw-scroll flex max-h-[260px] flex-col gap-2 overflow-y-auto pr-1">
                  {companyLeads.map((l) => {
                    const active = l.id === leadId;
                    return (
                      <button
                        key={l.id}
                        onClick={() => pickLead(l.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          active
                            ? "border-brand-2 bg-brand-tint"
                            : "border-border bg-background hover:bg-muted/60"
                        }`}
                      >
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm">
                          {l.seg === "Commercial" ? "🏢" : "🏠"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{l.name}</div>
                          <div className="text-xs text-muted-foreground">
                            quoted {eur(l.quote)} · {l.days}d ago
                          </div>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-semibold ${
                            l.status === "Booked"
                              ? "text-success"
                              : l.status === "Cold"
                                ? "text-muted-foreground"
                                : "text-foreground"
                          }`}
                        >
                          {l.status === "Booked" ? "✅ " : ""}
                          {l.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp simulator */}
              <div className="rounded-[2rem] border border-border bg-card p-2.5 shadow-phone">
                <div className="flex h-[620px] flex-col overflow-hidden rounded-[1.6rem] bg-wa-wall">
                  <div className="flex items-center gap-3 bg-wa-header px-4 py-3 text-white">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-semibold">
                      {lead && (lead.seg === "Commercial" ? "🏢" : initials(lead.name))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {lead ? lead.name : "—"}
                      </div>
                      <div className="text-xs opacity-80">
                        {typing ? "typing…" : "online"}
                      </div>
                    </div>
                    <Phone size={18} />
                  </div>

                  <div
                    ref={scrollRef}
                    className="sw-scroll flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4"
                  >
                    {!started && (
                      <div className="m-auto max-w-[260px] text-center">
                        <p className="mb-4 text-sm leading-relaxed text-wa-bubble-text/70">
                          {lead
                            ? `This ${lead.seg.toLowerCase()} lead went cold ${lead.days} days ago after a ${eur(lead.quote)} quote. Press start to watch SolarWake win them back.`
                            : "Select a lead to begin."}
                        </p>
                        {lead && (
                          <button onClick={start} className={CTA_CLASS}>
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
                            className={`rounded-xl px-3 pb-1.5 pt-2 text-sm leading-snug text-wa-bubble-text shadow-sm ${
                              mine ? "rounded-tr-sm bg-wa-out" : "rounded-tl-sm bg-wa-in"
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
                      <div className="self-start rounded-xl rounded-tl-sm bg-wa-in px-4 py-2.5 shadow-sm">
                        <span className="sw-dots">
                          <i />
                          <i />
                          <i />
                        </span>
                      </div>
                    )}
                  </div>

                  {started && status !== "booked" && (
                    <div className="sw-scroll flex gap-2 overflow-x-auto px-3 pt-2">
                      {QUICK.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          disabled={typing}
                          className="whitespace-nowrap rounded-full border border-wa-header/20 bg-wa-in px-3 py-1.5 text-xs font-medium text-wa-header disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void send(input);
                      }}
                      disabled={!started || typing}
                      placeholder={
                        started ? "Reply as the customer…" : "Press start first"
                      }
                      className="flex-1 rounded-full bg-wa-in px-4 py-2.5 text-sm text-wa-bubble-text outline-none placeholder:text-wa-bubble-text/40"
                    />
                    <button
                      onClick={() => void send(input)}
                      disabled={!started || typing}
                      aria-label="Send message"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-wa-header text-white disabled:opacity-60"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Same lead volume → more booked appointments.
              </p>
              <button
                onClick={() => {
                  setLeads(CONTACTS);
                  pickLead(leadId);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw size={14} /> Reset demo
              </button>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border bg-muted/40 py-20">
          <div className="container mx-auto max-w-3xl px-8 text-center">
            <h2 className="text-3xl font-semibold">
              Turn last quarter's quotes into next week's appointments
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We'll reactivate your dormant pipeline on a pilot list before you commit to
              anything.
            </p>
            <div className="mt-9">
              <a href="#demo" className={CTA_CLASS}>
                Book a walkthrough <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} SolarWake</span>
          <span>AI lead reactivation for solar installers</span>
        </div>
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-success px-6 py-3.5 text-sm font-semibold text-white shadow-phone">
          ✓ Appointment booked{appointment ? ` — ${appointment}` : ""} 🎉
        </div>
      )}
    </div>
  );
}
