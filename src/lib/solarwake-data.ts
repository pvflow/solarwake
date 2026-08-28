export type Company = {
  id: string;
  name: string;
  city: string;
  api: string;
};

export type LeadStatus = "Cold" | "Contacting" | "Warm" | "Booked";

export type Lead = {
  id: string;
  co: string;
  name: string;
  seg: "Residential" | "Commercial";
  city: string;
  kw: number;
  quote: number;
  days: number;
  status: LeadStatus;
  phone: string;
};

export type AgentStatus = "cold" | "contacting" | "warm" | "booked";

export type AgentReply = {
  message: string;
  status: Exclude<AgentStatus, "cold">;
  appointment: string | null;
};

export const COMPANIES: Company[] = [
  { id: "SW-001", name: "BrightRoof Solar", city: "Munich", api: "Live" },
  { id: "SW-002", name: "HelioHaus GmbH", city: "Berlin", api: "Live" },
  { id: "SW-003", name: "SonnenKraft Nord", city: "Hamburg", api: "Live" },
  { id: "SW-005", name: "AlpenVolt AG", city: "Zurich", api: "Live" },
];

export const CONTACTS: Lead[] = [
  { id: "C-1001", co: "SW-001", name: "Michael Weber", seg: "Residential", city: "Munich", kw: 8, quote: 14200, days: 47, status: "Cold", phone: "+491511234567" },
  { id: "C-1002", co: "SW-001", name: "Sofia Klein", seg: "Residential", city: "Munich", kw: 6.5, quote: 9800, days: 62, status: "Contacting", phone: "+491602345678" },
  { id: "C-1003", co: "SW-001", name: "Jonas Braun", seg: "Residential", city: "Augsburg", kw: 11, quote: 21400, days: 38, status: "Warm", phone: "+491703456789" },
  { id: "C-1004", co: "SW-001", name: "Amelie Roth", seg: "Residential", city: "Munich", kw: 5.5, quote: 12100, days: 90, status: "Cold", phone: "+491514567890" },
  { id: "C-1005", co: "SW-001", name: "David Fischer", seg: "Residential", city: "Rosenheim", kw: 9.5, quote: 17600, days: 51, status: "Cold", phone: "+491605678901" },
  { id: "C-1006", co: "SW-001", name: "Bäckerei Hofmann GmbH", seg: "Commercial", city: "Munich", kw: 42, quote: 48500, days: 73, status: "Cold", phone: "+498912345678" },
  { id: "C-1007", co: "SW-001", name: "Weber & Sohn Logistik", seg: "Commercial", city: "Dachau", kw: 95, quote: 112000, days: 44, status: "Warm", phone: "+498131234567" },
  { id: "C-1008", co: "SW-002", name: "Lena Schuster", seg: "Residential", city: "Berlin", kw: 7, quote: 13100, days: 55, status: "Cold", phone: "+491512223344" },
  { id: "C-1009", co: "SW-002", name: "Paul Neumann", seg: "Residential", city: "Potsdam", kw: 10, quote: 19800, days: 29, status: "Contacting", phone: "+491603334455" },
  { id: "C-1010", co: "SW-002", name: "Café Sonnendeck", seg: "Commercial", city: "Berlin", kw: 28, quote: 36700, days: 81, status: "Cold", phone: "+493044556677" },
  { id: "C-1012", co: "SW-003", name: "Erik Hansen", seg: "Residential", city: "Hamburg", kw: 8.5, quote: 15600, days: 67, status: "Cold", phone: "+491515556677" },
  { id: "C-1013", co: "SW-003", name: "Nina Fischer", seg: "Residential", city: "Lübeck", kw: 7.5, quote: 13900, days: 33, status: "Warm", phone: "+491606667788" },
  { id: "C-1014", co: "SW-003", name: "Nordwind Hotel GmbH", seg: "Commercial", city: "Hamburg", kw: 60, quote: 74000, days: 58, status: "Cold", phone: "+494030001122" },
  { id: "C-1019", co: "SW-005", name: "Andreas Meier", seg: "Residential", city: "Zurich", kw: 9, quote: 22500, days: 41, status: "Warm", phone: "+41791234567" },
  { id: "C-1020", co: "SW-005", name: "Claudia Brunner", seg: "Residential", city: "Winterthur", kw: 6.5, quote: 17800, days: 60, status: "Cold", phone: "+41782345678" },
  { id: "C-1021", co: "SW-005", name: "Bergblick Praxis AG", seg: "Commercial", city: "Zug", kw: 22, quote: 39900, days: 53, status: "Contacting", phone: "+41412223344" },
];

export const eur = (n: number) => "€" + n.toLocaleString("de-DE");

export const QUICK = [
  "Oh right, I forgot about this",
  "It's honestly a bit expensive",
  "I already got another quote",
  "Does it really lower my bill?",
  "Ok sure — when can we talk?",
];

/** Scripted fallback so a stage demo never depends on wifi. */
export const SCRIPT: AgentReply[] = [
  {
    message:
      "So glad you replied! 😊 A lot has changed — there's a subsidy round closing soon that can meaningfully cut your upfront cost. Want me to walk you through the new numbers?",
    status: "warm",
    appointment: null,
  },
  {
    message:
      "Totally fair. Most customers we reactivate end up cutting their electricity bill 50–70%, and with financing there's often no money upfront. Could I book you a quick 15-min call with an advisor — Thursday 6pm or Friday morning? 🙂",
    status: "warm",
    appointment: null,
  },
  {
    message:
      "Perfect — you're booked for Thursday at 6:00 PM. You'll get a WhatsApp confirmation shortly. Talk soon! ☀️",
    status: "booked",
    appointment: "Thursday 6:00 PM",
  },
];

export function buildSystem(lead: Lead, company: Company) {
  const biz = lead.seg === "Commercial";
  return `You are SolarWake, an AI reactivation assistant for ${company.name}, following up over WhatsApp as "Lina".
You are messaging ${lead.name}${biz ? " (a commercial / business lead)" : ""}, who was quoted ${eur(lead.quote)} for a ${lead.kw} kW ${biz ? "commercial " : ""}solar system ${lead.days} days ago in ${lead.city}, then went quiet.
Goal: warmly re-engage, answer briefly, handle objections, create gentle honest urgency (subsidy round closing, install slots before winter${biz ? ", clear ROI / payback for the business" : ", bill savings"}), and book a 15-minute call with a human advisor${biz ? " or decision-maker" : ""}.
Style: WhatsApp voice — short 1-2 sentence messages, friendly, an occasional emoji, never pushy.${biz ? " Slightly more professional, business tone." : ""} Offer specific time slots.
Use "warm" once interest returns; use "booked" and fill "appointment" ONLY once a specific day/time is agreed (format "Day at Time"). Move toward a booking within a few messages.`;
}

export function opener(lead: Lead, company: Company) {
  const biz = lead.seg === "Commercial";
  const who = biz ? "there" : lead.name.split(" ")[0];
  return `Hi ${who}! 👋 It's Lina from ${company.name}. A while back we put together a solar quote for ${biz ? "your business" : "your home"} — I wanted to reach out before the current subsidy round closes. Are you still thinking about going solar? ☀️`;
}
