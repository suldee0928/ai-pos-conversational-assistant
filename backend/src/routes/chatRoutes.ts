import { Router } from "express";
import { handleChat } from "../controllers/chatController";

export const chatRouter = Router();

chatRouter.post("/", handleChat);