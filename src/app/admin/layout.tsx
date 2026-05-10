import Link from "next/link";

import { requireAdmin } from "@/lib/auth/require-admin";


/*
  Admin section layout.

  Wraps every page under /admin/* with a nav bar and an admin
  context guard. The requireAdmin() call at the top of this layout
  enforces that only ADMIN users can render any child route.
*/


const ADMIN_NAV = [
  { href: "/admin",                label: "Overview" },
  { href: "/admin/material-sets",  label: "Material Sets" },
  { href: "/admin/lessons",        label: "Lessons" },
  { href: "/admin/submissions",    label: "Submissions" },
  { href: "/admin/progress",       label: "Progress" },
  { href: "/admin/classes",        label: "Classes" },
  { href: "/admin/teachers",       label: "Teachers" },
] as const;


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {

  const adminUser = await requireAdmin();

  return (
    <div className="min-h-screen bg-background">

      {/* Admin top bar */}
      <header className="border-b border-foreground/10 bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            href="/admin"
            className="font-serif text-xl tracking-tight text-foreground"
          >
            NoraLingua
            <span
              aria-hidden="true"
              className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B8985A]"
            />
            Admin
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-foreground/60 sm:inline">
              {adminUser.fullName}
            </span>
            <Link
              href="/dashboard"
              className="rounded-full border border-foreground/20 px-4 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-foreground/5"
            >
              Exit admin
            </Link>
          </div>

        </div>
      </header>

      {/* Mobile nav (simple horizontal scroll) */}
      <nav className="border-b border-foreground/10 bg-background md:hidden">
        <div className="flex gap-1 overflow-x-auto px-6 py-2">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-foreground/70 hover:bg-foreground/5"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>

    </div>
  );
}
