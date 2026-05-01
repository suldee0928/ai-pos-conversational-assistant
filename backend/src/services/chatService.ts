// Main chat orchestration: intent handling, session context, validation, persistence, response generation.
import { validateIntent } from "./intentValidator";
import { dispatchQuery } from "./queryDispatcher";
import { getSessionContext, updateSessionContext } from "./contextManager";
import { getInterpreter } from "./interpreters";
import type { StructuredIntent } from "./interpreters/types";
import { formatAssistantResponse } from "./responseFormatter";
import { formulateGroundedReply, shouldUseGroundedLlmReply } from "./groundedReply";
import {
  inferIsoDateFromBareMonthDayInMessage,
  normalizeBareMonthDayParam
} from "./dateInference";
import { IntentType } from "../domain/intentTypes";

function shiftIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

function todayIso(): string {
  return formatLocalDate(new Date());
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveRelativeDate(value: string | null): string | null {
  if (!value) return null;

  const lower = value.toLowerCase();
  const today = todayIso();

  if (lower === "today") return today;
  if (lower === "yesterday") return shiftIsoDate(today, -1);
  if (lower === "tomorrow") return shiftIsoDate(today, 1);
  if (lower === "day before") return shiftIsoDate(today, -1);
  if (lower === "day after") return shiftIsoDate(today, 1);

  return value;
}

function resolveRelativeDateFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  const today = todayIso();

  // Contextual phrases ("day before that") are resolved using session history, not literal calendar shortcuts.
  if (
    /\b(day\s+before\s+that|before\s+that|day\s+after\s+that|after\s+that|the\s+previous\s+day|the\s+next\s+day)\b/.test(
      lower
    )
  ) {
    return null;
  }

  if (lower.includes("today")) return today;
  if (lower.includes("yesterday")) return shiftIsoDate(today, -1);
  if (lower.includes("tomorrow")) return shiftIsoDate(today, 1);
  if (lower.includes("day after")) return shiftIsoDate(today, 1);
  if (lower.includes("day before")) return shiftIsoDate(today, -1);

  return null;
}

const POS_TOPIC_HINT =
  /revenue|sale|sales|money|earn|profit|shift|working|work|worker|employee|staff|cashier|manager|compare|comparison|period|made|total|transaction|pos|register|inventory|stock|product|payment|cash|card|mobile|popular|best\s+sell|top\s+products|low\s+stock|yesterday|today|tomorrow|what\s+about|before|after|that|previous|next|follow-up|same\s+period|\d{4}-\d{2}-\d{2}/i;

// After FOLLOW_UP merges prior parameters, adjust dates relative to the last answered date when wording such as "the day before/after that" is used.
function adjustFollowUpAgainstPreviousMessage(
  message: string,
  intent: StructuredIntent,
  context: ReturnType<typeof getSessionContext>
): void {
  const lower = message.toLowerCase();
  const prevDate = context.lastParameters?.date;
  const prevAt = context.lastParameters?.at;

  const dayBeforeThat =
    /\b(day\s+before\s+that|before\s+that|the\s+previous\s+day|previous\s+day|one\s+day\s+earlier)\b/i.test(
      lower
    );
  const dayAfterThat =
    /\b(day\s+after\s+that|after\s+that|the\s+next\s+day|next\s+day|one\s+day\s+later)\b/i.test(lower);

  if (
    intent.intent === IntentType.GET_DAILY_REVENUE ||
    intent.intent === IntentType.GET_REVENUE_BY_PAYMENT
  ) {
    if (dayBeforeThat && prevDate && /^\d{4}-\d{2}-\d{2}$/.test(prevDate)) {
      intent.parameters.date = shiftIsoDate(prevDate, -1);
      return;
    }
    if (dayAfterThat && prevDate && /^\d{4}-\d{2}-\d{2}$/.test(prevDate)) {
      intent.parameters.date = shiftIsoDate(prevDate, 1);
      return;
    }
  }

  if (intent.intent === IntentType.GET_CURRENT_SHIFTS && prevAt) {
    try {
      const baseDay = formatLocalDate(new Date(prevAt));
      if (dayBeforeThat) {
        intent.parameters.at = localNoonIsoForCalendarDate(shiftIsoDate(baseDay, -1));
      } else if (dayAfterThat) {
        intent.parameters.at = localNoonIsoForCalendarDate(shiftIsoDate(baseDay, 1));
      }
    } catch {
      /* ignore */
    }
  }

  if (intent.intent === IntentType.GET_TOP_PRODUCTS || intent.intent === IntentType.GET_EMPLOYEE_SALES) {
    const prevFrom = context.lastParameters?.a_from ?? context.lastParameters?.date;
    const prevTo = context.lastParameters?.a_to ?? context.lastParameters?.date;
    const singleDay =
      prevFrom &&
      prevTo &&
      prevFrom === prevTo &&
      /^\d{4}-\d{2}-\d{2}$/.test(prevFrom);
    if (singleDay && dayBeforeThat) {
      const d = shiftIsoDate(prevFrom, -1);
      intent.parameters.a_from = d;
      intent.parameters.a_to = d;
    } else if (singleDay && dayAfterThat) {
      const d = shiftIsoDate(prevFrom, 1);
      intent.parameters.a_from = d;
      intent.parameters.a_to = d;
    }
  }
}

