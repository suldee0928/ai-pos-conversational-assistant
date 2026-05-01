// Auxiliary tool: model-proposed SELECT statements are gated by sqlGuard before execution.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { runTool } from "../helpers";
import { generateSqlFromQuestion } from "../sql/generateSqlFromQuestion";
import { assertReadOnlySelect } from "../sql/sqlGuard";

const toolName = "natural_language_sql";

const paramsSchema = z.object({
  question: z.string().min(1).max(2000)
});

const MAX_ROWS = 100;

export function registerNaturalLanguageSqlTool(server: McpServer) {
  server.tool(
    toolName,
    "Generate a read-only PostgreSQL SELECT from a natural language question and execute it (demo-safe guardrails).",
    {
      question: z.string().describe("Natural language question about POS data")
    },
    async (params) =>
      runTool(toolName, params, async () => {
        const input = paramsSchema.parse(params);
        const draftSql = await generateSqlFromQuestion(input.question);
        const sql = assertReadOnlySelect(draftSql);

        const rowsUnknown = await prisma.$queryRawUnsafe(sql);
        const allRows = Array.isArray(rowsUnknown) ? rowsUnknown : [];
        const truncated = allRows.length > MAX_ROWS;
        const rows = allRows.slice(0, MAX_ROWS);

        const reply = truncated
          ? `Executed read-only query; returning first ${MAX_ROWS} of ${allRows.length} rows.`
          : `Executed read-only query; ${allRows.length} row(s) returned.`;

        return {
          question: input.question,
          sql,
          rowCount: allRows.length,
          truncated,
          rows,
          reply
        };
      })
  );
}
