import type { Metadata } from "next";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { ProfilePage } from "./profile-page";

export const metadata: Metadata = {
  title: "Profile",
};

export default function Page() {
  return (
    <RouteGuard>
      <ProfilePage />
    </RouteGuard>
  );
}
