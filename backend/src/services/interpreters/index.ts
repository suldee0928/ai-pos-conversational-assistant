import { IntentInterpreter } from "./types";
import { RuleBasedInterpreter } from "./RuleBasedInterpreter";
import { OpenAIInterpreter } from "./OpenAIInterpreter";

export function getInterpreter(): IntentInterpreter {
  if (process.env.USE_LLM === "true") {
    return new OpenAIInterpreter();
  }

  return new RuleBasedInterpreter();
}