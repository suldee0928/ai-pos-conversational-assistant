// MCP implementation (thesis): developed with Cursor (IDE AI); the author reviewed, adapted, and tested all behaviour — see Declaration on AI tools.
import { z } from "zod";
import { McpErrorEnvelope } from "./types";

type ToolResult<TData> = {
  content: Array<{ type: "text"; text: string }>;
};

function successEnvelope<TData>(tool: string, data: TData) {
  return {
    ok: true as const,
    tool,
    data
  };
}

function errorEnvelope(tool: string, error: unknown): McpErrorEnvelope {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      tool,
      error: {
        code: "VALIDATION_ERROR",
        message: error.issues.map((issue) => issue.message).join("; ")
      }
    };
  }

  if (error instanceof Error) {
    return {
      ok: false,
      tool,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message
      }
    };
  }

  return {
    ok: false,
    tool,
    error: {
      code: "UNKNOWN_ERROR",
      message: "Unknown error"
    }
  };
}

function logMcp(message: string, details?: unknown) {
  const prefix = `[mcp][${new Date().toISOString()}] ${message}`;
  if (details === undefined) {
    console.error(prefix);
    return;
  }
  console.error(prefix, details);
}

export async function runTool<TData>(
  tool: string,
  params: unknown,
  callback: () => Promise<TData>
): Promise<ToolResult<TData>> {
  logMcp(`${tool} called`, params);
  try {
    const data = await callback();
    logMcp(`${tool} success`);
    return {
      content: [{ type: "text", text: JSON.stringify(successEnvelope(tool, data)) }]
    };
  } catch (error) {
    const formatted = errorEnvelope(tool, error);
    logMcp(`${tool} failed`, formatted.error);
    return {
      content: [{ type: "text", text: JSON.stringify(formatted) }]
    };
  }
}
