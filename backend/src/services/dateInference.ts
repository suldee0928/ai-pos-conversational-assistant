// Infer calendar dates from shorthand like "4-6" (month-day, US ordering) using the machine's current year.

const FULL_ISO_DAY = /\b\d{4}-\d{2}-\d{2}\b/;

// Not followed by `-YYYY` — avoids interpreting "6" in truncated ISO-ish strings oddly; bare "M-D[-YYYY]" uses another path.
const BARE_MONTH_DAY =
  /(?<![0-9])(?<month>\d{1,2})\s*[-/](?<day>\d{1,2})(?!\s*[-/]\s*\d{4})(?![0-9])/;

function isPlausibleGregorianMonthDay(month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const y = new Date().getFullYear();
  const d = new Date(Date.UTC(y, month - 1, day));
  return d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function inferIsoDateFromBareMonthDayInMessage(message: string): string | null {
  if (!message || FULL_ISO_DAY.test(message)) {
    return null;
  }

  const m = message.match(BARE_MONTH_DAY);
  if (!m?.groups?.month || !m.groups?.day) {
    return null;
  }

  const month = Number(m.groups.month);
  const day = Number(m.groups.day);
  if (!isPlausibleGregorianMonthDay(month, day)) {
    return null;
  }

  const year = new Date().getFullYear();
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function normalizeBareMonthDayParam(value: string | null): string | null {
  if (!value) return null;

  const v = value.trim();
  let month: number;
  let day: number;

  const dash = /^(\d{1,2})-(\d{1,2})$/.exec(v);
  const slash = /^(\d{1,2})\/(\d{1,2})$/.exec(v);
  if (dash) {
    month = Number(dash[1]);
    day = Number(dash[2]);
  } else if (slash) {
    month = Number(slash[1]);
    day = Number(slash[2]);
  } else {
    return value;
  }

  if (!isPlausibleGregorianMonthDay(month, day)) return value;

  const year = new Date().getFullYear();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
