/** JSON Schema for NL→SQL structured output (single SELECT). */
export const NL_SQL_JSON_SCHEMA = {
  type: "object",
  properties: {
    sql: {
      type: "string",
      description:
        "Exactly one PostgreSQL SELECT statement, read-only, no markdown, no trailing semicolon"
    }
  },
  required: ["sql"],
  additionalProperties: false
} as const;
