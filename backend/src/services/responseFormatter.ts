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
    const shifts = Array.isArray(result.data) ? result.data : result.data.shifts;

    if (shifts.length === 0) {
      return "No employees are currently on shift.";
    }

    const names = shifts
      .map((shift) => shift.employee?.name ?? "Unknown")
      .join(", ");

    return `Currently on shift: ${names}.`;
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

  return "The request was processed successfully.";
}