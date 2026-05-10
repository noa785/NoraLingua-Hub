import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NoraLingua Hub account.",
};


/*
  Login page
  Centered card on a sky-tinted background. The card has the
  same flat-with-hairline-border style as the homepage's white
  cards. Logo at top, headline, the form, footer link.

  Why redirect signed-in users away from /login?
    If a user already has a session and visits /login, they end
    up looking at a sign-in form they do not need. Sending them
    to /dashboard is the conventional behavior across web apps.
*/


export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const params = await searchParams;
  const redirectTo = params.next ?? "/dashboard";

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* Soft sky-blue glow behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[800px] w-[1100px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl"
      />

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">

        {/* Logo */}
        <Link
          href="/"
          className="group mb-8 flex items-center justify-center font-serif text-2xl tracking-tight text-foreground"
        >
          NoraLingua
          <span
            aria-hidden="true"
            className="mx-1.5 inline-block h-2 w-2 rounded-full bg-[#B8985A] transition-transform duration-200 group-hover:scale-125"
          />
          Hub
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-foreground/10 bg-background p-8 sm:p-10">

          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-foreground/70">
              Sign in to continue your learning.
            </p>
          </div>

          <LoginForm redirectTo={redirectTo} />

          <p className="mt-8 border-t border-foreground/10 pt-6 text-center text-sm text-foreground/70">
            New to NoraLingua Hub?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground transition-colors hover:text-[#B8985A]"
            >
              Create an account
            </Link>
          </p>

        </div>

        {/* Bottom link */}
        <p className="mt-8 text-center text-sm text-foreground/60">
          <Link href="/" className="hover:text-foreground">
            &larr; Back to home
          </Link>
        </p>

      </div>
    </main>
  );
}
