import { Request, Response } from "express";
import { processChat } from "../services/chatService";

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: "sessionId and message are required"
      });
    }

    const response = await processChat(sessionId, message);

    return res.json({
      success: true,
      ...response
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};