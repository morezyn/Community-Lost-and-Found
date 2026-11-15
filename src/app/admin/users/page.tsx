import type { Metadata } from "next";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { AdminUsers } from "./admin-users";

export const metadata: Metadata = {
  title: "Manage members",
};

export default function AdminUsersPage() {
  return (
    <RouteGuard allow={["admin"]}>
      <AdminUsers />
    </RouteGuard>
  );
}
