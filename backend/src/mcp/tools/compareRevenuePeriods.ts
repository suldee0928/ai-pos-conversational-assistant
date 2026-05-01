import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../helpers";
import { queryRevenueComparison } from "../../services/posQueries";

const toolName = "compare_revenue_periods";
const schema = z.object({
  a_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD"),
  a_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD"),
  b_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD"),
  b_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD")
});

export function registerCompareRevenuePeriodsTool(server: McpServer) {
  server.tool(
    toolName,
    "Compare revenue between two periods",
    {
      a_from: z.string().describe("Period A start date in YYYY-MM-DD"),
      a_to: z.string().describe("Period A end date in YYYY-MM-DD"),
      b_from: z.string().describe("Period B start date in YYYY-MM-DD"),
      b_to: z.string().describe("Period B end date in YYYY-MM-DD")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = schema.parse(params);
        const result = await queryRevenueComparison(input);
        const reply = `Revenue comparison: ${result.periodA.from} to ${result.periodA.to} = ${result.periodA.revenue}, ${result.periodB.from} to ${result.periodB.to} = ${result.periodB.revenue}.`;
        return {
          ...result,
          reply
        };
      })
  );
}
