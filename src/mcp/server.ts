import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetDailyRevenueTool } from "./tools/getDailyRevenue";
import { registerGetCurrentShiftsTool } from "./tools/getCurrentShifts";
import { registerCompareRevenuePeriodsTool } from "./tools/compareRevenuePeriods";

async function startServer() {
  const server = new McpServer({
    name: "ai-pos-assistant-mcp",
    version: "1.0.0"
  });

  registerGetDailyRevenueTool(server);
  registerGetCurrentShiftsTool(server);
  registerCompareRevenuePeriodsTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("[mcp] POS MCP server started on stdio");
}

startServer().catch((error) => {
  console.error("[mcp] Failed to start MCP server", error);
  process.exit(1);
});
