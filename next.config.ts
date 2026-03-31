import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**": ["./shop.db", "./late_delivery_model.sav", "./jobs/**"],
    "/select-customer": ["./shop.db"],
    "/dashboard": ["./shop.db"],
    "/orders/**": ["./shop.db"],
    "/place-order": ["./shop.db"],
    "/warehouse/**": ["./shop.db"],
  },
};

export default nextConfig;
