"use client";

import { useRouter } from "next/navigation";

interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  customer_segment: string;
  loyalty_tier: string;
}

export default function CustomerList({ customers }: { customers: Customer[] }) {
  const router = useRouter();

  function selectCustomer(c: Customer) {
    document.cookie = `customer_id=${c.customer_id}; path=/; max-age=86400`;
    document.cookie = `customer_name=${encodeURIComponent(c.full_name)}; path=/; max-age=86400`;
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Segment</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Tier</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((c) => (
            <tr key={c.customer_id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-700">{c.customer_id}</td>
              <td className="px-4 py-2 font-medium text-gray-900">{c.full_name}</td>
              <td className="px-4 py-2 text-gray-500">{c.email}</td>
              <td className="px-4 py-2 text-gray-500 capitalize">{c.customer_segment}</td>
              <td className="px-4 py-2 text-gray-500 capitalize">{c.loyalty_tier}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => selectCustomer(c)}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Select
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
