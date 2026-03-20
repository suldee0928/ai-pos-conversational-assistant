import { IntentType } from "../domain/intentTypes";
import { getDailyRevenue, compareRevenuePeriods } from "../repositories/revenueRepository";
import { getCurrentShifts } from "../repositories/shiftRepository";

export async function dispatchQuery(intent: any) {
  switch (intent.intent) {
    case IntentType.GET_DAILY_REVENUE:
      return {
        type: "REVENUE",
        data: await getDailyRevenue(intent.parameters.date)
      };

    case IntentType.GET_CURRENT_SHIFTS:
      return {
        type: "CURRENT_SHIFTS",
        data: await getCurrentShifts(intent.parameters.at ?? new Date().toISOString())
      };

    case IntentType.COMPARE_REVENUE_PERIODS:
      return {
        type: "COMPARE_REVENUE",
        data: await compareRevenuePeriods(
          intent.parameters.a_from,
          intent.parameters.a_to,
          intent.parameters.b_from,
          intent.parameters.b_to
        )
      };

    default:
      throw new Error("Unhandled intent");
  }
}