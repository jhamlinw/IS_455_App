import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const customerId = req.cookies.get("customer_id")?.value;
  if (!customerId) {
    return NextResponse.json({ orders: [] });
  }

  const db = getDb();
  const orders = db
    .prepare(
      `SELECT order_id, order_datetime, order_total, payment_method, shipping_state
       FROM orders WHERE customer_id = ?
       ORDER BY order_datetime DESC`
    )
    .all(Number(customerId));

  return NextResponse.json({ orders });
}
