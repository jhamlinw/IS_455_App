import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Order {
  order_id: number;
  order_datetime: string;
  order_total: number;
  payment_method: string;
  shipping_state: string;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const params = await searchParams;
  const db = getDb();
  const orders = db
    .prepare(
      `SELECT order_id, order_datetime, order_total, payment_method, shipping_state
       FROM orders WHERE customer_id = ?
       ORDER BY order_datetime DESC`
    )
    .all(Number(customerId)) as Order[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

      {params.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 text-sm mb-4">
          Order placed successfully!
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Order ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">State</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.order_id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{o.order_id}</td>
                <td className="px-4 py-2 text-gray-500">{o.order_datetime}</td>
                <td className="px-4 py-2 text-gray-700">${o.order_total.toFixed(2)}</td>
                <td className="px-4 py-2 text-gray-500 capitalize">{o.payment_method}</td>
                <td className="px-4 py-2 text-gray-500">{o.shipping_state}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/orders/${o.order_id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
