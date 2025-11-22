"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startApiServer = startApiServer;
const express_1 = __importDefault(require("express"));
const db_1 = require("../services/db");
const PORT = process.env.PORT || 3001;
function startApiServer() {
    return new Promise((resolve) => {
        const app = (0, express_1.default)();
        app.get("/api/health", (_req, res) => {
            res.json({ ok: true });
        });
        app.get("/api/dca/history", async (_req, res) => {
            const rows = await db_1.db.getDcaHistory();
            res.json(rows);
        });
        app.get("/api/dca/summary", async (_req, res) => {
            const summary = await db_1.db.getDcaSummary();
            res.json(summary);
        });
        app.listen(PORT, () => {
            console.log(`Backend API listening on http://localhost:${PORT}`);
            resolve();
        });
    });
}
