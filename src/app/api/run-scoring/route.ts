import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface OrderRow {
  order_id: number;
  order_total: number;
  shipping_fee: number;
  promo_used: number;
  risk_score: number;
  promised_days: number | null;
  actual_days: number | null;
  distance_band: string | null;
  shipping_method: string | null;
  carrier: string | null;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function scoreLateDelivery(row: OrderRow): number {
  let logit = -1.5;

  // Higher promised days → more likely to be late
  if (row.promised_days != null) {
    logit += row.promised_days * 0.15;
  }

  // Distance band
  if (row.distance_band === "national") logit += 0.6;
  else if (row.distance_band === "regional") logit += 0.2;
  else if (row.distance_band === "local") logit -= 0.3;

  // Shipping method
  if (row.shipping_method === "standard") logit += 0.4;
  else if (row.shipping_method === "economy") logit += 0.7;
  else if (row.shipping_method === "expedited") logit -= 0.2;

  // Higher order total → slightly more complex fulfillment
  if (row.order_total > 500) logit += 0.3;
  if (row.order_total > 1000) logit += 0.2;

  // Higher shipping fee can indicate longer distance
  logit += row.shipping_fee * 0.02;

  // Add some deterministic variation based on order_id
  logit += Math.sin(row.order_id * 0.1) * 0.3;

  return sigmoid(logit);
}

export async function POST() {
  try {
    const db = getDb();

    db.exec(`
      CREATE TABLE IF NOT EXISTS order_predictions (
        order_id INTEGER PRIMARY KEY,
        late_delivery_probability REAL,
        predicted_late_delivery INTEGER,
        prediction_timestamp TEXT
      )
    `);

    const rows = db.prepare(`
      SELECT
        o.order_id,
        o.order_total,
        o.shipping_fee,
        o.promo_used,
        o.risk_score,
        s.promised_days,
        s.actual_days,
        s.distance_band,
        s.shipping_method,
        s.carrier
      FROM orders o
      LEFT JOIN shipments s ON s.order_id = o.order_id
    `).all() as OrderRow[];

    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT OR REPLACE INTO order_predictions
      (order_id, late_delivery_probability, predicted_late_delivery, prediction_timestamp)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const row of rows) {
        const prob = scoreLateDelivery(row);
        const pred = prob > 0.5 ? 1 : 0;
        insert.run(row.order_id, prob, pred, now);
      }
    });

    transaction();

    return NextResponse.json({ count: rows.length, timestamp: now });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
