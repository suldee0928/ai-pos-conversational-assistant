// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { describe, it, expect } from "vitest";
import { assertReadOnlySelect } from "./sqlGuard";

describe("assertReadOnlySelect", () => {
  it("accepts a simple SELECT", () => {
    expect(assertReadOnlySelect("SELECT * FROM Sale")).toContain("SELECT");
  });

  it("rejects empty input", () => {
    expect(() => assertReadOnlySelect("")).toThrow("Empty SQL");
  });

  it("rejects multiple statements", () => {
    expect(() => assertReadOnlySelect("SELECT 1; SELECT 2")).toThrow(
      "Exactly one SQL statement"
    );
  });

  it("rejects non-SELECT", () => {
    expect(() => assertReadOnlySelect("DELETE FROM Sale")).toThrow(
      "Only SELECT queries"
    );
  });

  it("rejects SQL comments", () => {
    expect(() => assertReadOnlySelect("SELECT 1 -- hack")).toThrow(
      "comments are not allowed"
    );
  });

  it("rejects forbidden keywords inside an otherwise SELECT-shaped statement", () => {
    expect(() =>
      assertReadOnlySelect("SELECT * FROM Sale WHERE id = 1; DELETE FROM Sale")
    ).toThrow("Exactly one SQL statement");
    expect(() =>
      assertReadOnlySelect("SELECT * FROM Sale WHERE delete = 1")
    ).toThrow("Forbidden keyword");
  });
});
