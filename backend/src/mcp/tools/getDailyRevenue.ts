import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../helpers";
import { queryDailyRevenue } from "../../services/posQueries";

const toolName = "get_daily_revenue";
const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD")
});

export function registerGetDailyRevenueTool(server: McpServer) {
  server.tool(
    toolName,
    "Get total revenue for a given date",
    {
      date: z.string().describe("Date in YYYY-MM-DD format")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = schema.parse(params);
        return queryDailyRevenue(input);
      })
  );
}
