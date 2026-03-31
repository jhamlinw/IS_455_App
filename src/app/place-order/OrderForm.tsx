"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  product_id: number;
  product_name: string;
  category: string;
  price: number;
}

interface LineItem {
  product_id: number;
  quantity: number;
}

export default function OrderForm({
  products,
  customerId,
}: {
  products: Product[];
  customerId: number;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: products[0]?.product_id ?? 0, quantity: 1 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine() {
    setLines([...lines, { product_id: products[0]?.product_id ?? 0, quantity: 1 }]);
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof LineItem, value: number) {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  }

  const total = lines.reduce((sum, l) => {
    const prod = products.find((p) => p.product_id === l.product_id);
    return sum + (prod ? prod.price * l.quantity : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, items: lines }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place order");
      }

      router.push("/orders?success=1");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {lines.map((line, idx) => {
          const prod = products.find((p) => p.product_id === line.product_id);
          const lineTotal = prod ? prod.price * line.quantity : 0;
          return (
            <div key={idx} className="flex items-center gap-4 p-4">
              <select
                value={line.product_id}
                onChange={(e) => updateLine(idx, "product_id", Number(e.target.value))}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} — ${p.price.toFixed(2)} ({p.category})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={99}
                value={line.quantity}
                onChange={(e) => updateLine(idx, "quantity", Math.max(1, Number(e.target.value)))}
                className="w-20 border border-gray-300 rounded px-3 py-2 text-sm text-center"
              />
              <span className="w-24 text-right text-sm text-gray-700">
                ${lineTotal.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => removeLine(idx)}
                className="text-red-500 hover:text-red-700 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addLine}
          className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer"
        >
          + Add Item
        </button>
        <span className="text-lg font-semibold text-gray-900">
          Total: ${total.toFixed(2)}
        </span>
      </div>

      <button
        type="submit"
        disabled={submitting || lines.length === 0}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {submitting ? "Placing Order..." : "Place Order"}
      </button>
    </form>
  );
}
