// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import express, { type Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntentType } from "../domain/intentTypes";

const { processChat } = vi.hoisted(() => ({
  processChat: vi.fn()
}));

vi.mock("../services/chatService", () => ({
  processChat
}));

import { chatRouter } from "./chatRoutes";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/chat", chatRouter);
  return app;
}

describe("HTTP routes (integration-style)", () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("POST /chat returns 400 when body is incomplete", async () => {
    const res = await request(app).post("/chat").send({ sessionId: "s1" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /chat returns 200 and forwards to processChat", async () => {
    processChat.mockResolvedValue({
      intent: { intent: IntentType.GET_DAILY_REVENUE, parameters: {}, confidence: 0.9 },
      result: {},
      reply: "ok",
      replySource: "formatter"
    });
    const res = await request(app)
      .post("/chat")
      .send({ sessionId: "s-test", message: "revenue today" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBe("ok");
    expect(processChat).toHaveBeenCalledWith("s-test", "revenue today");
  });
});
