/*
  Lesson detail route loading state.

  Mirrors the lesson reader: title bar at top, content body
  underneath, comprehension question stack at the bottom.
*/

import { Skeleton } from "@/components/shared/Skeleton";


export default function LessonLoading() {
  return (
    <main aria-busy="true" className="mx-auto max-w-3xl px-6 pb-24 pt-12 lg:px-8 lg:pt-16">

      <span className="sr-only" role="status">
        Loading lesson.
      </span>

      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-2 h-9 w-3/4" />
      <Skeleton className="mb-10 h-4 w-32" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-9/12" />
      </div>

      <div className="mt-10 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-8/12" />
      </div>

      <div className="mt-16 space-y-6">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>

    </main>
  );
}