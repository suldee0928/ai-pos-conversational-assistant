// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  inferIsoDateFromBareMonthDayInMessage,
  normalizeBareMonthDayParam
} from "./dateInference";

describe("dateInference", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("infers shorthand month-day from user text using host year", () => {
    expect(inferIsoDateFromBareMonthDayInMessage("How much revenue did we make on 4-6")).toBe(
      "2026-04-06"
    );
  });

  it("does not infer when the message includes a full ISO date", () => {
    expect(inferIsoDateFromBareMonthDayInMessage("revenue on 2023-04-06 please")).toBe(null);
  });

  it("normalizes bare MM-DD fragments that sit in structured parameters", () => {
    expect(normalizeBareMonthDayParam("4-6")).toBe("2026-04-06");
    expect(normalizeBareMonthDayParam("04/06")).toBe("2026-04-06");
  });
});
