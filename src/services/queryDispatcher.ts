import { Intent } from "../validators/intentSchema";
import { IntentType } from "../domain/intentTypes";
import { compareRevenuePeriods, queryCurrentShifts, queryDailyRevenue } from "./posQueries";

export async function dispatchQuery(intent: Intent) {
  switch (intent.intent) {
    case IntentType.GET_DAILY_REVENUE:
      return {
        type: "REVENUE",
        data: await queryDailyRevenue({ date: String(intent.parameters?.date ?? "") })
      };

    case IntentType.GET_CURRENT_SHIFTS:
      return {
        type: "CURRENT_SHIFTS",
        data: await queryCurrentShifts({
          at: String(intent.parameters?.at ?? new Date().toISOString())
        })
      };

    case IntentType.COMPARE_REVENUE_PERIODS:
      return {
        type: "REVENUE_COMPARISON",
        data: await compareRevenuePeriods({
          currentStartDate: String(intent.parameters?.currentStartDate ?? ""),
          currentEndDate: String(intent.parameters?.currentEndDate ?? ""),
          previousStartDate: String(intent.parameters?.previousStartDate ?? ""),
          previousEndDate: String(intent.parameters?.previousEndDate ?? "")
        })
      };

    default:
      throw new Error("Unhandled intent");
  }
}