/*
  Submission detail route loading state.

  Mirrors the graded submission page: assignment header, big
  band score block, four-criterion breakdown, then feedback body.
*/

import { Skeleton } from "@/components/shared/Skeleton";


export default function SubmissionLoading() {
  return (
    <main aria-busy="true" className="mx-auto max-w-3xl px-6 pb-24 pt-12 lg:px-8 lg:pt-16">

      <span className="sr-only" role="status">
        Loading your graded submission.
      </span>

      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-8 h-9 w-3/4" />

      <div className="mb-10 rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8">
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="h-12 w-32" />
      </div>

      <Skeleton className="mb-4 h-3 w-32" />
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      <Skeleton className="mb-4 h-3 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-9/12" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-7/12" />
      </div>

    </main>
  );
}