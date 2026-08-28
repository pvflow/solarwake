import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { COMPANIES, CONTACTS, buildSystem, type AgentReply } from "./solarwake-data";

const Input = z.object({
  leadId: z.string(),
  companyId: z.string(),
  history: z
    .array(
      z.object({
        role: z.enum(["agent", "customer"]),
        text: z.string(),
      }),
    )
    .min(1),
});

const ReplySchema = z.object({
  message: z.string(),
  status: z.enum(["contacting", "warm", "booked"]),
  appointment: z.string().nullable(),
});

export const reactivationReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<AgentReply> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const company = COMPANIES.find((c) => c.id === data.companyId);
    const lead = CONTACTS.find((l) => l.id === data.leadId);
    if (!company || !lead) throw new Error("Unknown lead or company");

    const gateway = createLovableAiGatewayProvider(apiKey);

    const result = generateText({
      model: gateway("google/gemini-3.7-flash"),
      system: buildSystem(lead, company),
      messages: data.history.map((m) => ({
        role: m.role === "agent" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      })),
      output: Output.object({ schema: ReplySchema }),
    });

    const output = await (await result).output;
    return {
      message: output.message || "…",
      status: output.status,
      appointment: output.appointment || null,
    };
  });
