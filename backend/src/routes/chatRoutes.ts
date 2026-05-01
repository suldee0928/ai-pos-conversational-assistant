import { Router } from "express";
import { handleChat } from "../controllers/chatController";
import { chatRateLimiter, requireChatApiKey } from "../middleware/chatProtection";

export const chatRouter = Router();

// Rate limiting and optional API key gates run before payload handling.
chatRouter.post("/", chatRateLimiter, requireChatApiKey, handleChat);