import { z } from "zod";
import { getDailyRevenue, getRevenueBetween } from "../repositories/revenueRepository";
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
  currentStartDate: isoDateSchema,
  currentEndDate: isoDateSchema,
  previousStartDate: isoDateSchema,
  previousEndDate: isoDateSchema
});

function toNextDayIso(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString();
}

function toDayStartIso(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

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

export async function compareRevenuePeriods(input: z.infer<typeof compareRevenueInputSchema>) {
  const parsed = compareRevenueInputSchema.parse(input);

  const [currentRevenue, previousRevenue] = await Promise.all([
    getRevenueBetween(toDayStartIso(parsed.currentStartDate), toNextDayIso(parsed.currentEndDate)),
    getRevenueBetween(toDayStartIso(parsed.previousStartDate), toNextDayIso(parsed.previousEndDate))
  ]);

  const difference = currentRevenue - previousRevenue;
  const percentChange = previousRevenue === 0 ? null : (difference / previousRevenue) * 100;

  return {
    currentPeriod: {
      startDate: parsed.currentStartDate,
      endDate: parsed.currentEndDate,
      revenue: currentRevenue
    },
    previousPeriod: {
      startDate: parsed.previousStartDate,
      endDate: parsed.previousEndDate,
      revenue: previousRevenue
    },
    difference,
    percentChange
  };
}