function looksLikeChitchatOnly(message: string): boolean {
  const t = message.trim();
  if (t.length > 80) return false;
  return /^(hi|hello|hey|thanks|thank you|thx|ok|okay|bye|goodbye|good morning|good afternoon)\.?$/i.test(
    t
  );
}

function sanitizeIntentClassification(message: string, intent: StructuredIntent): void {
  if (intent.intent === IntentType.FOLLOW_UP) {
    return;
  }

  if (looksLikeChitchatOnly(message) && !POS_TOPIC_HINT.test(message)) {
    intent.intent = IntentType.UNKNOWN;
    intent.confidence = 0.15;
    return;
  }

  const shortText = message.trim().length < 36;
  if (
    shortText &&
    !POS_TOPIC_HINT.test(message) &&
    (intent.intent === IntentType.GET_DAILY_REVENUE ||
      intent.intent === IntentType.GET_CURRENT_SHIFTS ||
      intent.intent === IntentType.COMPARE_REVENUE_PERIODS ||
      intent.intent === IntentType.GET_REVENUE_BY_PAYMENT ||
      intent.intent === IntentType.GET_TOP_PRODUCTS ||
      intent.intent === IntentType.GET_EMPLOYEE_SALES ||
      intent.intent === IntentType.GET_LOW_STOCK)
  ) {
    intent.intent = IntentType.UNKNOWN;
    intent.confidence = 0.15;
  }
}

function localNoonIsoForCalendarDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toISOString();
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;

  const coercedBare = normalizeBareMonthDayParam(value);
  const v = typeof coercedBare === "string" ? coercedBare : value;

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return v;
  }

  return value;
}

function applyBareMonthDayFromUserMessage(message: string, intent: StructuredIntent): void {
  if (
    intent.intent !== IntentType.GET_DAILY_REVENUE &&
    intent.intent !== IntentType.GET_REVENUE_BY_PAYMENT
  ) {
    return;
  }
  const inferred = inferIsoDateFromBareMonthDayInMessage(message);
  if (inferred) {
    intent.parameters.date = inferred;
  }
}

function extractMcpReply(result: unknown): string | undefined {
  if (!result || typeof result !== "object" || !("data" in result)) {
    return undefined;
  }

  const data = (result as { data?: unknown }).data;
  if (!data || typeof data !== "object" || !("reply" in data)) {
    return undefined;
  }

  const reply = (data as { reply?: unknown }).reply;
  return typeof reply === "string" ? reply : undefined;
}

type ReplySource = "mcp" | "formatter" | "llm_grounded";

