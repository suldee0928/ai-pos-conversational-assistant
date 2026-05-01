import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const windowMs = parsePositiveInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const maxRequests = parsePositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 60);

export const chatRateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again later."
  }
});

export function requireChatApiKey(req: Request, res: Response, next: NextFunction) {
  const expectedKey = process.env.CHAT_API_KEY;

  // If CHAT_API_KEY is unset, client authentication is disabled (development default).
  if (!expectedKey) {
    return next();
  }

  const received = req.header("x-api-key");
  if (received !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  return next();
}
