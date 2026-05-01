// Converts query results into fixed wording when MCP or LLM-assisted reply drafting is unavailable.
import { PaymentType } from "@prisma/client";
import { IntentType } from "../domain/intentTypes";
import { formatShiftQueryReply } from "./shiftReply";

type Intent = {
  intent: IntentType;
  parameters: {
    date: string | null;
    at: string | null;
    a_from: string | null;
    a_to: string | null;
    b_from: string | null;
    b_to: string | null;
    limit: string | null;
    threshold: string | null;
  };
  confidence: number;
};

export type QueryResult =
  | {
      type: "REVENUE";
      data:
        | number
        | {
            date: string;
            revenue: number;
          };
    }
  | {
      type: "CURRENT_SHIFTS";
      data:
        | Array<{
            id: number;
            startTime: string | Date;
            endTime: string | Date | null;
            employee?: {
              id: number;
              name: string;
              role: string;
            } | null;
          }>
        | {
            at: string;
            shifts: Array<{
              id: number;
              startTime: string | Date;
              endTime: string | Date | null;
              employee?: {
                id: number;
                name: string;
                role: string;
              } | null;
            }>;
          };
    }
  | {
      type: "COMPARE_REVENUE";
      data: {
        periodA:
          | number
          | {
              from: string;
              to: string;
              revenue: number;
            };
        periodB:
          | number
          | {
              from: string;
              to: string;
              revenue: number;
            };
      };
    }
  | {
      type: "REVENUE_BY_PAYMENT";
      data: {
        date: string;
        breakdown: Array<{ paymentType: PaymentType; revenue: number }>;
      };
    }
  | {
      type: "TOP_PRODUCTS";
      data: {
        from: string;
        to: string;
        limit: number;
        products: Array<{
          productId: number;
          name: string;
          sku: string;
          revenue: number;
          quantitySold: number;
        }>;
      };
    }
  | {
      type: "EMPLOYEE_SALES";
      data: {
        from: string;
        to: string;
        employees: Array<{
          employeeId: number;
          name: string;
          revenue: number;
        }>;
      };
    }
  | {
      type: "LOW_STOCK";
      data: {
        threshold: number;
        limit: number;
        products: Array<{
          id: number;
          name: string;
          sku: string;
          stock: number;
          categoryName: string;
        }>;
      };
    };

function formatSingleDate(date: string | null): string {
  return date ?? "the requested date";
}

function formatDateRange(from: string | null, to: string | null): string {
  if (!from && !to) return "the requested period";
  if (from && to && from === to) return from;
  if (from && to) return `${from} to ${to}`;
  return from ?? to ?? "the requested period";
}

function paymentLabel(pt: PaymentType): string {
  switch (pt) {
    case PaymentType.CASH:
      return "Cash";
    case PaymentType.CARD:
      return "Card";
    case PaymentType.MOBILE:
      return "Mobile";
    default:
      return String(pt);
  }
}

export function formatAssistantResponse(
  intent: Intent,
  result: QueryResult
): string {
  if (result.type === "REVENUE") {
    const revenueData =
      typeof result.data === "number"
        ? { date: intent.parameters.date, revenue: result.data }
        : result.data;
    const dateText = formatSingleDate(revenueData.date ?? intent.parameters.date);

    if (revenueData.revenue === 0) {
      return `No revenue was recorded on ${dateText}.`;
    }

    return `Revenue on ${dateText} was ${revenueData.revenue}.`;
  }

  if (result.type === "CURRENT_SHIFTS") {
    if (Array.isArray(result.data)) {
      return formatShiftQueryReply(new Date().toISOString(), result.data);
    }
    return formatShiftQueryReply(result.data.at, result.data.shifts);
  }

  if (result.type === "COMPARE_REVENUE") {
    const periodAValue =
      typeof result.data.periodA === "number"
        ? result.data.periodA
        : result.data.periodA.revenue;
    const periodBValue =
      typeof result.data.periodB === "number"
        ? result.data.periodB
        : result.data.periodB.revenue;

    const periodAText =
      typeof result.data.periodA === "number"
        ? formatDateRange(intent.parameters.a_from, intent.parameters.a_to)
        : formatDateRange(result.data.periodA.from, result.data.periodA.to);
    const periodBText =
      typeof result.data.periodB === "number"
        ? formatDateRange(intent.parameters.b_from, intent.parameters.b_to)
        : formatDateRange(result.data.periodB.from, result.data.periodB.to);

    return `Revenue comparison: ${periodAText} = ${periodAValue}, ${periodBText} = ${periodBValue}.`;
  }

  if (result.type === "REVENUE_BY_PAYMENT") {
    const { date, breakdown } = result.data;
    if (breakdown.length === 0 || breakdown.every((r) => r.revenue === 0)) {
      return `No revenue was recorded on ${date} (by payment type).`;
    }
    const parts = breakdown
      .filter((r) => r.revenue > 0)
      .map((r) => `${paymentLabel(r.paymentType)}: ${r.revenue}`)
      .join("; ");
    return `Revenue on ${date} by payment type — ${parts}.`;
  }

  if (result.type === "TOP_PRODUCTS") {
    const { from, to, limit, products } = result.data;
    const rangeText = formatDateRange(from, to);
    if (products.length === 0) {
      return `No product sales found for ${rangeText}.`;
    }
    const lines = products.map(
      (p, i) =>
        `${i + 1}. ${p.name} (${p.sku}) — revenue ${p.revenue}, units sold ${p.quantitySold}`
    );
    return `Top ${limit} products by revenue (${rangeText}):\n${lines.join("\n")}`;
  }

  if (result.type === "EMPLOYEE_SALES") {
    const { from, to, employees } = result.data;
    const rangeText = formatDateRange(from, to);
    if (employees.length === 0) {
      return `No employee-attributed sales found for ${rangeText}.`;
    }
    const lines = employees.map(
      (e, i) => `${i + 1}. ${e.name} — total sales ${e.revenue}`
    );
    return `Sales by employee (${rangeText}):\n${lines.join("\n")}`;
  }

  if (result.type === "LOW_STOCK") {
    const { threshold, limit, products } = result.data;
    if (products.length === 0) {
      return `No products at or below stock threshold ${threshold}.`;
    }
    const lines = products.map(
      (p) =>
        `• ${p.name} (${p.sku}) — stock ${p.stock} [${p.categoryName}]`
    );
    return `Low stock (≤ ${threshold}, showing up to ${limit}):\n${lines.join("\n")}`;
  }

  return "The request was processed successfully.";
}
