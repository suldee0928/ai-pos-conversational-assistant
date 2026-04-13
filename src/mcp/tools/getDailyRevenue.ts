import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeTool } from "../helpers";
import { queryDailyRevenue } from "../../services/posQueries";

const toolName = "get_daily_revenue";

const paramsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD")
});

export function registerGetDailyRevenueTool(server: McpServer) {
  server.tool(
    toolName,
    "Get total revenue for one day",
    {
      date: z.string().describe("Date in YYYY-MM-DD format")
    },
    async (params) =>
      executeTool(toolName, params, async () => {
        const input = paramsSchema.parse(params);
        return queryDailyRevenue(input);
      })
  );
}
