import { Intent } from "../validators/intentSchema";
import { IntentType } from "../domain/intentTypes";

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

  if (intent.intent === IntentType.GET_DAILY_REVENUE && !intent.parameters?.date) {
    throw new Error("Missing required parameter: date");
  }
}