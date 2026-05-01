export type ShiftForReply = {
  employee?: { name: string } | null;
};

function localDateParts(d: Date) {
  return {
    y: d.getFullYear(),
    m: d.getMonth(),
    day: d.getDate()
  };
}

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  const pa = localDateParts(a);
  const pb = localDateParts(b);
  return pa.y === pb.y && pa.m === pb.m && pa.day === pb.day;
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** If "at" is within this window of real time, treat as a live “now” query. */
const NEAR_NOW_MS = 5 * 60 * 1000;

/**
 * Natural-language reply for shifts at a specific instant (not always “currently”).
 */
export function formatShiftQueryReply(atIso: string, shifts: ShiftForReply[]): string {
  const at = new Date(atIso);
  const now = new Date();
  const names = shifts.map((s) => s.employee?.name ?? "Unknown").join(", ");

  const sameDay = sameLocalCalendarDay(at, now);
  const nearNow = Number.isFinite(at.getTime()) && Math.abs(at.getTime() - now.getTime()) <= NEAR_NOW_MS;

  if (shifts.length === 0) {
    if (sameDay && nearNow) {
      return "No employees are on shift at this time.";
    }
    const dateLabel = formatLocalYmd(at);
    const timeLabel = at.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
    return `No employees were on shift at ${dateLabel} ${timeLabel}.`;
  }

  if (sameDay && nearNow) {
    return `Currently on shift: ${names}.`;
  }

  const dateLabel = formatLocalYmd(at);
  const timeLabel = at.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });

  if (sameDay) {
    return `On shift at ${timeLabel} today: ${names}.`;
  }

  return `On shift on ${dateLabel} at ${timeLabel}: ${names}.`;
}
