import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";


/*
  Top navigation.
  Sticky to the top, hairline bottom border, subtle backdrop
  blur for readability when content scrolls behind it.
*/


export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center font-serif text-xl tracking-tight text-foreground"
        >
          NoraLingua
          <span
            aria-hidden="true"
            className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B8985A] transition-transform duration-200 group-hover:scale-125"
          />
          Hub
        </Link>

        {/* Right cluster */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/about"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground sm:inline-block"
          >
            About
          </Link>
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground sm:inline-block"
          >
            Sign in
          </Link>
          <div className="mx-1 h-5 w-px bg-foreground/10 hidden sm:block" />
          <ThemeToggle />
          <Link
            href="/register"
            className="ml-2 inline-flex h-9 items-center rounded-full bg-[#B8985A] px-5 text-sm font-medium text-[#0B1C3F] transition-all duration-200 hover:scale-[1.03] hover:bg-[#B8985A]/90"
          >
            Get started
          </Link>
        </nav>

      </div>
    </header>
  );
}
