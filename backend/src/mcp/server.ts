// MCP implementation (thesis): developed with Cursor (IDE AI); the author reviewed, adapted, and tested all behaviour — see Declaration on AI tools.
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetDailyRevenueTool } from "./tools/getDailyRevenue";
import { registerGetCurrentShiftsTool } from "./tools/getCurrentShifts";
import { registerCompareRevenuePeriodsTool } from "./tools/compareRevenuePeriods";
import { registerNaturalLanguageSqlTool } from "./tools/naturalLanguageSql";
import { registerGetRevenueByPaymentTool } from "./tools/getRevenueByPayment";
import { registerGetTopProductsTool } from "./tools/getTopProducts";
import { registerGetEmployeeSalesTool } from "./tools/getEmployeeSales";
import { registerGetLowStockTool } from "./tools/getLowStock";

// Stdio MCP entrypoint (`npm run mcp:dev`): tools share repositories with the HTTP API for consistent behavior.
async function start() {
  const server = new McpServer({
    name: "pos-assistant-mcp",
    version: "1.0.0"
  });

  registerGetDailyRevenueTool(server);
  registerGetCurrentShiftsTool(server);
  registerCompareRevenuePeriodsTool(server);
  registerGetRevenueByPaymentTool(server);
  registerGetTopProductsTool(server);
  registerGetEmployeeSalesTool(server);
  registerGetLowStockTool(server);
  registerNaturalLanguageSqlTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp][${new Date().toISOString()}] server started`);
}

start().catch((error) => {
  console.error(`[mcp][${new Date().toISOString()}] failed to start`, error);
  process.exit(1);
});
