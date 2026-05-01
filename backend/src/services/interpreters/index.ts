import { IntentInterpreter } from "./types";
import { OpenAIInterpreter } from "./OpenAIInterpreter";

// OpenAI interpreter with structured output; OPENAI_API_KEY is required when this module initializes.
export function getInterpreter(): IntentInterpreter {
  return new OpenAIInterpreter();
}