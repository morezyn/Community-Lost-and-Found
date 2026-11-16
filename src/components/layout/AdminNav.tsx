"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Dashboard matches only exactly; otherwise it would stay active everywhere. */
  exact: boolean;
}

const ADMIN_LINKS: AdminLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Members", icon: Users, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
];

/**
 * Sub-navigation for the admin area, shared by the dashboard, members, and
 * categories pages. Without it `/admin/users` and `/admin/categories` had no
 * entry point in the UI at all.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="flex w-full items-center gap-1 overflow-x-auto rounded-xl border bg-card p-1 shadow-sm"
    >
      {ADMIN_LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap lg:transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
