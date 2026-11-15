import type { Metadata } from "next";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { EditReportLoader } from "@/components/reports/EditReportLoader";

export const metadata: Metadata = {
  title: "Edit report",
};

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <RouteGuard>
        <EditReportLoader reportId={id} />
      </RouteGuard>
    </div>
  );
}
