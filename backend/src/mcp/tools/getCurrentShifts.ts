import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runTool } from "../helpers";
import { queryCurrentShifts } from "../../services/posQueries";
import { formatShiftQueryReply } from "../../services/shiftReply";

const toolName = "get_current_shifts";
const schema = z.object({
  at: z.string().datetime({ offset: true })
});

export function registerGetCurrentShiftsTool(server: McpServer) {
  server.tool(
    toolName,
    "Get shifts active at a given datetime",
    {
      at: z.string().describe("ISO datetime with offset")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = schema.parse(params);
        const result = await queryCurrentShifts(input);
        const reply = formatShiftQueryReply(result.at, result.shifts);
        return {
          ...result,
          reply
        };
      })
  );
}
