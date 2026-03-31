import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface OrderDetail {
  order_id: number;
  order_datetime: string;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
  payment_method: string;
  shipping_state: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { orderId } = await params;
  const query = await searchParams;
  const db = getDb();

  const order = db
    .prepare(
      `SELECT order_id, order_datetime, order_subtotal, shipping_fee, tax_amount,
              order_total, payment_method, shipping_state
       FROM orders WHERE order_id = ?`
    )
    .get(Number(orderId)) as OrderDetail | undefined;

  if (!order) notFound();

  const items = db
    .prepare(
      `SELECT p.product_name, oi.quantity, oi.unit_price, oi.line_total
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(Number(orderId)) as OrderItem[];

  return (
    <div>
      <Link href="/orders" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 inline-block">
        &larr; Back to Orders
      </Link>

      {query.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 text-sm mb-4">
          Order placed successfully!
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Order #{order.order_id}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {order.order_datetime} &middot; {order.payment_method} &middot; Ships to {order.shipping_state}
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white mb-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Unit Price</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-gray-900">{item.product_name}</td>
                <td className="px-4 py-2 text-right text-gray-700">{item.quantity}</td>
                <td className="px-4 py-2 text-right text-gray-700">${item.unit_price.toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-gray-700">${item.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 max-w-xs ml-auto space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-900">${order.order_subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Shipping</span>
          <span className="text-gray-900">${order.shipping_fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax</span>
          <span className="text-gray-900">${order.tax_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
          <span>Total</span>
          <span>${order.order_total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
