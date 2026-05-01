import { IntentType } from "../../domain/intentTypes";
import { IntentInterpreter, SessionContextInput, StructuredIntent } from "./types";

function emptyParameters(): StructuredIntent["parameters"] {
  return {
    date: null,
    at: null,
    a_from: null,
    a_to: null,
    b_from: null,
    b_to: null,
    limit: null,
    threshold: null
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

/** e.g. "top 5" → "5" */
function extractLimit(message: string): string | null {
  const m = message.match(/\btop\s+(\d+)\b/i);
  if (m) return m[1];
  const m2 = message.match(/\bfirst\s+(\d+)\b/i);
  if (m2) return m2[1];
  return null;
}

/** e.g. "below 10" → "10" */
function extractThreshold(message: string): string | null {
  const m =
    message.match(/\b(?:below|under|at\s+most|<=|≤)\s*(\d+)\b/i) ||
    message.match(/\bstock\s*(?:of\s*)?(\d+)\b/i);
  if (m) return m[1];
  return null;
}

function wantsPaymentBreakdown(lower: string): boolean {
  if (/\b(payment\s*types?|by\s+payment|payment\s+breakdown|split.*payment)\b/.test(lower)) {
    return true;
  }
  if (/\bcash\b.*\bcard\b|\bcard\b.*\bcash\b/.test(lower)) {
    return true;
  }
  if (/\b(mobile\s+pay|tap\s+to\s+pay)\b/.test(lower) && /\b(revenue|sales|money|takings)\b/.test(lower)) {
    return true;
  }
  return false;
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
      lower.includes("and this week") ||
      /\b(day\s+before\s+that|before\s+that|day\s+after\s+that|after\s+that|same\s+(thing|query)|like\s+before)\b/.test(
        lower
      )
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

    if (wantsPaymentBreakdown(lower) || (/\brevenue\b.*\bpayment\b|\bpayment\b.*\brevenue\b/.test(lower))) {
      params.date = extractDate(message) ?? formatDate(new Date());
      return {
        intent: IntentType.GET_REVENUE_BY_PAYMENT,
        parameters: params,
        confidence: 0.88
      };
    }

    if (
      /\b(low\s+stock|out\s+of\s+stock|restock|need\s+restock|running\s+low|inventory\s+alert|low\s+inventory|stock\s+level)\b/.test(
        lower
      )
    ) {
      params.threshold = extractThreshold(message);
      params.limit = extractLimit(message);
      return {
        intent: IntentType.GET_LOW_STOCK,
        parameters: params,
        confidence: 0.9
      };
    }

    if (
      /\b(top\s+products|best\s+sell|most\s+sold|best\s+sellers|popular\s+products)\b/.test(lower)
    ) {
      const dates = extractAllDates(message);
      let aFrom: string;
      let aTo: string;
      if (dates.length >= 2) {
        [aFrom, aTo] = [dates[0], dates[1]];
      } else if (dates.length === 1) {
        aFrom = aTo = dates[0];
      } else {
        const d = extractDate(message) ?? formatDate(new Date());
        aFrom = aTo = d;
      }
      params.a_from = aFrom;
      params.a_to = aTo;
      params.limit = extractLimit(message);
      return {
        intent: IntentType.GET_TOP_PRODUCTS,
        parameters: params,
        confidence: 0.88
      };
    }

    if (
      /\b(sales\s+by\s+employee|employee\s+sales|who\s+sold|which\s+employee|cashier\s+totals|staff\s+sales)\b/.test(
        lower
      )
    ) {
      const dates = extractAllDates(message);
      let aFrom: string;
      let aTo: string;
      if (dates.length >= 2) {
        [aFrom, aTo] = [dates[0], dates[1]];
      } else if (dates.length === 1) {
        aFrom = aTo = dates[0];
      } else {
        const d = extractDate(message) ?? formatDate(new Date());
        aFrom = aTo = d;
      }
      params.a_from = aFrom;
      params.a_to = aTo;
      return {
        intent: IntentType.GET_EMPLOYEE_SALES,
        parameters: params,
        confidence: 0.88
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
      lower.includes("who was on shift") ||
      lower.includes("who worked") ||
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
