import Link from "next/link";

import { APP } from "@/lib/constants";


/*
  Footer.
  Three columns separated by whitespace. Top border is the
  hairline rule. No social icons, no newsletter, no marketing
  badges -- just identity, navigation, and meta.
*/


export function Footer() {
  return (
    <footer className="border-t border-foreground/10 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">

          {/* Identity */}
          <div>
            <div className="flex items-center font-serif text-lg tracking-tight text-foreground">
              {APP.name.split(" ")[0]}
              <span aria-hidden="true" className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B8985A]" />
              {APP.name.split(" ")[1]}
            </div>
            <p className="mt-3 text-sm text-foreground/60 leading-relaxed">
              {APP.description}
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/40">Product</p>
            <Link href="/about"    className="text-foreground/70 transition-colors hover:text-foreground">About the method</Link>
            <Link href="/login"    className="text-foreground/70 transition-colors hover:text-foreground">Sign in</Link>
            <Link href="/register" className="text-foreground/70 transition-colors hover:text-foreground">Create account</Link>
          </nav>

          {/* Meta */}
          <div className="text-sm text-foreground/60 sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/40 sm:text-right">Built with care</p>
            <p className="mt-3">Designed and developed by</p>
            <p className="font-medium text-foreground">{APP.author}</p>
            <p className="mt-1 text-xs text-foreground/50">Riyadh, Saudi Arabia &middot; {APP.year}</p>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="mt-12 border-t border-foreground/10 pt-6 text-xs text-foreground/40 text-center">
          (c) {APP.year} {APP.name}. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
