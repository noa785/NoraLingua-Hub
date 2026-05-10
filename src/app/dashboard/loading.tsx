/*
  Dashboard route loading state.

  Mirrors the structure of the real dashboard so the page does
  not visibly jump when the data resolves: welcome strip, hero
  card, then alternating sections (skills, writing pair,
  milestones, activity).

  Why bother matching the real layout shape?
    A skeleton that looks nothing like the page underneath is
    just a spinner with extra steps. Matching the layout means
    the eye locks onto the eventual content positions; the swap
    feels like fade-in, not a layout shift.
*/

import { Skeleton } from "@/components/shared/Skeleton";


export default function DashboardLoading() {
  return (
    <main aria-busy="true" className="min-h-screen pb-24">

      {/* Visually-hidden announcement for screen readers. The
          rest of the page uses aria-hidden Skeleton bars so this
          is the only spoken hint that something is loading. */}
      <span className="sr-only" role="status">
        Loading your dashboard.
      </span>

      {/* Welcome strip placeholder */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-2 lg:px-8 lg:pt-16">
        <Skeleton className="h-7 w-56" />
      </section>

      {/* Hero learner card placeholder */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pb-12 lg:px-8">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
              <div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-9 w-48" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-7 w-32" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next class placeholder */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <Skeleton className="mb-4 h-3 w-20" />
          <Skeleton className="mb-8 h-8 w-72" />
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </section>

      {/* Skill mastery placeholder, banded */}
      <section className="bg-[#DCE6F2]/40 dark:bg-foreground/[0.05]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <Skeleton className="mb-4 h-3 w-24" />
          <Skeleton className="mb-8 h-8 w-80" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
          </div>
        </div>
      </section>

      {/* Writing pair placeholder (chart + feedback card) */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <Skeleton className="mb-4 h-3 w-16" />
          <Skeleton className="mb-8 h-8 w-72" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </div>
      </section>

      {/* Milestones placeholder, banded */}
      <section className="bg-[#DCE6F2]/40 dark:bg-foreground/[0.05]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <Skeleton className="mb-4 h-3 w-24" />
          <Skeleton className="mb-8 h-8 w-80" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </section>

      {/* Activity feed placeholder */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <Skeleton className="h-72" />
        </div>
      </section>

    </main>
  );
}