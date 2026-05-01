// MCP implementation (thesis): developed with Cursor (IDE AI); the author reviewed, adapted, and tested all behaviour — see Declaration on AI tools.
// Backend for HTTP tools/call: shared query helpers alongside the guarded natural-language-SQL path.
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import {
  compareRevenueInputSchema,
  currentShiftsInputSchema,
  dailyRevenueInputSchema,
  employeeSalesInputSchema,
  lowStockInputSchema,
  queryEmployeeSales,
  queryCurrentShifts,
  queryDailyRevenue,
  queryLowStock,
  queryRevenueByPayment,
  queryRevenueComparison,
  queryTopProducts,
  revenueByPaymentInputSchema,
  topProductsInputSchema
} from "../../services/posQueries";
import { formatShiftQueryReply } from "../../services/shiftReply";
import { generateSqlFromQuestion } from "../sql/generateSqlFromQuestion";
import { assertReadOnlySelect } from "../sql/sqlGuard";

const MAX_ROWS = 100;

const nlSchema = z.object({
  question: z.string().min(1).max(2000)
});

export type McpToolEnvelope<T> =
  | { ok: true; tool: string; data: T }
  | { ok: false; tool: string; error: { code: string; message: string } };

function success<T>(tool: string, data: T): McpToolEnvelope<T> {
  return { ok: true, tool, data };
}

function fail(tool: string, code: string, message: string): McpToolEnvelope<never> {
  return { ok: false, tool, error: { code, message } };
}

export async function runMcpToolByName(
  tool: string,
  args: unknown
): Promise<McpToolEnvelope<unknown>> {
  try {
    switch (tool) {
      case "get_daily_revenue": {
        const input = dailyRevenueInputSchema.parse(args);
        const base = await queryDailyRevenue(input);
        const reply =
          base.revenue === 0
            ? `No revenue was recorded on ${base.date}.`
            : `Revenue on ${base.date} was ${base.revenue}.`;
        return success(tool, { ...base, reply });
      }
      case "get_current_shifts": {
        const input = currentShiftsInputSchema.parse(args);
        const base = await queryCurrentShifts(input);
        const reply = formatShiftQueryReply(base.at, base.shifts);
        return success(tool, { ...base, reply });
      }
      case "compare_revenue_periods": {
        const input = compareRevenueInputSchema.parse(args);
        const base = await queryRevenueComparison(input);
        const reply = `Revenue comparison: ${base.periodA.from} to ${base.periodA.to} = ${base.periodA.revenue}, ${base.periodB.from} to ${base.periodB.to} = ${base.periodB.revenue}.`;
        return success(tool, { ...base, reply });
      }
      case "get_revenue_by_payment": {
        const input = revenueByPaymentInputSchema.parse(args);
        const base = await queryRevenueByPayment(input);
        return success(tool, base);
      }
      case "get_top_products": {
        const input = topProductsInputSchema.parse(args);
        const base = await queryTopProducts(input);
        return success(tool, base);
      }
      case "get_employee_sales": {
        const input = employeeSalesInputSchema.parse(args);
        const base = await queryEmployeeSales(input);
        return success(tool, base);
      }
      case "get_low_stock": {
        const input = lowStockInputSchema.parse(args);
        const base = await queryLowStock(input);
        return success(tool, base);
      }
      case "natural_language_sql": {
        const input = nlSchema.parse(args);
        const draftSql = await generateSqlFromQuestion(input.question);
        const sql = assertReadOnlySelect(draftSql);
        const rowsUnknown = await prisma.$queryRawUnsafe(sql);
        const allRows = Array.isArray(rowsUnknown) ? rowsUnknown : [];
        const truncated = allRows.length > MAX_ROWS;
        const rows = allRows.slice(0, MAX_ROWS);
        const reply = truncated
          ? `Executed read-only query; returning first ${MAX_ROWS} of ${allRows.length} rows.`
          : `Executed read-only query; ${allRows.length} row(s) returned.`;
        return success(tool, {
          question: input.question,
          sql,
          rowCount: allRows.length,
          truncated,
          rows,
          reply
        });
      }
      default:
        return fail(tool, "UNKNOWN_TOOL", `Unknown tool: ${tool}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(
        tool,
        "VALIDATION_ERROR",
        error.issues.map((i) => i.message).join("; ")
      );
    }
    if (error instanceof Error) {
      return fail(tool, "INTERNAL_ERROR", error.message);
    }
    return fail(tool, "UNKNOWN_ERROR", "Unknown error");
  }
}
