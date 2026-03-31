import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import OrderForm from "./OrderForm";

export const dynamic = "force-dynamic";

interface Product {
  product_id: number;
  product_name: string;
  category: string;
  price: number;
}

export default async function PlaceOrderPage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const db = getDb();
  const products = db
    .prepare(
      "SELECT product_id, product_name, category, price FROM products WHERE is_active = 1 ORDER BY category, product_name"
    )
    .all() as Product[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Place Order</h1>
      <OrderForm products={products} customerId={Number(customerId)} />
    </div>
  );
}
