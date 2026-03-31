const STORAGE_KEY = "shop_app_local_orders";

export interface LocalOrder {
  order_id: number;
  order_datetime: string;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
  payment_method: string;
  shipping_state: string;
  customer_id: number;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

export function saveLocalOrder(order: LocalOrder) {
  const existing = getLocalOrders();
  existing.unshift(order);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getLocalOrders(): LocalOrder[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
