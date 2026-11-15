import type { Metadata } from "next";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export default function AdminPage() {
  return (
    <RouteGuard allow={["admin"]}>
      <AdminDashboard />
    </RouteGuard>
  );
}
