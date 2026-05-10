import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Create account",
  description: "Create your NoraLingua Hub account.",
};


/*
  Register page.
  Mirror of the login page layout: centered card on sky-tinted
  background. After successful registration the form pushes the
  user to /onboarding.
*/


export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden">

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
              Create your account
            </h1>
            <p className="mt-2 text-sm text-foreground/70">
              Three minutes of setup. Then you start learning.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-8 border-t border-foreground/10 pt-6 text-center text-sm text-foreground/70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground transition-colors hover:text-[#B8985A]"
            >
              Sign in
            </Link>
          </p>

        </div>

        <p className="mt-8 text-center text-sm text-foreground/60">
          <Link href="/" className="hover:text-foreground">
            &larr; Back to home
          </Link>
        </p>

      </div>
    </main>
  );
}
