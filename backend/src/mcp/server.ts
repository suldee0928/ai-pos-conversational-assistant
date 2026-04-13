import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetDailyRevenueTool } from "./tools/getDailyRevenue";
import { registerGetCurrentShiftsTool } from "./tools/getCurrentShifts";
import { registerCompareRevenuePeriodsTool } from "./tools/compareRevenuePeriods";

async function start() {
  const server = new McpServer({
    name: "pos-assistant-mcp",
    version: "1.0.0"
  });

  registerGetDailyRevenueTool(server);
  registerGetCurrentShiftsTool(server);
  registerCompareRevenuePeriodsTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp][${new Date().toISOString()}] server started`);
}

start().catch((error) => {
  console.error(`[mcp][${new Date().toISOString()}] failed to start`, error);
  process.exit(1);
});
