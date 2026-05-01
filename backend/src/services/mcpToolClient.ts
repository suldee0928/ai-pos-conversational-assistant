// MCP bridge (thesis): developed with Cursor (IDE AI); the author reviewed, adapted, and tested all behaviour — see Declaration on AI tools.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type McpToolName =
  | "get_daily_revenue"
  | "get_current_shifts"
  | "compare_revenue_periods"
  | "get_revenue_by_payment"
  | "get_top_products"
  | "get_employee_sales"
  | "get_low_stock"
  | "natural_language_sql";

type McpSuccessEnvelope<TData> = {
  ok: true;
  tool: string;
  data: TData;
};

type McpErrorEnvelope = {
  ok: false;
  tool: string;
  error: {
    code: string;
    message: string;
  };
};

type McpEnvelope<TData> = McpSuccessEnvelope<TData> | McpErrorEnvelope;

function parseMcpTextPayload<TData>(payload: unknown): McpEnvelope<TData> {
  if (!payload || typeof payload !== "object" || !("content" in payload)) {
    throw new Error("Invalid MCP response payload");
  }

  const content = (payload as { content?: Array<{ type?: string; text?: string }> }).content ?? [];
  const textPart = content.find((item) => item?.type === "text" && typeof item.text === "string");
  if (!textPart?.text) {
    throw new Error("MCP response did not contain text content");
  }

  return JSON.parse(textPart.text) as McpEnvelope<TData>;
}

// One MCP subprocess per call; straightforward for prototyping, not optimized for concurrency.
export async function callMcpTool<TData>(toolName: McpToolName, args: Record<string, unknown>) {
  const transport = new StdioClientTransport({
    command: process.env.MCP_CLIENT_COMMAND ?? "npm",
    args: process.env.MCP_CLIENT_ARGS?.split(" ").filter(Boolean) ?? ["run", "mcp:dev"],
    cwd: process.env.MCP_CLIENT_CWD ?? process.cwd()
  });

  const client = new Client({ name: "chat-mcp-bridge", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    const raw = await client.callTool({ name: toolName, arguments: args });
    const parsed = parseMcpTextPayload<TData>(raw);

    if (!parsed.ok) {
      throw new Error(`MCP tool failed (${parsed.error.code}): ${parsed.error.message}`);
    }

    return parsed.data;
  } finally {
    await client.close();
  }
}
