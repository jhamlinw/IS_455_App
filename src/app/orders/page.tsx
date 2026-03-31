"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Order {
  order_id: number;
  order_datetime: string;
  order_total: number;
  payment_method: string;
  shipping_state: string;
}

function SuccessBanner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  if (!success) return null;
  return (
    <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 text-sm mb-4">
      Order placed successfully!
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

      <Suspense>
        <SuccessBanner />
      </Suspense>

      {loading ? (
        <p className="text-gray-400">Loading orders...</p>
      ) : (
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
      )}
    </div>
  );
}
