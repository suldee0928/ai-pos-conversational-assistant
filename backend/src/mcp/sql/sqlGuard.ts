const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|execute|call|copy|merge|replace)\b/i;

// Permits exactly one SELECT; rejects DDL/DML keywords and other unsafe patterns for read-only use.
export function assertReadOnlySelect(sql: string): string {
  let s = sql.trim();
  if (s.length === 0) {
    throw new Error("Empty SQL");
  }
  if (s.length > 8000) {
    throw new Error("SQL too long");
  }
  if (/--|\/\*|\*\//.test(s)) {
    throw new Error("SQL comments are not allowed");
  }

  const statements = s
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (statements.length !== 1) {
    throw new Error("Exactly one SQL statement is allowed");
  }

  s = statements[0];

  if (!/^\s*select\b/i.test(s)) {
    throw new Error("Only SELECT queries are allowed");
  }

  if (/\binto\s+/i.test(s)) {
    throw new Error("SELECT INTO is not allowed");
  }

  if (FORBIDDEN.test(s)) {
    throw new Error("Forbidden keyword in SQL");
  }

  return s;
}
