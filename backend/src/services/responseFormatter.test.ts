// Automated tests (thesis): developed with Cursor (IDE AI) assistance; the author reviewed, adapted, and validates all cases — see Declaration on AI tools.
import { PaymentType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { IntentType } from "../domain/intentTypes";
import { formatAssistantResponse } from "./responseFormatter";
import type { QueryResult } from "./responseFormatter";

const baseParams = {
  date: "2024-01-10",
  at: "2024-01-10T12:00:00.000Z",
  a_from: "2024-01-01",
  a_to: "2024-01-10",
  b_from: "2024-02-01",
  b_to: "2024-02-10",
  limit: "5" as string | null,
  threshold: "10" as string | null
};

const baseIntent = {
  parameters: { ...baseParams },
  confidence: 0.9
};

describe("formatAssistantResponse", () => {
  it("formats zero revenue for a day", () => {
    const intent = { ...baseIntent, intent: IntentType.GET_DAILY_REVENUE };
    const result: QueryResult = {
      type: "REVENUE",
      data: { date: "2024-01-10", revenue: 0 }
    };
    expect(formatAssistantResponse(intent, result)).toBe("No revenue was recorded on 2024-01-10.");
  });

  it("formats positive daily revenue", () => {
    const intent = { ...baseIntent, intent: IntentType.GET_DAILY_REVENUE };
    const result: QueryResult = {
      type: "REVENUE",
      data: { date: "2024-01-10", revenue: 150.5 }
    };
    expect(formatAssistantResponse(intent, result)).toBe("Revenue on 2024-01-10 was 150.5.");
  });

  it("formats revenue by payment with labels", () => {
    const intent = { ...baseIntent, intent: IntentType.GET_REVENUE_BY_PAYMENT };
    const result: QueryResult = {
      type: "REVENUE_BY_PAYMENT",
      data: {
        date: "2024-01-10",
        breakdown: [
          { paymentType: PaymentType.CASH, revenue: 10 },
          { paymentType: PaymentType.CARD, revenue: 20 }
        ]
      }
    };
    const out = formatAssistantResponse(intent, result);
    expect(out).toContain("Cash: 10");
    expect(out).toContain("Card: 20");
  });

  it("formats period comparison with structured period objects", () => {
    const intent = { ...baseIntent, intent: IntentType.COMPARE_REVENUE_PERIODS };
    const result: QueryResult = {
      type: "COMPARE_REVENUE",
      data: {
        periodA: { from: "2024-01-01", to: "2024-01-10", revenue: 100 },
        periodB: { from: "2024-02-01", to: "2024-02-10", revenue: 200 }
      }
    };
    expect(formatAssistantResponse(intent, result)).toBe(
      "Revenue comparison: 2024-01-01 to 2024-01-10 = 100, 2024-02-01 to 2024-02-10 = 200."
    );
  });

  it("formats empty top products", () => {
    const intent = { ...baseIntent, intent: IntentType.GET_TOP_PRODUCTS };
    const result: QueryResult = {
      type: "TOP_PRODUCTS",
      data: {
        from: "2024-01-01",
        to: "2024-01-10",
        limit: 5,
        products: []
      }
    };
    expect(formatAssistantResponse(intent, result)).toContain("No product sales found");
  });

  it("formats top products with lines", () => {
    const intent = { ...baseIntent, intent: IntentType.GET_TOP_PRODUCTS };
    const result: QueryResult = {
      type: "TOP_PRODUCTS",
      data: {
        from: "2024-01-01",
        to: "2024-01-10",
        limit: 1,
        products: [
          {
            productId: 1,
            name: "Milk",
            sku: "M-1",
            revenue: 9.5,
            quantitySold: 2
          }
        ]
      }
    };
    const out = formatAssistantResponse(intent, result);
    expect(out).toContain("Milk");
    expect(out).toContain("M-1");
  });

  it("formats low stock with threshold header", () => {
    const intent = { ...baseIntent, intent: IntentType.GET_LOW_STOCK };
    const result: QueryResult = {
      type: "LOW_STOCK",
      data: {
        threshold: 5,
        limit: 10,
        products: [
          { id: 1, name: "Soap", sku: "S-1", stock: 2, categoryName: "Hyg" }
        ]
      }
    };
    const out = formatAssistantResponse(intent, result);
    expect(out).toContain("Low stock");
    expect(out).toContain("Soap");
  });
});
