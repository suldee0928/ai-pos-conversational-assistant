import { validateIntent } from "./intentValidator";
import { dispatchQuery } from "./queryDispatcher";
import { getSessionContext, updateSessionContext } from "./contextManager";
import { getInterpreter } from "./interpreters";
import { formatAssistantResponse } from "./responseFormatter";
import { IntentType } from "../domain/intentTypes";

function shiftIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
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

  if (lower.includes("today")) return today;
  if (lower.includes("yesterday")) return shiftIsoDate(today, -1);
  if (lower.includes("tomorrow")) return shiftIsoDate(today, 1);
  if (lower.includes("day after")) return shiftIsoDate(today, 1);
  if (lower.includes("day before")) return shiftIsoDate(today, -1);

  return null;
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}-\d{2}$/.test(value)) {
    const year = new Date().getFullYear();
    return `${year}-${value}`;
  }

  return value;
}

export async function processChat(sessionId: string, message: string) {
  const context = getSessionContext(sessionId);
  const interpreter = getInterpreter();

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
      b_to: structuredIntent.parameters.b_to ?? context.lastParameters?.b_to ?? null
    };
  }

  if (structuredIntent.intent === IntentType.COMPARE_REVENUE_PERIODS) {
    structuredIntent.parameters.a_to =
      structuredIntent.parameters.a_to ?? structuredIntent.parameters.a_from;

    structuredIntent.parameters.b_to =
      structuredIntent.parameters.b_to ?? structuredIntent.parameters.b_from;
  }

  const relativeDateFromMessage = resolveRelativeDateFromMessage(message);

  if (
    (structuredIntent.intent === IntentType.GET_DAILY_REVENUE ||
      structuredIntent.intent === IntentType.FOLLOW_UP) &&
    relativeDateFromMessage
  ) {
    structuredIntent.parameters.date = relativeDateFromMessage;
  }

  if (
    structuredIntent.intent === IntentType.GET_CURRENT_SHIFTS &&
    !structuredIntent.parameters.at
  ) {
    structuredIntent.parameters.at = new Date().toISOString();
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

  validateIntent(structuredIntent);
  const result = await dispatchQuery(structuredIntent);
  const reply = formatAssistantResponse(structuredIntent, result);

  updateSessionContext(sessionId, {
    lastIntent: structuredIntent.intent,
    lastParameters: structuredIntent.parameters,
    lastResult: result
  });

  return {
    intent: structuredIntent,
    result,
    reply
  };
}