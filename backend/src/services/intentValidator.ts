import { IntentType } from "../domain/intentTypes";

type Intent = {
  intent: IntentType;
  parameters: {
    date: string | null;
    at: string | null;
    a_from: string | null;
    a_to: string | null;
    b_from: string | null;
    b_to: string | null;
    limit: string | null;
    threshold: string | null;
  };
  confidence: number;
};

const allowedIntents = [
  IntentType.GET_DAILY_REVENUE,
  IntentType.GET_CURRENT_SHIFTS,
  IntentType.COMPARE_REVENUE_PERIODS,
  IntentType.GET_REVENUE_BY_PAYMENT,
  IntentType.GET_TOP_PRODUCTS,
  IntentType.GET_EMPLOYEE_SALES,
  IntentType.GET_LOW_STOCK
];

// Enforces intent allow-listing and plausible parameters before repository access.
export function validateIntent(intent: Intent): void {
  if (intent.intent === IntentType.UNKNOWN) {
    return;
  }

  if (!allowedIntents.includes(intent.intent)) {
    throw new Error("Intent not allowed");
  }

  if (intent.confidence < 0.6) {
    throw new Error("Intent confidence too low");
  }

  if (
    intent.intent === IntentType.GET_DAILY_REVENUE &&
    !intent.parameters.date
  ) {
    throw new Error("Missing required parameter: date");
  }

  if (intent.intent === IntentType.GET_REVENUE_BY_PAYMENT && !intent.parameters.date) {
    throw new Error("Missing required parameter: date");
  }

  if (
    intent.intent === IntentType.COMPARE_REVENUE_PERIODS &&
    (!intent.parameters.a_from ||
      !intent.parameters.a_to ||
      !intent.parameters.b_from ||
      !intent.parameters.b_to)
  ) {
    throw new Error("Missing required comparison parameters");
  }

  if (
    intent.intent === IntentType.GET_TOP_PRODUCTS &&
    (!intent.parameters.a_from || !intent.parameters.a_to)
  ) {
    throw new Error("Missing required date range for top products");
  }

  if (
    intent.intent === IntentType.GET_EMPLOYEE_SALES &&
    (!intent.parameters.a_from || !intent.parameters.a_to)
  ) {
    throw new Error("Missing required date range for employee sales");
  }
}
