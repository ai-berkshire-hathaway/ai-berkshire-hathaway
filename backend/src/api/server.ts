import express from "express";
import { db } from "../services/db";

const PORT = process.env.PORT || 3001;

export function startApiServer(): Promise<void> {
  return new Promise((resolve) => {
    const app = express();

    app.get("/api/health", (_req, res) => {
      res.json({ ok: true });
    });

    app.get("/api/dca/history", async (_req, res) => {
      const rows = await db.getDcaHistory();
      res.json(rows);
    });

    app.get("/api/dca/summary", async (_req, res) => {
      const summary = await db.getDcaSummary();
      res.json(summary);
    });

    app.listen(PORT, () => {
      console.log(`Backend API listening on http://localhost:${PORT}`);
      resolve();
    });
  });
}