import { IntentType } from "../domain/intentTypes";

type Intent = {
  intent: IntentType;
  parameters: {
    date: string | null;
    at: string | null;
    a_from: string | null;
    a_to: string | null;
    b_from: string | null;
    b_to: string | null;
  };
  confidence: number;
};

type QueryResult =
  | {
      type: "REVENUE";
      data: number;
    }
  | {
      type: "CURRENT_SHIFTS";
      data: Array<{
        id: number;
        startTime: string;
        endTime: string | null;
        employee?: {
          id: number;
          name: string;
          role: string;
        } | null;
      }>;
    }
  | {
      type: "COMPARE_REVENUE";
      data: {
        periodA: number;
        periodB: number;
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

export function formatAssistantResponse(
  intent: Intent,
  result: QueryResult
): string {
  if (result.type === "REVENUE") {
    const dateText = formatSingleDate(intent.parameters.date);

    if (result.data === 0) {
      return `No revenue was recorded on ${dateText}.`;
    }

    return `Revenue on ${dateText} was ${result.data}.`;
  }

  if (result.type === "CURRENT_SHIFTS") {
    const shifts = result.data ?? [];

    if (shifts.length === 0) {
      return "No employees are currently on shift.";
    }

    const names = shifts
      .map((shift) => shift.employee?.name ?? "Unknown")
      .join(", ");

    return `Currently on shift: ${names}.`;
  }

  if (result.type === "COMPARE_REVENUE") {
    const periodAText = formatDateRange(
      intent.parameters.a_from,
      intent.parameters.a_to
    );
    const periodBText = formatDateRange(
      intent.parameters.b_from,
      intent.parameters.b_to
    );

    return `Revenue comparison: ${periodAText} = ${result.data.periodA}, ${periodBText} = ${result.data.periodB}.`;
  }

  return "The request was processed successfully.";
}