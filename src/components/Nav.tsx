"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Nav() {
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    const name = document.cookie
      .split("; ")
      .find((c) => c.startsWith("customer_name="))
      ?.split("=")[1];
    if (name) setCustomerName(decodeURIComponent(name));
  }, []);

  const links = [
    { href: "/select-customer", label: "Select Customer" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/place-order", label: "Place Order" },
    { href: "/orders", label: "Order History" },
    { href: "/warehouse/priority", label: "Priority Queue" },
    { href: "/scoring", label: "Run Scoring" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          Shop App
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-gray-600 hover:text-indigo-600 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      {customerName && (
        <div className="bg-indigo-50 border-t border-indigo-100 text-center text-sm text-indigo-700 py-1.5">
          Logged in as <span className="font-semibold">{customerName}</span>
        </div>
      )}
    </header>
  );
}
