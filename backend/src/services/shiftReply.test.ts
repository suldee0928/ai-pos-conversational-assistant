// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { describe, it, expect, vi, afterEach } from "vitest";
import { formatShiftQueryReply } from "./shiftReply";

describe("formatShiftQueryReply", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses historical calendar wording for a past day", () => {
    const msg = formatShiftQueryReply("1999-06-15T14:30:00.000Z", [
      { employee: { name: "Ada" } }
    ]);
    expect(msg).toContain("1999-06-15");
    expect(msg).toContain("Ada");
    expect(msg).not.toContain("Currently");
  });

  it("uses empty-state wording for a past day with no shifts", () => {
    const msg = formatShiftQueryReply("1999-06-15T14:30:00.000Z", []);
    expect(msg).toContain("No employees were on shift");
    expect(msg).not.toContain("at this time");
  });

  it('says "currently" when instant matches the clock (live query)', () => {
    vi.useFakeTimers();
    const t = new Date("2026-06-01T15:00:00.000Z");
    vi.setSystemTime(t);
    expect(
      formatShiftQueryReply(t.toISOString(), [{ employee: { name: "Bob" } }])
    ).toBe("Currently on shift: Bob.");
  });

  it('says "at this time" when no shifts at the clock instant', () => {
    vi.useFakeTimers();
    const t = new Date("2026-06-01T15:00:00.000Z");
    vi.setSystemTime(t);
    expect(formatShiftQueryReply(t.toISOString(), [])).toBe(
      "No employees are on shift at this time."
    );
  });
});
