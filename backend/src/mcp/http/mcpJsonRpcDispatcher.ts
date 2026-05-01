// MCP implementation (thesis): developed with Cursor (IDE AI); the author reviewed, adapted, and tested all behaviour — see Declaration on AI tools.
import { runMcpToolByName } from "./toolRunner";

function logHttpMcp(method: string, id: unknown) {
  console.error(`[mcp-http][${new Date().toISOString()}] <- ${method} (id=${JSON.stringify(id)})`);
}

function jsonRpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0" as const, id, result };
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return {
    jsonrpc: "2.0" as const,
    id,
    error: { code, message }
  };
}

function toolsListPayload() {
  return {
    tools: [
      {
        name: "get_daily_revenue",
        description: "Get total revenue for a calendar date (YYYY-MM-DD).",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date in YYYY-MM-DD format" }
          },
          required: ["date"]
        }
      },
      {
        name: "get_current_shifts",
        description: "List shifts active at a given instant.",
        inputSchema: {
          type: "object",
          properties: {
            at: { type: "string", description: "ISO datetime with offset" }
          },
          required: ["at"]
        }
      },
      {
        name: "compare_revenue_periods",
        description: "Compare revenue between two inclusive date ranges.",
        inputSchema: {
          type: "object",
          properties: {
            a_from: { type: "string" },
            a_to: { type: "string" },
            b_from: { type: "string" },
            b_to: { type: "string" }
          },
          required: ["a_from", "a_to", "b_from", "b_to"]
        }
      },
      {
        name: "get_revenue_by_payment",
        description: "Get revenue split by payment channel for a calendar date.",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date in YYYY-MM-DD format" }
          },
          required: ["date"]
        }
      },
      {
        name: "get_top_products",
        description: "Top-selling products by revenue over a date range.",
        inputSchema: {
          type: "object",
          properties: {
            a_from: { type: "string" },
            a_to: { type: "string" },
            limit: { type: "number" }
          },
          required: ["a_from", "a_to"]
        }
      },
      {
        name: "get_employee_sales",
        description: "Employee sales totals over an inclusive date range.",
        inputSchema: {
          type: "object",
          properties: {
            a_from: { type: "string" },
            a_to: { type: "string" }
          },
          required: ["a_from", "a_to"]
        }
      },
      {
        name: "get_low_stock",
        description: "List products at or below a stock threshold.",
        inputSchema: {
          type: "object",
          properties: {
            threshold: { type: "number" },
            limit: { type: "number" }
          }
        }
      },
      {
        name: "natural_language_sql",
        description:
          "Generate a read-only PostgreSQL SELECT from natural language and execute it (guarded).",
        inputSchema: {
          type: "object",
          properties: {
            question: { type: "string" }
          },
          required: ["question"]
        }
      }
    ]
  };
}

// JSON-RPC façade over HTTP invoking the same tool suite as the stdio MCP implementation.
export async function dispatchMcpJsonRpc(body: unknown): Promise<unknown> {
  if (!body || typeof body !== "object") {
    return jsonRpcError(null, -32600, "Invalid Request");
  }

  const req = body as {
    jsonrpc?: string;
    method?: string;
    params?: unknown;
    id?: unknown;
  };

  const id = req.id ?? null;
  const method = req.method ?? "";

  if (req.jsonrpc !== "2.0") {
    return jsonRpcError(id, -32600, "jsonrpc must be 2.0");
  }

  logHttpMcp(method, id);

  try {
    switch (method) {
      case "initialize":
        return jsonRpcResult(id, {
          protocolVersion: "2025-06-18",
          capabilities: {},
          serverInfo: {
            name: "pos-assistant-mcp-http",
            version: "1.0.0"
          },
          instructions:
            "POS assistant HTTP MCP bridge. Use tools/call with get_daily_revenue, get_current_shifts, compare_revenue_periods, get_revenue_by_payment, get_top_products, get_employee_sales, get_low_stock, natural_language_sql."
        });

      case "notifications/initialized":
        return jsonRpcResult(id, {});

      case "tools/list":
        return jsonRpcResult(id, toolsListPayload());

      case "tools/call": {
        const params = (req.params ?? {}) as {
          name?: string;
          arguments?: unknown;
        };
        const name = params.name ?? "";
        const args = params.arguments ?? {};
        const envelope = await runMcpToolByName(name, args);
        const text = JSON.stringify(envelope);
        return jsonRpcResult(id, {
          content: [{ type: "text", text }]
        });
      }

      default:
        return jsonRpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error(`[mcp-http][${new Date().toISOString()}] error`, error);
    return jsonRpcError(id, -32000, message);
  }
}
