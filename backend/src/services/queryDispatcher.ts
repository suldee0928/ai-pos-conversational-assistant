import { IntentType } from "../domain/intentTypes";
import {
  queryCurrentShifts,
  queryDailyRevenue,
  queryRevenueComparison
} from "./posQueries";

export async function dispatchQuery(intent: any) {
  switch (intent.intent) {
    case IntentType.GET_DAILY_REVENUE:
      return {
        type: "REVENUE" as const,
        data: await queryDailyRevenue({ date: String(intent.parameters.date) })
      };

    case IntentType.GET_CURRENT_SHIFTS:
      return {
        type: "CURRENT_SHIFTS" as const,
        data: await queryCurrentShifts({
          at: String(intent.parameters.at ?? new Date().toISOString())
        })
      };

    case IntentType.COMPARE_REVENUE_PERIODS:
      return {
        type: "COMPARE_REVENUE" as const,
        data: await queryRevenueComparison({
          a_from: String(intent.parameters.a_from),
          a_to: String(intent.parameters.a_to),
          b_from: String(intent.parameters.b_from),
          b_to: String(intent.parameters.b_to)
        })
      };

    default:
      throw new Error("Unhandled intent");
  }
}