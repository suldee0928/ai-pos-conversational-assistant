import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeTool } from "../helpers";
import { queryCurrentShifts } from "../../services/posQueries";

const toolName = "get_current_shifts";

const paramsSchema = z.object({
  at: z.string().datetime({ offset: true })
});

export function registerGetCurrentShiftsTool(server: McpServer) {
  server.tool(
    toolName,
    "Get shifts active at a given datetime",
    {
      at: z.string().describe("ISO datetime with offset, e.g. 2026-03-06T10:00:00.000Z")
    },
    async (params) =>
      executeTool(toolName, params, async () => {
        const input = paramsSchema.parse(params);
        return queryCurrentShifts(input);
      })
  );
}
