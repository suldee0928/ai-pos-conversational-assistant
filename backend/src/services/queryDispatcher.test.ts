// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntentType } from "../domain/intentTypes";

const {
  queryDailyRevenue,
  queryCurrentShifts,
  queryRevenueComparison,
  queryRevenueByPayment,
  queryTopProducts,
  queryEmployeeSales,
  queryLowStock
} = vi.hoisted(() => ({
  queryDailyRevenue: vi.fn(),
  queryCurrentShifts: vi.fn(),
  queryRevenueComparison: vi.fn(),
  queryRevenueByPayment: vi.fn(),
  queryTopProducts: vi.fn(),
  queryEmployeeSales: vi.fn(),
  queryLowStock: vi.fn()
}));

const { callMcpTool } = vi.hoisted(() => ({
  callMcpTool: vi.fn()
}));

vi.mock("./posQueries", () => ({
  queryDailyRevenue,
  queryCurrentShifts,
  queryRevenueComparison,
  queryRevenueByPayment,
  queryTopProducts,
  queryEmployeeSales,
  queryLowStock
}));

vi.mock("./mcpToolClient", () => ({
  callMcpTool
}));

import { dispatchQuery } from "./queryDispatcher";

const baseParams = {
  date: "2024-01-10",
  at: "2024-01-10T12:00:00.000Z",
  a_from: "2024-01-01",
  a_to: "2024-01-10",
  b_from: "2024-02-01",
  b_to: "2024-02-10",
  limit: "5",
  threshold: "10"
};

function envMode(mode: "direct" | "mcp") {
  if (mode === "direct") {
    delete process.env.CHAT_EXECUTION_MODE;
  } else {
    process.env.CHAT_EXECUTION_MODE = "mcp";
  }
}

describe("dispatchQuery", () => {
  const prev = process.env.CHAT_EXECUTION_MODE;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.CHAT_EXECUTION_MODE;
    } else {
      process.env.CHAT_EXECUTION_MODE = prev;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    const revenue = { date: "2024-01-10", revenue: 42 };
    queryDailyRevenue.mockResolvedValue(revenue);
    callMcpTool.mockResolvedValue(revenue);
  });

  it("GET_DAILY_REVENUE uses posQueries in direct mode", async () => {
    envMode("direct");
    const res = await dispatchQuery({
      intent: IntentType.GET_DAILY_REVENUE,
      parameters: { ...baseParams, date: "2024-01-10" }
    });
    expect(res).toEqual({ type: "REVENUE", data: { date: "2024-01-10", revenue: 42 } });
    expect(queryDailyRevenue).toHaveBeenCalledWith({ date: "2024-01-10" });
    expect(callMcpTool).not.toHaveBeenCalled();
  });

  it("GET_DAILY_REVENUE uses MCP in mcp mode", async () => {
    envMode("mcp");
    const res = await dispatchQuery({
      intent: IntentType.GET_DAILY_REVENUE,
      parameters: { ...baseParams, date: "2024-01-10" }
    });
    expect(res).toEqual({ type: "REVENUE", data: { date: "2024-01-10", revenue: 42 } });
    expect(callMcpTool).toHaveBeenCalledWith("get_daily_revenue", { date: "2024-01-10" });
    expect(queryDailyRevenue).not.toHaveBeenCalled();
  });

  it("GET_TOP_PRODUCTS passes numeric limit to both paths", async () => {
    envMode("direct");
    const top = {
      from: "2024-01-01",
      to: "2024-01-10",
      limit: 5,
      products: []
    };
    queryTopProducts.mockResolvedValue(top);
    await dispatchQuery({
      intent: IntentType.GET_TOP_PRODUCTS,
      parameters: { ...baseParams, limit: "5" }
    });
    expect(queryTopProducts).toHaveBeenCalledWith({
      a_from: "2024-01-01",
      a_to: "2024-01-10",
      limit: 5
    });

    vi.clearAllMocks();
    callMcpTool.mockResolvedValue(top);
    envMode("mcp");
    await dispatchQuery({
      intent: IntentType.GET_TOP_PRODUCTS,
      parameters: { ...baseParams, limit: "5" }
    });
    expect(callMcpTool).toHaveBeenCalledWith("get_top_products", {
      a_from: "2024-01-01",
      a_to: "2024-01-10",
      limit: 5
    });
  });

  it("GET_LOW_STOCK passes optional threshold and limit in direct mode", async () => {
    envMode("direct");
    const low = { threshold: 10, limit: 20, products: [] };
    queryLowStock.mockResolvedValue(low);
    await dispatchQuery({
      intent: IntentType.GET_LOW_STOCK,
      parameters: { ...baseParams, threshold: "10", limit: "20" }
    });
    expect(queryLowStock).toHaveBeenCalledWith({ threshold: 10, limit: 20 });
  });

  it("throws for intents not handled by the dispatcher (e.g. FOLLOW_UP from raw pipeline)", async () => {
    envMode("direct");
    await expect(
      dispatchQuery({
        intent: IntentType.FOLLOW_UP,
        parameters: { ...baseParams }
      } as any)
    ).rejects.toThrow("Unhandled intent");
  });
});
