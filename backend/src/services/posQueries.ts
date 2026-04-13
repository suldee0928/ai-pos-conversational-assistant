import { z } from "zod";
import {
  compareRevenuePeriods as compareRevenuePeriodsRepo,
  getDailyRevenue
} from "../repositories/revenueRepository";
import { getCurrentShifts } from "../repositories/shiftRepository";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD");
const isoDateTimeSchema = z.string().datetime({ offset: true });

export const dailyRevenueInputSchema = z.object({
  date: isoDateSchema
});

export const currentShiftsInputSchema = z.object({
  at: isoDateTimeSchema
});

export const compareRevenueInputSchema = z.object({
  a_from: isoDateSchema,
  a_to: isoDateSchema,
  b_from: isoDateSchema,
  b_to: isoDateSchema
});

export async function queryDailyRevenue(input: z.infer<typeof dailyRevenueInputSchema>) {
  const parsed = dailyRevenueInputSchema.parse(input);
  const revenue = await getDailyRevenue(parsed.date);
  return {
    date: parsed.date,
    revenue
  };
}

export async function queryCurrentShifts(input: z.infer<typeof currentShiftsInputSchema>) {
  const parsed = currentShiftsInputSchema.parse(input);
  const shifts = await getCurrentShifts(parsed.at);
  return {
    at: parsed.at,
    shifts
  };
}

export async function queryRevenueComparison(input: z.infer<typeof compareRevenueInputSchema>) {
  const parsed = compareRevenueInputSchema.parse(input);
  const comparison = await compareRevenuePeriodsRepo(
    parsed.a_from,
    parsed.a_to,
    parsed.b_from,
    parsed.b_to
  );

  return {
    periodA: {
      from: parsed.a_from,
      to: parsed.a_to,
      revenue: comparison.periodA
    },
    periodB: {
      from: parsed.b_from,
      to: parsed.b_to,
      revenue: comparison.periodB
    },
    difference: comparison.periodA - comparison.periodB
  };
}
