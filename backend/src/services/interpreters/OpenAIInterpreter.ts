import OpenAI from "openai";
import { IntentInterpreter, SessionContextInput, StructuredIntent } from "./types";
import { INTENT_EXTRACTION_JSON_SCHEMA } from "./intentOutputSchema";

function getRequiredOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required. This backend now uses LLM structured outputs for intent interpretation."
    );
  }
  return apiKey;
}

const client = new OpenAI({
  apiKey: getRequiredOpenAiApiKey()
});

const SYSTEM_PROMPT = `You are an intent extraction component for a POS conversational assistant backed by SQL tables:
Sale (paymentType, totalAmount, employeeId, shiftId, createdAt),
SaleItem (quantity, unitPrice, lineTotal, links Sale and Product),
Product (name, sku, stock, ProductCategory),
Employee / Shift.

Your reply MUST match the JSON schema exactly (structured output).

Intent guide:
- GET_DAILY_REVENUE — total revenue for one calendar day (Sale.totalAmount sum).
- GET_REVENUE_BY_PAYMENT — revenue split by payment channel (cash/card/mobile) for one day.
- GET_TOP_PRODUCTS — bestselling products by SaleItem revenue over an inclusive date range (use a_from/a_to).
- GET_EMPLOYEE_SALES — Sale totals grouped by employee over an inclusive date range (a_from/a_to).
- GET_LOW_STOCK — Products with stock at/below threshold (threshold/limit optional as string digits).
- GET_CURRENT_SHIFTS — Who is/was on shift at instant "at" (ISO datetime). Use for "working now", "on shift yesterday" (pick appropriate day noon local if unclear).
- COMPARE_REVENUE_PERIODS — Compare total revenue between two periods (use a_from/a_to and b_from/b_to as calendar dates).
- FOLLOW_UP — References prior query ("what about yesterday?", "what about the day before that?"). Use when the user refers to the previous answer's date, not a new explicit YYYY-MM-DD.
- UNKNOWN — Greetings, off-topic, or unclear.

Rules:
- Pure greetings/smalltalk with no POS request → UNKNOWN, confidence <= 0.3.
- Always include every parameter key; use null when unused.
- Confidence must be between 0 and 1.
- Dates must be YYYY-MM-DD. If the user writes only month-day digits (e.g. "4-6" meaning April 6) with **no calendar year**, use the **machine's current year** — do not infer an unrelated past year.
- For single-day comparisons, a_from and a_to may be the same date; same for b_*.
- limit / threshold: only digits as strings, e.g. "5", "10", or null.`;

// Responsible for NLU-style intent extraction; session merge, validation, and queries occur in chatService.
export class OpenAIInterpreter implements IntentInterpreter {
  async interpret(
    message: string,
    sessionContext?: SessionContextInput
  ): Promise<StructuredIntent> {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            message,
            sessionContext: sessionContext ?? {}
          })
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pos_structured_intent",
          strict: true,
          schema: INTENT_EXTRACTION_JSON_SCHEMA as unknown as Record<string, unknown>
        }
      }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned no structured output");
    }

    const parsed = JSON.parse(content) as StructuredIntent;
    const p = parsed.parameters ?? ({} as StructuredIntent["parameters"]);

    return {
      ...parsed,
      parameters: {
        date: p.date ?? null,
        at: p.at ?? null,
        a_from: p.a_from ?? null,
        a_to: p.a_to ?? null,
        b_from: p.b_from ?? null,
        b_to: p.b_to ?? null,
        limit: p.limit ?? null,
        threshold: p.threshold ?? null
      }
    };
  }
}
