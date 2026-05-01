import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../helpers";
import { queryLowStock } from "../../services/posQueries";

const toolName = "get_low_stock";
const schema = z.object({
  threshold: z.number().int().min(0).max(1_000_000).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

export function registerGetLowStockTool(server: McpServer) {
  server.tool(
    toolName,
    "List low-stock products using optional threshold/limit",
    {
      threshold: z
        .number()
        .int()
        .min(0)
        .max(1_000_000)
        .optional()
        .describe("Stock threshold, default 10"),
      limit: z.number().int().min(1).max(100).optional().describe("Maximum rows, default 15")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = schema.parse(params);
        return queryLowStock(input);
      })
  );
}
