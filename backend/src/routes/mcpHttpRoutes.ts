// MCP HTTP routes (thesis): developed with Cursor (IDE AI); the author reviewed, adapted, and tested all behaviour — see Declaration on AI tools.
import { Router, Request, Response } from "express";
import { dispatchMcpJsonRpc } from "../mcp/http/mcpJsonRpcDispatcher";

// HTTP JSON-RPC transport for MCP, complementing the stdio MCP server process.
export const mcpHttpRouter = Router();

mcpHttpRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    endpoint: "/mcp",
    hint: "POST JSON-RPC 2.0 here (initialize, tools/list, tools/call). Optional SSE: GET /mcp/stream",
    docs: "Professor-style HTTP MCP probe + JSON-RPC bridge alongside stdio MCP (npm run mcp:dev)"
  });
});

mcpHttpRouter.head("/", (_req: Request, res: Response) => {
  res.status(200).end();
});

mcpHttpRouter.options("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .header("Access-Control-Allow-Origin", "*")
    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    .header("Access-Control-Allow-Methods", "GET,POST,HEAD,OPTIONS")
    .end();
});

mcpHttpRouter.post("/", async (req: Request, res: Response) => {
  try {
    const payload = await dispatchMcpJsonRpc(req.body);
    res
      .status(200)
      .header("Cache-Control", "no-cache")
      .json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(200).json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32000, message }
    });
  }
});

// SSE stub for integrations that expected a streamed connection handshake.
mcpHttpRouter.get("/stream", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const ready = {
    jsonrpc: "2.0",
    method: "server/ready",
    params: {}
  };

  res.write(`event: jsonrpc\n`);
  res.write(`data: ${JSON.stringify(ready)}\n\n`);
  res.end();
});
