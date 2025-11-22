import React, { useEffect, useState } from "react";
import axios from "axios";

type DcaSummary = {
  trade_count: number;
  total_btc: string;
  total_usdc: string;
};

type DcaHistoryRow = {
  id: number;
  plan_id: number;
  threshold_index: number;
  usdc_amount: string;
  price: string;
  expo: number;
  publish_time: number;
  arc_tx_hash: string;
  bridge_tx_hash: string;
  base_swap_tx_hash: string;
  btc_received: string;
  created_at: string;
};

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DcaSummary | null>(null);
  const [history, setHistory] = useState<DcaHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([
          axios.get<DcaSummary>("/api/dca/summary"),
          axios.get<DcaHistoryRow[]>("/api/dca/history")
        ]);
        setSummary(s.data);
        setHistory(h.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Strategy Overview</h2>
      {summary ? (
        <div style={{ marginBottom: 24 }}>
          <div>Executed trades: {summary.trade_count}</div>
          <div>Total USDC invested: {summary.total_usdc}</div>
          <div>Total BTC accumulated: {summary.total_btc}</div>
        </div>
      ) : (
        <p>No summary available.</p>
      )}

      <h2>Recent DCA Events</h2>
      {history.length === 0 ? (
        <p>No DCA events yet.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={th}>Time</th>
              <th style={th}>Threshold Index</th>
              <th style={th}>USDC Amount</th>
              <th style={th}>Price</th>
              <th style={th}>BTC Received</th>
              <th style={th}>Base Swap Tx</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td style={td}>{new Date(row.created_at).toLocaleString()}</td>
                <td style={td}>{row.threshold_index}</td>
                <td style={td}>{row.usdc_amount}</td>
                <td style={td}>{row.price}</td>
                <td style={td}>{row.btc_received}</td>
                <td style={td}>
                  {row.base_swap_tx_hash ? (
                    <a
                      href={`https://basescan.org/tx/${row.base_swap_tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Basescan
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const th: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  padding: "8px"
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px"
};