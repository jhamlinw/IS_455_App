import { getDb } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PriorityRow {
  order_id: number;
  order_datetime: string;
  order_total: number;
  customer_name: string;
  late_delivery_probability: number;
  predicted_late_delivery: number;
  prediction_timestamp: string;
}

export default function PriorityQueuePage() {
  const db = getDb();

  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='order_predictions'")
    .get();

  let rows: PriorityRow[] = [];

  if (tableExists) {
    rows = db
      .prepare(
        `SELECT
          o.order_id,
          o.order_datetime,
          o.order_total,
          c.full_name AS customer_name,
          p.late_delivery_probability,
          p.predicted_late_delivery,
          p.prediction_timestamp
        FROM orders o
        JOIN customers c ON c.customer_id = o.customer_id
        JOIN order_predictions p ON p.order_id = o.order_id
        ORDER BY p.late_delivery_probability DESC, o.order_datetime ASC
        LIMIT 50`
      )
      .all() as PriorityRow[];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Late Delivery Priority Queue
      </h1>
      <p className="text-gray-600 mb-6">
        Top 50 orders ranked by predicted late-delivery probability. Higher probability
        orders should be prioritized for expedited fulfillment. Use the{" "}
        <Link href="/scoring" className="text-indigo-600 hover:text-indigo-800">
          Run Scoring
        </Link>{" "}
        page to refresh predictions.
      </p>

      {rows.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded p-4 text-sm">
          No predictions found. Run the scoring job first to populate this queue.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Late Prob</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Predicted Late</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Scored At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, i) => (
                <tr key={r.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 text-gray-700">{r.order_id}</td>
                  <td className="px-4 py-2 text-gray-900">{r.customer_name}</td>
                  <td className="px-4 py-2 text-gray-500">{r.order_datetime}</td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    ${r.order_total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    <span
                      className={
                        r.late_delivery_probability > 0.7
                          ? "text-red-600 font-semibold"
                          : r.late_delivery_probability > 0.4
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {(r.late_delivery_probability * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {r.predicted_late_delivery ? (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                        Yes
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{r.prediction_timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
