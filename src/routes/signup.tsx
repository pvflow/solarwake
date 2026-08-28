import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Check,
  KeyRound,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

const title = "Create your SolarWake account — 3-minute setup";
const description =
  "Sign up, paste your CRM API key and your WhatsApp API key, and SolarWake starts reactivating your dormant solar leads automatically.";

export const Route = createFileRoute("/signup")({
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
  component: SignupPage,
});

const CTA =
  "inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-brand transition-all duration-200 hover:scale-105 hover:brightness-105 active:brightness-95 disabled:pointer-events-none disabled:opacity-50";
const GHOST =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted";
const FIELD =
  "mt-1.5 w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand-2 focus:ring-2 focus:ring-ring/30";

const CRM_OPTIONS = ["HubSpot", "Pipedrive", "Salesforce", "Zoho", "Other / custom"];

const STEPS = [
  { n: 1, label: "Company", icon: Building2 },
  { n: 2, label: "CRM key", icon: KeyRound },
  { n: 3, label: "WhatsApp key", icon: MessageCircle },
];

const SYNC_STEPS = [
  "Authenticating CRM API key…",
  "Reading contacts & quotes…",
  "Found 1,284 dormant leads older than 30 days",
  "Verifying WhatsApp Business number…",
  "Briefing your AI assistant on your offer…",
  "Ready — your pipeline is live.",
];

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [crm, setCrm] = useState(CRM_OPTIONS[0]!);
  const [crmKey, setCrmKey] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [waKey, setWaKey] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncIndex, setSyncIndex] = useState(0);

  const canNext =
    step === 1
      ? company.trim().length > 1 && city.trim().length > 1 && email.includes("@")
      : step === 2
        ? crmKey.trim().length >= 8
        : waKey.trim().length >= 8 && waNumber.trim().length >= 6;

  useEffect(() => {
    if (!syncing) return;
    if (syncIndex >= SYNC_STEPS.length) {
      const done = setTimeout(() => {
        void navigate({ to: "/", hash: "demo", search: { onboarded: true } });
      }, 900);
      return () => clearTimeout(done);
    }
    const t = setTimeout(() => setSyncIndex((i) => i + 1), 750);
    return () => clearTimeout(t);
  }, [syncing, syncIndex, navigate]);

  function submit() {
    try {
      sessionStorage.setItem(
        "solarwake_onboarding",
        JSON.stringify({ company, city, email, crm }),
      );
    } catch {
      /* storage unavailable — demo continues */
    }
    setSyncing(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-base shadow-brand">
              ☀️
            </span>
            <span className="text-lg font-semibold tracking-tight">SolarWake</span>
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} /> Keys are stored encrypted
          </span>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-brand-gradient opacity-20 blur-[120px]"
        />
        <div className="container relative mx-auto max-w-4xl px-8 py-16">
          {syncing ? (
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-3xl font-semibold">Connecting {company || "your CRM"}</h1>
              <p className="mt-3 text-muted-foreground">
                No imports, no migration. SolarWake reads your pipeline and takes it from here.
              </p>
              <div className="mt-8 space-y-3 rounded-xl border border-border bg-card p-6 text-left shadow-sm">
                {SYNC_STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`flex items-center gap-3 text-sm transition-opacity ${
                      i < syncIndex
                        ? "text-foreground"
                        : i === syncIndex
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {i < syncIndex ? (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                        <Check size={12} />
                      </span>
                    ) : i === syncIndex ? (
                      <Loader2 size={20} className="shrink-0 animate-spin text-brand-2" />
                    ) : (
                      <span className="size-5 shrink-0 rounded-full border border-border" />
                    )}
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-semibold md:text-5xl">
                  Live in <span className="text-brand-gradient">3 minutes</span>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Tell us about your company, paste two API keys, and your dormant leads
                  start getting messaged. That&apos;s the whole setup.
                </p>
              </div>

              <ol className="mx-auto mt-10 flex max-w-lg items-center justify-between">
                {STEPS.map((s, i) => {
                  const active = step === s.n;
                  const done = step > s.n;
                  return (
                    <li key={s.n} className="flex flex-1 items-center gap-3 last:flex-none">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`grid size-10 place-items-center rounded-xl border text-sm font-semibold transition-colors ${
                            done
                              ? "border-transparent bg-success-soft text-success"
                              : active
                                ? "border-transparent bg-brand-gradient text-brand-foreground shadow-brand"
                                : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {done ? <Check size={16} /> : <s.icon size={16} />}
                        </span>
                        <span
                          className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <span
                          className={`mb-6 h-px flex-1 ${step > s.n ? "bg-success" : "bg-border"}`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="mx-auto mt-10 max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your company</h2>
                    <label className="block text-sm font-medium">
                      Company name
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="BrightRoof Solar"
                        className={FIELD}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      City / service area
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Munich"
                        className={FIELD}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Work email
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@brightroof.de"
                        className={FIELD}
                      />
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Connect your CRM</h2>
                    <p className="text-sm text-muted-foreground">
                      Copy the API key from your CRM settings and paste it here. We read
                      contacts, quotes and dates — nothing is changed on your side.
                    </p>
                    <label className="block text-sm font-medium">
                      CRM
                      <select
                        value={crm}
                        onChange={(e) => setCrm(e.target.value)}
                        className={FIELD}
                      >
                        {CRM_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-medium">
                      CRM API key
                      <input
                        value={crmKey}
                        onChange={(e) => setCrmKey(e.target.value)}
                        placeholder="pat-eu1-••••-••••-••••"
                        className={`${FIELD} font-mono`}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Demo environment — use any placeholder key.
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Connect WhatsApp</h2>
                    <p className="text-sm text-muted-foreground">
                      Paste the API key of your WhatsApp Business account. Your leads get
                      messages from your own number.
                    </p>
                    <label className="block text-sm font-medium">
                      WhatsApp Business number
                      <input
                        value={waNumber}
                        onChange={(e) => setWaNumber(e.target.value)}
                        placeholder="+49 151 1234567"
                        className={FIELD}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      WhatsApp API key
                      <input
                        value={waKey}
                        onChange={(e) => setWaKey(e.target.value)}
                        placeholder="EAAG••••••••••••"
                        className={`${FIELD} font-mono`}
                      />
                    </label>
                  </div>
                )}

                <div className="mt-7 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button onClick={() => setStep((s) => s - 1)} className={GHOST}>
                      Back
                    </button>
                  ) : (
                    <Link to="/" className={GHOST}>
                      Cancel
                    </Link>
                  )}
                  {step < 3 ? (
                    <button
                      disabled={!canNext}
                      onClick={() => setStep((s) => s + 1)}
                      className={CTA}
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button disabled={!canNext} onClick={submit} className={CTA}>
                      Finish & start reactivating <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              <p className="mx-auto mt-6 max-w-xl text-center text-xs text-muted-foreground">
                No data migration, no new tools for your sales team. The AI assistant pulls
                dormant leads straight from your CRM and starts the conversation.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
