import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const FOOTER_LINKS = [
  { href: "/reports", label: "Browse reports" },
  { href: "/reports/new", label: "Report an item" },
  { href: "/profile", label: "Profile" },
];

export function Footer() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <span className="text-muted-foreground/70">
            Demo build · ELEC4 finals project
          </span>
        </nav>
      </div>
    </footer>
  );
}
