import { getDb } from "@/lib/db";
import CustomerList from "./CustomerList";

interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  customer_segment: string;
  loyalty_tier: string;
}

export const dynamic = "force-dynamic";

export default function SelectCustomerPage() {
  const db = getDb();
  const customers = db
    .prepare(
      "SELECT customer_id, full_name, email, customer_segment, loyalty_tier FROM customers ORDER BY customer_id"
    )
    .all() as Customer[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Select Customer</h1>
      <p className="text-gray-600 mb-4">
        Choose a customer to act as. No sign-up or login required.
      </p>
      <CustomerList customers={customers} />
    </div>
  );
}
