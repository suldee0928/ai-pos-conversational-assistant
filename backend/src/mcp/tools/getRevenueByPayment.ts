import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../helpers";
import { queryRevenueByPayment } from "../../services/posQueries";

const toolName = "get_revenue_by_payment";
const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD")
});

export function registerGetRevenueByPaymentTool(server: McpServer) {
  server.tool(
    toolName,
    "Get revenue split by payment type for a date",
    {
      date: z.string().describe("Date in YYYY-MM-DD format")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = schema.parse(params);
        return queryRevenueByPayment(input);
      })
  );
}
