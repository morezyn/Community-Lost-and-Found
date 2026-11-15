import Link from "next/link";
import { Compass, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you were looking for may have moved or never existed.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/reports">
            <Compass /> Browse reports
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
