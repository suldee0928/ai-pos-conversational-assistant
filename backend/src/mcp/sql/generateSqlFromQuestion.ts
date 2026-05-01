import OpenAI from "openai";
import { POS_SCHEMA_FOR_LLM } from "./schemaContext";
import { NL_SQL_JSON_SCHEMA } from "./nlSqlOutputSchema";

export async function generateSqlFromQuestion(question: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You translate natural language into ONE PostgreSQL SELECT statement only.

${POS_SCHEMA_FOR_LLM}

Hard rules:
- Fill the structured output field "sql" with ONLY the SQL text (no markdown fences).
- Single SELECT only. No CTE abuse beyond simple readability; keep it one statement.
- Read-only: SELECT only.
- Prefer aggregations with clear column aliases when summarizing.
- Use LIMIT if the user asks for "top N" or sample rows; otherwise you may omit LIMIT for aggregates.
- Do not end the SQL string with a semicolon.`
      },
      {
        role: "user",
        content: question.trim()
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "nl_sql_select",
        strict: true,
        schema: NL_SQL_JSON_SCHEMA as unknown as Record<string, unknown>
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned no structured SQL output");
  }

  const parsed = JSON.parse(content) as { sql: string };
  const sql = parsed.sql?.trim();
  if (!sql) {
    throw new Error("Structured output missing sql field");
  }

  return sql.replace(/;+\s*$/, "");
}
