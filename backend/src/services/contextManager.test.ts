// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { describe, expect, it } from "vitest";
import { getSessionContext, updateSessionContext } from "./contextManager";

describe("contextManager", () => {
  it("returns empty object for unknown session", () => {
    expect(getSessionContext(`new-session-${Date.now()}-${Math.random()}`)).toEqual({});
  });

  it("merges updates per session", () => {
    const id = `session-merge-${Date.now()}-${Math.random()}`;
    updateSessionContext(id, { lastIntent: "GET_DAILY_REVENUE" });
    const next = updateSessionContext(id, {
      lastParameters: {
        date: "2024-01-10",
        a_from: null,
        a_to: null,
        at: null,
        b_from: null,
        b_to: null,
        limit: null,
        threshold: null
      }
    });
    expect(next.lastIntent).toBe("GET_DAILY_REVENUE");
    expect(next.lastParameters?.date).toBe("2024-01-10");
  });
});
