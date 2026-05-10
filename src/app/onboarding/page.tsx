import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Tell us about your English",
  description:
    "Quick three question setup so NoraLingua Hub can personalize your lessons.",
};


/*
  Onboarding page
  Three quick questions before the dashboard. Centered card on a
  sky-tinted background, same shell as login and register.
  Form submission redirects to /dashboard.
*/


export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { onboardedAt: true, fullName: true },
  });

  if (profile?.onboardedAt) redirect("/dashboard");

  const firstName = profile?.fullName.split(" ")[0] ?? "there";

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* Soft sky glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl"
      />

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12 lg:py-16">

        {/* Logo */}
        <Link
          href="/"
          className="group mb-10 flex items-center justify-center font-serif text-2xl tracking-tight text-foreground"
        >
          NoraLingua
          <span
            aria-hidden="true"
            className="mx-1.5 inline-block h-2 w-2 rounded-full bg-[#B8985A] transition-transform duration-200 group-hover:scale-125"
          />
          Hub
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-foreground/10 bg-background p-8 sm:p-12">

          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Personalize
            </p>
            <h1 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-tight text-foreground">
              Hi {firstName}, let&apos;s set this up.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-[1.65] text-foreground/70">
              Three quick choices. We use your answers to match every lesson
              to your level and goal.
            </p>
          </div>

          <OnboardingForm />

        </div>

      </div>
    </main>
  );
}
