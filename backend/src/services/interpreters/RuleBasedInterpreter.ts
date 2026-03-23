import { IntentType } from "../../domain/intentTypes";
import { IntentInterpreter, SessionContextInput, StructuredIntent } from "./types";

function emptyParameters() {
  return {
    date: null,
    at: null,
    a_from: null,
    a_to: null,
    b_from: null,
    b_to: null
  };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function extractDate(message: string): string | null {
  const explicit = message.match(/\d{4}-\d{2}-\d{2}/);
  if (explicit) return explicit[0];

  const lower = message.toLowerCase();

  if (lower.includes("today")) return formatDate(new Date());

  if (lower.includes("yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  }

  return null;
}

function extractAllDates(message: string): string[] {
  return [...message.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((m) => m[0]);
}

export class RuleBasedInterpreter implements IntentInterpreter {
  async interpret(
    message: string,
    _sessionContext?: SessionContextInput
  ): Promise<StructuredIntent> {
    const lower = message.toLowerCase();
    const params = emptyParameters();

    if (
      lower.includes("what about") ||
      lower.includes("and yesterday") ||
      lower.includes("and today") ||
      lower.includes("and this week")
    ) {
      params.date = extractDate(message);
      return {
        intent: IntentType.FOLLOW_UP,
        parameters: params,
        confidence: 0.95
      };
    }

    if (lower.includes("compare") && lower.includes("revenue")) {
      const dates = extractAllDates(message);

      if (dates.length >= 2) {
        return {
          intent: IntentType.COMPARE_REVENUE_PERIODS,
          parameters: {
            ...params,
            a_from: dates[0],
            a_to: dates[0],
            b_from: dates[1],
            b_to: dates[1]
          },
          confidence: 0.9
        };
      }

      return {
        intent: IntentType.COMPARE_REVENUE_PERIODS,
        parameters: {
          ...params,
          a_from: "2026-03-05",
          a_to: "2026-03-05",
          b_from: "2026-03-06",
          b_to: "2026-03-06"
        },
        confidence: 0.75
      };
    }

    if (
      lower.includes("revenue") ||
      lower.includes("sales total") ||
      lower.includes("how much did we make")
    ) {
      params.date = extractDate(message) ?? formatDate(new Date());
      return {
        intent: IntentType.GET_DAILY_REVENUE,
        parameters: params,
        confidence: 0.95
      };
    }

    if (
      lower.includes("who is working") ||
      lower.includes("who's working") ||
      lower.includes("current shifts") ||
      lower.includes("on shift")
    ) {
      params.at = new Date().toISOString();
      return {
        intent: IntentType.GET_CURRENT_SHIFTS,
        parameters: params,
        confidence: 0.95
      };
    }

    return {
      intent: IntentType.UNKNOWN,
      parameters: params,
      confidence: 0.2
    };
  }
}