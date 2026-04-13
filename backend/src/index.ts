import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chatRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/chat", chatRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});