import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeTool } from "../helpers";
import { compareRevenuePeriods } from "../../services/posQueries";

const toolName = "compare_revenue_periods";

const paramsSchema = z.object({
  currentStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  currentEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  previousStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  previousEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
});

export function registerCompareRevenuePeriodsTool(server: McpServer) {
  server.tool(
    toolName,
    "Compare revenue between two periods",
    {
      currentStartDate: z.string().describe("Current period start date: YYYY-MM-DD"),
      currentEndDate: z.string().describe("Current period end date: YYYY-MM-DD"),
      previousStartDate: z.string().describe("Previous period start date: YYYY-MM-DD"),
      previousEndDate: z.string().describe("Previous period end date: YYYY-MM-DD")
    },
    async (params) =>
      executeTool(toolName, params, async () => {
        const input = paramsSchema.parse(params);
        return compareRevenuePeriods(input);
      })
  );
}
