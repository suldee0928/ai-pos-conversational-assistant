// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { describe, it, expect } from "vitest";
import { IntentType } from "../domain/intentTypes";
import { validateIntent } from "./intentValidator";

const baseParams = {
  date: null as string | null,
  at: null as string | null,
  a_from: null as string | null,
  a_to: null as string | null,
  b_from: null as string | null,
  b_to: null as string | null,
  limit: null as string | null,
  threshold: null as string | null
};

describe("validateIntent", () => {
  it("allows UNKNOWN without confidence check", () => {
    expect(() =>
      validateIntent({
        intent: IntentType.UNKNOWN,
        parameters: { ...baseParams },
        confidence: 0
      })
    ).not.toThrow();
  });

  it("rejects disallowed intent types", () => {
    expect(() =>
      validateIntent({
        intent: IntentType.FOLLOW_UP,
        parameters: { ...baseParams },
        confidence: 0.9
      })
    ).toThrow("Intent not allowed");
  });

  it("rejects low confidence", () => {
    expect(() =>
      validateIntent({
        intent: IntentType.GET_DAILY_REVENUE,
        parameters: { ...baseParams, date: "2026-01-01" },
        confidence: 0.5
      })
    ).toThrow("confidence too low");
  });

  it("requires date for GET_DAILY_REVENUE", () => {
    expect(() =>
      validateIntent({
        intent: IntentType.GET_DAILY_REVENUE,
        parameters: { ...baseParams },
        confidence: 0.9
      })
    ).toThrow("Missing required parameter: date");
  });

  it("requires all window fields for COMPARE_REVENUE_PERIODS", () => {
    expect(() =>
      validateIntent({
        intent: IntentType.COMPARE_REVENUE_PERIODS,
        parameters: {
          ...baseParams,
          a_from: "2026-01-01",
          a_to: "2026-01-02",
          b_from: "2026-02-01",
          b_to: null
        },
        confidence: 0.9
      })
    ).toThrow("Missing required comparison parameters");
  });
});
