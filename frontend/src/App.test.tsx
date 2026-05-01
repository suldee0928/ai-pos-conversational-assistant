// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders heading and send button", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /POS Conversational Assistant/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });
});
