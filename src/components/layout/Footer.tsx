import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/reports", label: "Browse reports" },
      { href: "/reports/new", label: "Report an item" },
      { href: "/profile", label: "My reports" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/reports?type=lost", label: "Lost items" },
      { href: "/reports?type=found", label: "Found items" },
      { href: "/reports?type=incident", label: "Community issues" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/profile#settings", label: "Account settings" },
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto w-full max-w-content px-6 py-12 lg:px-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div>
              <p className="font-heading text-lg font-semibold text-ink">{APP_NAME}</p>
              <p className="mt-1 text-sm text-ink-soft">{APP_TAGLINE}</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="footer-email" className="text-sm font-medium text-ink">
                Get updates
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="footer-email"
                  type="email"
                  placeholder="Email address"
                  className="h-11"
                />
                <Button type="button" size="sm" className="sm:shrink-0">
                  Join us
                </Button>
              </div>
              <label className="flex items-start gap-2 text-xs text-ink-soft">
                <input type="checkbox" className="mt-0.5 rounded border-border" />
                <span>I agree to receive occasional updates about FindIt.</span>
              </label>
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Demo newsletter signup (no emails are sent).
              </p>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <p className="text-sm font-semibold text-ink">{col.title}</p>
              <ul className="space-y-2 text-sm text-ink-soft">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-ink transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {APP_NAME}. Demo build · ELEC4 finals project.</p>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
