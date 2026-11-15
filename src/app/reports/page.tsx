import type { Metadata } from "next";

import { ReportsBrowser } from "./reports-browser";

export const metadata: Metadata = {
  title: "Browse reports",
  description: "Search and filter lost items, found items, and community incidents.",
};

export default function ReportsPage() {
  return <ReportsBrowser />;
}
