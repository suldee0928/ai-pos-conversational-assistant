import { Request, Response } from "express";
import { intentSchema } from "../validators/intentSchema";
import { validateIntent } from "../services/intentValidator";
import { dispatchQuery } from "../services/queryDispatcher";

export const handleChat = async (req: Request, res: Response) => {
  try {
    const parsedIntent = intentSchema.parse(req.body);

    validateIntent(parsedIntent);

    const result = await dispatchQuery(parsedIntent);

    return res.json({
      success: true,
      result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};