import { validateIntent } from "./intentValidator";
import { dispatchQuery } from "./queryDispatcher";
import { getSessionContext, updateSessionContext } from "./contextManager";
import { interpretMessage } from "./llmClient";
import { IntentType } from "../domain/intentTypes";

export async function processChat(sessionId: string, message: string) {
  const context = getSessionContext(sessionId);

  const structuredIntent = await interpretMessage(message, {
    lastIntent: context.lastIntent,
    lastParameters: context.lastParameters
  });

  if (structuredIntent.intent === IntentType.FOLLOW_UP) {
    if (!context.lastIntent) {
      throw new Error("No previous context available for follow-up");
    }

    structuredIntent.intent = context.lastIntent as IntentType;

    structuredIntent.parameters = {
      date:
        structuredIntent.parameters.date ??
        context.lastParameters?.date ??
        null,
      at:
        structuredIntent.parameters.at ??
        context.lastParameters?.at ??
        null,
      a_from:
        structuredIntent.parameters.a_from ??
        context.lastParameters?.a_from ??
        null,
      a_to:
        structuredIntent.parameters.a_to ??
        context.lastParameters?.a_to ??
        null,
      b_from:
        structuredIntent.parameters.b_from ??
        context.lastParameters?.b_from ??
        null,
      b_to:
        structuredIntent.parameters.b_to ??
        context.lastParameters?.b_to ??
        null
    };
  }

  validateIntent(structuredIntent);

  const result = await dispatchQuery(structuredIntent);

  updateSessionContext(sessionId, {
    lastIntent: structuredIntent.intent,
    lastParameters: structuredIntent.parameters,
    lastResult: result
  });

  return {
    intent: structuredIntent,
    result
  };
}