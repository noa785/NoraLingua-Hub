/*
  Skill view route loading state.

  Renders while the lesson list / writing prompt list / speaking
  surface for a given level + purpose + skill is being fetched.
*/

import { Skeleton } from "@/components/shared/Skeleton";


export default function SkillLoading() {
  return (
    <main aria-busy="true" className="mx-auto max-w-6xl px-6 pb-24 pt-12 lg:px-8 lg:pt-16">

      <span className="sr-only" role="status">
        Loading practice surface.
      </span>

      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>

    </main>
  );
}