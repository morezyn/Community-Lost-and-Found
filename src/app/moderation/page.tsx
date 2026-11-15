import type { Metadata } from "next";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { ModerationPanel } from "./moderation-panel";

export const metadata: Metadata = {
  title: "Moderation",
};

export default function ModerationPage() {
  return (
    <RouteGuard allow={["moderator"]}>
      <ModerationPanel />
    </RouteGuard>
  );
}
