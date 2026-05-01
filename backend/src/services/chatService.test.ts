// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntentType } from "../domain/intentTypes";
import { getSessionContext } from "./contextManager";

const interpret = vi.hoisted(() => vi.fn());
const { dispatchQuery } = vi.hoisted(() => ({
  dispatchQuery: vi.fn()
}));

const { shouldUseGroundedLlmReply, formulateGroundedReply } = vi.hoisted(() => ({
  shouldUseGroundedLlmReply: vi.fn(() => false),
  formulateGroundedReply: vi.fn()
}));

vi.mock("./interpreters", () => ({
  getInterpreter: () => ({ interpret: interpret as unknown as typeof interpret })
}));

vi.mock("./queryDispatcher", () => ({
  dispatchQuery
}));

vi.mock("./groundedReply", () => ({
  shouldUseGroundedLlmReply,
  formulateGroundedReply
}));

import { processChat } from "./chatService";

const fullParams = {
  date: "2024-01-10",
  at: null as string | null,
  a_from: null as string | null,
  a_to: null as string | null,
  b_from: null as string | null,
  b_to: null as string | null,
  limit: null as string | null,
  threshold: null as string | null
};

describe("processChat (orchestration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldUseGroundedLlmReply.mockReturnValue(false);
    interpret.mockResolvedValue({
      intent: IntentType.GET_DAILY_REVENUE,
      parameters: { ...fullParams, date: "2024-01-10" },
      confidence: 0.9
    });
    dispatchQuery.mockResolvedValue({
      type: "REVENUE" as const,
      data: { date: "2024-01-10", revenue: 99 }
    });
  });

  it("returns formatted reply and stores session context for supported revenue query", async () => {
    const sid = "session-orch-1";
    const out = await processChat(
      sid,
      "What was total revenue on 2024-01-10? I need the sales revenue figure."
    );
    expect(out.reply).toContain("99");
    expect(out.replySource).toBe("formatter");
    expect(dispatchQuery).toHaveBeenCalled();
    const stored = getSessionContext(sid);
    expect(stored.lastIntent).toBe(IntentType.GET_DAILY_REVENUE);
  });

  it("returns guidance without dispatch for UNKNOWN (off-topic)", async () => {
    interpret.mockResolvedValue({
      intent: IntentType.UNKNOWN,
      parameters: { ...fullParams },
      confidence: 0.2
    });
    const out = await processChat("session-orch-2", "hello there");
    expect(out.reply).toMatch(/POS data|Try:/i);
    expect(out.result).toBeUndefined();
    expect(dispatchQuery).not.toHaveBeenCalled();
  });
});
