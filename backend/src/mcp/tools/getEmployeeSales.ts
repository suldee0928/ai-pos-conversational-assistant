import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../helpers";
import { queryEmployeeSales } from "../../services/posQueries";

const toolName = "get_employee_sales";
const schema = z.object({
  a_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD"),
  a_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format: YYYY-MM-DD")
});

export function registerGetEmployeeSalesTool(server: McpServer) {
  server.tool(
    toolName,
    "Get employee revenue totals for an inclusive date range",
    {
      a_from: z.string().describe("Start date in YYYY-MM-DD"),
      a_to: z.string().describe("End date in YYYY-MM-DD")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = schema.parse(params);
        return queryEmployeeSales(input);
      })
  );
}
