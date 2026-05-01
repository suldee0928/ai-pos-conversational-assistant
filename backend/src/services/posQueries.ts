// Entry point for MCP and chat: validates inputs via Zod, delegates execution to repositories.
import { z } from "zod";
import {
  getEmployeeSalesTotals,
  getLowStockProducts,
  getRevenueByPaymentForDay,
  getTopProductsByRevenue
} from "../repositories/analyticsRepository";
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

export const revenueByPaymentInputSchema = z.object({
  date: isoDateSchema
});

export const topProductsInputSchema = z.object({
  a_from: isoDateSchema,
  a_to: isoDateSchema,
  limit: z.number().int().min(1).max(50).optional()
});

export const employeeSalesInputSchema = z.object({
  a_from: isoDateSchema,
  a_to: isoDateSchema
});

export const lowStockInputSchema = z.object({
  threshold: z.number().int().min(0).max(1_000_000).optional(),
  limit: z.number().int().min(1).max(100).optional()
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

export async function queryRevenueByPayment(input: z.infer<typeof revenueByPaymentInputSchema>) {
  const parsed = revenueByPaymentInputSchema.parse(input);
  const breakdown = await getRevenueByPaymentForDay(parsed.date);
  return {
    date: parsed.date,
    breakdown
  };
}

export async function queryTopProducts(input: z.infer<typeof topProductsInputSchema>) {
  const parsed = topProductsInputSchema.parse(input);
  const limit = parsed.limit ?? 5;
  const products = await getTopProductsByRevenue(parsed.a_from, parsed.a_to, limit);
  return {
    from: parsed.a_from,
    to: parsed.a_to,
    limit,
    products
  };
}

export async function queryEmployeeSales(input: z.infer<typeof employeeSalesInputSchema>) {
  const parsed = employeeSalesInputSchema.parse(input);
  const employees = await getEmployeeSalesTotals(parsed.a_from, parsed.a_to);
  return {
    from: parsed.a_from,
    to: parsed.a_to,
    employees
  };
}

export async function queryLowStock(input: z.infer<typeof lowStockInputSchema>) {
  const parsed = lowStockInputSchema.parse(input);
  const threshold = parsed.threshold ?? 10;
  const limit = parsed.limit ?? 15;
  const products = await getLowStockProducts(threshold, limit);
  return {
    threshold,
    limit,
    products
  };
}
