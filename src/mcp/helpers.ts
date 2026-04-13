import { z } from "zod";
import { McpEnvelope, McpErrorEnvelope } from "./types";

type ToolTask<TData> = () => Promise<TData>;

export function buildSuccess<TData>(tool: string, data: TData): McpEnvelope<TData> {
  return {
    ok: true,
    tool,
    data
  };
}

export function buildError(tool: string, error: unknown): McpErrorEnvelope {
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
      message: "Unknown tool error"
    }
  };
}

export async function executeTool<TData>(
  tool: string,
  params: unknown,
  task: ToolTask<TData>
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  console.log(`[mcp] ${tool} called`, params);
  try {
    const data = await task();
    const envelope = buildSuccess(tool, data);
    console.log(`[mcp] ${tool} success`);
    return {
      content: [{ type: "text", text: JSON.stringify(envelope) }]
    };
  } catch (error) {
    const envelope = buildError(tool, error);
    console.error(`[mcp] ${tool} failed`, envelope.error);
    return {
      content: [{ type: "text", text: JSON.stringify(envelope) }]
    };
  }
}
