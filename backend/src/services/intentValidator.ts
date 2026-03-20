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
  };
  confidence: number;
};

const allowedIntents = [
  IntentType.GET_DAILY_REVENUE,
  IntentType.GET_CURRENT_SHIFTS,
  IntentType.COMPARE_REVENUE_PERIODS
];

export function validateIntent(intent: Intent): void {
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

  if (
    intent.intent === IntentType.COMPARE_REVENUE_PERIODS &&
    (!intent.parameters.a_from ||
      !intent.parameters.a_to ||
      !intent.parameters.b_from ||
      !intent.parameters.b_to)
  ) {
    throw new Error("Missing required comparison parameters");
  }
}