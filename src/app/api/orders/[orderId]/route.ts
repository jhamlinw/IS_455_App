import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const db = getDb();

  const order = db
    .prepare(
      `SELECT order_id, order_datetime, order_subtotal, shipping_fee, tax_amount,
              order_total, payment_method, shipping_state
       FROM orders WHERE order_id = ?`
    )
    .get(Number(orderId));

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = db
    .prepare(
      `SELECT p.product_name, oi.quantity, oi.unit_price, oi.line_total
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(Number(orderId));

  return NextResponse.json({ order, items });
}
