import { IntentType } from "../../domain/intentTypes";

export type StructuredIntent = {
  intent: IntentType;
  parameters: {
    date: string | null;
    at: string | null;
    a_from: string | null;
    a_to: string | null;
    b_from: string | null;
    b_to: string | null;
    /** Max rows / top-N (numeric string), e.g. "5" */
    limit: string | null;
    /** Stock threshold for low-stock queries (numeric string), e.g. "10" */
    threshold: string | null;
  };
  confidence: number;
};

export type SessionContextInput = {
  lastIntent?: string;
  lastParameters?: Record<string, unknown>;
};

export interface IntentInterpreter {
  interpret(
    message: string,
    sessionContext?: SessionContextInput
  ): Promise<StructuredIntent>;
}