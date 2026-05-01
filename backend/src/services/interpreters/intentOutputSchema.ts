import { IntentType } from "../../domain/intentTypes";

/** JSON Schema for OpenAI Structured Outputs (strict). Matches {@link StructuredIntent}. */
export const INTENT_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      description: "Classified POS assistant intent",
      enum: Object.values(IntentType)
    },
    parameters: {
      type: "object",
      description: "Structured parameters; use null when not applicable",
      properties: {
        date: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
        at: { type: ["string", "null"], description: "ISO datetime or null" },
        a_from: { type: ["string", "null"] },
        a_to: { type: ["string", "null"] },
        b_from: { type: ["string", "null"] },
        b_to: { type: ["string", "null"] },
        limit: { type: ["string", "null"], description: "Digits only, e.g. top-N" },
        threshold: { type: ["string", "null"], description: "Stock threshold digits" }
      },
      required: ["date", "at", "a_from", "a_to", "b_from", "b_to", "limit", "threshold"],
      additionalProperties: false
    },
    confidence: {
      type: "number",
      description: "Confidence between 0 and 1"
    }
  },
  required: ["intent", "parameters", "confidence"],
  additionalProperties: false
} as const;
