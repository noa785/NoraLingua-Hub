import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";


/*
  Shared TopNav for all authenticated pages.

  Why one component for every page?
    Earlier each page had its own inline header. The duplication
    drifted -- some pages had the theme toggle, some did not, the
    profile pill rendered slightly differently. Centralising means
    every signed-in page gets the exact same nav, and the theme
    toggle is guaranteed to be reachable from anywhere.

  Why an isAdmin prop instead of fetching the role here?
    This is a Server Component-friendly client header that needs
    auth state up front. Pages already fetch the user's Prisma row
    to render learner-specific UI (name, level, etc.). Passing
    isAdmin down avoids a duplicate database round trip per render.
*/


export type NavActive = "dashboard" | "practice" | "paths" | "admin" | null;


type Props = {
  firstName: string;
  active:    NavActive;
  isAdmin?:  boolean;
};


export function TopNav({ firstName, active, isAdmin = false }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

        <Link
          href="/dashboard"
          className="group flex items-center font-serif text-xl tracking-tight text-foreground"
        >
          NoraLingua
          <span
            aria-hidden="true"
            className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B8985A] transition-transform duration-200 group-hover:scale-125"
          />
          Hub
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/dashboard" label="Dashboard" isActive={active === "dashboard"} />

          {/* Practice and Paths are learner-only; admins do not have
              a learning path so we hide these to avoid empty pages. */}
          {!isAdmin ? (
            <>
              <NavLink href="/practice"  label="Practice"  isActive={active === "practice"} />
              <NavLink href="/paths"     label="Paths"     isActive={active === "paths"} hideOnMobile />
            </>
          ) : null}

          {/* Admin link -- only visible to admin users */}
          {isAdmin ? (
            <Link
              href="/admin"
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                active === "admin"
                  ? "border-[#B8985A] bg-[#B8985A]/[0.10] text-[#B8985A]"
                  : "border-[#B8985A]/40 bg-transparent text-[#B8985A] hover:border-[#B8985A] hover:bg-[#B8985A]/[0.06]",
              ].join(" ")}
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          ) : null}

          {/* Theme toggle -- always visible */}
          <div className="ml-1">
            <ThemeToggle />
          </div>

          {/* Profile pill -- subtle elevated surface in dark mode */}
          <div className="ml-1 flex items-center gap-2.5 rounded-full bg-[#DCE6F2]/40 py-1 pl-1 pr-3 dark:bg-foreground/[0.09] sm:pr-4">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B8985A] text-xs font-semibold text-[#0B1C3F]"
            >
              {firstName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              {firstName}
            </span>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-4 text-sm font-medium text-foreground/80 transition-all duration-200 hover:border-foreground/30 hover:bg-foreground/5 hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>

        </nav>
      </div>
    </header>
  );
}


function NavLink({
  href, label, isActive, hideOnMobile = false,
}: {
  href: string; label: string; isActive: boolean; hideOnMobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-1.5 text-sm transition-colors",
        hideOnMobile ? "hidden sm:inline-flex" : "",
        isActive
          ? "bg-foreground/5 font-medium text-foreground dark:bg-foreground/[0.12]"
          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
