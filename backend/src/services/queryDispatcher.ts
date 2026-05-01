import { IntentType } from "../domain/intentTypes";
import {
  queryCurrentShifts,
  queryDailyRevenue,
  queryEmployeeSales,
  queryLowStock,
  queryRevenueByPayment,
  queryRevenueComparison,
  queryTopProducts
} from "./posQueries";
import { callMcpTool } from "./mcpToolClient";

// When CHAT_EXECUTION_MODE=mcp, queries run via MCP tools instead of in-process repository calls.
function shouldUseMcpForChat(): boolean {
  return (process.env.CHAT_EXECUTION_MODE ?? "direct").toLowerCase() === "mcp";
}

// MCP tool identifiers corresponding to dispatcher intents (used for logging traces).
const MCP_TOOL_BY_INTENT: Partial<Record<IntentType, string>> = {
  [IntentType.GET_DAILY_REVENUE]: "get_daily_revenue",
  [IntentType.GET_CURRENT_SHIFTS]: "get_current_shifts",
  [IntentType.COMPARE_REVENUE_PERIODS]: "compare_revenue_periods",
  [IntentType.GET_REVENUE_BY_PAYMENT]: "get_revenue_by_payment",
  [IntentType.GET_TOP_PRODUCTS]: "get_top_products",
  [IntentType.GET_EMPLOYEE_SALES]: "get_employee_sales",
  [IntentType.GET_LOW_STOCK]: "get_low_stock"
};

function logQueryDispatch(intentType: IntentType) {
  const useMcp = shouldUseMcpForChat();
  const execution = useMcp ? "mcp" : "direct";
  const tool = useMcp ? MCP_TOOL_BY_INTENT[intentType] : undefined;
  const toolSuffix = tool ? ` mcpTool=${tool}` : "";
  console.error(
    `[dispatch][${new Date().toISOString()}] execution=${execution} intent=${intentType}${toolSuffix}`
  );
}

type DailyRevenueData = Awaited<ReturnType<typeof queryDailyRevenue>>;
type CurrentShiftsData = Awaited<ReturnType<typeof queryCurrentShifts>>;
type RevenueComparisonData = Awaited<ReturnType<typeof queryRevenueComparison>>;
type RevenueByPaymentData = Awaited<ReturnType<typeof queryRevenueByPayment>>;
type TopProductsData = Awaited<ReturnType<typeof queryTopProducts>>;
type EmployeeSalesData = Awaited<ReturnType<typeof queryEmployeeSales>>;
type LowStockData = Awaited<ReturnType<typeof queryLowStock>>;

export async function dispatchQuery(intent: any) {
  logQueryDispatch(intent.intent as IntentType);

  // Branch remains read-only; MCP and direct execution return equivalent payload shapes.
  switch (intent.intent) {
    case IntentType.GET_DAILY_REVENUE:
      return {
        type: "REVENUE" as const,
        data: shouldUseMcpForChat()
          ? await callMcpTool<DailyRevenueData>("get_daily_revenue", {
              date: String(intent.parameters.date)
            })
          : await queryDailyRevenue({ date: String(intent.parameters.date) })
      };

    case IntentType.GET_CURRENT_SHIFTS:
      return {
        type: "CURRENT_SHIFTS" as const,
        data: shouldUseMcpForChat()
          ? await callMcpTool<CurrentShiftsData>("get_current_shifts", {
              at: String(intent.parameters.at ?? new Date().toISOString())
            })
          : await queryCurrentShifts({
              at: String(intent.parameters.at ?? new Date().toISOString())
            })
      };

    case IntentType.COMPARE_REVENUE_PERIODS:
      return {
        type: "COMPARE_REVENUE" as const,
        data: shouldUseMcpForChat()
          ? await callMcpTool<RevenueComparisonData>("compare_revenue_periods", {
              a_from: String(intent.parameters.a_from),
              a_to: String(intent.parameters.a_to),
              b_from: String(intent.parameters.b_from),
              b_to: String(intent.parameters.b_to)
            })
          : await queryRevenueComparison({
              a_from: String(intent.parameters.a_from),
              a_to: String(intent.parameters.a_to),
              b_from: String(intent.parameters.b_from),
              b_to: String(intent.parameters.b_to)
            })
      };

    case IntentType.GET_REVENUE_BY_PAYMENT:
      return {
        type: "REVENUE_BY_PAYMENT" as const,
        data: shouldUseMcpForChat()
          ? await callMcpTool<RevenueByPaymentData>("get_revenue_by_payment", {
              date: String(intent.parameters.date)
            })
          : await queryRevenueByPayment({
              date: String(intent.parameters.date)
            })
      };

    case IntentType.GET_TOP_PRODUCTS: {
      const lim = intent.parameters.limit ? parseInt(String(intent.parameters.limit), 10) : NaN;
      return {
        type: "TOP_PRODUCTS" as const,
        data: shouldUseMcpForChat()
          ? await callMcpTool<TopProductsData>("get_top_products", {
              a_from: String(intent.parameters.a_from),
              a_to: String(intent.parameters.a_to),
              ...(!Number.isNaN(lim) && lim > 0 ? { limit: lim } : {})
            })
          : await queryTopProducts({
              a_from: String(intent.parameters.a_from),
              a_to: String(intent.parameters.a_to),
              ...(!Number.isNaN(lim) && lim > 0 ? { limit: lim } : {})
            })
      };
    }

    case IntentType.GET_EMPLOYEE_SALES:
      return {
        type: "EMPLOYEE_SALES" as const,
        data: shouldUseMcpForChat()
          ? await callMcpTool<EmployeeSalesData>("get_employee_sales", {
              a_from: String(intent.parameters.a_from),
              a_to: String(intent.parameters.a_to)
            })
          : await queryEmployeeSales({
              a_from: String(intent.parameters.a_from),
              a_to: String(intent.parameters.a_to)
            })
      };

    case IntentType.GET_LOW_STOCK: {
      const th = intent.parameters.threshold ? parseInt(String(intent.parameters.threshold), 10) : NaN;
      const lim = intent.parameters.limit ? parseInt(String(intent.parameters.limit), 10) : NaN;
      return {
        type: "LOW_STOCK" as const,
        data: shouldUseMcpForChat()
          ? await callMcpTool<LowStockData>("get_low_stock", {
              ...(!Number.isNaN(th) && th >= 0 ? { threshold: th } : {}),
              ...(!Number.isNaN(lim) && lim > 0 ? { limit: lim } : {})
            })
          : await queryLowStock({
              ...(!Number.isNaN(th) && th >= 0 ? { threshold: th } : {}),
              ...(!Number.isNaN(lim) && lim > 0 ? { limit: lim } : {})
            })
      };
    }

    default:
      throw new Error("Unhandled intent");
  }
}