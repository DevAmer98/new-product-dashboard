import express from "express";
import cors from "cors";

import lateNotificationsRouter from "./routes/lateNotifications";
import pool from "./db/pool";
import { executeWithRetry, withTimeout } from "./utils/reliability";

const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api", lateNotificationsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error("Unhandled error in API server", err);
  res.status(500).json({ error: "Unexpected server error" });
});

const start = async () => {
  try {
    await executeWithRetry(() => withTimeout(pool.query("SELECT 1"), 5000));
    console.log("✅ Database connection ready");
  } catch (error) {
    console.error("⚠️ Database connection failed", error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 API server listening on http://localhost:${PORT}`);
  });
};

start();
