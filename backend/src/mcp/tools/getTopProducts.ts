import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../helpers";
import { queryTopProducts } from "../../services/posQueries";

const toolName = "get_top_products";
const schema = z.object({
  a_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD"),
  a_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD"),
  limit: z.number().int().min(1).max(50).optional()
});

export function registerGetTopProductsTool(server: McpServer) {
  server.tool(
    toolName,
    "Get top products by revenue in an inclusive date range",
    {
      a_from: z.string().describe("Start date in YYYY-MM-DD"),
      a_to: z.string().describe("End date in YYYY-MM-DD"),
      limit: z.number().int().min(1).max(50).optional().describe("Top-N limit (default 5)")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = schema.parse(params);
        return queryTopProducts(input);
      })
  );
}
