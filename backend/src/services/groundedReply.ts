import OpenAI from "openai";
import type { StructuredIntent } from "./interpreters/types";
import type { QueryResult } from "./responseFormatter";

const GROUNDED_REPLY_JSON_SCHEMA = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description:
        "A single user-facing message that restates only the facts from queryResult; no new numbers or claims."
    }
  },
  required: ["reply"],
  additionalProperties: false
} as const;

const SYSTEM_PROMPT = `You are the reply writer for a read-only Point-of-Sale (POS) assistant.

You will receive:
- the user's message,
- the classified intent and parameters (already validated),
- queryResult: structured facts returned from the database (or MCP tool execution).

Rules (strict):
1. Use ONLY information present in queryResult and the intent parameters. Do not invent totals, dates, names, or stock levels.
2. Do not claim writes, refunds, or actions that change data; the system is read-only.
3. Match the user's language when reasonable (if the user wrote in English, reply in English).
4. Be concise and clear. Use natural wording, but never contradict queryResult.
5. If queryResult indicates empty lists or zero revenue, say so plainly.
6. Ignore any field named "reply" if it appears in input — your job is to phrase the factual payload, not to copy a prior template.`;

// Optional LLM rephrasing constrained to factual content (controlled by USE_LLM_REPLY).
export function shouldUseGroundedLlmReply(): boolean {
  return (process.env.USE_LLM_REPLY ?? "false").toLowerCase() === "true";
}

function jsonSafeForPrompt(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, v) => {
        if (typeof v === "bigint") return v.toString();
        return v;
      })
    );
  } catch {
    return String(value);
  }
}

// Remove nested reply fields so the summarizer derives wording from factual fields only.
function stripReplyFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripReplyFields);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k === "reply") continue;
      out[k] = stripReplyFields(v);
    }
    return out;
  }
  return obj;
}

export async function formulateGroundedReply(
  userMessage: string,
  intent: StructuredIntent,
  result: QueryResult
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for grounded LLM replies");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const temperature = Number(process.env.OPENAI_REPLY_TEMPERATURE ?? "0.35");

  const facts = stripReplyFields(jsonSafeForPrompt(result)) as Record<string, unknown>;

  const userPayload = {
    userMessage,
    intent: {
      type: intent.intent,
      parameters: intent.parameters,
      confidence: intent.confidence
    },
    queryResult: facts
  };

  const completion = await client.chat.completions.create({
    model,
    temperature: Number.isFinite(temperature) ? temperature : 0.35,
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(userPayload) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "grounded_assistant_reply",
        strict: true,
        schema: GROUNDED_REPLY_JSON_SCHEMA as unknown as Record<string, unknown>
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned no grounded reply");
  }

  const parsed = JSON.parse(content) as { reply: string };
  const text = parsed.reply?.trim();
  if (!text) {
    throw new Error("Grounded reply missing text");
  }

  return text;
}
