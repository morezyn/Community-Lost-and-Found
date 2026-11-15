import type { Metadata } from "next";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { AdminCategories } from "./admin-categories";

export const metadata: Metadata = {
  title: "Manage categories",
};

export default function AdminCategoriesPage() {
  return (
    <RouteGuard allow={["admin"]}>
      <AdminCategories />
    </RouteGuard>
  );
}
