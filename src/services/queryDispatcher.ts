import { Intent } from "../validators/intentSchema";
import { IntentType } from "../domain/intentTypes";
import { getDailyRevenue } from "../repositories/revenueRepository";
import { getCurrentShifts } from "../repositories/shiftRepository";

export async function dispatchQuery(intent: Intent) {
  switch (intent.intent) {
    case IntentType.GET_DAILY_REVENUE:
      return {
        type: "REVENUE",
        data: await getDailyRevenue(intent.parameters?.date)
      };

    case IntentType.GET_CURRENT_SHIFTS:
      return {
        type: "CURRENT_SHIFTS",
        data: await getCurrentShifts(intent.parameters?.at ?? new Date().toISOString())
      };

    default:
      throw new Error("Unhandled intent");
  }
}