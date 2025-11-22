"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const DATABASE_URL = process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/aibkh";
const pool = new pg_1.Pool({
    connectionString: DATABASE_URL
});
exports.db = {
    async init() {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS dca_events (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER,
        threshold_index INTEGER,
        usdc_amount TEXT,
        price TEXT,
        expo INTEGER,
        publish_time BIGINT,
        arc_tx_hash TEXT,
        bridge_tx_hash TEXT,
        base_swap_tx_hash TEXT,
        btc_received TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    },
    async insertDcaEvent(record) {
        await pool.query(`
      INSERT INTO dca_events (
        plan_id, threshold_index, usdc_amount, price, expo, publish_time,
        arc_tx_hash, bridge_tx_hash, base_swap_tx_hash, btc_received
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, [
            record.planId,
            record.thresholdIndex,
            record.usdcAmount,
            record.price,
            record.expo,
            record.publishTime,
            record.arcTxHash,
            record.bridgeTxHash,
            record.baseSwapTxHash,
            record.btcReceived
        ]);
    },
    async getDcaHistory() {
        const res = await pool.query(`SELECT * FROM dca_events ORDER BY created_at DESC LIMIT 200`);
        return res.rows;
    },
    async getDcaSummary() {
        const res = await pool.query(`
      SELECT
        COUNT(*)::INT AS trade_count,
        COALESCE(SUM((btc_received)::numeric), 0) AS total_btc,
        COALESCE(SUM((usdc_amount)::numeric), 0) AS total_usdc
      FROM dca_events
    `);
        return res.rows[0] || { trade_count: 0, total_btc: 0, total_usdc: 0 };
    }
};
// Initialize schema on module load
exports.db.init().catch((err) => {
    console.error("[db] Failed to init schema:", err);
});
