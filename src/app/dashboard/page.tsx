import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const db = getDb();

  const customer = db
    .prepare("SELECT full_name, email FROM customers WHERE customer_id = ?")
    .get(Number(customerId)) as { full_name: string; email: string } | undefined;

  if (!customer) redirect("/select-customer");

  const stats = db
    .prepare(
      `SELECT COUNT(*) as order_count, COALESCE(SUM(order_total), 0) as total_spend
       FROM orders WHERE customer_id = ?`
    )
    .get(Number(customerId)) as { order_count: number; total_spend: number };

  const recentOrders = db
    .prepare(
      `SELECT order_id, order_datetime, order_total, payment_method
       FROM orders WHERE customer_id = ?
       ORDER BY order_datetime DESC LIMIT 5`
    )
    .all(Number(customerId)) as {
    order_id: number;
    order_datetime: string;
    order_total: number;
    payment_method: string;
  }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome, <span className="font-semibold">{customer.full_name}</span> ({customer.email})
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{stats.order_count}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Spend</p>
          <p className="text-3xl font-bold text-gray-900">
            ${stats.total_spend.toFixed(2)}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">5 Most Recent Orders</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Order ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentOrders.map((o) => (
              <tr key={o.order_id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{o.order_id}</td>
                <td className="px-4 py-2 text-gray-500">{o.order_datetime}</td>
                <td className="px-4 py-2 text-gray-700">${o.order_total.toFixed(2)}</td>
                <td className="px-4 py-2 text-gray-500 capitalize">{o.payment_method}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-gray-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