export async function processChat(sessionId: string, message: string) {
  const context = getSessionContext(sessionId);
  const interpreter = getInterpreter();

  // What the classifier thinks (LLM right now). FOLLOW_UP gets merged with session state just below.
  const structuredIntent = await interpreter.interpret(message, {
    lastIntent: context.lastIntent,
    lastParameters: context.lastParameters
  });

  if (structuredIntent.intent === IntentType.FOLLOW_UP) {
    if (!context.lastIntent) {
      throw new Error("No previous context available for follow-up");
    }

    structuredIntent.intent = context.lastIntent as IntentType;
    structuredIntent.parameters = {
      date: structuredIntent.parameters.date ?? context.lastParameters?.date ?? null,
      at: structuredIntent.parameters.at ?? context.lastParameters?.at ?? null,
      a_from: structuredIntent.parameters.a_from ?? context.lastParameters?.a_from ?? null,
      a_to: structuredIntent.parameters.a_to ?? context.lastParameters?.a_to ?? null,
      b_from: structuredIntent.parameters.b_from ?? context.lastParameters?.b_from ?? null,
      b_to: structuredIntent.parameters.b_to ?? context.lastParameters?.b_to ?? null,
      limit: structuredIntent.parameters.limit ?? context.lastParameters?.limit ?? null,
      threshold:
        structuredIntent.parameters.threshold ?? context.lastParameters?.threshold ?? null
    };
  }

  if (structuredIntent.intent === IntentType.COMPARE_REVENUE_PERIODS) {
    structuredIntent.parameters.a_to =
      structuredIntent.parameters.a_to ?? structuredIntent.parameters.a_from;

    structuredIntent.parameters.b_to =
      structuredIntent.parameters.b_to ?? structuredIntent.parameters.b_from;
  }

  applyBareMonthDayFromUserMessage(message, structuredIntent);

  sanitizeIntentClassification(message, structuredIntent);

  if (structuredIntent.intent !== IntentType.UNKNOWN) {
    adjustFollowUpAgainstPreviousMessage(message, structuredIntent, context);
  }

  if (structuredIntent.intent === IntentType.UNKNOWN) {
    return {
      intent: structuredIntent,
      result: undefined,
      reply:
        "I am focused on POS data for this demo. Try: daily revenue, revenue by payment type (cash/card/mobile), comparing periods, who is on shift, top-selling products over a date range, sales by employee, or low-stock products.",
      replySource: "formatter"
    };
  }

  const relativeDateFromMessage = resolveRelativeDateFromMessage(message);

  if (
    (structuredIntent.intent === IntentType.GET_DAILY_REVENUE ||
      structuredIntent.intent === IntentType.GET_REVENUE_BY_PAYMENT ||
      structuredIntent.intent === IntentType.FOLLOW_UP) &&
    relativeDateFromMessage
  ) {
    structuredIntent.parameters.date = relativeDateFromMessage;
  }

  if (structuredIntent.intent === IntentType.GET_CURRENT_SHIFTS) {
    const shiftDayFromMessage = resolveRelativeDateFromMessage(message);
    if (shiftDayFromMessage) {
      structuredIntent.parameters.at = localNoonIsoForCalendarDate(shiftDayFromMessage);
    } else if (!structuredIntent.parameters.at) {
      structuredIntent.parameters.at = new Date().toISOString();
    }
  }

  structuredIntent.parameters.date = normalizeDate(
    resolveRelativeDate(structuredIntent.parameters.date)
  );
  structuredIntent.parameters.a_from = normalizeDate(
    resolveRelativeDate(structuredIntent.parameters.a_from)
  );
  structuredIntent.parameters.a_to = normalizeDate(
    resolveRelativeDate(structuredIntent.parameters.a_to)
  );
  structuredIntent.parameters.b_from = normalizeDate(
    resolveRelativeDate(structuredIntent.parameters.b_from)
  );
  structuredIntent.parameters.b_to = normalizeDate(
    resolveRelativeDate(structuredIntent.parameters.b_to)
  );

  if (
    structuredIntent.intent === IntentType.GET_TOP_PRODUCTS ||
    structuredIntent.intent === IntentType.GET_EMPLOYEE_SALES
  ) {
    if (!structuredIntent.parameters.a_from && structuredIntent.parameters.date) {
      structuredIntent.parameters.a_from = structuredIntent.parameters.date;
      structuredIntent.parameters.a_to = structuredIntent.parameters.date;
    }
  }

  validateIntent(structuredIntent);
  const result = await dispatchQuery(structuredIntent);
  const mcpReply = extractMcpReply(result);
  // Prefer a reply supplied by MCP if present; otherwise format query results deterministically.
  const deterministicFallback = mcpReply ?? formatAssistantResponse(structuredIntent, result);

  let reply: string;
  let replySource: ReplySource;

  if (shouldUseGroundedLlmReply()) {
    try {
      reply = await formulateGroundedReply(message, structuredIntent, result);
      replySource = "llm_grounded";
    } catch (err) {
      console.error(`[chat][${new Date().toISOString()}] grounded reply failed; using deterministic fallback`, err);
      reply = deterministicFallback;
      replySource = mcpReply ? "mcp" : "formatter";
    }
  } else {
    reply = deterministicFallback;
    replySource = mcpReply ? "mcp" : "formatter";
  }

  updateSessionContext(sessionId, {
    lastIntent: structuredIntent.intent,
    lastParameters: structuredIntent.parameters,
    lastResult: result
  });

  return {
    intent: structuredIntent,
    result,
    reply,
    replySource
  };
}