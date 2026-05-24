"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Tag, BarChart3, Search, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Calendar", icon: Calendar },
  { href: "/search", label: "Search", icon: Search },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 md:min-h-screen md:flex md:flex-col border-b md:border-b-0 md:border-r border-border bg-surface">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-soft">
            <Sparkles size={16} />
          </div>
          <div className="font-semibold tracking-tight">FlexiLog</div>
        </div>
        <nav className="px-3 pb-3 grid grid-cols-4 md:grid-cols-1 gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  "hover:bg-muted",
                  active
                    ? "bg-muted text-fg font-medium"
                    : "text-subtle"
                )}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex md:mt-auto px-5 py-5 items-center justify-between gap-2">
          <UserButton afterSignOutUrl="/sign-in" />
          <ThemeToggle />
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-end gap-2 p-3 border-b border-border">
          <UserButton afterSignOutUrl="/sign-in" />
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
