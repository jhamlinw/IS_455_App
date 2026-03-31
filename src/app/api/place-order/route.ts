import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { customer_id, items } = await req.json();

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const db = getDb();

    const customer = db
      .prepare("SELECT customer_id, zip_code, state FROM customers WHERE customer_id = ?")
      .get(customer_id) as { customer_id: number; zip_code: string; state: string } | undefined;

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
        payment_method, device_type, ip_country, promo_used, order_subtotal,
        shipping_fee, tax_amount, order_total, risk_score, is_fraud
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
      VALUES (?, ?, ?, ?, ?)
    `);

    const getProduct = db.prepare("SELECT price FROM products WHERE product_id = ?");

    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    const transaction = db.transaction(() => {
      let subtotal = 0;
      const lineItems: { product_id: number; quantity: number; price: number }[] = [];

      for (const item of items) {
        const prod = getProduct.get(item.product_id) as { price: number } | undefined;
        if (!prod) throw new Error(`Product ${item.product_id} not found`);
        const lineTotal = prod.price * item.quantity;
        subtotal += lineTotal;
        lineItems.push({ product_id: item.product_id, quantity: item.quantity, price: prod.price });
      }

      const shippingFee = 9.99;
      const taxAmount = Math.round(subtotal * 0.07 * 100) / 100;
      const orderTotal = Math.round((subtotal + shippingFee + taxAmount) * 100) / 100;

      const result = insertOrder.run(
        customer_id, now, customer.zip_code, customer.zip_code, customer.state,
        "card", "desktop", "US", 0, subtotal,
        shippingFee, taxAmount, orderTotal, 0, 0
      );

      const orderId = result.lastInsertRowid;

      for (const li of lineItems) {
        insertItem.run(orderId, li.product_id, li.quantity, li.price, li.price * li.quantity);
      }

      return orderId;
    });

    const orderId = transaction();

    return NextResponse.json({ order_id: Number(orderId) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
