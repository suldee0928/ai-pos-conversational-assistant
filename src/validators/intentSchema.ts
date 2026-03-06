import { z } from "zod";
import { IntentType } from "../domain/intentTypes";

export const intentSchema = z.object({
  intent: z.nativeEnum(IntentType),
  parameters: z.object({}).passthrough().optional(),
  confidence: z.number().min(0).max(1)
});

export type Intent = z.infer<typeof intentSchema>;