import OpenAI from "openai";
import { IntentType } from "../../domain/intentTypes";
import { IntentInterpreter, SessionContextInput, StructuredIntent } from "./types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class OpenAIInterpreter implements IntentInterpreter {
  async interpret(
    message: string,
    sessionContext?: SessionContextInput
  ): Promise<StructuredIntent> {
    const prompt = `
You are an intent extraction component for a POS conversational assistant.

Return only valid JSON with this exact shape:
{
  "intent": "GET_DAILY_REVENUE | GET_CURRENT_SHIFTS | COMPARE_REVENUE_PERIODS | FOLLOW_UP | UNKNOWN",
  "parameters": {
    "date": string|null,
    "at": string|null,
    "a_from": string|null,
    "a_to": string|null,
    "b_from": string|null,
    "b_to": string|null
  },
  "confidence": number
}

Rules:
- For a daily revenue question, use GET_DAILY_REVENUE.
- For "who is working" type questions, use GET_CURRENT_SHIFTS.
- For revenue comparison, use COMPARE_REVENUE_PERIODS.
- For context-dependent queries like "what about yesterday?", use FOLLOW_UP.
- If unclear, use UNKNOWN.
- Always include all parameter fields.
- Use null for unused parameters.
- Confidence must be between 0 and 1.
- For single-day comparisons, set a_from and a_to to the same date.
- For single-day comparisons, set b_from and b_to to the same date.
- Do not leave a_to null if a_from is provided.
- Do not leave b_to null if b_from is provided.
- All dates must be returned in YYYY-MM-DD format.
- If the user gives dates like MM-DD, convert them to YYYY-MM-DD.
- Do not return dates in MM-DD format.
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.2,
      input: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({
            message,
            sessionContext: sessionContext ?? {}
          })
        }
      ]
    });

    console.log("===== RAW OPENAI RESPONSE =====");
    console.dir(response, { depth: null });

    const text = response.output_text;

    console.log("===== OPENAI TEXT OUTPUT =====");
    console.log(text);


    if (!text) {
      throw new Error("OpenAI returned no text output");
    }

    const parsed = JSON.parse(text) as StructuredIntent;

    console.log("===== PARSED INTENT =====");
    console.log(parsed);

    return parsed;
  }


}